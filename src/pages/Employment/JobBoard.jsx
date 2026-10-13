import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Briefcase, Building, MapPin, Search, CheckCircle, FileText } from 'lucide-react'

export default function JobBoard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All') // All, Job, Internship
  const [hasSavedResume, setHasSavedResume] = useState(false)
  const [isApplying, setIsApplying] = useState(null)

  useEffect(() => {
    fetchJobs()
    checkResume()
  }, [])

  const fetchJobs = async () => {
    const { data: jData } = await supabase.from('job_listings').select('*').order('created_at', { ascending: false })
    if (jData) setJobs(jData)

    const { data: aData } = await supabase.from('job_applications').select('*').eq('user_id', user.id)
    if (aData) setApplications(aData)
  }

  const checkResume = async () => {
    // Check if the user has a resume.pdf in their folder
    const { data } = await supabase.storage.from('resumes').list(user.id, { search: 'resume.pdf' })
    if (data && data.length > 0) {
      setHasSavedResume(true)
    }
  }

  const handleApply = async (jobId, attachResume) => {
    setIsApplying(jobId)
    const baseResumePath = attachResume && hasSavedResume ? `${user.id}/resume.pdf` : 'none'
    const userName = user?.user_metadata?.full_name || 'Applicant'
    const hackPath = `${baseResumePath}:::${userName}`
    
    const { error } = await supabase.from('job_applications').insert({
      job_id: jobId,
      user_id: user.id,
      resume_path: hackPath
    })
    
    setIsApplying(null)
    if (error) {
      alert("Error applying: " + error.message)
    } else {
      alert("Application submitted successfully!")
      fetchJobs() // refresh applications
    }
  }

  const formatIndianLocation = (rawLoc) => {
    if (!rawLoc) return 'Pune, Maharashtra (India)'
    const trimmed = rawLoc.trim()
    const lower = trimmed.toLowerCase()
    if (lower === 'usa' || lower === 'united states' || lower.includes('washington') || lower.includes('new york') || lower.includes('texas') || lower.includes('chicago')) {
      return 'Pune, Maharashtra (India)'
    }
    if (!lower.includes('india') && !lower.includes('remote') && !lower.includes('pune') && !lower.includes('mumbai') && !lower.includes('bengaluru')) {
      return `${trimmed}, India`
    }
    return trimmed
  }

  const [locationFilter, setLocationFilter] = useState('All')

  const filteredJobs = jobs.map(j => ({
    ...j,
    location: formatIndianLocation(j.location)
  })).filter(job => {
    const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'All' || job.type === filterType
    const matchLocation = locationFilter === 'All' || 
      (locationFilter === 'Pune' && job.location.toLowerCase().includes('pune')) ||
      (locationFilter === 'Mumbai' && job.location.toLowerCase().includes('mumbai')) ||
      (locationFilter === 'Bengaluru' && job.location.toLowerCase().includes('bengaluru')) ||
      (locationFilter === 'Remote' && job.location.toLowerCase().includes('remote'))
    return matchSearch && matchType && matchLocation
  })

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🇮🇳</span>
            <h2 className="text-2xl font-black text-foreground">Inclusive Employment & Careers (India)</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Equal-opportunity employment and internships across Indian tech hubs tailored for deaf and hard-of-hearing professionals.
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 self-start md:self-auto shrink-0">
          ✓ Verified Indian Employers Only
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-border space-y-3">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search roles, companies, or Indian cities (Pune, Mumbai, Bengaluru)..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20 text-sm cursor-pointer outline-none transition-all"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Job">Full-time Jobs</option>
            <option value="Internship">Internships</option>
          </select>
        </div>

        {/* Location Filter Pills */}
        <div className="flex gap-2 pt-1 flex-wrap items-center">
          <span className="text-xs font-bold text-muted-foreground mr-1">Location:</span>
          {['All', 'Pune', 'Mumbai', 'Bengaluru', 'Remote'].map(loc => (
            <button
              key={loc}
              onClick={() => setLocationFilter(loc)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                locationFilter === loc 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
              }`}
            >
              {loc === 'All' ? 'All India' : loc}
            </button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="grid gap-6">
        {filteredJobs.length === 0 ? (
          <div className="text-center p-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-dashed border-border text-muted-foreground">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-foreground">No matching listings found.</p>
            <p className="text-sm mt-1">Try adjusting your search filters.</p>
          </div>
        ) : (
          filteredJobs.map(job => {
            const hasApplied = applications.some(a => a.job_id === job.id)
            
            return (
              <Card key={job.id} className="transition-all duration-300 hover:shadow-card-md border-indigo-50 dark:border-indigo-900/30 shadow-card-sm overflow-hidden group">
                <CardContent className="p-8 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center bg-gradient-to-r from-white to-slate-50/50">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm border ${job.type === 'Internship' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 border-indigo-200'}`}>
                        {job.type}
                      </span>
                      <span className="text-xs text-muted-foreground font-bold flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-border shadow-sm">
                        <MapPin className="w-3.5 h-3.5 text-red-500" /> {job.location}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-900">
                        🇮🇳 India
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-foreground group-hover:text-indigo-600 transition-colors">{job.title}</h2>
                    <p className="text-[17px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Building className="w-5 h-5 text-slate-400" /> {job.company}
                    </p>
                    <p className="text-foreground/70 mt-4 leading-relaxed text-[15px]">{job.description}</p>
                  </div>
                  
                  <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
                    {hasApplied ? (
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-6 text-center flex flex-col items-center shadow-sm">
                        <CheckCircle className="w-10 h-10 mb-3 text-emerald-500" />
                        <span className="font-black text-lg">Application Submitted</span>
                        <span className="text-sm font-semibold mt-1 opacity-80">Track in My Applications</span>
                      </div>
                    ) : (
                      <div className="space-y-3 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -z-10 opacity-50"></div>
                        <Button 
                          className="w-full h-12 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-transform active:scale-95" 
                          disabled={isApplying === job.id}
                          onClick={() => handleApply(job.id, false)}
                        >
                          Apply with Profile
                        </Button>
                        
                        {hasSavedResume ? (
                          <Button 
                            variant="secondary" 
                            className="w-full text-[13px] h-12 rounded-xl font-bold border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 shadow-sm transition-transform active:scale-95" 
                            disabled={isApplying === job.id}
                            onClick={() => handleApply(job.id, true)}
                          >
                            <FileText className="w-4 h-4 mr-2" /> Apply with Resume PDF
                          </Button>
                        ) : (
                          <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                             <p className="text-[11px] font-medium text-center text-slate-500 dark:text-slate-400 px-2 leading-tight">
                               Generate a resume in the <span className="font-bold text-indigo-600">Resume Builder</span> tab to attach PDFs to applications.
                             </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
