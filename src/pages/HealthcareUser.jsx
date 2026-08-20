import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { MapPin, Phone, Calendar, Upload, Clock, AlertTriangle, FileText, Share2, Video, Heart, MessageSquare, Headset } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import healthcareHeart from '../assets/healthcare-heart.png'

export default function HealthcareUser() {
  const { user } = useAuth()
  
  // Fetch reminders for background polling across all tabs
  const [activeReminders, setActiveReminders] = useState([])
  const [activeAlert, setActiveAlert] = useState(null)
  const lastNotifiedMinute = useRef(-1)

  useEffect(() => {
    if (!user) return
    const fetchMyReminders = async () => {
      const { data } = await supabase.from('reminders').select('*').eq('user_id', user.id).eq('is_active', true)
      if (data) setActiveReminders(data)
    }
    fetchMyReminders()
    
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const interval = setInterval(() => {
      const now = new Date()
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      
      if (now.getMinutes() !== lastNotifiedMinute.current) {
        let triggeredReminder = null
        activeReminders.forEach(r => {
          if (r.time_schedule === currentHHMM) {
            triggeredReminder = r
          }
        })
        if (triggeredReminder) {
          lastNotifiedMinute.current = now.getMinutes()
          setActiveAlert(triggeredReminder)
          
          if (Notification.permission === 'granted') {
            new Notification("SignBridge Reminder", { body: `Time to take: ${triggeredReminder.medicine_name}` })
          }
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [user, activeReminders])

  const [activeTab, setActiveTab] = useState('directory') // directory, history, reminders, sos

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-card-sm border border-indigo-50 dark:border-indigo-900/30">
        <div className="w-24 h-24 shrink-0 drop-shadow-xl animate-float">
          <img src={healthcareHeart} alt="Healthcare" className="w-full h-full object-contain" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-foreground">Healthcare & Services</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage your appointments, records, and emergency contacts.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4 overflow-x-auto scrollbar-hide">
        <TabButton active={activeTab === 'directory'} onClick={() => setActiveTab('directory')} icon={MapPin}>Directory</TabButton>
        <TabButton active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} icon={Calendar}>My Appointments</TabButton>
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={FileText}>Medical History</TabButton>
        <TabButton active={activeTab === 'interpreter'} onClick={() => setActiveTab('interpreter')} icon={Headset}>Live Interpreter</TabButton>
        <TabButton active={activeTab === 'reminders'} onClick={() => setActiveTab('reminders')} icon={Clock}>Reminders</TabButton>
        <TabButton active={activeTab === 'sos'} onClick={() => setActiveTab('sos')} icon={AlertTriangle} variant="destructive">Emergency SOS</TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-800/50 p-1 rounded-xl relative">
        {activeTab === 'directory' && <DirectoryTab />}
        {activeTab === 'appointments' && <AppointmentsTab />}
        {activeTab === 'history' && <MedicalHistoryTab />}
        {activeTab === 'interpreter' && <InterpreterTab />}
        {activeTab === 'reminders' && <RemindersTab />}
        {activeTab === 'sos' && <SOSTab />}
      </div>

      {/* Reminder In-App Modal */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <Card className="w-full max-w-sm shadow-2xl overflow-hidden border-none ring-1 ring-white/10">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-8 text-center text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse backdrop-blur-md shadow-inner border border-white/20">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight drop-shadow-md">Reminder!</h2>
              <p className="text-indigo-100 mt-2 font-medium">Scheduled for {activeAlert.time_schedule}</p>
            </div>
            <CardContent className="p-8 text-center space-y-6 bg-white dark:bg-slate-900">
              <div>
                <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest mb-3">Time to take your</p>
                <p className="text-3xl font-black text-foreground bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                  {activeAlert.medicine_name}
                </p>
              </div>
              <div className="flex gap-3 pt-6">
                <Button variant="outline" className="flex-1 h-14 rounded-2xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold transition-all active:scale-95" onClick={() => setActiveAlert(null)}>
                  Skip
                </Button>
                <Button className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/25 transition-all active:scale-95" onClick={() => setActiveAlert(null)}>
                  Accept
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, children, variant = 'default' }) {
  const baseStyle = "px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-300 border border-transparent shadow-sm"
  const activeStyle = variant === 'destructive' 
    ? "bg-red-600 text-white shadow-md border-red-500 transform scale-105" 
    : "bg-indigo-600 text-white shadow-md border-indigo-500 transform scale-105"
  const inactiveStyle = "bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:bg-slate-800/50 hover:text-foreground border-slate-200 dark:border-slate-700"

  return (
    <button onClick={onClick} className={`${baseStyle} ${active ? activeStyle : inactiveStyle}`}>
      <Icon className="w-4 h-4" />
      {children}
    </button>
  )
}

// --------------------------------------------------------------------------
// 1. Directory & Booking Tab
// --------------------------------------------------------------------------
function DirectoryTab() {
  const { user } = useAuth()
  const [hospitals, setHospitals] = useState([])
  const [search, setSearch] = useState('')
  const [bookingModal, setBookingModal] = useState(null) // hospital object

  useEffect(() => {
    fetchHospitals()
  }, [])

  const fetchHospitals = async () => {
    const { data } = await supabase.from('hospitals').select('*')
    if (data) setHospitals(data)
  }

  const filtered = hospitals.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.specialty.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <FormField 
          placeholder="Search hospitals or specialties..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="max-w-md"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(hospital => (
          <Card key={hospital.id} className="flex flex-col shadow-card-sm border-indigo-50 dark:border-indigo-900/30 hover:shadow-card-md transition-shadow">
            <CardHeader className="pb-3 bg-white dark:bg-slate-900 rounded-t-xl border-b border-border">
              <CardTitle className="text-lg font-bold">{hospital.name}</CardTitle>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full w-max uppercase tracking-wider">{hospital.specialty}</span>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 p-5 text-sm text-muted-foreground bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-border flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="mt-1">{hospital.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-border flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-indigo-500" />
                </div>
                <span>{hospital.phone}</span>
              </div>
            </CardContent>
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-border rounded-b-xl flex gap-2">
              <Button className="flex-1 shadow-sm rounded-lg" onClick={() => setBookingModal(hospital)}>Book Appointment</Button>
            </div>
          </Card>
        ))}
      </div>

      {bookingModal && (
        <BookingModal hospital={bookingModal} onClose={() => setBookingModal(null)} userId={user?.id} userName={user?.user_metadata?.full_name} />
      )}
    </div>
  )
}

function BookingModal({ hospital, onClose, userId, userName }) {
  const [specialist, setSpecialist] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBook = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Combine date and time to ISO
    const dateTime = new Date(`${date}T${time}`).toISOString()
    
    // Append patient name for RLS workaround
    const patientName = userName || 'Patient'
    const finalSpecialistName = specialist ? `${specialist} (Patient: ${patientName})` : `(Patient: ${patientName})`

    const { error } = await supabase.from('appointments').insert({
      user_id: userId,
      hospital_id: hospital.id,
      specialist_name: finalSpecialistName,
      appointment_time: dateTime
    })

    setLoading(false)
    if (error) {
      alert("Error booking: " + error.message)
    } else {
      alert("Appointment booked successfully!")
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle>Book Appointment at {hospital.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBook} className="space-y-4">
            <FormField label="Specialist Name (Optional)" value={specialist} onChange={e => setSpecialist(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
              <FormField label="Time" type="time" required value={time} onChange={e => setTime(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Booking...' : 'Confirm Booking'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function AppointmentsTab() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*, hospitals(name)')
      .order('appointment_time', { ascending: false })
    
    if (data) setAppointments(data)
  }

  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-50 dark:border-indigo-900/30 shadow-card-sm">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-300 mb-4">
            <Calendar className="w-10 h-10" />
          </div>
          <p className="text-lg font-semibold text-foreground">No appointments yet</p>
          <p className="text-muted-foreground text-sm mt-1">Book an appointment from the Directory tab.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map(app => (
            <Card key={app.id} className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30 hover:shadow-card-md transition-shadow">
              <CardHeader className="pb-3 bg-white dark:bg-slate-900 rounded-t-xl border-b border-border">
                <CardTitle className="text-lg font-bold">{app.hospitals?.name}</CardTitle>
                <span className={`text-xs font-bold px-3 py-1 rounded-full w-max tracking-wide shadow-sm ${
                  app.status === 'Accepted' || app.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  app.status === 'Rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                  'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {app.status}
                </span>
              </CardHeader>
              <CardContent className="space-y-3 p-5 text-sm text-foreground bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-border flex items-center justify-center shrink-0 shadow-sm">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="font-medium">{new Date(app.appointment_time).toLocaleString()}</span>
                </div>
                {app.specialist_name && app.specialist_name.split(' (Patient:')[0] && app.specialist_name.split(' (Patient:')[0] !== '(Patient:' && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-border flex items-center justify-center shrink-0 shadow-sm">
                      <Heart className="w-4 h-4 text-rose-500" />
                    </div>
                    <span>Dr. {app.specialist_name.split(' (Patient:')[0].replace('(Patient:', '').trim()}</span>
                  </div>
                )}
                
                {(app.status === 'Accepted' || app.status === 'Completed') && (
                  <div className="pt-3 border-t border-border mt-1 flex gap-2">
                    <Button 
                      variant="secondary"
                      className="flex-1 rounded-lg shadow-sm" 
                      onClick={() => window.location.href = `/appointment/${app.id}/chat`}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> Chat
                    </Button>
                    <Button 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm" 
                      onClick={() => window.location.href = `/appointment/${app.id}/video`}
                    >
                      <Video className="w-4 h-4 mr-2" /> Video Call
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// --------------------------------------------------------------------------
// 2. Medical History Tab
// --------------------------------------------------------------------------
function MedicalHistoryTab() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [uploading, setUploading] = useState(false)
  const [sharingRecordId, setSharingRecordId] = useState(null)

  useEffect(() => {
    fetchRecords()
    fetchHospitals()
  }, [])

  const fetchRecords = async () => {
    const { data } = await supabase.from('medical_records').select('*').order('created_at', { ascending: false })
    if (data) setRecords(data)
  }

  const fetchHospitals = async () => {
    const { data } = await supabase.from('hospitals').select('id, name')
    if (data) setHospitals(data)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage.from('medical_documents').upload(filePath, file)
    
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { error: dbError } = await supabase.from('medical_records').insert({
      user_id: user.id,
      title: file.name,
      file_path: filePath
    })

    setUploading(false)
    if (dbError) {
      alert("Error saving record link: " + dbError.message)
    } else {
      alert("Document uploaded successfully!")
      fetchRecords()
    }
  }

  const downloadFile = async (filePath) => {
    const { data, error } = await supabase.storage.from('medical_documents').createSignedUrl(filePath, 60)
    if (data) window.open(data.signedUrl, '_blank')
    if (error) alert("Could not open file: " + error.message)
  }

  const handleShare = async (hospitalId) => {
    if (!hospitalId || !sharingRecordId) return
    const { error } = await supabase.from('record_access').upsert({
      record_id: sharingRecordId,
      hospital_id: hospitalId
    })
    
    if (error) {
      alert('Failed to share record: ' + error.message)
    } else {
      alert('Record shared successfully!')
      setSharingRecordId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30">
        <CardHeader className="bg-white dark:bg-slate-900 border-b border-border rounded-t-xl">
          <CardTitle className="text-lg font-bold">Upload Document</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input type="file" id="doc-upload" className="hidden" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" />
            <label htmlFor="doc-upload" className="cursor-pointer inline-flex items-center justify-center rounded-xl font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 h-12 px-6 shadow-md w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Select Document'}
            </label>
            <span className="text-sm text-muted-foreground bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-border shadow-sm">PDF, PNG, or JPEG up to 5MB</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {records.map(r => (
          <Card key={r.id} className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30 hover:shadow-card-md transition-shadow">
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold truncate text-foreground text-base">{r.title}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-lg shadow-sm" onClick={() => downloadFile(r.file_path)}>View</Button>
                  <Button 
                    size="sm" 
                    variant={sharingRecordId === r.id ? "default" : "secondary"} 
                    className={`rounded-lg shadow-sm ${sharingRecordId === r.id ? 'bg-indigo-600 text-white' : ''}`}
                    title="Share with Hospital"
                    onClick={() => setSharingRecordId(sharingRecordId === r.id ? null : r.id)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {sharingRecordId === r.id && (
                <div className="flex gap-2 pt-4 border-t border-border mt-2 animate-fade-in-up">
                  <select 
                    className="flex-1 text-sm rounded-xl border border-border bg-white dark:bg-slate-900 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    onChange={(e) => handleShare(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Select Hospital to Share With...</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// 3. Reminders Tab
// --------------------------------------------------------------------------
function RemindersTab() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState([])
  const [medName, setMedName] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    const { data } = await supabase.from('reminders').select('*').order('time_schedule')
    if (data) setReminders(data)
  }

  const addReminder = async (e) => {
    e.preventDefault()
    if (!medName || !time) return
    const { error } = await supabase.from('reminders').insert({
      user_id: user.id,
      medicine_name: medName,
      time_schedule: time
    })
    if (!error) {
      setMedName('')
      setTime('')
      fetchReminders()
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Add Reminder</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addReminder} className="flex gap-4 items-end">
            <FormField className="flex-1" label="Medicine Name" value={medName} onChange={e => setMedName(e.target.value)} required />
            <FormField label="Time (HH:MM)" type="time" value={time} onChange={e => setTime(e.target.value)} required />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {reminders.map(r => (
          <Card key={r.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{r.medicine_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {r.time_schedule}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${r.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// 4. SOS Tab
// --------------------------------------------------------------------------
function SOSTab() {
  const { user } = useAuth()
  const [triggering, setTriggering] = useState(false)
  const [sosHistory, setSosHistory] = useState([])

  useEffect(() => {
    fetchSOS()
  }, [])

  const fetchSOS = async () => {
    const { data } = await supabase.from('sos_alerts').select('*').order('created_at', { ascending: false })
    if (data) setSosHistory(data)
  }

  const triggerSOS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    setTriggering(true)
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      
      const { error } = await supabase.from('sos_alerts').insert({
        user_id: user.id,
        lat: latitude,
        lng: longitude
      })

      setTriggering(false)
      if (error) {
        alert("Failed to send SOS: " + error.message)
      } else {
        alert("SOS Alert Sent! Your emergency contact has been notified.")
        fetchSOS()
      }
    }, (err) => {
      alert("Error getting location: " + err.message)
      setTriggering(false)
    })
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-8">
      <div className="max-w-md space-y-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold">Emergency SOS</h2>
        <p className="text-muted-foreground">
          Pressing this button will record your GPS coordinates and immediately trigger an email alert to your designated emergency contact.
        </p>
      </div>
      
      <button 
        onClick={triggerSOS}
        disabled={triggering}
        className="w-64 h-64 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full flex flex-col items-center justify-center shadow-2xl transition-all transform hover:scale-105 active:scale-95 border-8 border-red-400 focus:outline-none"
      >
        <span className="text-4xl font-black tracking-widest">{triggering ? 'SENDING...' : 'SOS'}</span>
      </button>

      {sosHistory.length > 0 && (
        <div className="w-full max-w-md mt-12 text-left">
          <h3 className="font-semibold mb-4 border-b border-border pb-2">Recent Alerts</h3>
          <ul className="space-y-2">
            {sosHistory.map(h => (
              <li key={h.id} className="text-sm flex justify-between bg-muted/50 p-2 rounded">
                <span>{new Date(h.created_at).toLocaleString()}</span>
                <a href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Map</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// --------------------------------------------------------------------------
// 5. Interpreter Tab
// --------------------------------------------------------------------------
function InterpreterTab() {
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequest()
    
    // Subscribe to changes on our requests
    const channel = supabase
      .channel('public:interpreter_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interpreter_requests', filter: `user_id=eq.${user?.id}` }, payload => {
        fetchRequest() // Refresh on any change
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  const fetchRequest = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('interpreter_requests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (data) setRequest(data)
    else setRequest(null)
    setLoading(false)
  }

  const handleRequest = async () => {
    const { error } = await supabase.from('interpreter_requests').insert({
      user_id: user.id,
      status: 'pending'
    })
    if (error) {
      alert("Error requesting interpreter: " + error.message)
    } else {
      fetchRequest()
    }
  }

  const handleCancel = async () => {
    const { error } = await supabase.from('interpreter_requests').update({ status: 'completed' }).eq('id', request.id)
    if (error) {
      alert("Error cancelling request: " + error.message)
    } else {
      setRequest(null)
    }
  }

  const handleJoinCall = async () => {
    // Both users join a video call using the request.id as the call room
    // First, we ensure a video_calls record exists
    const { data: existingCall } = await supabase.from('video_calls').select('*').eq('id', request.id).single()
    
    if (!existingCall) {
      const { error: insertError } = await supabase.from('video_calls').insert({
        id: request.id,
        caller_id: user.id, // Current user is caller for RLS
        receiver_id: request.interpreter_id, // The interpreter
        status: 'ringing'
      })
      if (insertError) {
        alert("Failed to join video call room: " + insertError.message)
        return
      }
    }
    
    window.location.href = `/call/${request.id}`
  }

  if (loading) return <div className="p-12 text-center text-muted-foreground">Checking interpreter status...</div>

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-8 animate-fade-in-up">
      <div className="max-w-md space-y-4">
        <Headset className="w-16 h-16 text-indigo-500 mx-auto" />
        <h2 className="text-2xl font-bold">Live Sign Language Interpreter</h2>
        <p className="text-muted-foreground">
          Connect with a professional human interpreter via secure video call to help translate in real-time during your hospital or bank visits.
        </p>
      </div>

      {!request ? (
        <Button 
          onClick={handleRequest}
          className="h-16 px-8 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-lg font-bold transition-transform hover:scale-105 active:scale-95"
        >
          Request Live Interpreter Now
        </Button>
      ) : request.status === 'pending' ? (
        <Card className="max-w-md w-full border-amber-200 bg-amber-50 dark:bg-amber-900/20 shadow-md">
          <CardContent className="p-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto text-amber-600 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">Finding an Interpreter...</h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm">Please wait while we connect you with the next available professional interpreter.</p>
            </div>
            <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-100" onClick={handleCancel}>Cancel Request</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-md w-full border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 shadow-md animate-scale-in">
          <CardContent className="p-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto text-emerald-600">
              <Video className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">Interpreter Connected!</h3>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm">Your interpreter has accepted the request and is waiting for you in the secure video room.</p>
            </div>
            <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-transform hover:scale-105 active:scale-95" onClick={handleJoinCall}>
              Join Video Call
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-emerald-700 opacity-70 hover:opacity-100" onClick={handleCancel}>End Session</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

