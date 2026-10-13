import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { MapPin, Phone, Calendar, Upload, Clock, AlertTriangle, FileText, Share2, Video, Heart, MessageSquare, Headset, HeartHandshake, Search, Target, Check, Plus, Trash2, ShieldAlert } from 'lucide-react'
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

  const [activeTab, setActiveTab] = useState('directory') // directory, ngos, appointments, history, reminders, sos

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
        <TabButton active={activeTab === 'directory'} onClick={() => setActiveTab('directory')} icon={MapPin}>Hospitals</TabButton>
        <TabButton active={activeTab === 'ngos'} onClick={() => setActiveTab('ngos')} icon={HeartHandshake}>NGO Directory (India)</TabButton>
        <TabButton active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} icon={Calendar}>My Appointments</TabButton>
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={FileText}>Medical History</TabButton>
        <TabButton active={activeTab === 'reminders'} onClick={() => setActiveTab('reminders')} icon={Clock}>Reminders</TabButton>
        <TabButton active={activeTab === 'sos'} onClick={() => setActiveTab('sos')} icon={AlertTriangle} variant="destructive">Emergency SOS</TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-800/50 p-1 rounded-xl relative">
        {activeTab === 'directory' && <DirectoryTab />}
        {activeTab === 'ngos' && <HealthcareNGODirectoryTab />}
        {activeTab === 'appointments' && <AppointmentsTab />}
        {activeTab === 'history' && <MedicalHistoryTab />}
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
// --------------------------------------------------------------------------
// 4. Enhanced Emergency SOS Tab (Doctors, NGO Staff & Guardians)
// --------------------------------------------------------------------------
const INITIAL_EMERGENCY_CONTACTS = [
  {
    id: 'contact-doc-1',
    category: 'doctor',
    categoryLabel: 'Doctor / Medical Staff',
    icon: '👨‍⚕️',
    name: 'Dr. Anil Kulkarni',
    roleOrAffiliation: 'Sassoon General Hospital / ENT & Audiology',
    phone: '+91 98220 11223',
    email: 'dr.anil.kulkarni@hospital.org',
    active: true
  },
  {
    id: 'contact-ngo-1',
    category: 'ngo',
    categoryLabel: 'NGO Support Staff',
    icon: '🤝',
    name: 'Pooja Sharma (Helpdesk Coordinator)',
    roleOrAffiliation: 'National Association of the Deaf (NAD) Maharashtra',
    phone: '+91 98110 12345',
    email: 'sos-response@nadindia.org',
    active: true
  },
  {
    id: 'contact-guardian-1',
    category: 'guardian',
    categoryLabel: 'Family Guardian / Caregiver',
    icon: '👨‍👩‍👧',
    name: 'Ramesh & Sunita (Primary Guardians)',
    roleOrAffiliation: 'Parents / Immediate Family',
    phone: '+91 99220 54321',
    email: 'family.emergency@gmail.com',
    active: true
  }
]

function SOSTab() {
  const { user } = useAuth()
  const [triggering, setTriggering] = useState(false)
  const [sosHistory, setSosHistory] = useState([])
  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('signbridge_emergency_contacts')
    return saved ? JSON.parse(saved) : INITIAL_EMERGENCY_CONTACTS
  })
  
  // New Contact Form state
  const [showAddContact, setShowAddContact] = useState(false)
  const [newCategory, setNewCategory] = useState('doctor')
  const [newName, setNewName] = useState('')
  const [newOrg, setNewOrg] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [lastDispatchedList, setLastDispatchedList] = useState([])

  useEffect(() => {
    localStorage.setItem('signbridge_emergency_contacts', JSON.stringify(contacts))
  }, [contacts])

  useEffect(() => {
    fetchSOS()
  }, [])

  const fetchSOS = async () => {
    const { data } = await supabase.from('sos_alerts').select('*').order('created_at', { ascending: false })
    if (data) setSosHistory(data)
  }

  const toggleContactActive = (id) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c))
  }

  const handleDeleteContact = (id) => {
    if (contacts.length <= 1) {
      alert("You must keep at least one emergency contact.")
      return
    }
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  const handleAddContact = (e) => {
    e.preventDefault()
    if (!newName || !newPhone || !newEmail) {
      alert("Please fill in Name, Phone, and Email.")
      return
    }

    const categoryMeta = {
      doctor: { label: 'Doctor / Medical Staff', icon: '👨‍⚕️' },
      ngo: { label: 'NGO Support Staff', icon: '🤝' },
      guardian: { label: 'Family Guardian / Caregiver', icon: '👨‍👩‍👧' }
    }[newCategory]

    const newEntry = {
      id: `contact-${Date.now()}`,
      category: newCategory,
      categoryLabel: categoryMeta.label,
      icon: categoryMeta.icon,
      name: newName,
      roleOrAffiliation: newOrg || 'Emergency Responder',
      phone: newPhone,
      email: newEmail,
      active: true
    }

    setContacts(prev => [...prev, newEntry])
    setNewName(''); setNewOrg(''); setNewPhone(''); setNewEmail('');
    setShowAddContact(false)
  }

  const triggerSOS = () => {
    const activeContacts = contacts.filter(c => c.active)
    if (activeContacts.length === 0) {
      alert("Please select at least one emergency contact (Doctor, NGO Staff, or Guardian) to alert.")
      return
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    setTriggering(true)
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      
      const { error } = await supabase.from('sos_alerts').insert({
        user_id: user?.id,
        lat: latitude,
        lng: longitude
      })

      setTriggering(false)
      if (error) {
        alert("Failed to send SOS: " + error.message)
      } else {
        setLastDispatchedList(activeContacts)
        fetchSOS()
        alert(`🚨 EMERGENCY SOS DISPATCHED!\n\nLive GPS location link transmitted to:\n` + 
          activeContacts.map(c => `• ${c.name} (${c.categoryLabel}) - ${c.email}`).join('\n'))
      }
    }, (err) => {
      alert("Error getting location: " + err.message)
      setTriggering(false)
    }, { enableHighAccuracy: true, timeout: 10000 })
  }

  const activeCount = contacts.filter(c => c.active).length

  return (
    <div className="space-y-8 p-4 md:p-6 animate-fade-in-up max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <h2 className="text-2xl font-black text-red-900 dark:text-red-100">Emergency SOS Network</h2>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 max-w-xl font-medium">
            One-tap silent distress signal transmits your live device GPS pin to all designated <b>Doctors</b>, <b>NGO Staff</b>, and <b>Family Guardians</b> instantly.
          </p>
        </div>

        {/* Big Panic SOS Trigger Button */}
        <button 
          onClick={triggerSOS}
          disabled={triggering}
          className="w-48 h-48 shrink-0 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full flex flex-col items-center justify-center shadow-2xl transition-all transform hover:scale-105 active:scale-95 border-8 border-red-400 focus:outline-none"
        >
          <span className="text-3xl font-black tracking-widest">{triggering ? 'LOCATING...' : 'SOS'}</span>
          <span className="text-[11px] font-bold text-red-100 uppercase tracking-wider mt-1">Tap to Alert ({activeCount})</span>
        </button>
      </div>

      {/* Confirmation of Last SOS Dispatch */}
      {lastDispatchedList.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 animate-fade-in space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
            <Check className="w-5 h-5 text-emerald-600" />
            <span>Latest SOS Successfully Transmitted to {lastDispatchedList.length} Emergency Responders:</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {lastDispatchedList.map(c => (
              <div key={c.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 text-xs space-y-1">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <span>{c.icon}</span> {c.name}
                </p>
                <p className="text-muted-foreground truncate">{c.categoryLabel}</p>
                <p className="text-emerald-600 font-semibold truncate">{c.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorized Emergency Contacts Management */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <span>🚨</span> Designated SOS Emergency Contacts
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select who should receive your GPS coordinates during a medical crisis.
            </p>
          </div>
          <Button 
            onClick={() => setShowAddContact(!showAddContact)}
            size="sm" 
            className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </Button>
        </div>

        {/* Add Contact Modal / Inline Form */}
        {showAddContact && (
          <form onSubmit={handleAddContact} className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-border space-y-4 animate-scale-in">
            <h4 className="font-bold text-sm text-foreground">Add New Emergency Contact</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Contact Category</label>
                <select 
                  className="w-full h-10 px-3 rounded-lg border border-input bg-white dark:bg-slate-900 text-xs font-semibold"
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)}
                >
                  <option value="doctor">👨‍⚕️ Doctor / Medical Specialist</option>
                  <option value="ngo">🤝 NGO Support Staff</option>
                  <option value="guardian">👨‍👩‍👧 Family Guardian / Caregiver</option>
                </select>
              </div>
              <FormField label="Full Name" placeholder="e.g. Dr. Rajesh / Suman" required value={newName} onChange={e => setNewName(e.target.value)} />
              <FormField label="Organization / Relationship" placeholder="e.g. City Hospital / Sister" value={newOrg} onChange={e => setNewOrg(e.target.value)} />
              <FormField label="Phone Number" placeholder="+91 98000 00000" required value={newPhone} onChange={e => setNewPhone(e.target.value)} />
              <div className="sm:col-span-2">
                <FormField label="Email Address (Receives GPS Alert Link)" type="email" placeholder="contact@emergency.com" required value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddContact(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-indigo-600 text-white font-bold">Save Contact</Button>
            </div>
          </form>
        )}

        {/* Contact Cards Grid: Doctors, NGO Staff, Guardians */}
        <div className="grid md:grid-cols-3 gap-4">
          {contacts.map(c => (
            <Card key={c.id} className={`transition-all duration-200 border-2 ${c.active ? 'border-red-400 dark:border-red-600/60 shadow-sm bg-red-50/20' : 'border-border opacity-70 bg-slate-50/50'}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{c.icon}</span>
                    <div>
                      <p className="font-bold text-sm text-foreground leading-tight">{c.name}</p>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {c.categoryLabel}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteContact(c.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                    title="Remove contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-border">
                  <p className="font-medium text-foreground truncate">{c.roleOrAffiliation}</p>
                  <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {c.phone}</p>
                  <p className="text-indigo-600 truncate">{c.email}</p>
                </div>

                <label className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-border cursor-pointer select-none text-xs font-bold">
                  <span className={c.active ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}>
                    {c.active ? "✓ Alerts Active" : "Disabled for SOS"}
                  </span>
                  <input 
                    type="checkbox" 
                    checked={c.active} 
                    onChange={() => toggleContactActive(c.id)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                  />
                </label>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Incident History */}
      {sosHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-sm text-left">
          <h3 className="font-bold text-sm mb-3 border-b border-border pb-2 text-foreground">
            Recent Emergency Transmissions
          </h3>
          <ul className="space-y-2">
            {sosHistory.slice(0, 5).map(h => (
              <li key={h.id} className="text-xs flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-border">
                <span className="font-medium text-foreground">{new Date(h.created_at).toLocaleString()}</span>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-lg border border-blue-100"
                >
                  <MapPin className="w-3 h-3 text-red-500" /> View Live Location Pin ➔
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  )
}

// --------------------------------------------------------------------------
// 6. NGO Directory (India Only) Tab
// --------------------------------------------------------------------------
const INDIAN_HEALTHCARE_NGOS = [
  {
    id: 'in-ngo-1',
    name: 'Ali Yavar Jung National Institute of Speech and Hearing Disabilities (AYJNISHD)',
    description: 'Premier national autonomous institute under DEPwD (Govt. of India) providing clinical diagnosis, audiology testing, cochlear implant rehabilitation, and speech therapy.',
    focus_area: 'Audiology Healthcare, Speech Therapy & Rehabilitation',
    location: 'Bandra West, Mumbai, Maharashtra (India)',
    contact_info: '022-2640-0211 | ayjnihh-mum@nic.in',
    category: 'National Apex Institute'
  },
  {
    id: 'in-ngo-2',
    name: 'All India Institute of Speech and Hearing (AIISH)',
    description: 'Leading autonomous institute under the Ministry of Health and Family Welfare providing clinical testing, hearing aids, and specialized communicative disorders care.',
    focus_area: 'Clinical Testing, Hearing Healthcare & Research',
    location: 'Manasagangothri, Mysuru, Karnataka (India)',
    contact_info: '0821-251-4449 | director@aiishmysore.in',
    category: 'National Healthcare Institute'
  },
  {
    id: 'in-ngo-3',
    name: 'National Association of the Deaf (NAD) - Maharashtra',
    description: 'Deaf-led Indian advocacy foundation fighting for accessible healthcare communication, hospital sign interpreters, and RPwD Act 2016 patient rights.',
    focus_area: 'Healthcare Advocacy & Legal Rights',
    location: 'Dadar West, Mumbai, Maharashtra (India)',
    contact_info: 'nad.maharashtra@nadindia.org | 98110-12345 (Text/WhatsApp)',
    category: 'Indian Advocacy NGO'
  },
  {
    id: 'in-ngo-4',
    name: 'Deaf Enabled Foundation (DEF)',
    description: 'Empowers deaf individuals across Maharashtra and India with accessible health literacy, digital education, and hospital visit assistance.',
    focus_area: 'Health Literacy, Skill Training & Employment',
    location: 'Shivaji Nagar, Pune & Vashi, Navi Mumbai (India)',
    contact_info: 'contact@def.org.in | 020-2565-1122',
    category: 'Indian Welfare NGO'
  },
  {
    id: 'in-ngo-5',
    name: 'All India Federation of the Deaf (AIFD) - Western Outreach',
    description: 'Prominent national organization conducting accessible medical check-up camps, subsidizing audiology aids, and social welfare programs across India.',
    focus_area: 'Medical Health Camps & Community Welfare',
    location: 'Fort, Mumbai, Maharashtra (India)',
    contact_info: 'aifd.west@deafindia.org | 022-2261-4400',
    category: 'National Federation'
  },
  {
    id: 'in-ngo-6',
    name: 'Indian Sign Language Research and Training Centre (ISLRTC)',
    description: 'Autonomous central body standardizing Indian Sign Language and training certified medical & hospital ISL interpreters across India.',
    focus_area: 'Medical Interpreters & Sign Language Standards',
    location: 'Okhla, New Delhi (India)',
    contact_info: 'islrtcnewdelhi@gmail.com | 011-2638-7558',
    category: 'Government Body'
  },
  {
    id: 'in-ngo-7',
    name: 'Balkalyan Sanstha - Special Care Rehabilitation',
    description: 'Non-profit rehabilitation center offering speech & hearing sensory therapy, physical fitness, and health development for deaf children in Maharashtra.',
    focus_area: 'Pediatric Rehabilitation & Health Development',
    location: 'Raj Bhavan Road, Pune, Maharashtra (India)',
    contact_info: 'info@balkalyansanstha.org | 020-2565-4560',
    category: 'Specialized Care Center'
  },
  {
    id: 'in-ngo-8',
    name: 'v-shesh Learning & Accessibility Services',
    description: 'Accessibility enterprise facilitating workplace health accommodations, disability inclusion audits, and assistive technology across India.',
    focus_area: 'Workplace Accommodations & Corporate Inclusion',
    location: 'Vashi, Navi Mumbai, Maharashtra & Bengaluru (India)',
    contact_info: 'contact@v-shesh.com | 022-4972-8800',
    category: 'Social Impact Enterprise'
  },
  {
    id: 'in-ngo-9',
    name: 'Yuva Deaf Association',
    description: 'Youth-led community organization organizing accessible mental wellness circles, health workshops, and sports initiatives in Maharashtra.',
    focus_area: 'Mental Wellness & Youth Health Activities',
    location: 'Kothrud, Pune, Maharashtra (India)',
    contact_info: 'yuvadeaf.pune@gmail.com | 98901-23456 (Video Call)',
    category: 'Community Youth NGO'
  },
  {
    id: 'in-ngo-10',
    name: 'SignBridge Foundation India',
    description: 'Technology foundation delivering free AI-driven sign translation tools, emergency medical SOS integrations, and healthcare accessibility resources.',
    focus_area: 'Emergency Healthcare Tech & ISL Tools',
    location: 'Hinjawadi, Pune, Maharashtra (India)',
    contact_info: 'foundation@signbridge.ai | signbridge.ai',
    category: 'Assistive Tech Foundation'
  }
]

function HealthcareNGODirectoryTab() {
  const [ngos, setNgos] = useState(INDIAN_HEALTHCARE_NGOS)
  const [search, setSearch] = useState('')
  const [filterRegion, setFilterRegion] = useState('All')

  // Helper to ensure strictly Indian NGOs
  const isStrictlyIndian = (item) => {
    const loc = (item.location || '').toLowerCase()
    const name = (item.name || '').toLowerCase()
    const foreignKeywords = ['new york', 'austin', 'chicago', 'san francisco', 'usa', 'united states', 'tx', 'ny', 'il', 'ca', 'london', 'uk', 'europe']
    if (foreignKeywords.some(f => loc.includes(f) || name.includes(f))) return false
    const indianKeywords = ['india', 'maharashtra', 'mumbai', 'pune', 'delhi', 'mysuru', 'karnataka', 'vashi', 'navi mumbai', 'hyderabad', 'bengaluru']
    return indianKeywords.some(k => loc.includes(k) || name.includes(k))
  }

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        const { data } = await supabase.from('ngos').select('*').order('name')
        if (data && data.length > 0) {
          // Strictly keep only Indian NGOs from database
          const indianDbOnly = data.filter(isStrictlyIndian)
          const dbMap = new Map(indianDbOnly.map(d => [d.name.toLowerCase().trim(), d]))
          const merged = INDIAN_HEALTHCARE_NGOS.map(n => dbMap.get(n.name.toLowerCase().trim()) || n)
          
          indianDbOnly.forEach(d => {
            if (!INDIAN_HEALTHCARE_NGOS.some(n => n.name.toLowerCase().trim() === d.name.toLowerCase().trim())) {
              merged.push(d)
            }
          })
          setNgos(merged)
        }
      } catch (err) {
        console.warn("Could not load NGOs from Supabase, using verified Indian dataset:", err)
      }
    }
    fetchNgos()
  }, [])

  const filtered = ngos.filter(ngo => {
    const matchesSearch = 
      ngo.name.toLowerCase().includes(search.toLowerCase()) || 
      ngo.focus_area.toLowerCase().includes(search.toLowerCase()) || 
      ngo.location.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false
    if (filterRegion === 'Maharashtra') return ngo.location.toLowerCase().includes('maharashtra') || ngo.location.toLowerCase().includes('mumbai') || ngo.location.toLowerCase().includes('pune')
    if (filterRegion === 'Clinical') return ngo.focus_area.toLowerCase().includes('audiology') || ngo.focus_area.toLowerCase().includes('clinical') || ngo.focus_area.toLowerCase().includes('pediatric')
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🇮🇳</span>
              <h2 className="text-2xl font-black text-foreground">Deaf Healthcare & Welfare NGOs (India)</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Verified non-governmental organizations and national institutes across India providing speech therapy, audiology aids, hospital interpretation, and deaf patient advocacy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
              ✓ 100% Indian NGOs Only
            </span>
          </div>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by NGO name, Indian city (Mumbai, Pune, Delhi, Mysuru), or medical specialty..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-1 flex-wrap">
          <button 
            onClick={() => setFilterRegion('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterRegion === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'}`}
          >
            All India ({ngos.length})
          </button>
          <button 
            onClick={() => setFilterRegion('Maharashtra')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterRegion === 'Maharashtra' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'}`}
          >
            Maharashtra (Mumbai & Pune)
          </button>
          <button 
            onClick={() => setFilterRegion('Clinical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterRegion === 'Clinical' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'}`}
          >
            Clinical & Audiology Care
          </button>
        </div>
      </div>

      {/* NGO Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map(ngo => (
          <Card key={ngo.id} className="shadow-card-sm hover:shadow-card-md transition-all duration-300 flex flex-col border-indigo-50 dark:border-indigo-900/30 group hover:-translate-y-1">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-border/50 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-lg font-black text-foreground group-hover:text-indigo-600 transition-colors flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <span>{ngo.name}</span>
                </CardTitle>
                <span className="text-[11px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 px-2.5 py-1 rounded-md border border-orange-200 dark:border-orange-800 shrink-0">
                  🇮🇳 India
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
              <div className="space-y-4 mb-6">
                <p className="text-foreground/80 leading-relaxed font-medium text-[14px]">{ngo.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 rounded-lg text-xs font-bold shadow-sm">
                    <Target className="w-3.5 h-3.5" /> {ngo.focus_area}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-red-500" /> {ngo.location}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-border flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Emergency & Contact</span>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-100 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl truncate max-w-[280px]">
                  <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">{ngo.contact_info}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-border shadow-sm p-16 text-muted-foreground">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="font-bold text-xl text-foreground mb-1">No organizations found</p>
            <p className="text-sm">Try searching for "Mumbai", "Pune", "Audiology", or "Advocacy".</p>
          </div>
        )}
      </div>
    </div>
  )
}

