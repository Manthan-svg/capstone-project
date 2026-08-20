import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Peer } from 'peerjs'
import { Mic, MicOff, PhoneOff, VideoOff, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useSpeech } from '../hooks/useSpeech'
import { supabase } from '../lib/supabase'

export default function VideoCall() {
  const { id: callId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [callData, setCallData] = useState(null)
  const [peer, setPeer] = useState(null)
  const [connection, setConnection] = useState(null)
  const [mediaCall, setMediaCall] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [liveCaption, setLiveCaption] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)

  const isCaller = callData?.caller_id === user.id

  // Speech Recognition
  const onSpeechResult = useCallback((transcript) => {
    if (transcript && connection) {
      connection.send({ type: 'caption', text: transcript })
    }
  }, [connection])

  const { isListening, startListening, stopListening } = useSpeech(onSpeechResult)

  // 1. Fetch Call Data and Subscribe
  useEffect(() => {
    const fetchCall = async () => {
      const { data, error } = await supabase.from('video_calls').select('*').eq('id', callId).single()
      if (error || !data) {
        setErrorMsg('Call not found or unauthorized.')
        return
      }
      setCallData(data)
    }
    fetchCall()

    const channel = supabase
      .channel(`call_${callId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'video_calls', filter: `id=eq.${callId}` }, payload => {
        setCallData(payload.new)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [callId])

  // 2. Initialize PeerJS when callData is ready
  useEffect(() => {
    if (!callData || peer || errorMsg) return

    // Setup Local Media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      
      const myPeerId = `signbridge-${crypto.randomUUID()}`
      const newPeer = new Peer(myPeerId, { debug: 2 })
      
      newPeer.on('open', async (id) => {
        // Update DB with my peer ID
        if (isCaller) {
          const { error } = await supabase.from('video_calls').update({ peer_id_caller: id }).eq('id', callId)
          if (error) alert("Caller update error: " + error.message)
        } else {
          // If receiver is mounting, they have accepted. Update status and peer ID.
          const { error } = await supabase.from('video_calls').update({ peer_id_receiver: id, status: 'accepted' }).eq('id', callId)
          if (error) alert("Receiver update error: " + error.message)
        }
      })

      // Listen for data (captions)
      newPeer.on('connection', (conn) => {
        setConnection(conn)
        conn.on('data', (data) => {
          if (data.type === 'caption') {
            setLiveCaption(data.text)
            setTimeout(() => setLiveCaption(''), 4000)
          }
        })
      })

      // Listen for media calls (Receiver waiting for Caller)
      newPeer.on('call', (incomingCall) => {
        incomingCall.answer(localStreamRef.current)
        setMediaCall(incomingCall)
        setIsConnected(true)
        incomingCall.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
        })
      })

      setPeer(newPeer)
    }).catch(err => {
      console.error(err)
      setErrorMsg("Microphone/Camera permission denied or device not found.")
    })

    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop())
      if (peer) peer.destroy()
    }
  }, [callData?.id]) // only run once when callData is first loaded

  // 3. Caller dials Receiver when status is accepted and peer_id_receiver is populated
  useEffect(() => {
    if (isCaller && peer && callData?.status === 'accepted' && callData?.peer_id_receiver && !isConnected && !mediaCall) {
      // Connect Data
      const conn = peer.connect(callData.peer_id_receiver)
      conn.on('open', () => setConnection(conn))

      // Connect Media
      const outgoingCall = peer.call(callData.peer_id_receiver, localStreamRef.current)
      setMediaCall(outgoingCall)
      setIsConnected(true)

      outgoingCall.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
      })
    }
  }, [isCaller, peer, callData, isConnected, mediaCall])

  // Handle call end from remote
  useEffect(() => {
    if (callData?.status === 'declined' || callData?.status === 'ended') {
      endCallLocally()
    }
  }, [callData?.status])

  const endCallLocally = () => {
    if (mediaCall) mediaCall.close()
    if (connection) connection.close()
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop())
    if (peer) peer.destroy()
    setIsConnected(false)
    if (isListening) stopListening()
  }

  const endCall = async () => {
    await supabase.from('video_calls').update({ status: 'ended' }).eq('id', callId)
    endCallLocally()
    navigate('/community')
  }

  if (errorMsg) return <div className="p-8 text-center text-red-500 font-bold">{errorMsg}</div>

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 p-4 animate-fade-in-up pb-8">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-card-sm border border-indigo-50 dark:border-indigo-900/30">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Secure Video Call</h1>
          <p className="text-sm font-medium text-indigo-600 mt-1">
            {callData?.status === 'ringing' ? 'Waiting for answer...' : 
             callData?.status === 'declined' ? 'Call declined.' :
             callData?.status === 'ended' ? 'Call ended.' :
             isConnected ? 'Connected via E2EE WebRTC' : 'Connecting...'}
          </p>
        </div>
        <Button onClick={endCall} variant="destructive" className="rounded-xl shadow-md px-6 bg-red-600 hover:bg-red-700">
          <PhoneOff className="w-5 h-5 mr-2" /> End Call
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[500px] lg:h-[600px]">
        {/* Remote Video (Main) */}
        <Card className="flex-[2] flex flex-col relative bg-slate-900 border-4 border-white shadow-xl rounded-2xl overflow-hidden">
          {isConnected ? (
             <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              {callData?.status === 'ringing' ? (
                <>
                  <Loader2 className="w-20 h-20 mb-6 animate-spin text-indigo-500" />
                  <p className="text-lg font-medium text-foreground">Ringing...</p>
                </>
              ) : (
                <>
                  <VideoOff className="w-20 h-20 mb-6 opacity-30" />
                  <p className="text-lg font-medium">No remote video.</p>
                </>
              )}
            </div>
          )}

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
          <Card className="bg-black overflow-hidden aspect-video flex-shrink-0 relative border-4 border-white shadow-lg rounded-2xl">
             <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
          </Card>

          <Card className="flex-1 flex flex-col shadow-card-sm border-indigo-50 dark:border-indigo-900/30">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-border py-4">
              <CardTitle className="text-lg font-bold">Live Captioning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-6 bg-slate-50/50 dark:bg-slate-800/50">
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">Turn on your microphone to automatically transcribe your speech and overlay it on the other person's screen.</p>
              <Button 
                className={`w-full rounded-xl shadow-md py-6 text-base ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                onClick={isListening ? stopListening : startListening}
                disabled={!isConnected}
              >
                {isListening ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                {isListening ? 'Stop Captions' : 'Start Captions'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
