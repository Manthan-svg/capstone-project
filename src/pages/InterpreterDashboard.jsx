import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Video, Headset, Clock, CheckCircle, Search, AlertCircle } from 'lucide-react'

export default function InterpreterDashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [isOnline, setIsOnline] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()

    // Subscribe to new requests
    const channel = supabase
      .channel('public:interpreter_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interpreter_requests' }, payload => {
        fetchRequests()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('interpreter_requests')
      .select('*, auth.users(raw_user_meta_data)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    // Workaround since we can't join auth.users easily in all Supabase setups
    // We will just fetch the requests and manually get user names if needed,
    // but for now, we'll display the request ID or a generic "Patient" if auth join fails.
    
    if (data) {
      setRequests(data)
    } else {
      // Fallback if auth.users join fails due to permissions
      const { data: fallbackData } = await supabase
        .from('interpreter_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (fallbackData) setRequests(fallbackData)
    }
    
    setLoading(false)
  }

  const handleAccept = async (request) => {
    if (!isOnline) {
      alert("You must be online to accept a request.")
      return
    }

    // 1. Update the request status
    const { error } = await supabase
      .from('interpreter_requests')
      .update({ status: 'accepted', interpreter_id: user.id })
      .eq('id', request.id)
      .eq('status', 'pending') // ensure it hasn't been taken

    if (error) {
      alert("Could not accept request. It may have been taken or cancelled.")
      fetchRequests()
      return
    }

    // 2. Create the Video Call Room (Receiver side handles answering)
    const { data: existingCall } = await supabase.from('video_calls').select('*').eq('id', request.id).single()
    if (!existingCall) {
      const { error: insertError } = await supabase.from('video_calls').insert({
        id: request.id,
        caller_id: user.id, // Current user must be caller for RLS
        receiver_id: request.user_id, // The other party
        status: 'ringing'
      })
      if (insertError) {
        alert("Failed to create video call room: " + insertError.message)
        return
      }
    }

    // 3. Redirect to video call
    window.location.href = `/call/${request.id}`
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in-up pb-8 h-full">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-card-sm border border-purple-50 dark:border-purple-900/30">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 shrink-0 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center text-purple-600 shadow-inner">
            <Headset className="w-10 h-10" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground">Interpreter Portal</h1>
            <p className="text-muted-foreground mt-1 text-lg">Manage live translation requests from Deaf users.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-border shadow-sm">
          <button 
            onClick={() => setIsOnline(true)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${isOnline ? 'bg-emerald-500 text-white shadow-md' : 'text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Online
          </button>
          <button 
            onClick={() => setIsOnline(false)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${!isOnline ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white shadow-md' : 'text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Offline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left Column: Stats */}
        <div className="space-y-6">
          <Card className="shadow-card-sm border-purple-50 dark:border-purple-900/30 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-purple-100 font-medium mb-1">Pending Requests</h3>
              <div className="text-5xl font-black">{requests.length}</div>
              <p className="text-purple-200 text-sm mt-4">Live queue of Deaf users currently waiting for an interpreter.</p>
            </CardContent>
          </Card>

          <Card className="shadow-card-sm border-purple-50 dark:border-purple-900/30">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border py-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-500" /> System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Connection</span>
                <span className="text-sm font-bold text-emerald-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">WebRTC Node</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Active</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Queue */}
        <Card className="lg:col-span-2 shadow-card-sm border-purple-50 dark:border-purple-900/30 flex flex-col h-full min-h-[500px]">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-border py-5 rounded-t-xl flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-500" /> Live Request Queue
            </CardTitle>
            {loading && <div className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full animate-pulse">Syncing...</div>}
          </CardHeader>
          <CardContent className="p-0 flex-1 bg-slate-50/50 dark:bg-slate-800/50 overflow-hidden relative flex flex-col">
            
            {requests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-6 text-purple-300">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Queue is Empty</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">There are no pending requests at this time. You'll be notified automatically when a new request comes in.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {requests.map(req => (
                  <div key={req.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-transform hover:scale-[1.01]">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider animate-pulse-soft">Live Request</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(req.created_at).toLocaleTimeString()}</span>
                      </div>
                      <h4 className="font-bold text-foreground text-lg">Deaf User Needs Translation</h4>
                      <p className="text-sm text-muted-foreground">Request ID: <span className="font-mono text-xs">{req.id.split('-')[0]}</span></p>
                    </div>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 h-12 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                      onClick={() => handleAccept(req)}
                      disabled={!isOnline}
                    >
                      <Video className="w-5 h-5" />
                      Accept & Join Call
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {!isOnline && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-10">
                <Card className="w-full max-w-sm text-center p-6 border-none shadow-2xl">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Headset className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">You are Offline</h3>
                  <p className="text-muted-foreground text-sm mb-6">Go online to view and accept incoming interpreter requests.</p>
                  <Button onClick={() => setIsOnline(true)} className="w-full bg-emerald-500 hover:bg-emerald-600">Go Online Now</Button>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
