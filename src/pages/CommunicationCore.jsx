import { useState, useEffect, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Mic, MicOff, Volume2, Video, MessageSquare, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { useMediaPipe } from '../hooks/useMediaPipe'
import { useSpeech } from '../hooks/useSpeech'
import { getAllTemplates } from '../lib/db'
import { classifySign, normalizeLandmarks } from '../lib/classifier'
import { supabase } from '../lib/supabase'

// Assets
import handSigning from '../assets/hand-signing.png'
import earListening from '../assets/ear-listening.png'
import emptyChat from '../assets/empty-chat.png'

export default function CommunicationCore() {
  const webcamRef = useRef(null)
  const avatarVideoRef = useRef(null)
  const messagesEndRef = useRef(null)
  const { landmarker, isLoaded: isMediaPipeLoaded } = useMediaPipe()
  
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('signbridge_chat_history')
    return saved ? JSON.parse(saved) : []
  })

  // Save to session storage whenever messages change
  useEffect(() => {
    sessionStorage.setItem('signbridge_chat_history', JSON.stringify(messages))
  }, [messages])

  const handleClearChat = () => {
    setMessages([])
    sessionStorage.removeItem('signbridge_chat_history')
  }
  const [templates, setTemplates] = useState([])
  const templatesRef = useRef([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // States for Deaf Pane
  const [isSigning, setIsSigning] = useState(false)
  const [currentSignText, setCurrentSignText] = useState('')
  const [typedText, setTypedText] = useState('')
  
  // States for Hearing Pane
  const [playingVideoUrl, setPlayingVideoUrl] = useState(null)
  const [currentEmojiFallback, setCurrentEmojiFallback] = useState('👋')

  // Load templates on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        getAllTemplates(data.user.id).then(templateData => {
          const normalizedData = templateData.map(t => ({
            ...t,
            landmarksList: t.landmarksList.map(normalizeLandmarks)
          }))
          setTemplates(normalizedData)
          templatesRef.current = normalizedData
        })
      }
    })
  }, [])

  // --------------------------------------------------------------------------
  // Speech Hooks & Logic (Hearing Pane)
  // --------------------------------------------------------------------------
  const onSpeechResult = useCallback((transcript) => {
    // We add speech to the chat log
    if (transcript) {
      addMessage('hearing', transcript)
      processTextToSign(transcript)
    }
  }, [])

  const { isListening, startListening, stopListening, speak } = useSpeech(onSpeechResult)

  const processTextToSign = (text) => {
    // Extremely simplistic keyword matching for Text-to-Sign demo
    const words = text.toLowerCase().replace(/[^\w\s]/gi, '').split(' ')
    
    // Find first word in our templates
    for (const w of words) {
      const template = templatesRef.current.find(t => t.word === w)
      if (template && template.videoBlob) {
        const url = URL.createObjectURL(template.videoBlob)
        setPlayingVideoUrl(url)
        return
      }
    }
    // Fallback if no keyword matched
    setPlayingVideoUrl(null)
    setCurrentEmojiFallback('🤷‍♂️')
    setTimeout(() => setCurrentEmojiFallback('👋'), 2000)
  }

  useEffect(() => {
    if (playingVideoUrl && avatarVideoRef.current) {
      avatarVideoRef.current.play().catch(e => console.error(e))
    }
  }, [playingVideoUrl])

  // --------------------------------------------------------------------------
  // Sign Recognition Logic (Deaf Pane)
  // --------------------------------------------------------------------------
  const isSigningRef = useRef(false)
  const lastVideoTimeRef = useRef(-1)
  const requestRef = useRef()
  const lastRecognizedRef = useRef(null)
  const debounceTimerRef = useRef(null)

  const toggleSigning = () => {
    const newState = !isSigning
    setIsSigning(newState)
    isSigningRef.current = newState
    if (newState) {
      lastVideoTimeRef.current = -1
      requestRef.current = requestAnimationFrame(detectFrame)
    } else {
      cancelAnimationFrame(requestRef.current)
    }
  }

  const detectFrame = useCallback(() => {
    if (landmarker && webcamRef.current && webcamRef.current.video && isSigningRef.current) {
      const video = webcamRef.current.video
      
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        const results = landmarker.detectForVideo(video, performance.now())
        if (results.landmarks && results.landmarks.length > 0) {
          const match = classifySign(results.landmarks[0], templates, 3.0) // Increased threshold for stability
          if (match) {
            const word = match.word
            if (lastRecognizedRef.current !== word) {
              lastRecognizedRef.current = word
              setCurrentSignText(word)
              
              // Debounce pushing to chat to avoid spam
              clearTimeout(debounceTimerRef.current)
              debounceTimerRef.current = setTimeout(() => {
                addMessage('deaf', word)
                speak(word) // auto speak the sign
                lastRecognizedRef.current = null
              }, 1500)
            }
          }
        }
      }
    }
    
    if (isSigningRef.current) {
      requestRef.current = requestAnimationFrame(detectFrame)
    }
  }, [landmarker, templates, speak])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(requestRef.current)
      clearTimeout(debounceTimerRef.current)
    }
  }, [])

  // --------------------------------------------------------------------------
  // Chat / TTS
  // --------------------------------------------------------------------------
  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { id: Date.now(), sender, text }])
  }

  const handleSpeakText = (e) => {
    e.preventDefault()
    if (!typedText.trim()) return
    addMessage('deaf', typedText)
    speak(typedText)
    setTypedText('')
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto animate-fade-in-up pb-8">
      {/* Top Section: Dual Visuals */}
      <div className="flex flex-col md:flex-row gap-6 min-h-[350px] lg:h-[450px]">
        {/* Deaf User Pane */}
        <Card className="flex-1 flex flex-col shadow-card-sm border-indigo-50 dark:border-indigo-900/30 group hover:shadow-card-md transition-shadow">
          <CardHeader className="py-4 px-6 border-b border-border bg-white dark:bg-slate-900 rounded-t-xl z-10">
            <CardTitle className="text-lg flex justify-between items-center text-foreground font-bold">
              <span>Deaf User (Sign-to-Text)</span>
              {isSigning && (
                <div className="flex items-center gap-2 text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full animate-pulse-soft">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Live Camera
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center overflow-hidden z-0">
            {!isSigning ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="w-32 h-32 opacity-80 mb-4 group-hover:scale-105 transition-transform duration-500">
                  <img src={handSigning} alt="Hand Signing" className="w-full h-full object-contain drop-shadow-xl" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                  {!isMediaPipeLoaded 
                    ? "Loading AI Engine..." 
                    : templates.length === 0 
                      ? "No templates enrolled. Please go to Enrollment first." 
                      : "Use your camera to sign and see the text instantly."}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600">
                    <Video className="w-5 h-5" />
                  </div>
                  <Button 
                    className="rounded-full shadow-sm"
                    onClick={toggleSigning}
                    disabled={!isMediaPipeLoaded || templates.length === 0}
                  >
                    Start Signing
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                />
                <div className="absolute top-4 right-4 z-20">
                  <Button variant="danger" size="sm" onClick={toggleSigning} className="rounded-full shadow-md">
                    Stop Camera
                  </Button>
                </div>
                {currentSignText && (
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 animate-fade-in-up">
                    <span className="bg-white dark:bg-slate-900/90 backdrop-blur-md text-indigo-900 dark:text-indigo-100 border border-indigo-100 dark:border-indigo-900/50 shadow-lg text-2xl font-bold px-6 py-3 rounded-2xl">
                      {currentSignText}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="p-3 bg-white dark:bg-slate-900 border-t border-border rounded-b-xl z-10">
            <form onSubmit={handleSpeakText} className="flex w-full gap-2">
              <FormField 
                className="flex-1"
                placeholder="Type a message to speak..." 
                value={typedText}
                onChange={e => setTypedText(e.target.value)}
              />
              <Button type="submit" variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700">
                <Volume2 className="w-4 h-4 mr-2" /> Speak
              </Button>
            </form>
          </CardFooter>
        </Card>

        {/* Hearing User Pane */}
        <Card className="flex-1 flex flex-col shadow-card-sm border-indigo-50 dark:border-indigo-900/30 group hover:shadow-card-md transition-shadow">
          <CardHeader className="py-4 px-6 border-b border-border bg-white dark:bg-slate-900 rounded-t-xl z-10">
            <CardTitle className="text-lg flex justify-between items-center text-foreground font-bold">
              <span>Hearing User (Speech-to-Sign)</span>
              {isListening && (
                <div className="flex items-center gap-2 text-xs font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded-full animate-pulse-soft">
                  <div className="w-2 h-2 rounded-full bg-purple-500" /> Listening
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden z-0">
            {playingVideoUrl ? (
              <>
                <video 
                  ref={avatarVideoRef}
                  src={playingVideoUrl} 
                  className="w-full h-full object-cover"
                  onEnded={() => setPlayingVideoUrl(null)}
                  autoPlay
                  muted
                  playsInline
                />
                <div className="absolute top-4 right-4 z-20">
                  <Button variant="danger" size="sm" onClick={stopListening} className="rounded-full shadow-md">
                    Stop Mic
                  </Button>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="w-32 h-32 opacity-80 mb-4 group-hover:scale-105 transition-transform duration-500">
                  <img src={earListening} alt="Ear Listening" className="w-full h-full object-contain drop-shadow-xl" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                  {isListening ? "Listening... Speak now." : "Speak and see the sign language in real-time."}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </div>
                  <Button 
                    className={`rounded-full shadow-sm ${isListening ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                    onClick={isListening ? stopListening : startListening}
                  >
                    {isListening ? 'Stop Mic' : 'Start Speaking'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Chat Transcript */}
      <Card className="flex flex-col overflow-hidden shadow-card-sm border-indigo-50 dark:border-indigo-900/30 h-[500px]">
        <CardHeader className="py-4 px-6 border-b border-border bg-white dark:bg-slate-900 z-10 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-bold">Conversation</CardTitle>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearChat} className="text-muted-foreground hover:text-red-600 h-8 px-3 rounded-lg text-xs">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-800/50 relative">
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full relative z-10">
              <div className="w-24 h-24 mb-4 relative opacity-60">
                <img src={emptyChat} alt="Empty Conversation" className="w-full h-full object-contain animate-float" />
              </div>
              <p className="font-semibold text-foreground text-center">Your conversation will appear here</p>
              <p className="text-sm text-muted-foreground mt-1">Start signing or speaking to begin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex w-full animate-slide-in ${msg.sender === 'deaf' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm relative ${
                    msg.sender === 'deaf' 
                      ? 'bg-indigo-600 text-white rounded-tl-sm border border-indigo-700' 
                      : 'bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:border-slate-700 text-slate-800 dark:text-slate-200 dark:text-slate-200 rounded-tr-sm'
                  }`}>
                    <p className={`text-xs font-semibold mb-1 ${msg.sender === 'deaf' ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                      {msg.sender === 'deaf' ? 'Deaf User' : 'Hearing User'}
                    </p>
                    <p className="text-base leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        
        {/* Placeholder Chat Input Bar just for visual consistency with Home */}
        <div className="p-4 border-t border-border bg-white dark:bg-slate-900 rounded-b-xl hidden md:block">
          <div className="relative opacity-50">
            <input 
              type="text" 
              placeholder="Use the camera or microphone above to communicate..." 
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-muted/30 focus:outline-none"
              disabled
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 dark:text-slate-400">
              <MessageSquare className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
