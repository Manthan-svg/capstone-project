import { useState, useRef, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { saveTemplate, getAllTemplates } from '../lib/db'
import { useMediaPipe } from '../hooks/useMediaPipe'
import { supabase } from '../lib/supabase'
import { 
  normalizeLandmarks, 
  classifySign, 
  verifySpecificSign, 
  calculateSignQuality, 
  drawHandLandmarks 
} from '../lib/classifier'
import { 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Square, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  Check, 
  X,
  Video,
  Play
} from 'lucide-react'

const VOCABULARY = [
  // Basic & Greetings
  'hello', 'thank you', 'please', 'help', 'yes', 'no', 'sorry', 'good', 'bad',
  'how are you', 'what', 'where', 'when', 'why', 'who', 
  // Medical & Needs
  'doctor', 'pain', 'emergency', 'water', 'food', 'bathroom', 'hospital', 'sick', 'medicine',
  // People & Relationships
  'family', 'friend', 'mother', 'father', 'sister', 'brother',
  // Actions & Directions
  'stop', 'wait', 'more', 'go', 'come', 'left', 'right', 'straight',
  // Emotions
  'happy', 'sad', 'angry', 'tired', 'scared',
  // Workplace & Tech
  'work', 'meeting', 'internet', 'computer', 'phone', 'email',
  // Numbers
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
]

const RECORD_DURATION_SECONDS = 5

export default function Enrollment() {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const { landmarker, isLoaded } = useMediaPipe()
  
  const [selectedWord, setSelectedWord] = useState(VOCABULARY[0])
  const [activeTab, setActiveTab] = useState('enroll') // 'enroll' | 'test'
  const [status, setStatus] = useState('idle') // 'idle' | 'counting' | 'recording' | 'review' | 'saved'
  const [countdown, setCountdown] = useState(3)
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState(RECORD_DURATION_SECONDS)
  
  const [savedTemplates, setSavedTemplates] = useState([])
  const [allTemplatesData, setAllTemplatesData] = useState([])
  const [userId, setUserId] = useState(null)
  
  // Review state
  const [reviewData, setReviewData] = useState(null) // { blob, videoUrl, landmarks, quality }
  
  // Live test verification state
  const [testResult, setTestResult] = useState({
    status: 'waiting', // 'waiting' | 'correct' | 'wrong'
    detectedWord: null,
    confidence: 0,
    message: 'Perform sign in front of camera'
  })
  
  // Real-time hand tracking status
  const [handsDetectedCount, setHandsDetectedCount] = useState(0)
  
  const isRecordingRef = useRef(false)
  const activeTabRef = useRef('enroll')
  const statusRef = useRef('idle')
  const requestRef = useRef()
  const landmarksLogRef = useRef([])
  const lastVideoTimeRef = useRef(-1)
  const recordingTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id)
        loadTemplates(data.user.id)
      }
    })

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [])

  const loadTemplates = async (uid = userId) => {
    if (!uid) return
    const templates = await getAllTemplates(uid)
    const normalizedData = templates.map(t => ({
      ...t,
      landmarksList: t.landmarksList.map(normalizeLandmarks)
    }))
    setAllTemplatesData(normalizedData)
    setSavedTemplates(templates.map(t => t.word))
  }

  // Real-time frame loop: runs for both enrollment landmark logging and live testing
  const detectFrame = useCallback(() => {
    if (landmarker && webcamRef.current && webcamRef.current.video) {
      const video = webcamRef.current.video
      
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        const results = landmarker.detectForVideo(video, performance.now())
        
        // 1. Draw hand landmarks onto the overlay canvas
        if (canvasRef.current) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 480
          }
          if (results.landmarks && results.landmarks.length > 0) {
            drawHandLandmarks(ctx, results.landmarks, canvas.width, canvas.height, true)
            setHandsDetectedCount(results.landmarks.length)
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            setHandsDetectedCount(0)
          }
        }

        // 2. If currently recording in enroll mode, capture landmarks
        if (isRecordingRef.current && results.landmarks && results.landmarks.length > 0) {
          landmarksLogRef.current.push(results.landmarks[0])
        }

        // 3. If in Live Test Mode, classify current hand gesture
        if (activeTabRef.current === 'test' && results.landmarks && results.landmarks.length > 0) {
          const hand = results.landmarks[0]
          const targetVerification = verifySpecificSign(hand, selectedWord, allTemplatesData, 15.0)
          const generalMatch = classifySign(hand, allTemplatesData, 15.0)

          if (targetVerification.isMatch) {
            setTestResult({
              status: 'correct',
              detectedWord: selectedWord,
              confidence: targetVerification.confidence,
              message: `RIGHT! You signed "${selectedWord}" correctly!`
            })
          } else if (generalMatch && generalMatch.word.toLowerCase() !== selectedWord.toLowerCase()) {
            setTestResult({
              status: 'wrong',
              detectedWord: generalMatch.word,
              confidence: generalMatch.confidence,
              message: `WRONG! AI detected "${generalMatch.word}" instead of "${selectedWord}".`
            })
          } else {
            setTestResult({
              status: 'waiting',
              detectedWord: null,
              confidence: 0,
              message: `Analyzing hand... Sign "${selectedWord}" clearly.`
            })
          }
        }
      }
    }
    
    requestRef.current = requestAnimationFrame(detectFrame)
  }, [landmarker, selectedWord, allTemplatesData])

  // Start continuous detection when MediaPipe is ready
  useEffect(() => {
    if (isLoaded) {
      requestRef.current = requestAnimationFrame(detectFrame)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [isLoaded, detectFrame])

  // Start 3-second countdown
  const startEnrollment = () => {
    if (status !== 'idle' && status !== 'saved') return
    setStatus('counting')
    setCountdown(3)
    
    let cnt = 3
    countdownTimerRef.current = setInterval(() => {
      cnt -= 1
      if (cnt <= 0) {
        clearInterval(countdownTimerRef.current)
        startRecording()
      } else {
        setCountdown(cnt)
      }
    }, 1000)
  }

  // Start recording sign
  const startRecording = () => {
    setStatus('recording')
    isRecordingRef.current = true
    landmarksLogRef.current = []
    lastVideoTimeRef.current = -1
    setRecordingSecondsLeft(RECORD_DURATION_SECONDS)
    
    const stream = webcamRef.current.video.srcObject
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    mediaRecorderRef.current = mediaRecorder
    
    const chunks = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    
    mediaRecorder.onstop = () => {
      isRecordingRef.current = false
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      
      const blob = new Blob(chunks, { type: 'video/webm' })
      const capturedLandmarks = [...landmarksLogRef.current]
      const quality = calculateSignQuality(capturedLandmarks)
      const videoUrl = URL.createObjectURL(blob)

      setReviewData({
        blob,
        videoUrl,
        landmarks: capturedLandmarks,
        quality
      })

      // Move to review mode without advancing to next word!
      setStatus('review')
    }
    
    mediaRecorder.start()
    
    // Countdown remaining recording seconds (5 seconds total)
    let seconds = RECORD_DURATION_SECONDS
    recordingTimerRef.current = setInterval(() => {
      seconds -= 1
      setRecordingSecondsLeft(seconds)
      if (seconds <= 0) {
        clearInterval(recordingTimerRef.current)
        stopRecording()
      }
    }, 1000)
  }

  // Manual stop button so user doesn't have to wait or rush
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  // Discard and retake the sign
  const handleRetake = () => {
    setReviewData(null)
    setStatus('idle')
  }

  // Save the reviewed sign
  const handleSaveSign = async (advanceToNext = false) => {
    if (!reviewData || !userId) {
      alert("Missing sign recording or user authentication.")
      return
    }

    setStatus('saving')
    try {
      await saveTemplate(userId, selectedWord, reviewData.landmarks, reviewData.blob)
      await loadTemplates(userId)
      
      if (advanceToNext) {
        const nextMissing = VOCABULARY.find(w => w !== selectedWord && !savedTemplates.includes(w))
        if (nextMissing) {
          setSelectedWord(nextMissing)
        }
      }
      
      setStatus('saved')
      setReviewData(null)
    } catch (err) {
      console.error("Failed to save template:", err)
      alert("Error saving sign template. Please try again.")
      setStatus('review')
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full max-w-6xl mx-auto animate-fade-in-up pb-10">
      
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-card-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sign Enrollment & AI Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Train, review, and test your sign language gestures with live AI feedback.
          </p>
        </div>
        
        {/* Mode Selector Tabs */}
        <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => { setActiveTab('enroll'); setStatus('idle'); setReviewData(null); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'enroll'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Camera className="w-4 h-4" />
            1. Enroll Sign
          </button>
          <button
            onClick={() => { setActiveTab('test'); setStatus('idle'); setReviewData(null); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'test'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            2. Test & Verify (Right/Wrong)
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Pane: Options & Controls */}
        <Card className="w-full lg:w-[380px] shrink-0 flex flex-col shadow-card-sm border-indigo-50 dark:border-indigo-900/30">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-border rounded-t-xl py-5">
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span>{activeTab === 'enroll' ? 'Select Sign to Enroll' : 'Select Sign to Test'}</span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full">
                {savedTemplates.length} / {VOCABULARY.length} Enrolled
              </span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6 flex-1 bg-slate-50/50 dark:bg-slate-800/50">
            
            {/* Word Selection Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Target Vocabulary Sign</label>
              <div className="relative">
                <select 
                  className="w-full pl-4 pr-10 py-3.5 border border-border rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base font-semibold shadow-sm appearance-none cursor-pointer disabled:opacity-50"
                  value={selectedWord}
                  onChange={(e) => {
                    setSelectedWord(e.target.value)
                    if (status === 'review' || status === 'saved') setStatus('idle')
                  }}
                  disabled={status === 'counting' || status === 'recording' || status === 'saving'}
                >
                  {VOCABULARY.map(word => {
                    const isEnrolled = savedTemplates.includes(word)
                    return (
                      <option key={word} value={word}>
                        {isEnrolled ? '✓ ' : '○ '} {word} {isEnrolled ? '(Enrolled)' : ''}
                      </option>
                    )
                  })}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  ▼
                </div>
              </div>
              
              {savedTemplates.includes(selectedWord) ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Enrolled & ready for AI verification. You can re-record anytime.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Not enrolled yet. Record this sign to enable AI practice & chat.</span>
                </div>
              )}
            </div>

            {/* Hand Presence Indicator */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-border space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Hand Tracking Sensor</span>
                <span className={handsDetectedCount > 0 ? "text-emerald-600" : "text-slate-400"}>
                  {handsDetectedCount > 0 ? `${handsDetectedCount} Hand(s) Detected` : 'No Hands in Frame'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${handsDetectedCount > 0 ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
                <p className="text-xs text-foreground font-medium">
                  {handsDetectedCount > 0 
                    ? 'AI is actively capturing hand joints in real time.' 
                    : 'Raise your hand into the camera frame to begin.'}
                </p>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            {activeTab === 'enroll' ? (
              <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" /> Enrollment Steps:
                </h3>
                <ol className="list-decimal pl-4 space-y-1.5 font-medium">
                  <li>Hold your hand in position facing the camera.</li>
                  <li>Click <b className="text-foreground">Record Sign</b> (3s prep countdown).</li>
                  <li>Perform the gesture naturally for 5 seconds.</li>
                  <li>Review the AI validation (Right / Valid check).</li>
                  <li>Click <b className="text-foreground">Save Sign</b> when satisfied!</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" /> Live Verification:
                </h3>
                <p className="font-medium">
                  Perform the sign for <b className="text-foreground capitalize font-bold">"{selectedWord}"</b> directly in front of the camera. The AI will instantly judge whether your gesture is <b>Right</b> or <b>Wrong</b>.
                </p>
              </div>
            )}

            {/* Action Buttons for Enroll Mode */}
            {activeTab === 'enroll' && (
              <div className="space-y-3 pt-2">
                {status === 'idle' || status === 'saved' ? (
                  <Button 
                    onClick={startEnrollment} 
                    disabled={!isLoaded}
                    size="lg"
                    className="w-full text-base py-6 rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    <Camera className="w-5 h-5 mr-2" /> Record '{selectedWord}'
                  </Button>
                ) : status === 'counting' ? (
                  <Button disabled size="lg" className="w-full text-base py-6 rounded-xl bg-amber-500 text-white font-bold">
                    Get Ready... {countdown}s
                  </Button>
                ) : status === 'recording' ? (
                  <Button 
                    onClick={stopRecording} 
                    size="lg" 
                    className="w-full text-base py-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg animate-pulse"
                  >
                    <Square className="w-5 h-5 mr-2 fill-current" /> Finish Signing ({recordingSecondsLeft}s left)
                  </Button>
                ) : null}

                {status === 'saved' && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 text-center animate-fade-in">
                    ✓ Sign for '{selectedWord}' successfully enrolled and ready!
                  </div>
                )}
              </div>
            )}

          </CardContent>
        </Card>

        {/* Right Pane: Camera Dashboard with Landmarks & Validation */}
        <Card className="flex-1 flex flex-col shadow-card-sm border-indigo-50 dark:border-indigo-900/30 overflow-hidden">
          
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-border py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" />
              <span>Camera Dashboard</span>
            </CardTitle>
            
            <div className="flex items-center gap-3">
              {activeTab === 'test' && (
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full">
                  Live Testing Mode
                </span>
              )}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                <div className={`w-2 h-2 rounded-full ${isLoaded ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {isLoaded ? 'AI Vision Active' : 'Loading MediaPipe...'}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-6 relative bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[460px]">
            
            {!isLoaded ? (
              <div className="flex flex-col items-center animate-fade-in-up">
                <div className="h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4 shadow-sm" />
                <p className="text-muted-foreground font-semibold">Initializing MediaPipe Hand Tracking Engine...</p>
              </div>
            ) : status === 'review' && reviewData ? (
              
              /* Review & Validation State */
              <div className="w-full max-w-2xl flex flex-col items-center space-y-6 animate-fade-in">
                
                {/* Video Playback of Recorded Sign */}
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl bg-black border-4 border-indigo-500">
                  <video
                    src={reviewData.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 fill-current" /> Video Preview (Your Recorded Sign)
                  </div>
                </div>

                {/* AI Quality & Right/Wrong Validation Banner */}
                <div className={`w-full p-5 rounded-2xl border shadow-md ${
                  reviewData.quality.isValid
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                    : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      reviewData.quality.isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {reviewData.quality.isValid ? <Check className="w-7 h-7" /> : <X className="w-7 h-7" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-black leading-tight">
                        {reviewData.quality.isValid ? '✅ RIGHT: Valid Hand Gesture Captured!' : '❌ WRONG / INCOMPLETE: Sign Gesture Not Detected'}
                      </h4>
                      <p className="text-sm font-medium mt-1 opacity-90">
                        {reviewData.quality.message}
                      </p>
                      <div className="mt-3 flex gap-3 text-xs font-bold">
                        <span className="px-2.5 py-1 rounded-md bg-white/70 dark:bg-black/30">
                          Hand Frames: {reviewData.quality.frameCount}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-white/70 dark:bg-black/30">
                          Quality Score: {reviewData.quality.score}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Action Buttons: User chooses when to save or advance */}
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <Button 
                    onClick={handleRetake} 
                    variant="outline" 
                    size="lg"
                    className="flex-1 h-14 rounded-xl text-base font-bold border-2 hover:bg-slate-200"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" /> Discard & Retake
                  </Button>
                  
                  <Button 
                    onClick={() => handleSaveSign(false)} 
                    disabled={!reviewData.quality.isValid}
                    size="lg"
                    className="flex-1 h-14 rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                  >
                    <Check className="w-5 h-5 mr-2" /> Save This Sign
                  </Button>

                  <Button 
                    onClick={() => handleSaveSign(true)} 
                    disabled={!reviewData.quality.isValid}
                    size="lg"
                    className="flex-1 h-14 rounded-xl text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-b-4 border-emerald-800"
                  >
                    <span>Save & Next Word</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>

              </div>

            ) : (

              /* Live Camera View with Canvas Skeleton Overlay */
              <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border-4 border-white dark:border-slate-800">
                
                {/* Live Webcam Feed */}
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                />
                
                {/* Hand Landmarks Skeleton Canvas Overlay */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* 3-Second Preparation Countdown */}
                {status === 'counting' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/70 backdrop-blur-md animate-fade-in z-30">
                    <span className="text-[9rem] font-black text-white drop-shadow-2xl animate-zoom-in leading-none">{countdown}</span>
                    <p className="text-xl font-bold text-indigo-200 mt-2">Get ready to sign "{selectedWord}"</p>
                  </div>
                )}

                {/* Active Recording Overlay with Timer & Stop Button */}
                {status === 'recording' && (
                  <div className="absolute inset-x-0 top-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-30">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 bg-red-500 rounded-full animate-ping" />
                      <span className="text-white font-black tracking-wider text-sm uppercase">RECORDING: '{selectedWord}'</span>
                    </div>
                    <div className="bg-red-600 text-white px-4 py-1.5 rounded-full font-black text-sm shadow-md">
                      {recordingSecondsLeft}s remaining
                    </div>
                  </div>
                )}

                {/* Bottom Bar in Test Mode: Real-Time RIGHT or WRONG verdict */}
                {activeTab === 'test' && (
                  <div className="absolute inset-x-0 bottom-4 px-4 z-30">
                    <div className={`p-4 rounded-2xl backdrop-blur-md border shadow-2xl transition-all duration-300 ${
                      testResult.status === 'correct'
                        ? 'bg-emerald-900/90 border-emerald-400 text-white'
                        : testResult.status === 'wrong'
                        ? 'bg-rose-900/90 border-rose-400 text-white'
                        : 'bg-black/75 border-slate-700 text-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                            testResult.status === 'correct'
                              ? 'bg-emerald-500 text-white'
                              : testResult.status === 'wrong'
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {testResult.status === 'correct' ? '✓' : testResult.status === 'wrong' ? '✕' : '👁'}
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-widest font-bold opacity-80">
                              Target Word: <b className="text-white capitalize">{selectedWord}</b>
                            </p>
                            <p className="text-base font-black leading-snug">
                              {testResult.message}
                            </p>
                          </div>
                        </div>

                        {testResult.confidence > 0 && (
                          <div className="text-right">
                            <span className="text-xs uppercase opacity-75 font-bold block">Match Confidence</span>
                            <span className="text-xl font-black">{testResult.confidence}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </CardContent>
          
          <CardFooter className="py-3 px-6 bg-slate-50 dark:bg-slate-900 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
            <span>AI Model: MediaPipe Hands (v0.10.3)</span>
            <span>Continuous Hand Landmark Detection: {handsDetectedCount > 0 ? 'Active' : 'Standby'}</span>
          </CardFooter>

        </Card>

      </div>
    </div>
  )
}
