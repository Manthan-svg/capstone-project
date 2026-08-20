import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Building, Calendar, FileText, Video, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import govBuilding from '../assets/government-building.png'

export default function HospitalDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [hospitalsList, setHospitalsList] = useState([])
  const [selectedHospitalId, setSelectedHospitalId] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    if (profile && !profile.hospital_id) {
      const fetchAllHospitals = async () => {
        const { data } = await supabase.from('hospitals').select('id, name')
        if (data) setHospitalsList(data)
      }
      fetchAllHospitals()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    // 1. Fetch incoming appointments for this hospital
    const { data: aptData } = await supabase
      .from('appointments')
      .select('*')
      .eq('hospital_id', profile.hospital_id)
      .order('appointment_time', { ascending: true })
      
    // 2. Fetch accessible records
    const { data: accessData } = await supabase
      .from('record_access')
      .select('*, medical_records(*)')
      .eq('hospital_id', profile.hospital_id)

    let finalApts = aptData || []
    let finalRecords = accessData ? accessData.map(a => a.medical_records).filter(r => r !== null) : []

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

  const downloadFile = async (filePath) => {
    const { data, error } = await supabase.storage.from('medical_documents').createSignedUrl(filePath, 60)
    if (data) window.open(data.signedUrl, '_blank')
    if (error) alert("Could not open file: " + error.message)
  }

  const handleJoinHospital = async () => {
    if (!selectedHospitalId) return
    setAssigning(true)
    const { data, error } = await supabase
      .from('profiles')
      .update({ hospital_id: selectedHospitalId })
      .eq('id', profile.id)
      .select()
    
    setAssigning(false)
    if (error) {
      alert("Error joining hospital: " + error.message)
    } else if (!data || data.length === 0) {
      const sqlCommand = `UPDATE profiles SET hospital_id = '${selectedHospitalId}' WHERE id = '${profile.id}';`
      alert("Database Security (RLS) prevented the assignment.\n\nPlease run this exact SQL command in your Supabase SQL Editor to bypass it:\n\n" + sqlCommand)
    } else {
      alert("Hospital assigned successfully! Refreshing dashboard...")
      window.location.reload()
    }
  }

  if (loading) return <div>Loading dashboard...</div>

  if (!profile?.hospital_id) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex items-center justify-center min-h-[60vh] animate-fade-in-up">
        <Card className="max-w-md w-full shadow-card-lg border-indigo-50">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600 mb-2">
              <Building className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome, {profile?.full_name?.split(' ')[0] || 'Hospital Admin'}!</h2>
              <p className="text-muted-foreground text-sm">
                Your account is not yet linked to a hospital facility. Please select your facility below to access the dashboard.
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
                {assigning ? 'Linking...' : 'Link Facility'}
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
          <img src={govBuilding} alt="Hospital" className="w-full h-full object-contain" />
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-foreground">Hospital Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage your patients, appointments, and facility records.</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-8">
        {/* Appointments Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground"><Calendar className="w-6 h-6 text-indigo-600" /> Upcoming Appointments</h2>
          {appointments.length === 0 ? (
            <Card className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30"><CardContent className="p-8 text-muted-foreground text-center">No upcoming appointments.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {appointments.map(appt => (
                <Card key={appt.id} className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30 hover:shadow-card-md transition-shadow">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-lg text-foreground">{appt.profiles?.full_name || 'Unknown Patient'}</p>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Specialist: {appt.specialist_name || 'General'}</p>
                      <p className="text-sm font-semibold text-indigo-600 mt-2">{new Date(appt.appointment_time).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <Button size="sm" onClick={() => navigate(`/appointment/${appt.id}/chat`)} className="flex gap-2 rounded-lg shadow-sm">
                        <MessageSquare className="w-4 h-4" /> Open Chat
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/appointment/${appt.id}/video`)} className="flex gap-2 rounded-lg shadow-sm">
                        <Video className="w-4 h-4" /> Video Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Medical Records Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground"><FileText className="w-6 h-6 text-indigo-600" /> Patient Records</h2>
          {records.length === 0 ? (
            <Card className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30"><CardContent className="p-8 text-muted-foreground text-center">No patient records have been shared with this hospital.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {records.map(r => (
                <Card key={r.id} className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30 hover:shadow-card-md transition-shadow">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-base text-foreground">{r.title}</p>
                        <p className="text-sm font-medium text-muted-foreground mt-1">Patient: {r.profiles?.full_name}</p>
                        <p className="text-xs text-slate-400 mt-1">Uploaded: {new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => downloadFile(r.file_path)} className="w-full sm:w-auto rounded-lg shadow-sm">View Document</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
