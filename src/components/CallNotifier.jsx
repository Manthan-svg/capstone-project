import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/Button'
import { Phone, PhoneOff } from 'lucide-react'

export function CallNotifier() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [incomingCall, setIncomingCall] = useState(null)

  useEffect(() => {
    if (!user) return

    // Check for any currently ringing calls on mount
    const checkRinging = async () => {
      const { data } = await supabase
        .from('video_calls')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'ringing')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (data) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.caller_id).single()
        setIncomingCall({ ...data, profiles: profile })
      }
    }
    checkRinging()

    // Subscribe to new incoming calls
    const channel = supabase
      .channel(`calls_receiver_${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'video_calls', 
        filter: `receiver_id=eq.${user.id}` 
      }, async (payload) => {
        if (payload.new.status === 'ringing') {
          // Fetch caller name
          const { data } = await supabase.from('profiles').select('full_name').eq('id', payload.new.caller_id).single()
          setIncomingCall({ ...payload.new, profiles: data })
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'video_calls',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.status !== 'ringing') {
          setIncomingCall(null) // Dismiss if cancelled or already accepted elsewhere
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  const acceptCall = () => {
    const callId = incomingCall.id
    setIncomingCall(null)
    navigate(`/call/${callId}`)
  }

  const declineCall = async () => {
    await supabase.from('video_calls').update({ status: 'declined' }).eq('id', incomingCall.id)
    setIncomingCall(null)
  }

  if (!incomingCall) return null

  return (
    <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 text-foreground shadow-card-lg rounded-3xl border border-indigo-100 dark:border-indigo-900/50 p-6 w-80 flex flex-col items-center gap-5">
        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 animate-pulse shadow-inner">
          <Phone className="w-10 h-10" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-black text-xl text-indigo-950 dark:text-indigo-50">Incoming Video Call</h3>
          <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400">{incomingCall.profiles?.full_name || 'Anonymous User'} is calling...</p>
        </div>
        <div className="flex gap-4 w-full mt-2">
          <Button variant="outline" className="flex-1 h-12 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50" onClick={declineCall}>
            <PhoneOff className="w-4 h-4 mr-2" /> Decline
          </Button>
          <Button className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-md text-white border-none" onClick={acceptCall}>
            <Phone className="w-4 h-4 mr-2" /> Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
