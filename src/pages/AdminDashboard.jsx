import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Shield, Users, Activity, FileText, Award, MessageSquare, Mic, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import heroAvatar from '../assets/hero-avatar.png'

export default function AdminDashboard() {
  const { profile } = useAuth()
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    roleDistribution: {},
    totalMedicalRecords: 0,
    totalJobApps: 0,
    totalCertificates: 0
  })

  // Mock AI Data
  const mockAIStats = {
    chatbotQueriesToday: 342,
    chatbotQueryTrend: '+12%',
    speechToTextAccuracy: '94.2%',
    videoCallsCaptionedToday: 89
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // 1. Fetch Users
      const { data: users, error: uError } = await supabase.from('profiles').select('role')
      if (uError) throw uError
      
      const roleDist = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {})

      // 2. Fetch Usage Metrics
      const { count: medCount } = await supabase.from('medical_records').select('*', { count: 'exact', head: true })
      const { count: jobCount } = await supabase.from('job_applications').select('*', { count: 'exact', head: true })
      const { count: certCount } = await supabase.from('certificates').select('*', { count: 'exact', head: true })

      setStats({
        totalUsers: users.length,
        roleDistribution: roleDist,
        totalMedicalRecords: medCount || 0,
        totalJobApps: jobCount || 0,
        totalCertificates: certCount || 0
      })
    } catch (err) {
      console.error("Error fetching admin stats:", err)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-card-sm border border-indigo-50 dark:border-indigo-900/30">
        <div className="w-24 h-24 shrink-0 drop-shadow-xl animate-float">
          <img src={heroAvatar} alt="Admin" className="w-full h-full object-contain" />
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-foreground">Admin Console</h1>
          <p className="text-muted-foreground mt-1 text-lg">System analytics, role management, and AI telemetry.</p>
        </div>
      </div>

      {/* Main Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-indigo-50 dark:border-indigo-900/30 shadow-card-sm hover:shadow-card-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl">
            <div className="p-4 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-indigo-600 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Users</p>
              <h2 className="text-3xl font-black text-foreground">{stats.totalUsers}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-indigo-50 dark:border-indigo-900/30 shadow-card-sm hover:shadow-card-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl">
            <div className="p-4 bg-white dark:bg-slate-900 border border-rose-100 text-rose-500 rounded-2xl shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Records</p>
              <h2 className="text-3xl font-black text-foreground">{stats.totalMedicalRecords}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-50 dark:border-indigo-900/30 shadow-card-sm hover:shadow-card-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl">
            <div className="p-4 bg-white dark:bg-slate-900 border border-blue-100 text-blue-500 rounded-2xl shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Job Apps</p>
              <h2 className="text-3xl font-black text-foreground">{stats.totalJobApps}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-50 dark:border-indigo-900/30 shadow-card-sm hover:shadow-card-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl">
            <div className="p-4 bg-white dark:bg-slate-900 border border-emerald-100 text-emerald-500 rounded-2xl shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Certificates</p>
              <h2 className="text-3xl font-black text-foreground">{stats.totalCertificates}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Role Distribution */}
        <Card className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-border py-4">
            <CardTitle className="text-lg flex items-center gap-2 font-bold">
              <Users className="w-5 h-5 text-indigo-600" /> User Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="space-y-3">
              {Object.entries(stats.roleDistribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-border shadow-sm">
                  <span className="font-bold text-foreground text-sm uppercase tracking-wide">{role}</span>
                  <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 px-4 py-1.5 rounded-full text-sm font-bold border border-indigo-200">{count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-border">
              * Note: Role promotion UI (granting Doctor/Hospital status) is accessible via the Supabase Table Editor for this phase.
            </p>
          </CardContent>
        </Card>

        {/* AI Monitoring Dashboard */}
        <Card className="border-indigo-100 dark:border-indigo-900/50 shadow-card-sm relative overflow-hidden bg-slate-50/50 dark:bg-slate-800/50">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-32 h-32 text-indigo-500" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
              <Sparkles className="w-5 h-5" /> AI Health & Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <MessageSquare className="w-4 h-4" /> <span className="font-semibold text-sm">Bot Queries (24h)</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-indigo-900 dark:text-indigo-100">{mockAIStats.chatbotQueriesToday}</span>
                  <span className="text-sm font-bold text-green-600 mb-1">{mockAIStats.chatbotQueryTrend}</span>
                </div>
              </div>
              
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Mic className="w-4 h-4" /> <span className="font-semibold text-sm">STT Accuracy</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-indigo-900 dark:text-indigo-100">{mockAIStats.speechToTextAccuracy}</span>
                </div>
              </div>
              
              <div className="col-span-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Sparkles className="w-4 h-4" /> <span className="font-semibold text-sm">Live Calls Captioned</span>
                </div>
                <span className="text-xl font-black text-indigo-900 dark:text-indigo-100">{mockAIStats.videoCallsCaptionedToday}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              AI analytics are aggregated. No PII or raw transcripts are persisted.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
