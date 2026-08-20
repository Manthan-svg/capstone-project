import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Peer } from 'peerjs'
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useSpeech } from '../hooks/useSpeech'

// NOTE FOR PRODUCTION: 
// The public PeerJS cloud server is used here strictly for demonstration purposes.
// Due to HIPAA and healthcare data sensitivity, a production deployment MUST use
// a self-hosted PeerJS server or a vetted TURN/STUN infrastructure to ensure signaling 
// is secure and compliant. The actual A/V stream remains peer-to-peer (E2EE by WebRTC).

export default function Telemedicine() {
  const { id: appointmentId } = useParams()
  const { profile } = useAuth()
  
  const [peer, setPeer] = useState(null)
  const [connection, setConnection] = useState(null)
  const [call, setCall] = useState(null)
  const [peerId, setPeerId] = useState('')
  const [remotePeerId, setRemotePeerId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [liveCaption, setLiveCaption] = useState('')
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)

  const isHospital = profile?.role === 'Hospital' || profile?.role === 'Doctor'

  // Speech Recognition (Hospital generates captions, sends to Deaf user)
  const onSpeechResult = useCallback((transcript) => {
    if (transcript && connection) {
      connection.send({ type: 'caption', text: transcript })
    }
  }, [connection])

  const { isListening, startListening, stopListening } = useSpeech(onSpeechResult)

  useEffect(() => {
    // Generate predictable IDs based on role and appointment
    const myRole = isHospital ? 'hospital' : 'user'
    const remoteRole = isHospital ? 'user' : 'hospital'
    
    const myId = `signbridge-${appointmentId}-${myRole}`
    const targetId = `signbridge-${appointmentId}-${remoteRole}`
    
    setPeerId(myId)
    setRemotePeerId(targetId)

    const newPeer = new Peer(myId, {
      debug: 2
    })

    newPeer.on('open', (id) => {
      console.log('My peer ID is: ' + id)
    })

    // Listen for incoming data connections (for captions)
    newPeer.on('connection', (conn) => {
      setConnection(conn)
      conn.on('data', (data) => {
        if (data.type === 'caption') {
          setLiveCaption(data.text)
          // Clear caption after 4 seconds
          setTimeout(() => setLiveCaption(''), 4000)
        }
      })
    })

    // Listen for incoming calls
    newPeer.on('call', (incomingCall) => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        
        incomingCall.answer(stream)
        setCall(incomingCall)
        setIsConnected(true)

        incomingCall.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
        })
      }).catch(err => console.error("Failed to get local stream", err))
    })

    setPeer(newPeer)

    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop())
      newPeer.destroy()
    }
  }, [appointmentId, isHospital])

  const startCall = () => {
    if (!peer) return

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      // Establish Data Connection for Captions
      const conn = peer.connect(remotePeerId)
      conn.on('open', () => {
        setConnection(conn)
      })

      // Establish Media Call
      const outgoingCall = peer.call(remotePeerId, stream)
      setCall(outgoingCall)
      setIsConnected(true)

      outgoingCall.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
      })
    }).catch(err => {
      console.error("Failed to get local stream", err)
      alert("Microphone/Camera permission denied or device not found.")
    })
  }

  const endCall = () => {
    if (call) call.close()
    if (connection) connection.close()
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop())
    setIsConnected(false)
    setCall(null)
    setConnection(null)
    if (isListening) stopListening()
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in-up pb-8">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-card-sm border border-indigo-50 dark:border-indigo-900/30">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Telemedicine Consultation</h1>
          <p className="text-sm font-medium text-indigo-600 mt-1">End-to-End Encrypted WebRTC Video Call</p>
        </div>
        <div className="flex gap-3">
          {!isConnected ? (
            <Button onClick={startCall} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md px-6">
              <Phone className="w-5 h-5 mr-2" /> Start Call
            </Button>
          ) : (
            <Button onClick={endCall} variant="destructive" className="rounded-xl shadow-md px-6 bg-red-600 hover:bg-red-700">
              <PhoneOff className="w-5 h-5 mr-2" /> End Call
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[500px] lg:h-[600px]">
        {/* Remote Video (Main) */}
        <Card className="flex-[2] flex flex-col relative bg-slate-900 border-4 border-white shadow-xl rounded-2xl overflow-hidden">
          {isConnected ? (
             <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <VideoOff className="w-20 h-20 mb-6 opacity-30" />
              <p className="text-lg font-medium">Waiting for connection...</p>
              <p className="text-xs mt-3 bg-slate-800 px-3 py-1 rounded-full opacity-70">Target ID: {remotePeerId}</p>
            </div>
          )}

          {/* Live Captions Overlay for Deaf User */}
          {liveCaption && (
            <div className="absolute bottom-12 left-0 right-0 flex justify-center">
              <div className="bg-black/80 backdrop-blur-md text-white text-3xl font-black px-8 py-4 rounded-2xl shadow-2xl animate-fade-in-up border-2 border-indigo-500/50">
                {liveCaption}
              </div>
            </div>
          )}
        </Card>

        {/* Local Sidebar */}
        <div className="flex-1 flex flex-col gap-6">
          <Card className="bg-black overflow-hidden aspect-video flex-shrink-0 border-4 border-white shadow-lg rounded-2xl">
             <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
          </Card>

          <Card className="flex-1 flex flex-col shadow-card-sm border-indigo-50 dark:border-indigo-900/30">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-border py-4">
              <CardTitle className="text-lg font-bold">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-6 bg-slate-50/50 dark:bg-slate-800/50">
              {isHospital && (
                <div className="space-y-4">
                  <div>
                    <p className="text-base font-bold text-foreground">Live Captioning</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Turn on your microphone to automatically transcribe your speech and overlay it on the patient's screen.</p>
                  </div>
                  <Button 
                    className={`w-full rounded-xl shadow-md py-6 text-base ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    onClick={isListening ? stopListening : startListening}
                    disabled={!isConnected}
                  >
                    {isListening ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                    {isListening ? 'Stop Captions' : 'Start Captions'}
                  </Button>
                </div>
              )}
              
              {!isHospital && (
                <div className="space-y-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-border shadow-sm">
                  <p className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">ℹ</span>
                    Interpreter / Captions
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-8">If the hospital staff speaks, their captions will appear at the bottom of the main video feed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
