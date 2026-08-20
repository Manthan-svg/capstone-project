import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Send, MapPin, Building, Calendar, FileText } from 'lucide-react'

export default function MyApplications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    const { data } = await supabase
      .from('job_applications')
      .select('*, job_listings(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) setApplications(data)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center mb-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-card-sm border border-indigo-50 dark:border-indigo-900/30">
        <h2 className="text-3xl font-bold text-foreground mb-2">My Applications</h2>
        <p className="text-lg text-muted-foreground">Track the status of your submitted job and internship applications.</p>
      </div>

      {applications.length === 0 ? (
        <Card className="bg-slate-50/50 dark:bg-slate-800/50 border-dashed border-2 border-border shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
              <Send className="w-12 h-12 text-slate-300" />
            </div>
            <p className="font-bold text-xl text-foreground mb-2">No applications yet.</p>
            <p className="text-base max-w-sm">Head over to the Job Board to start applying!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {applications.map(app => (
            <Card key={app.id} className="overflow-hidden border-indigo-50 dark:border-indigo-900/30 shadow-card-sm transition-all hover:shadow-card-md">
              <CardContent className="p-0 flex flex-col sm:flex-row bg-white dark:bg-slate-900">
                <div className="flex-1 p-8 space-y-5">
                  <div>
                    <h3 className="text-2xl font-black text-foreground">{app.job_listings.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-bold flex flex-wrap items-center gap-3 mt-2 text-[15px]">
                      <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-slate-400" /> {app.job_listings.company}</span>
                      <span className="text-border hidden sm:inline">|</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {app.job_listings.location}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm font-semibold text-muted-foreground bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4 rounded-xl w-fit">
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-indigo-600" /></div>
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </span>
                    {app.resume_path && (
                      <span className="flex items-center gap-2 text-indigo-700">
                        <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-indigo-600" /></div>
                        PDF Attached
                      </span>
                    )}
                  </div>
                </div>

                <div className={`sm:w-56 p-8 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-border/50 ${
                  app.status === 'Pending' ? 'bg-amber-50/50' :
                  app.status === 'Reviewed' ? 'bg-blue-50/50' :
                  app.status === 'Accepted' ? 'bg-emerald-50/50' : 'bg-rose-50/50'
                }`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400">Application Status</p>
                  <div className={`px-4 py-2 rounded-xl text-center shadow-sm w-full font-black uppercase tracking-wider text-sm ${
                    app.status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    app.status === 'Reviewed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    app.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {app.status}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
