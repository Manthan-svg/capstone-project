import { useState, useEffect, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { 
  RefreshCw, 
  Check, 
  X, 
  ArrowRight, 
  VideoOff, 
  Camera, 
  Sparkles, 
  Layers 
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getAllTemplates } from '../../lib/db'
import { useMediaPipe } from '../../hooks/useMediaPipe'
import { 
  normalizeLandmarks, 
  classifySign, 
  verifySpecificSign, 
  drawHandLandmarks 
} from '../../lib/classifier'

const ISL_SIGN_GUIDES = {
  yes: {
    title: 'Yes',
    gesture: 'Fist Nod or Thumbs Up',
    instructions: 'Make a closed fist and bob it up and down at the wrist like a nodding head, or raise a confident thumbs-up.',
    icon: '👍',
    videoUrl: 'https://www.youtube-nocookie.com/embed/vO5zC_k9d_I'
  },
  no: {
    title: 'No',
    gesture: 'Index Point / Snap',
    instructions: 'Extend index and middle fingers together and snap them down firmly against your thumb, or wag your index finger side-to-side.',
    icon: '☝️',
    videoUrl: 'https://www.youtube-nocookie.com/embed/vO5zC_k9d_I'
  },
  hello: {
    title: 'Hello',
    gesture: 'Open Palm Salute',
    instructions: 'Touch your fingertips near your forehead/temple in an open-palm salute and move your hand outward with a friendly smile.',
    icon: '👋',
    videoUrl: 'https://www.youtube-nocookie.com/embed/5F6o3fGZk_k'
  },
  'thank you': {
    title: 'Thank You',
    gesture: 'Chin to Forward Palm',
    instructions: 'Touch the flat fingertips of your hand to your chin or lips, then extend your hand forward toward the person with an open palm.',
    icon: '🙏',
    videoUrl: 'https://www.youtube-nocookie.com/embed/bE_iW63mXWc'
  },
  help: {
    title: 'Help',
    gesture: 'Thumbs-up on Flat Palm',
    instructions: 'Hold your non-dominant hand flat facing up. Make a thumbs-up fist with your dominant hand and place it on top of the flat palm, raising both together.',
    icon: '🆘',
    videoUrl: 'https://www.youtube-nocookie.com/embed/sU74W5cT1uU'
  },
  please: {
    title: 'Please',
    gesture: 'Chest Circular Rub',
    instructions: 'Place your flat open palm over your chest/heart and rub in a gentle clockwise circle.',
    icon: '🤲',
    videoUrl: 'https://www.youtube-nocookie.com/embed/bE_iW63mXWc'
  },
  doctor: {
    title: 'Doctor',
    gesture: 'Wrist Pulse Check',
    instructions: 'Rest your non-dominant wrist facing up. Tap the tips of your index and middle fingers against your pulse point twice.',
    icon: '👨‍⚕️',
    videoUrl: 'https://www.youtube-nocookie.com/embed/Xq3_j47M2l8'
  },
  pain: {
    title: 'Pain',
    gesture: 'Opposing Index Points',
    instructions: 'Point both index fingers toward each other with a small gap and jab them toward each other repeatedly near the hurting area.',
    icon: '⚡',
    videoUrl: 'https://www.youtube-nocookie.com/embed/G_l9N4s0Tyo'
  },
  water: {
    title: 'Water',
    gesture: 'W-Shape on Chin',
    instructions: 'Form a "W" with your index, middle, and ring fingers extended upward. Tap your index finger against your chin twice.',
    icon: '💧'
  },
  food: {
    title: 'Food / Eat',
    gesture: 'Fingertips to Mouth',
    instructions: 'Bring your thumb and all fingertips together into a point, then tap them to your lips twice as if putting food in your mouth.',
    icon: '🍲'
  },
  emergency: {
    title: 'Emergency',
    gesture: 'Raised Shaking Fist',
    instructions: 'Form an "E" handshape or raised fist and shake it with an urgent facial expression.',
    icon: '🚨'
  }
}

const DEFAULT_PRACTICE_WORDS = [
  'yes', 'no', 'hello', 'thank you', 'help', 'please', 'doctor', 'pain', 'water', 'food',
  'emergency', 'hospital', 'medicine', 'good', 'bad', 'sorry', 'work', 'friend', 'family', 'how are you'
]

export default function PracticeFlashcards() {
  const [deck, setDeck] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [practiceMode, setPracticeMode] = useState('camera') // 'camera' | 'flashcard'
  
  const [stats, setStats] = useState({ known: 0, learning: 0 })
  
  // Camera & MediaPipe states
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const { landmarker, isLoaded: isMediaPipeLoaded } = useMediaPipe()
  const requestRef = useRef()
  const lastVideoTimeRef = useRef(-1)
  
  // AI Verification state for current card
  const [verificationState, setVerificationState] = useState({
    status: 'waiting', // 'waiting' | 'correct' | 'wrong'
    detectedWord: null,
    confidence: 0,
    message: 'Perform sign in front of camera'
  })
  const [hasScoredCurrent, setHasScoredCurrent] = useState(false)
  const [handsInFrameCount, setHandsInFrameCount] = useState(0)

  useEffect(() => {
    loadEnrolledSigns()
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  const loadEnrolledSigns = async () => {
    setIsLoading(true)
    const { data } = await supabase.auth.getUser()
    let loadedDeck = []
    if (data?.user) {
      const templates = await getAllTemplates(data.user.id)
      if (templates && templates.length > 0) {
        loadedDeck = templates.map(t => ({
          ...t,
          landmarksList: t.landmarksList.map(normalizeLandmarks)
        }))
      }
    }
    
    // If user has not enrolled all words yet, supplement with the 20 core ISL words
    if (loadedDeck.length === 0) {
      loadedDeck = DEFAULT_PRACTICE_WORDS.map(word => ({ word, landmarksList: [] }))
    } else {
      // Ensure key words exist in practice deck
      DEFAULT_PRACTICE_WORDS.forEach(w => {
        if (!loadedDeck.some(item => item.word.toLowerCase() === w)) {
          loadedDeck.push({ word: w, landmarksList: [] })
        }
      })
    }

    setDeck(loadedDeck.sort(() => Math.random() - 0.5))
    setIsLoading(false)
  }

  const currentTemplate = deck[currentIndex]
  const isComplete = currentIndex >= deck.length && deck.length > 0
  const currentWord = currentTemplate?.word

  // Reset verification whenever current card changes
  useEffect(() => {
    setVerificationState({
      status: 'waiting',
      detectedWord: null,
      confidence: 0,
      message: currentWord ? `Position hands and sign "${currentWord}"` : ''
    })
    setHasScoredCurrent(false)
  }, [currentIndex, currentWord])

  // Continuous Camera Loop for AI Sign Verification
  const detectFrame = useCallback(() => {
    if (
      practiceMode === 'camera' &&
      landmarker && 
      webcamRef.current && 
      webcamRef.current.video && 
      currentWord
    ) {
      const video = webcamRef.current.video
      
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        const results = landmarker.detectForVideo(video, performance.now())
        
        // 1. Draw hand landmarks onto canvas
        if (canvasRef.current) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 480
          }
          if (results.landmarks && results.landmarks.length > 0) {
            drawHandLandmarks(ctx, results.landmarks, canvas.width, canvas.height, true)
            setHandsInFrameCount(results.landmarks.length)
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            setHandsInFrameCount(0)
          }
        }

        // 2. Classify gesture against target word
        if (results.landmarks && results.landmarks.length > 0) {
          const hand = results.landmarks[0]
          const targetCheck = verifySpecificSign(hand, currentWord, deck, 15.0)
          const generalCheck = classifySign(hand, deck, 15.0)

          if (targetCheck.isMatch) {
            setVerificationState({
              status: 'correct',
              detectedWord: currentWord,
              confidence: targetCheck.confidence,
              message: `RIGHT! You signed "${currentWord}" correctly!`
            })

            // Increment known score if not yet scored for this card
            if (!hasScoredCurrent) {
              setStats(prev => ({ ...prev, known: prev.known + 1 }))
              setHasScoredCurrent(true)
            }
          } else if (generalCheck && generalCheck.word.toLowerCase() !== currentWord.toLowerCase()) {
            setVerificationState({
              status: 'wrong',
              detectedWord: generalCheck.word,
              confidence: generalCheck.confidence,
              message: `WRONG! AI detected "${generalCheck.word}" instead of "${currentWord}".`
            })
          } else {
            setVerificationState({
              status: 'waiting',
              detectedWord: null,
              confidence: 0,
              message: `Analyzing gesture... Perform "${currentWord}".`
            })
          }
        }
      }
    }
    
    requestRef.current = requestAnimationFrame(detectFrame)
  }, [practiceMode, landmarker, currentWord, deck, hasScoredCurrent])

  useEffect(() => {
    if (isMediaPipeLoaded && practiceMode === 'camera') {
      requestRef.current = requestAnimationFrame(detectFrame)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [isMediaPipeLoaded, practiceMode, detectFrame])

  // Move to the next sign
  const handleNext = (knewIt = true) => {
    if (practiceMode === 'flashcard' || !hasScoredCurrent) {
      setStats(prev => ({
        known: knewIt ? prev.known + 1 : prev.known,
        learning: !knewIt ? prev.learning + 1 : prev.learning
      }))
    }
    setIsFlipped(false)
    setCurrentIndex(prev => prev + 1)
  }

  const restart = () => {
    setDeck(prev => [...prev].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
    setIsFlipped(false)
    setStats({ known: 0, learning: 0 })
    setHasScoredCurrent(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-4">
        <div className="h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-muted-foreground font-semibold">Loading your enrolled signs...</p>
      </div>
    )
  }

  if (deck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] animate-fade-in-up">
        <Card className="max-w-md w-full text-center p-10 shadow-card-lg border-indigo-50 bg-white dark:bg-slate-900">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <VideoOff className="w-10 h-10 text-slate-400" />
          </div>
          <CardTitle className="text-2xl font-bold mb-4">No Signs Enrolled</CardTitle>
          <p className="text-muted-foreground mb-8 text-sm">
            You haven't enrolled any signs yet. Please go to the <b>Sign Enrollment</b> section to record yourself signing words before practicing here!
          </p>
          <Button onClick={() => window.location.href = '/enroll'} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">
            Go to Sign Enrollment ➔
          </Button>
        </Card>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] animate-fade-in-up">
        <Card className="max-w-md w-full text-center p-10 shadow-card-lg border-indigo-50 dark:border-indigo-900/30 bg-white dark:bg-slate-900">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-200">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <CardTitle className="text-3xl font-black mb-2 text-foreground">Practice Session Complete!</CardTitle>
          <p className="text-muted-foreground mb-8 font-medium">Outstanding work practicing your sign language vocabulary!</p>
          
          <div className="flex justify-center gap-12 mb-10">
            <div className="text-emerald-600 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-2 shadow-sm border border-emerald-100">
                <p className="text-3xl font-black">{stats.known}</p>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300">Right / Known</p>
            </div>
            <div className="text-amber-600 flex flex-col items-center">
               <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-2 shadow-sm border border-amber-100">
                <p className="text-3xl font-black">{stats.learning}</p>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300">Learning</p>
            </div>
          </div>
          <Button onClick={restart} className="w-full flex items-center justify-center gap-2 h-14 rounded-xl text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-transform active:scale-95" size="lg">
            <RefreshCw className="w-5 h-5" /> Practice Again
          </Button>
        </Card>
      </div>
    )
  }

  const videoUrl = currentTemplate?.videoBlob ? URL.createObjectURL(currentTemplate.videoBlob) : null

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
      
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-border">
        
        {/* Progress & Scores */}
        <div className="flex items-center gap-4 text-sm font-bold">
          <span className="text-foreground px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
            Progress: {currentIndex + 1} / {deck.length}
          </span>
          <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-100">
            Right: {stats.known}
          </span>
          <span className="text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full border border-amber-100">
            Learning: {stats.learning}
          </span>
        </div>

        {/* Practice Mode Switcher */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setPracticeMode('camera')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              practiceMode === 'camera'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> AI Camera Mode (Right/Wrong)
          </button>
          <button
            onClick={() => setPracticeMode('flashcard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              practiceMode === 'flashcard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Classic Flashcards
          </button>
        </div>

      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
        <div 
          className="bg-indigo-600 h-full transition-all duration-500 ease-out rounded-full" 
          style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
        />
      </div>

      {/* Mode 1: AI CAMERA PRACTICE DASHBOARD */}
      {practiceMode === 'camera' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* Left: Camera Feed with Hand Skeleton & Live Verification */}
          <Card className="flex flex-col shadow-card-md border-indigo-100 dark:border-indigo-900/40 overflow-hidden">
            <CardHeader className="py-4 px-6 bg-white dark:bg-slate-900 border-b border-border flex flex-row items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Sign This Word</span>
                <CardTitle className="text-3xl font-black capitalize text-foreground mt-0.5">{currentWord}</CardTitle>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
                <span className={`w-2 h-2 rounded-full ${handsInFrameCount > 0 ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                {handsInFrameCount > 0 ? 'Hand Detected' : 'Show Hand'}
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative bg-black flex items-center justify-center min-h-[340px]">
              {!isMediaPipeLoaded ? (
                <div className="text-center text-white p-6">
                  <div className="h-8 w-8 border-4 border-indigo-400 border-t-white rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm font-semibold">Loading AI Hand Tracker...</p>
                </div>
              ) : (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                </>
              )}

              {/* Real-time Right / Wrong verdict overlay */}
              <div className="absolute inset-x-3 bottom-3 z-20">
                <div className={`p-3.5 rounded-xl backdrop-blur-md border shadow-lg transition-all ${
                  verificationState.status === 'correct'
                    ? 'bg-emerald-900/90 border-emerald-400 text-white'
                    : verificationState.status === 'wrong'
                    ? 'bg-rose-900/90 border-rose-400 text-white'
                    : 'bg-black/75 border-slate-700 text-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        verificationState.status === 'correct'
                          ? 'bg-emerald-500 text-white'
                          : verificationState.status === 'wrong'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {verificationState.status === 'correct' ? '✓' : verificationState.status === 'wrong' ? '✕' : '●'}
                      </div>
                      <p className="text-sm font-black leading-tight">
                        {verificationState.message}
                      </p>
                    </div>
                    {verificationState.confidence > 0 && (
                      <span className="text-xs font-black bg-white/20 px-2 py-1 rounded">
                        {verificationState.confidence}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="py-4 px-6 bg-white dark:bg-slate-900 border-t border-border flex justify-between items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNext(false)}
                className="font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Skip Word
              </Button>
              
              <Button
                size="default"
                onClick={() => handleNext(true)}
                className={`font-bold px-6 shadow-md ${
                  verificationState.status === 'correct'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                Next Sign ➔
              </Button>
            </CardFooter>
          </Card>

          {/* Right: Enrolled Sign Reference & Video Guide */}
          <Card className="flex flex-col shadow-card-md border-indigo-100 dark:border-indigo-900/40">
            <CardHeader className="py-4 px-6 bg-white dark:bg-slate-900 border-b border-border">
              <CardTitle className="text-base font-bold flex items-center justify-between text-foreground">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>ISL Demonstration & Reference</span>
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  Official ISL
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target gesture instructions for <b className="capitalize text-foreground">"{currentWord}"</b>.
              </p>
            </CardHeader>

            <CardContent className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50">
              <div className="w-full aspect-video max-w-sm bg-slate-900 rounded-2xl overflow-hidden shadow-md relative border border-slate-300 dark:border-slate-700 flex items-center justify-center">
                {videoUrl ? (
                  <video 
                    src={videoUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : ISL_SIGN_GUIDES[currentWord?.toLowerCase()]?.videoUrl ? (
                  <iframe
                    src={`${ISL_SIGN_GUIDES[currentWord?.toLowerCase()].videoUrl}?rel=0&modestbranding=1`}
                    title={`ISL Demonstration for ${currentWord}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-white space-y-2">
                    <span className="text-5xl">{ISL_SIGN_GUIDES[currentWord?.toLowerCase()]?.icon || '✋'}</span>
                    <span className="text-sm font-black capitalize text-indigo-300">{currentWord}</span>
                    <span className="text-xs text-slate-300 max-w-xs">{ISL_SIGN_GUIDES[currentWord?.toLowerCase()]?.gesture}</span>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-center pointer-events-none">
                  <span className="text-xs font-medium text-white">Target Sign: <b className="capitalize">{currentWord}</b></span>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="mt-5 w-full space-y-2 text-xs text-muted-foreground bg-white dark:bg-slate-900 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <span>{ISL_SIGN_GUIDES[currentWord?.toLowerCase()]?.icon || '💡'}</span>
                    How to Sign "{currentWord}":
                  </span>
                </div>
                <p className="text-foreground/90 font-medium leading-relaxed">
                  {ISL_SIGN_GUIDES[currentWord?.toLowerCase()]?.instructions || `Perform the Indian Sign Language gesture for "${currentWord}" in front of your camera.`}
                </p>
                <div className="pt-2 border-t border-dashed border-border flex items-center justify-between text-[11px] text-indigo-600 font-bold">
                  <span>Posture Match: Standard ISL</span>
                  <span>AI Live Analysis Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      ) : (

        /* Mode 2: CLASSIC FLASHCARD MODE */
        <div 
          className="relative w-full aspect-[4/3] max-w-2xl mx-auto perspective-1000 cursor-pointer group" 
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`w-full h-full transition-transform duration-700 transform-style-preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front of Card */}
            <Card className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-card-lg bg-white dark:bg-slate-900 group-hover:shadow-card-xl transition-shadow rounded-3xl p-8 text-center">
              <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-sm mb-4 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-1.5 rounded-full">Sign this word</p>
              <h2 className="text-6xl md:text-7xl font-black capitalize text-foreground drop-shadow-sm">{currentWord}</h2>
              <span className="text-5xl mt-6">{ISL_SIGN_GUIDES[currentWord?.toLowerCase()]?.icon || '✋'}</span>
              <p className="text-muted-foreground mt-8 text-sm font-medium flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-indigo-500" /> Click card to view official ISL demonstration
              </p>
            </Card>

            {/* Back of Card */}
            <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-3xl p-6">
              <div className="text-center w-full">
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mb-2">Did you sign it correctly?</p>
                <h3 className="text-xl font-black capitalize text-foreground">{currentWord}</h3>
              </div>
              
              <div className="w-full max-w-xs aspect-video bg-slate-900 rounded-2xl border border-slate-300 flex items-center justify-center shadow-sm relative overflow-hidden my-2">
                {videoUrl ? (
                  <video 
                    src={videoUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : ISL_SIGN_GUIDES[currentWord?.toLowerCase()]?.videoUrl ? (
                  <iframe
                    src={`${ISL_SIGN_GUIDES[currentWord?.toLowerCase()].videoUrl}?rel=0&modestbranding=1`}
                    title={`ISL Demonstration for ${currentWord}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-white space-y-1">
                    <span className="text-4xl">{ISL_SIGN_GUIDES[currentWord?.toLowerCase()]?.icon || '✋'}</span>
                    <span className="text-xs text-indigo-200 font-bold">{ISL_SIGN_GUIDES[currentWord?.toLowerCase()]?.gesture || currentWord}</span>
                  </div>
                )}
              </div>

              <div className="w-full max-w-sm px-4 text-center text-xs text-muted-foreground mb-2">
                <p className="font-medium text-foreground">{ISL_SIGN_GUIDES[currentWord?.toLowerCase()]?.instructions}</p>
              </div>

              <div className="flex gap-4 w-full max-w-sm px-2">
                <Button size="lg" className="flex-1 h-12 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 text-rose-600 border-2 border-rose-100 hover:bg-rose-50 shadow-sm" onClick={(e) => { e.stopPropagation(); handleNext(false); }}>
                  <X className="w-4 h-4 mr-1" /> No, I didn't
                </Button>
                <Button size="lg" className="flex-1 h-12 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md border-b-4 border-emerald-700" onClick={(e) => { e.stopPropagation(); handleNext(true); }}>
                  <Check className="w-4 h-4 mr-1" /> Yes, I did!
                </Button>
              </div>
            </Card>

          </div>
        </div>
      )}

    </div>
  )
}
