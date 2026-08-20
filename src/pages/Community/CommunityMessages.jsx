import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Search, Video, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CommunityMessages() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [activeChat, setActiveChat] = useState(null) // user object
  
  useEffect(() => {
    // Only search when the user types at least 2 characters
    if (search.length > 1) {
      searchUsers()
    } else {
      setUsers([])
    }
  }, [search])

  const searchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .ilike('full_name', `%${search}%`)
      .neq('id', user.id)
      .limit(10)
    if (data) setUsers(data)
  }

  const initiateVideoCall = async (targetUserId) => {
    // Generate secure call row
    const { data, error } = await supabase.from('video_calls').insert({
      caller_id: user.id,
      receiver_id: targetUserId,
      status: 'ringing'
    }).select().single()

    if (error) {
      alert("Error starting call: " + error.message)
      return
    }

    navigate(`/call/${data.id}`)
  }

  if (activeChat) {
    return (
      <ChatThread 
        targetUser={activeChat} 
        onBack={() => setActiveChat(null)} 
        user={user} 
        onCall={() => initiateVideoCall(activeChat.id)} 
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <Card className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30 overflow-hidden">
        <CardHeader className="bg-white dark:bg-slate-900 border-b border-border py-5">
          <CardTitle className="font-bold">Find someone to chat with</CardTitle>
        </CardHeader>
        <CardContent className="bg-slate-50/50 dark:bg-slate-800/50 p-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search by name..."
              className="w-full pl-12 pr-4 py-3 rounded-full border border-input bg-white dark:bg-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {users.map(u => (
          <Card key={u.id} className="cursor-pointer hover:shadow-card-md hover:border-indigo-200 transition-all duration-300 shadow-sm border-border group" onClick={() => setActiveChat(u)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center font-bold text-indigo-600 shadow-sm border border-indigo-100 dark:border-indigo-900/50">
                  {(u.full_name || 'U')[0]}
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">{u.full_name || 'Anonymous User'}</p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{u.role}</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-full font-semibold group-hover:bg-indigo-50 dark:bg-indigo-900/20 group-hover:text-indigo-700 group-hover:border-indigo-200">Message</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ChatThread({ targetUser, onBack, user, onCall }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel(`chat_${user.id}_${targetUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, payload => {
        const msg = payload.new
        // Only append if it belongs to this conversation
        if ((msg.sender_id === user.id && msg.receiver_id === targetUser.id) || 
            (msg.sender_id === targetUser.id && msg.receiver_id === user.id)) {
          setMessages(prev => [...prev, msg])
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [targetUser.id])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await supabase.from('private_messages').insert({
      sender_id: user.id,
      receiver_id: targetUser.id,
      message: text
    })
    setText('')
  }

  return (
    <Card className="h-[600px] lg:h-[700px] flex flex-col shadow-card-sm border-indigo-50 dark:border-indigo-900/30 overflow-hidden animate-fade-in-up">
      <CardHeader className="py-4 border-b border-border bg-white dark:bg-slate-900 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="px-3 rounded-full hover:bg-slate-100 dark:bg-slate-800">← Back</Button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center font-bold text-indigo-600 shadow-sm border border-indigo-100 dark:border-indigo-900/50">
               {(targetUser.full_name || 'U')[0]}
             </div>
             <CardTitle className="text-lg font-bold">{targetUser.full_name || 'User'}</CardTitle>
          </div>
        </div>
        <Button size="sm" onClick={onCall} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 shadow-sm font-semibold">
          <Video className="w-4 h-4 mr-2" /> Secure Call
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-800/50" ref={scrollRef}>
        {messages.map(msg => {
          const isMe = msg.sender_id === user.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              <div className={`max-w-[75%] px-5 py-3 shadow-sm ${
                isMe ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' : 'bg-white dark:bg-slate-900 border border-border text-foreground rounded-2xl rounded-bl-sm'
              }`}>
                <p className="text-[15px] leading-relaxed">{msg.message}</p>
                <p className={`text-[10px] mt-1.5 font-medium ${isMe ? 'text-indigo-200' : 'text-muted-foreground'}`}>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
      
      <CardFooter className="p-4 border-t border-border bg-white dark:bg-slate-900">
        <form onSubmit={handleSend} className="flex w-full gap-3 relative">
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 h-12 rounded-full border border-input bg-slate-50 dark:bg-slate-800/50 px-5 pr-16 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <Button type="submit" size="icon" className="absolute right-1.5 top-1.5 bottom-1.5 h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0"><Send className="w-4 h-4" /></Button>
        </form>
      </CardFooter>
    </Card>
  )
}
