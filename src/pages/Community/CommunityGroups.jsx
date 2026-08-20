import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Users, LogIn, LogOut } from 'lucide-react'

export default function CommunityGroups() {
  const { user, profile } = useAuth()
  const [groups, setGroups] = useState([])
  const [myMemberships, setMyMemberships] = useState([])
  const [activeGroup, setActiveGroup] = useState(null)

  useEffect(() => {
    fetchGroups()
    fetchMemberships()
  }, [])

  const fetchGroups = async () => {
    const { data } = await supabase.from('community_groups').select('*')
    if (data) setGroups(data)
  }

  const fetchMemberships = async () => {
    const { data } = await supabase.from('group_members').select('group_id').eq('user_id', user.id)
    if (data) setMyMemberships(data.map(m => m.group_id))
  }

  const toggleMembership = async (groupId, isMember) => {
    if (isMember) {
      await supabase.from('group_members').delete().match({ group_id: groupId, user_id: user.id })
      if (activeGroup?.id === groupId) setActiveGroup(null)
    } else {
      await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id })
    }
    fetchMemberships()
  }

  if (activeGroup) {
    return <GroupFeed group={activeGroup} onBack={() => setActiveGroup(null)} user={user} profile={profile} />
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => {
          const isMember = myMemberships.includes(group.id)
          return (
            <Card key={group.id} className="flex flex-col shadow-card-sm hover:shadow-card-md hover:-translate-y-1 transition-all duration-300 border-indigo-50 dark:border-indigo-900/30">
              <CardHeader className="pb-3 border-b border-border bg-white dark:bg-slate-900">
                <CardTitle className="flex items-center gap-3 font-bold text-lg">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                    <Users className="w-5 h-5" /> 
                  </div>
                  {group.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between p-5 bg-slate-50/50 dark:bg-slate-800/50">
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">{group.description}</p>
                <div className="flex gap-3">
                  <Button 
                    variant={isMember ? 'outline' : 'default'} 
                    className={`flex-1 rounded-xl shadow-sm ${!isMember ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50 font-semibold'}`}
                    onClick={() => toggleMembership(group.id, isMember)}
                  >
                    {isMember ? <><LogOut className="w-4 h-4 mr-2"/> Leave Group</> : <><LogIn className="w-4 h-4 mr-2"/> Join Group</>}
                  </Button>
                  {isMember && (
                    <Button variant="secondary" className="rounded-xl shadow-sm font-semibold bg-white dark:bg-slate-900 border border-border hover:bg-slate-50 dark:bg-slate-800/50" onClick={() => setActiveGroup(group)}>View Feed</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function GroupFeed({ group, onBack, user, profile }) {
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [group.id])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('group_posts')
      .select('*')
      .eq('group_id', group.id)
      .order('created_at', { ascending: false })
      
    if (error) console.error("Error fetching group posts:", error)
      
    if (data && data.length > 0) {
      const authorIds = [...new Set(data.map(p => p.author_id).filter(Boolean))]
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', authorIds)
      const profileMap = {}
      if (profiles) profiles.forEach(p => profileMap[p.id] = p)
      
      const enrichedPosts = data.map(p => {
        const parts = p.content ? p.content.split(':::AUTHOR:::') : [p.content]
        const actualContent = parts[0]
        const injectedName = parts[1]
        return {
          ...p,
          content: actualContent,
          profiles: { full_name: injectedName || (profileMap[p.author_id] ? profileMap[p.author_id].full_name : 'Unknown User') }
        }
      })
      setPosts(enrichedPosts)
    } else {
      setPosts([])
    }
  }

  const handlePost = async (e) => {
    e.preventDefault()
    setLoading(true)
    const authorName = profile?.full_name || user?.user_metadata?.full_name || 'User'
    const { data, error } = await supabase.from('group_posts').insert({
      group_id: group.id,
      author_id: user.id,
      content: newPost + ':::AUTHOR:::' + authorName
    }).select('*').single()
    setLoading(false)
    if (!error) {
      setNewPost('')
      setPosts(prev => [{
        ...data,
        content: newPost,
        profiles: { full_name: authorName }
      }, ...prev])
    }
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack} className="rounded-full px-5 shadow-sm font-semibold hover:bg-slate-100 dark:bg-slate-800">← Back to Groups</Button>
        <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-sm">
            <Users className="w-5 h-5"/>
          </div> 
          {group.name} Feed
        </h2>
      </div>

      <Card className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30 overflow-hidden">
        <CardContent className="p-6 bg-slate-50/50 dark:bg-slate-800/50">
          <form onSubmit={handlePost} className="space-y-3">
            <textarea 
              required
              placeholder="Share something with the group..."
              className="w-full min-h-[100px] rounded-xl border border-input bg-white dark:bg-slate-900 px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold">Post to Group</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6 md:pl-10 relative before:absolute before:inset-y-0 before:left-5 before:w-0.5 before:bg-indigo-100 dark:bg-indigo-900/40 hidden md:block">
        {posts.map(p => (
          <Card key={p.id} className="shadow-sm border-border relative">
            <div className="absolute top-6 -left-10 w-10 h-0.5 bg-indigo-100 dark:bg-indigo-900/40"></div>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-xs border border-slate-200 dark:border-slate-700">
                  {(p.profiles?.full_name || 'U')[0]}
                </div>
                <p className="text-sm font-bold text-foreground">
                  {p.profiles?.full_name || 'User'} 
                  <span className="text-muted-foreground font-medium text-xs ml-3">{new Date(p.created_at).toLocaleString()}</span>
                </p>
              </div>
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{p.content}</div>
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && <p className="text-center text-muted-foreground py-12 font-medium bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-border shadow-sm">No posts yet. Be the first to start a discussion!</p>}
      </div>

      <div className="space-y-4 md:hidden">
        {posts.map(p => (
          <Card key={p.id} className="shadow-sm border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-[10px] border border-slate-200 dark:border-slate-700">
                  {(p.profiles?.full_name || 'U')[0]}
                </div>
                <p className="text-sm font-bold text-foreground">
                  {p.profiles?.full_name || 'User'} 
                  <span className="text-muted-foreground font-medium text-xs ml-2">{new Date(p.created_at).toLocaleString()}</span>
                </p>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{p.content}</div>
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && <p className="text-center text-muted-foreground py-8 font-medium">No posts yet.</p>}
      </div>
    </div>
  )
}
