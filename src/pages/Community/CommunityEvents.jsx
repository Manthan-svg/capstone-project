import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Calendar, MapPin, Users } from 'lucide-react'

export default function CommunityEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [myRsvps, setMyRsvps] = useState([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchEvents()
    fetchRsvps()
  }, [])

  const fetchEvents = async () => {
    // Only fetch upcoming events
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true })
    if (data) setEvents(data)
  }

  const fetchRsvps = async () => {
    const { data } = await supabase.from('event_rsvps').select('event_id').eq('user_id', user.id)
    if (data) setMyRsvps(data.map(r => r.event_id))
  }

  const toggleRsvp = async (eventId, isRsvpd) => {
    if (isRsvpd) {
      await supabase.from('event_rsvps').delete().match({ event_id: eventId, user_id: user.id })
    } else {
      await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id })
    }
    fetchRsvps()
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-border">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-sm">
            <Calendar className="w-5 h-5"/>
          </div>
          Upcoming Events & Meetups
        </h2>
        <Button onClick={() => setShowForm(!showForm)} className={`rounded-full px-6 font-semibold shadow-md ${showForm ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-foreground' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>{showForm ? 'Cancel' : 'Host Event'}</Button>
      </div>

      {showForm && <div className="animate-fade-in-up"><EventForm user={user} onSuccess={(newEvent) => { setShowForm(false); setEvents(prev => [newEvent, ...prev]); }} onCancel={() => setShowForm(false)} /></div>}

      <div className="grid md:grid-cols-2 gap-6">
        {events.map(event => {
          const isRsvpd = myRsvps.includes(event.id)
          const date = new Date(event.date_time)
          
          return (
            <Card key={event.id} className="flex flex-col shadow-card-sm hover:shadow-card-md hover:-translate-y-1 transition-all duration-300 border-indigo-50 dark:border-indigo-900/30 overflow-hidden">
              <CardHeader className="pb-4 bg-white dark:bg-slate-900 border-b border-border">
                <CardTitle className="text-xl font-bold">{event.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {(event.profiles?.full_name || 'U')[0]}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Hosted by <span className="text-foreground">{event.profiles?.full_name || 'User'}</span></p>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-6 p-6 bg-slate-50/50 dark:bg-slate-800/50">
                <p className="text-[15px] text-muted-foreground leading-relaxed line-clamp-3">{event.description}</p>
                
                <div className="space-y-3 text-sm font-bold bg-white dark:bg-slate-900 p-4 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center"><Calendar className="w-4 h-4" /></div>
                    {date.toLocaleDateString()} at {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center"><MapPin className="w-4 h-4" /></div>
                    {event.location || 'Online'}
                  </div>
                </div>

                <Button 
                  variant={isRsvpd ? 'secondary' : 'default'}
                  className={`w-full h-12 rounded-xl font-semibold shadow-sm text-base mt-2 ${isRsvpd ? 'bg-white dark:bg-slate-900 border border-border hover:bg-slate-50 dark:bg-slate-800/50 text-foreground' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                  onClick={() => toggleRsvp(event.id, isRsvpd)}
                >
                  {isRsvpd ? 'Cancel RSVP' : 'RSVP to Event'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
        {events.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12 font-medium bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-border shadow-sm">No upcoming events found.</p>}
      </div>
    </div>
  )
}

function EventForm({ user, onSuccess, onCancel }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [loc, setLoc] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const dateTime = new Date(`${date}T${time}`).toISOString()
    const { data, error } = await supabase.from('events').insert({
      title, description: desc, location: loc, date_time: dateTime, organizer_id: user.id
    }).select('*').single()
    setLoading(false)
    if (!error) onSuccess(data)
    else alert(error.message)
  }

  return (
    <Card className="mb-8 border-indigo-100 dark:border-indigo-900/50 shadow-card-sm overflow-hidden">
      <CardHeader className="bg-white dark:bg-slate-900 border-b border-border py-5"><CardTitle className="font-bold text-lg">Host a New Event</CardTitle></CardHeader>
      <CardContent className="p-6 bg-slate-50/50 dark:bg-slate-800/50">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Event Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <FormField label="Description" value={desc} onChange={e => setDesc(e.target.value)} />
          <FormField label="Location (or Zoom/Meet link)" value={loc} onChange={e => setLoc(e.target.value)} required />
          <div className="grid grid-cols-2 gap-5">
            <FormField label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            <FormField label="Time" type="time" value={time} onChange={e => setTime(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl px-6">Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold">Create Event</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
