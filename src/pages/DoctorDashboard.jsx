import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Heart, Calendar, FileText, MessageSquare, Video, CheckCircle, XCircle } from 'lucide-react'
import healthcareHeart from '../assets/healthcare-heart.png'

export default function DoctorDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('appointments')
  const [appointments, setAppointments] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [profile])

  const fetchDashboardData = async () => {
    if (appointments.length === 0) setLoading(true)
    
    // Fetch Appointments for this doctor's hospital
    const { data: aptData, error: aptError } = await supabase
      .from('appointments')
      .select('*')
      .eq('hospital_id', profile.hospital_id)
      .order('appointment_time', { ascending: true })
      
    if (aptError) {
      console.error("Error fetching appointments:", aptError)
    }

    // Fetch Shared Medical Records
    const { data: accessData, error: accessError } = await supabase
      .from('record_access')
      .select('*, medical_records(*)')
      .eq('hospital_id', profile.hospital_id)
      
    if (accessError) {
      console.error("Error fetching record access:", accessError)
    }

    let finalApts = aptData || []
    let finalRecords = accessData ? accessData.map(a => a.medical_records).filter(r => r !== null) : []

    // Manually fetch profiles since user_id references auth.users and PostgREST can't join it directly
    const userIds = [
      ...finalApts.map(a => a.user_id),
      ...finalRecords.map(r => r.user_id)
    ]
    const uniqueUserIds = [...new Set(userIds)].filter(Boolean)

    if (uniqueUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueUserIds)

      const profileMap = {}
      if (profilesData) {
        profilesData.forEach(p => { profileMap[p.id] = p.full_name })
      }

      finalApts = finalApts.map(a => {
        // Fallback: If RLS blocks profile fetch, we extract it from specialist_name hack
        let extractedName = 'Unknown Patient'
        if (a.specialist_name && a.specialist_name.includes('Patient:')) {
          extractedName = a.specialist_name.split('Patient:')[1].trim().replace(')', '')
        }
        return {
          ...a,
          profiles: { full_name: profileMap[a.user_id] || extractedName }
        }
      })
      
      finalRecords = finalRecords.map(r => ({
        ...r,
        profiles: { full_name: profileMap[r.user_id] || 'Unknown Patient' }
      }))
    }
    
    setAppointments(finalApts)
    setRecords(finalRecords)
    setLoading(false)
  }

  const updateAppointmentStatus = async (id, status) => {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      
    if (error) {
      alert("Error updating appointment: " + error.message)
    } else if (!data || data.length === 0) {
      alert("Failed to accept appointment. You do not have permission to modify this record. Please contact the hospital administrator.")
    } else {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    }
  }

  const downloadFile = async (filePath) => {
    const { data, error } = await supabase.storage.from('medical_documents').createSignedUrl(filePath, 60)
    if (data) window.open(data.signedUrl, '_blank')
    if (error) alert("Could not open file: " + error.message)
  }

  const [hospitalsList, setHospitalsList] = useState([])
  const [selectedHospitalId, setSelectedHospitalId] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Fetch hospitals for onboarding if none assigned
  useEffect(() => {
    if (profile && !profile.hospital_id) {
      const fetchAllHospitals = async () => {
        const { data } = await supabase.from('hospitals').select('id, name')
        if (data) setHospitalsList(data)
      }
      fetchAllHospitals()
    }
  }, [profile])

  const handleJoinHospital = async () => {
    if (!selectedHospitalId) return
    setAssigning(true)
    const { error } = await supabase
      .from('profiles')
      .update({ hospital_id: selectedHospitalId })
      .eq('id', profile.id)
    
    setAssigning(false)
    if (error) {
      alert("Error joining hospital: " + error.message)
    } else {
      alert("Hospital assigned successfully! Refreshing dashboard...")
      window.location.reload()
    }
  }

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>

  if (!profile?.hospital_id) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex items-center justify-center min-h-[60vh] animate-fade-in-up">
        <Card className="max-w-md w-full shadow-card-lg border-indigo-50">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600 mb-2">
              <Heart className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome, Dr. {profile?.full_name?.split(' ')[0] || ''}!</h2>
              <p className="text-muted-foreground text-sm">
                Your doctor account is not yet linked to a hospital. To view appointments and patient records, please select your primary hospital below.
              </p>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-border">
              <select 
                className="w-full h-11 rounded-xl border border-border bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
              >
                <option value="" disabled>Select your hospital...</option>
                {hospitalsList.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              
              <Button 
                className="w-full h-11 rounded-xl font-bold shadow-sm"
                disabled={!selectedHospitalId || assigning}
                onClick={handleJoinHospital}
              >
                {assigning ? 'Linking...' : 'Join Hospital'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-card-sm border border-indigo-50 dark:border-indigo-900/30">
        <div className="w-24 h-24 shrink-0 drop-shadow-xl animate-float">
          <img src={healthcareHeart} alt="Doctor" className="w-full h-full object-contain" />
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-foreground">Doctor Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">Welcome back, Dr. {profile?.full_name || 'User'}. Manage your schedule and patients.</p>
        </div>
      </div>

      <div className="flex gap-3 border-b border-border pb-4 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('appointments')}
          className={`px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-300 border border-transparent shadow-sm ${activeTab === 'appointments' ? 'bg-indigo-600 text-white shadow-md border-indigo-500 transform scale-105' : 'bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:bg-slate-800/50 hover:text-foreground border-slate-200 dark:border-slate-700'}`}
        >
          <Calendar className="w-4 h-4" /> Appointments
        </button>
        <button 
          onClick={() => setActiveTab('records')}
          className={`px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-300 border border-transparent shadow-sm ${activeTab === 'records' ? 'bg-indigo-600 text-white shadow-md border-indigo-500 transform scale-105' : 'bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:bg-slate-800/50 hover:text-foreground border-slate-200 dark:border-slate-700'}`}
        >
          <FileText className="w-4 h-4" /> Patient Records
        </button>
      </div>

      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No appointments scheduled at your hospital.
              </CardContent>
            </Card>
          ) : (
              appointments.map(apt => (
              <Card key={apt.id} className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30 hover:shadow-card-md transition-shadow">
                <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{apt.profiles?.full_name || 'Unknown Patient'}</h3>
                      <p className="text-sm font-medium text-muted-foreground mt-1">
                        {new Date(apt.appointment_time).toLocaleString()}
                      </p>
                      <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm border ${
                        apt.status === 'Accepted' || apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        apt.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        Status: {apt.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    {apt.status === 'Pending' && (
                      <>
                        <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 rounded-lg" onClick={() => updateAppointmentStatus(apt.id, 'Accepted')}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg" onClick={() => updateAppointmentStatus(apt.id, 'Rejected')}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    
                    {(apt.status === 'Accepted' || apt.status === 'Completed') && (
                      <>
                        <Button size="sm" variant="secondary" className="rounded-lg shadow-sm" onClick={() => navigate(`/appointment/${apt.id}/chat`)}>
                          <MessageSquare className="w-4 h-4 mr-2" /> Chat
                        </Button>
                        <Button size="sm" className="rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate(`/appointment/${apt.id}/video`)}>
                          <Video className="w-4 h-4 mr-2" /> Video Call
                        </Button>
                        {apt.status !== 'Completed' && (
                          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => updateAppointmentStatus(apt.id, 'Completed')}>
                            Mark Completed
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-4">
          {records.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No patient records have been shared with your hospital yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {records.map(r => (
                <Card key={r.id} className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30 hover:shadow-card-md transition-shadow">
                  <CardContent className="p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold truncate text-foreground text-base">{r.title}</p>
                        <p className="text-sm text-muted-foreground font-medium mt-1">Patient: {r.profiles?.full_name}</p>
                        <p className="text-xs text-slate-400 mt-1">Uploaded: {new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button className="w-full mt-2 rounded-lg shadow-sm" variant="outline" onClick={() => downloadFile(r.file_path)}>
                      View Document
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
