import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Webcam from 'react-webcam'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { useMediaPipe } from '../hooks/useMediaPipe'
import { useSpeech } from '../hooks/useSpeech'
import { getAllTemplates } from '../lib/db'
import { classifySign, normalizeLandmarks } from '../lib/classifier'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AppointmentChat() {
  const { id: appointmentId } = useParams()
  const { user, profile } = useAuth()
  
  const webcamRef = useRef(null)
  const avatarVideoRef = useRef(null)
  const { landmarker, isLoaded: isMediaPipeLoaded } = useMediaPipe()
  
  const [messages, setMessages] = useState([])
  const [templates, setTemplates] = useState([])
  
  const [isSigning, setIsSigning] = useState(false)
  const [currentSignText, setCurrentSignText] = useState('')
  const [typedText, setTypedText] = useState('')
  
  const [playingVideoUrl, setPlayingVideoUrl] = useState(null)
  
  const lastPlayedMessageIdRef = useRef(null)
  
  const isDeafUser = profile?.role === 'User'

  // Load templates and fetch chat history
  useEffect(() => {
    if (user?.id) {
      getAllTemplates(user.id).then(templateData => {
        const normalizedData = templateData.map(t => ({
          ...t,
          landmarksList: t.landmarksList.map(normalizeLandmarks)
        }))
        setTemplates(normalizedData)
      })
    }
    
    fetchMessages()
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`room:${appointmentId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats', filter: `appointment_id=eq.${appointmentId}` }, payload => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        if (isDeafUser && payload.new.sender_id !== user.id) {
          lastPlayedMessageIdRef.current = payload.new.id
          processTextToSign(payload.new.message)
        }
      })
      .subscribe()

    // FALLBACK POLLING: In case Supabase Realtime is disabled on the database
    const pollInterval = setInterval(() => {
      fetchMessages()
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [appointmentId, user?.id, isDeafUser])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: true })
    if (data) {
      setMessages(data)
      
      // Auto-play sign video for the latest message if it's from the other person
      if (isDeafUser && data.length > 0) {
        const lastMsg = data[data.length - 1]
        if (lastMsg.sender_id !== user?.id && lastPlayedMessageIdRef.current !== lastMsg.id) {
           lastPlayedMessageIdRef.current = lastMsg.id
           processTextToSign(lastMsg.message)
        }
      }
    }
  }

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const { data, error } = await supabase.from('chats').insert({
      appointment_id: appointmentId,
      sender_id: user.id,
      message: text
    }).select()

    if (data && data.length > 0) {
      setMessages(prev => {
        // Prevent duplicate if realtime channel already caught it
        if (prev.find(m => m.id === data[0].id)) return prev
        return [...prev, data[0]]
      })
    }
  }

  // --------------------------------------------------------------------------
  // Speech Hooks (Hearing Pane)
  // --------------------------------------------------------------------------
  const onSpeechResult = useCallback((transcript) => {
    if (transcript) {
      sendMessage(transcript)
    }
  }, [])

  const { isListening, startListening, stopListening, speak } = useSpeech(onSpeechResult)

  const processTextToSign = async (text) => {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(' ')
    const stored = await getAllTemplates()
    
    for (let word of words) {
      const match = stored.find(t => t.word === word && t.videoBlob)
      if (match) {
        const url = URL.createObjectURL(match.videoBlob)
        setPlayingVideoUrl(url)
        break
      }
    }
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
          const match = classifySign(results.landmarks[0], templates, 3.0) 
          if (match) {
            const word = match.word
            if (lastRecognizedRef.current !== word) {
              lastRecognizedRef.current = word
              setCurrentSignText(word)
              
              clearTimeout(debounceTimerRef.current)
              debounceTimerRef.current = setTimeout(() => {
                sendMessage(word)
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
  }, [landmarker, templates])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(requestRef.current)
      clearTimeout(debounceTimerRef.current)
    }
  }, [])

  const handleManualSubmit = (e) => {
    e.preventDefault()
    sendMessage(typedText)
    setTypedText('')
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto animate-fade-in-up pb-8">
      <h1 className="text-3xl font-bold text-foreground">Appointment Consultation</h1>
      
      {/* Top Section: Visuals depend on role */}
      <div className="flex flex-col md:flex-row gap-6 min-h-[350px] lg:h-[450px]">
        
        {isDeafUser ? (
          // DEAF USER VIEW: Webcam for signing, Video for receiving signs
          <>
            <Card className="flex-1 flex flex-col border-indigo-50 dark:border-indigo-900/30 shadow-card-sm overflow-hidden">
              <CardHeader className="py-4 bg-white dark:bg-slate-900 border-b border-border">
                <CardTitle className="text-lg flex justify-between items-center font-bold">
                  <span>Your Camera (Sign-to-Text)</span>
                  <Button 
                    className={isSigning ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'} 
                    size="sm" 
                    onClick={toggleSigning} 
                    disabled={!isMediaPipeLoaded}
                  >
                    {isSigning ? 'Stop Camera' : 'Start Signing'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 relative bg-black flex items-center justify-center">
                {!isMediaPipeLoaded && <span className="text-white animate-pulse">Loading AI...</span>}
                <Webcam ref={webcamRef} audio={false} className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" />
                {currentSignText && isSigning && (
                  <div className="absolute bottom-6 left-0 right-0 text-center animate-fade-in-up">
                    <span className="bg-black/80 text-white text-3xl font-black px-6 py-3 rounded-2xl shadow-lg border-2 border-indigo-500/50 backdrop-blur-sm">{currentSignText}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col border-indigo-50 dark:border-indigo-900/30 shadow-card-sm overflow-hidden">
              <CardHeader className="py-4 bg-white dark:bg-slate-900 border-b border-border">
                <CardTitle className="text-lg font-bold">Staff Reply (Text-to-Sign)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {playingVideoUrl ? (
                  <video ref={avatarVideoRef} src={playingVideoUrl} className="w-full h-full object-cover" onEnded={() => setPlayingVideoUrl(null)} autoPlay muted playsInline />
                ) : (
                  <span className="text-muted-foreground block p-4 text-center">Waiting for hospital response...</span>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          // HOSPITAL VIEW: Audio Mic for Speech, No need for video reception (just text)
          <Card className="flex-1 flex flex-col border-indigo-50 dark:border-indigo-900/30 shadow-card-sm max-w-xl mx-auto w-full">
            <CardHeader className="py-4 bg-white dark:bg-slate-900 border-b border-border">
              <CardTitle className="text-lg flex justify-between items-center font-bold">
                <span>Staff Microphone (Speech-to-Text)</span>
                <Button 
                  className={isListening ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'} 
                  size="sm" 
                  onClick={isListening ? stopListening : startListening}
                >
                  {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isListening ? 'Stop Mic' : 'Start Mic'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/50">
               <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-inner ${isListening ? 'bg-red-100 text-red-600 animate-pulse-soft border-4 border-red-200' : 'bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                 <Mic className="w-12 h-12" />
               </div>
               <p className="mt-6 text-sm font-medium text-muted-foreground bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-border">
                 {isListening ? 'Listening...' : 'Click Start Mic to speak'}
               </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Middle Section: Chat Transcript */}
      <Card className="flex flex-col overflow-hidden shadow-card-sm border-indigo-50 dark:border-indigo-900/30 h-[500px]">
        <CardHeader className="py-4 bg-white dark:bg-slate-900 border-b border-border">
          <CardTitle className="text-lg font-bold">Live Transcript</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground pt-10 font-medium">Start communicating to begin the conversation.</p>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_id === user.id
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                  <div className={`max-w-[70%] px-5 py-3 shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' 
                      : 'bg-white dark:bg-slate-900 border border-border text-foreground rounded-2xl rounded-bl-sm'
                  }`}>
                    <p className="text-[15px] leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
        <CardFooter className="p-4 bg-white dark:bg-slate-900 border-t border-border">
            <form onSubmit={handleManualSubmit} className="flex w-full gap-3 relative">
              <input 
                className="flex-1 h-12 px-5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-24 shadow-sm"
                placeholder="Type a message manually..." 
                value={typedText}
                onChange={e => setTypedText(e.target.value)}
              />
              <Button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-semibold">Send</Button>
            </form>
          </CardFooter>
      </Card>
    </div>
  )
}
