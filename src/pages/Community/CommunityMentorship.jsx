import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { GraduationCap, MapPin, Search } from 'lucide-react'

export default function CommunityMentorship() {
  const { user, profile } = useAuth()
  const [mentors, setMentors] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchMentors()
    fetchRequests()
  }, [])

  const fetchMentors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, bio, interests, location, mentor_availability')
      .eq('is_mentor', true)
      .neq('id', user.id) // exclude self
    
    if (data) setMentors(data)
  }

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('mentor_requests')
      .select('*')
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
    
    if (data) setMyRequests(data)
  }

  const requestMentor = async (mentorId) => {
    const msg = window.prompt("Write a short message to this mentor introducing yourself and what you're looking for:")
    if (msg === null) return

    const { error } = await supabase.from('mentor_requests').insert({
      mentor_id: mentorId,
      mentee_id: user.id,
      request_message: msg
    })

    if (!error) {
      alert("Mentorship request sent successfully!")
      fetchRequests()
    } else {
      alert("Error sending request: " + error.message)
    }
  }

  const updateRequestStatus = async (reqId, status) => {
    await supabase.from('mentor_requests').update({ status }).eq('id', reqId)
    fetchRequests()
  }

  const filteredMentors = mentors.filter(m => 
    (m.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (m.interests || '').toLowerCase().includes(search.toLowerCase())
  )

  // Separate requests into incoming (if I'm a mentor) and outgoing (my requests)
  const incomingRequests = myRequests.filter(r => r.mentor_id === user.id && r.status === 'pending')
  const outgoingRequests = myRequests.filter(r => r.mentee_id === user.id)
  const activeMentorships = myRequests.filter(r => r.status === 'accepted')

  return (
    <div className="space-y-10 max-w-6xl mx-auto animate-fade-in-up">
      
      {/* Mentor/Mentee Dashboard Header */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100 dark:border-indigo-900/50 shadow-card-sm overflow-hidden">
          <CardHeader className="border-b border-indigo-50 dark:border-indigo-900/30 bg-white dark:bg-slate-900/50 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <GraduationCap className="w-5 h-5 text-indigo-600" /> My Mentorships
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {activeMentorships.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-indigo-50 dark:border-indigo-900/30">
                  <GraduationCap className="w-6 h-6 text-indigo-300" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">You don't have any active mentorships.</p>
              </div>
            ) : (
              activeMentorships.map(r => (
                <div key={r.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-indigo-50 dark:border-indigo-900/30">
                  <span className="font-bold text-sm text-foreground">
                    {r.mentor_id === user.id ? 'Mentoring a student' : 'Learning from a mentor'}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full shadow-sm">Active</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {profile?.is_mentor && incomingRequests.length > 0 && (
          <Card className="bg-gradient-to-br from-amber-50/50 to-white border-amber-200 shadow-card-sm overflow-hidden animate-fade-in-up">
            <CardHeader className="border-b border-amber-100 bg-white dark:bg-slate-900/50 pb-4">
              <CardTitle className="text-lg font-bold text-amber-900 flex items-center gap-2">
                Incoming Requests
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{incomingRequests.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {incomingRequests.map(r => (
                <div key={r.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-amber-100">
                  <div className="relative">
                    <span className="absolute -left-2 -top-2 text-3xl text-amber-200 font-serif leading-none">"</span>
                    <p className="text-[15px] italic mb-4 text-foreground/80 pl-2 relative z-10">{r.request_message}</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex-1 shadow-sm font-semibold" onClick={() => updateRequestStatus(r.id, 'accepted')}>Accept</Button>
                    <Button size="sm" variant="outline" className="rounded-lg flex-1 font-semibold hover:bg-slate-50 dark:bg-slate-800/50" onClick={() => updateRequestStatus(r.id, 'rejected')}>Decline</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Discover Mentors */}
      <div className="pt-4 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-sm">
              <GraduationCap className="w-5 h-5"/>
            </div>
            Discover Mentors
          </h2>
          
          <div className="relative w-full md:max-w-md">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search by keyword, skill, or interest..."
              className="w-full pl-12 pr-4 py-3 rounded-full border border-input bg-white dark:bg-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map(mentor => {
            const hasRequested = outgoingRequests.some(r => r.mentor_id === mentor.id)
            const requestInfo = outgoingRequests.find(r => r.mentor_id === mentor.id)

            return (
              <Card key={mentor.id} className="flex flex-col shadow-card-sm hover:shadow-card-md hover:-translate-y-1 transition-all duration-300 border-indigo-50 dark:border-indigo-900/30 overflow-hidden">
                <CardHeader className="pb-4 bg-white dark:bg-slate-900 border-b border-border text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 mx-auto flex items-center justify-center text-xl font-bold text-indigo-600 border border-indigo-200 mb-3 shadow-sm">
                    {(mentor.full_name || 'M')[0]}
                  </div>
                  <CardTitle className="text-lg font-bold">{mentor.full_name || 'Anonymous Mentor'}</CardTitle>
                  <p className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5 mt-2 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {mentor.location || 'Remote'}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 space-y-5 p-6 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-border shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Interests / Skills</h4>
                    <p className="text-[13px] font-semibold text-foreground leading-snug">{mentor.interests || 'Not specified'}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-border shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Availability</h4>
                    <p className="text-[13px] font-semibold text-foreground">{mentor.mentor_availability || 'Flexible'}</p>
                  </div>
                  {mentor.bio && (
                    <div className="pt-2">
                      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{mentor.bio}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-5 bg-white dark:bg-slate-900 border-t border-border">
                  {hasRequested ? (
                    <Button variant="outline" className="w-full rounded-xl h-11 font-semibold text-muted-foreground border-dashed bg-slate-50 dark:bg-slate-800/50" disabled>
                      {requestInfo.status === 'pending' ? 'Request Pending...' : 
                       requestInfo.status === 'accepted' ? 'Currently Matched!' : 'Request Declined'}
                    </Button>
                  ) : (
                    <Button className="w-full rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold transition-transform active:scale-95" onClick={() => requestMentor(mentor.id)}>
                      Request Mentorship
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
          {filteredMentors.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-border shadow-sm">
              <GraduationCap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No mentors found matching your search.</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
