import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { MessageSquare, ChevronRight, CornerDownRight } from 'lucide-react'

const CATEGORIES = ['Education', 'Jobs', 'Technology', 'Sports', 'Health', 'General']

export default function CommunityForums() {
  const { user, profile } = useAuth()
  const [threads, setThreads] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeThread, setActiveThread] = useState(null)
  const [showNewThread, setShowNewThread] = useState(false)

  useEffect(() => {
    fetchThreads()
  }, [activeCategory])

  const fetchThreads = async () => {
    let query = supabase.from('forum_threads').select('*').order('created_at', { ascending: false })
    if (activeCategory !== 'All') {
      query = query.eq('category', activeCategory)
    }
    const { data, error } = await query
    if (error) console.error("Error fetching threads:", error)
    
    if (data && data.length > 0) {
      const authorIds = [...new Set(data.map(t => t.author_id).filter(Boolean))]
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', authorIds)
      const profileMap = {}
      if (profiles) profiles.forEach(p => profileMap[p.id] = p)
      
      const enrichedData = data.map(t => {
        const parts = t.content ? t.content.split(':::AUTHOR:::') : [t.content]
        const actualContent = parts[0]
        const injectedName = parts[1]
        return {
          ...t,
          content: actualContent,
          profiles: { full_name: injectedName || (profileMap[t.author_id] ? profileMap[t.author_id].full_name : 'Unknown User') }
        }
      })
      setThreads(enrichedData)
    } else {
      setThreads([])
    }
  }

  if (activeThread) {
    return <ThreadView thread={activeThread} onBack={() => setActiveThread(null)} user={user} profile={profile} />
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-border">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['All', ...CATEGORIES].map(cat => (
            <Button 
              key={cat} 
              variant={activeCategory === cat ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-5 font-semibold ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-muted-foreground hover:bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}
            >
              {cat}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowNewThread(true)} className="rounded-full px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shrink-0 ml-4 font-semibold">New Thread</Button>
      </div>

      {showNewThread && (
        <NewThreadForm 
          onCancel={() => setShowNewThread(false)} 
          onSuccess={(newThread) => { 
            setShowNewThread(false)
            if (activeCategory === 'All' || activeCategory === newThread.category) {
              setThreads(prev => [newThread, ...prev])
            }
          }} 
          user={user}
          profile={profile}
        />
      )}

      <div className="space-y-4">
        {threads.map(thread => (
          <Card key={thread.id} className="hover:shadow-card-md hover:border-indigo-200 cursor-pointer transition-all duration-300 border-indigo-50 dark:border-indigo-900/30 shadow-card-sm" onClick={() => setActiveThread(thread)}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full uppercase tracking-wider">{thread.category}</span>
                <h3 className="text-lg font-bold mt-3 text-foreground">{thread.title}</h3>
                <p className="text-sm font-medium text-muted-foreground mt-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-400">{(thread.profiles?.full_name || 'U')[0]}</span>
                  {thread.profiles?.full_name || 'User'} <span className="opacity-50">•</span> {new Date(thread.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 dark:bg-indigo-900/20 group-hover:text-indigo-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
        {threads.length === 0 && !showNewThread && (
          <p className="text-center text-muted-foreground py-12 font-medium bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-border">No threads found in this category.</p>
        )}
      </div>
    </div>
  )
}

function NewThreadForm({ onCancel, onSuccess, user, profile }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const authorName = profile?.full_name || user?.user_metadata?.full_name || 'User'
    const { data, error } = await supabase.from('forum_threads').insert({
      title, category, content: content + ':::AUTHOR:::' + authorName, author_id: user.id
    }).select('*').single()
    
    setLoading(false)
    if (error) {
      alert(error.message)
    } else {
      onSuccess({
        ...data,
        content: content,
        profiles: { full_name: authorName }
      })
    }
  }

  return (
    <Card className="mb-6 shadow-card-sm border-indigo-50 dark:border-indigo-900/30 overflow-hidden">
      <CardHeader className="bg-white dark:bg-slate-900 border-b border-border py-4"><CardTitle className="font-bold">Create New Thread</CardTitle></CardHeader>
      <CardContent className="p-6 bg-slate-50/50 dark:bg-slate-800/50">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <FormField label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Category</label>
              <select 
                className="w-full flex h-11 rounded-xl border border-input bg-white dark:bg-slate-900 px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                value={category} 
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Content</label>
            <textarea 
              required
              className="w-full min-h-[150px] rounded-xl border border-input bg-white dark:bg-slate-900 px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl px-6">Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold">Post Thread</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ThreadView({ thread, onBack, user, profile }) {
  const [replies, setReplies] = useState([])
  const [newReply, setNewReply] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReplies()
  }, [thread.id])

  const fetchReplies = async () => {
    const { data, error } = await supabase
      .from('forum_replies')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true })
      
    if (error) console.error("Error fetching replies:", error)
      
    if (data && data.length > 0) {
      const authorIds = [...new Set(data.map(r => r.author_id).filter(Boolean))]
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', authorIds)
      const profileMap = {}
      if (profiles) profiles.forEach(p => profileMap[p.id] = p)
      
      const enrichedReplies = data.map(r => {
        const parts = r.content ? r.content.split(':::AUTHOR:::') : [r.content]
        const actualContent = parts[0]
        const injectedName = parts[1]
        return {
          ...r,
          content: actualContent,
          profiles: { full_name: injectedName || (profileMap[r.author_id] ? profileMap[r.author_id].full_name : 'Unknown User') }
        }
      })
      setReplies(enrichedReplies)
    } else {
      setReplies([])
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    setLoading(true)
    const authorName = profile?.full_name || user?.user_metadata?.full_name || 'User'
    const { error } = await supabase.from('forum_replies').insert({
      thread_id: thread.id, content: newReply + ':::AUTHOR:::' + authorName, author_id: user.id
    })
    setLoading(false)
    if (!error) {
      setNewReply('')
      fetchReplies()
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <Button variant="outline" size="sm" onClick={onBack} className="rounded-full px-5 shadow-sm font-semibold hover:bg-slate-100 dark:bg-slate-800">← Back to Forums</Button>
      
      <Card className="shadow-card-md border-indigo-50 dark:border-indigo-900/30">
        <CardContent className="p-8">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full uppercase tracking-wider">{thread.category}</span>
          <h2 className="text-3xl font-black mt-4 mb-2 text-foreground">{thread.title}</h2>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">
              {(thread.profiles?.full_name || 'U')[0]}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              <strong className="text-foreground">{thread.profiles?.full_name || 'User'}</strong> 
              <span className="mx-2 opacity-50">•</span> 
              {new Date(thread.created_at).toLocaleString()}
            </p>
          </div>
          <div className="whitespace-pre-wrap text-lg leading-relaxed text-foreground/90">{thread.content}</div>
        </CardContent>
      </Card>

      <div className="space-y-6 md:pl-10 relative before:absolute before:inset-y-0 before:left-5 before:w-0.5 before:bg-indigo-100 dark:bg-indigo-900/40 hidden md:block">
        <h3 className="font-bold text-xl flex items-center gap-2 mb-6">
          <MessageSquare className="w-6 h-6 text-indigo-500" /> {replies.length} Replies
        </h3>
        {replies.map(r => (
          <Card key={r.id} className="shadow-sm border-border relative">
            <div className="absolute top-6 -left-10 w-10 h-0.5 bg-indigo-100 dark:bg-indigo-900/40"></div>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-xs border border-slate-200 dark:border-slate-700">
                  {(r.profiles?.full_name || 'U')[0]}
                </div>
                <p className="text-sm font-bold text-foreground">
                  {r.profiles?.full_name || 'User'} 
                  <span className="text-muted-foreground font-medium text-xs ml-3">{new Date(r.created_at).toLocaleString()}</span>
                </p>
              </div>
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{r.content}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile view without left border layout */}
      <div className="space-y-4 md:hidden">
         <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-indigo-500" /> {replies.length} Replies
        </h3>
         {replies.map(r => (
          <Card key={r.id} className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-[10px] border border-slate-200 dark:border-slate-700">
                  {(r.profiles?.full_name || 'U')[0]}
                </div>
                <p className="text-sm font-bold text-foreground">
                  {r.profiles?.full_name || 'User'} 
                  <span className="text-muted-foreground font-medium text-xs ml-2">{new Date(r.created_at).toLocaleString()}</span>
                </p>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{r.content}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="md:ml-10 shadow-card-sm border-indigo-50 dark:border-indigo-900/30">
        <CardContent className="p-6 bg-slate-50/50 dark:bg-slate-800/50">
          <form onSubmit={handleReply} className="space-y-4">
            <textarea 
              required
              placeholder="Write a reply..."
              className="w-full min-h-[120px] rounded-xl border border-input bg-white dark:bg-slate-900 px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold flex gap-2">
                <CornerDownRight className="w-4 h-4" /> Post Reply
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
