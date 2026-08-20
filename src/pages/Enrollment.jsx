import { useState, useRef, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { saveTemplate, getAllTemplates } from '../lib/db'
import { useMediaPipe } from '../hooks/useMediaPipe'
import { supabase } from '../lib/supabase'

const VOCABULARY = [
  'hello', 'thank you', 'please', 'help', 'yes', 'no', 
  'doctor', 'pain', 'emergency', 'water', 'food', 'bathroom', 
  'family', 'friend', 'sorry', 'good', 'bad', 'stop', 'wait', 'more',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
]

export default function Enrollment() {
  const webcamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const { landmarker, isLoaded } = useMediaPipe()
  
  const [selectedWord, setSelectedWord] = useState(VOCABULARY[0])
  const [status, setStatus] = useState('idle') // idle, counting, recording, saving
  const [countdown, setCountdown] = useState(3)
  const [savedTemplates, setSavedTemplates] = useState([])
  const [userId, setUserId] = useState(null)
  
  const isRecordingRef = useRef(false)
  const requestRef = useRef()
  const landmarksLogRef = useRef([])
  const lastVideoTimeRef = useRef(-1)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id)
        loadTemplates(data.user.id)
      }
    })
  }, [])

  const loadTemplates = async (uid = userId) => {
    if (!uid) return
    const templates = await getAllTemplates(uid)
    setSavedTemplates(templates.map(t => t.word))
  }

  const detectFrame = useCallback(() => {
    if (landmarker && webcamRef.current && webcamRef.current.video && isRecordingRef.current) {
      const video = webcamRef.current.video
      
      // Only process if video is ready and playing
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        const results = landmarker.detectForVideo(video, performance.now())
        if (results.landmarks && results.landmarks.length > 0) {
          // just taking the first hand for simplicity
          landmarksLogRef.current.push(results.landmarks[0])
        }
      }
    }
    
    if (isRecordingRef.current) {
      requestRef.current = requestAnimationFrame(detectFrame)
    }
  }, [landmarker])

  const startEnrollment = () => {
    setStatus('counting')
    setCountdown(3)
    
    let cnt = 3
    const timer = setInterval(() => {
      cnt -= 1
      if (cnt === 0) {
        clearInterval(timer)
        startRecording()
      } else {
        setCountdown(cnt)
      }
    }, 1000)
  }

  const startRecording = () => {
    setStatus('recording')
    isRecordingRef.current = true
    landmarksLogRef.current = []
    lastVideoTimeRef.current = -1
    
    // Start detection loop
    requestRef.current = requestAnimationFrame(detectFrame)
    
    const stream = webcamRef.current.video.srcObject
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    mediaRecorderRef.current = mediaRecorder
    
    const chunks = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    
    mediaRecorder.onstop = async () => {
      isRecordingRef.current = false
      cancelAnimationFrame(requestRef.current)
      setStatus('saving')
      
      const blob = new Blob(chunks, { type: 'video/webm' })
      const capturedLandmarks = [...landmarksLogRef.current]
      
      if (capturedLandmarks.length === 0) {
        alert("No hands detected! Please keep your hands clearly visible in the camera frame.")
        setStatus('idle')
        return
      }

      if (!userId) {
        alert("You must be logged in to save signs.")
        setStatus('idle')
        return
      }

      await saveTemplate(userId, selectedWord, capturedLandmarks, blob)
      await loadTemplates()
      
      // Auto-select next missing word
      const nextMissing = VOCABULARY.find(w => w !== selectedWord && !savedTemplates.includes(w))
      if (nextMissing) setSelectedWord(nextMissing)
      
      setStatus('idle')
    }
    
    mediaRecorder.start()
    
    // Stop recording after 2 seconds
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }, 2000)
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full max-w-6xl mx-auto animate-fade-in-up">
      {/* Left Pane: Instructions & Vocabulary */}
      <Card className="w-full md:w-[400px] flex flex-col shadow-card-sm border-indigo-50 dark:border-indigo-900/30">
        <CardHeader className="bg-white dark:bg-slate-900 border-b border-border rounded-t-xl py-6">
          <CardTitle className="text-xl font-bold">Sign Enrollment</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Train the AI to recognize your specific hand gestures for common words.
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6 flex-1 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-border shadow-sm">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 flex items-center justify-center text-xs">ℹ</div>
              How it works
            </h3>
            <ol className="list-decimal pl-5 space-y-3 text-sm text-muted-foreground">
              <li>Select a word from the list below.</li>
              <li>Position your hands clearly in the camera view.</li>
              <li>Click <strong className="text-foreground">Record Sign</strong> (3s countdown).</li>
              <li>Perform the sign while recording (2s).</li>
            </ol>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Select Word to Enroll</label>
            <div className="relative">
              <select 
                className="w-full pl-4 pr-10 py-3 border border-border rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base shadow-sm appearance-none cursor-pointer disabled:opacity-50"
                value={selectedWord}
                onChange={(e) => setSelectedWord(e.target.value)}
                disabled={status !== 'idle'}
              >
                {VOCABULARY.map(word => (
                  <option key={word} value={word}>
                    {savedTemplates.includes(word) ? '✓ ' : ''} {word}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                ▼
              </div>
            </div>
            
            <Button 
              onClick={startEnrollment} 
              disabled={status !== 'idle' || !isLoaded}
              size="lg"
              className="w-full text-base py-6 rounded-xl shadow-md"
            >
              {status === 'idle' ? `Record '${selectedWord}'` : status.toUpperCase()}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right Pane: Camera & Recording */}
      <Card className="flex-1 flex flex-col shadow-card-sm border-indigo-50 dark:border-indigo-900/30">
        <CardHeader className="bg-white dark:bg-slate-900 border-b border-border rounded-t-xl py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Camera View</CardTitle>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-slate-400" /> Preview
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center relative bg-slate-100 dark:bg-slate-800 p-6 overflow-hidden rounded-b-xl">
          {!isLoaded ? (
            <div className="flex flex-col items-center animate-fade-in-up">
              <div className="h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4 shadow-sm"></div>
              <p className="text-muted-foreground font-medium">Loading AI Engine...</p>
            </div>
          ) : (
            <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-lg bg-black border-4 border-white">
              <Webcam
                ref={webcamRef}
                audio={false}
                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
              />
              
              {status === 'counting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/40 backdrop-blur-sm animate-fade-in">
                  <span className="text-[10rem] font-bold text-white drop-shadow-2xl animate-zoom-in">{countdown}</span>
                </div>
              )}
              
              {status === 'recording' && (
                <div className="absolute top-6 right-6 bg-red-500 text-white px-5 py-2 rounded-full animate-pulse-soft font-bold text-sm flex items-center shadow-lg">
                  <span className="h-2 w-2 bg-white dark:bg-slate-900 rounded-full mr-2 animate-ping"></span>
                  RECORDING
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
