import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Briefcase, Building, MapPin, Users, Award, Download, CheckCircle, XCircle } from 'lucide-react'
import briefcase3d from '../assets/briefcase-3d.png'

export default function EmployerDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('postings') // postings, create
  
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  
  // New Job Form
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [type, setType] = useState('Job')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchJobsAndApplications()
  }, [])

  const fetchJobsAndApplications = async () => {
    const { data: jobsData } = await supabase.from('job_listings').select('*').eq('employer_id', user.id).order('created_at', { ascending: false })
    if (jobsData) setJobs(jobsData)

    if (jobsData && jobsData.length > 0) {
      const jobIds = jobsData.map(j => j.id)
      const { data: appsData, error: appsError } = await supabase
        .from('job_applications')
        .select('*')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
      
      if (appsError) console.error("Error fetching applications:", appsError)
      if (appsData) setApplications(appsData)
    }
  }

  const handleCreateJob = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { error } = await supabase.from('job_listings').insert({
      employer_id: user.id,
      title, company, type, location, description
    })
    setIsSubmitting(false)
    
    if (error) {
      alert("Error posting job: " + error.message)
    } else {
      alert("Job posted successfully!")
      setTitle(''); setCompany(''); setLocation(''); setDescription(''); setType('Job');
      setActiveTab('postings')
      fetchJobsAndApplications()
    }
  }

  const updateAppStatus = async (appId, status) => {
    await supabase.from('job_applications').update({ status }).eq('id', appId)
    fetchJobsAndApplications()
  }

  const awardBadge = async (applicantId, badgeName) => {
    const { error } = await supabase.from('skill_badges').insert({
      user_id: applicantId,
      badge_name: badgeName,
      awarded_by: user.id
    })
    if (error) {
      alert(error.message.includes('unique') ? "User already has this badge." : "Error awarding badge.")
    } else {
      alert(`Awarded "${badgeName}" badge successfully!`)
    }
  }

  const getResumeUrl = async (path) => {
    if (!path) return null
    const { data } = await supabase.storage.from('resumes').createSignedUrl(path, 60)
    return data?.signedUrl
  }

  const downloadResume = async (path) => {
    if (!path) return
    let realPath = path
    if (path.includes(':::')) {
      realPath = path.split(':::')[0]
    }
    if (realPath === 'none') return
    const url = await getResumeUrl(realPath)
    if (url) window.open(url, '_blank')
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-card-sm border border-indigo-50 dark:border-indigo-900/30">
        <div className="w-24 h-24 shrink-0 drop-shadow-xl animate-float">
          <img src={briefcase3d} alt="Employer" className="w-full h-full object-contain" />
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-foreground">Employer Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage job postings, review applicants, and award credentials.</p>
        </div>
      </div>

      <div className="flex gap-3 mb-8 border-b border-border pb-4 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('postings')} 
          className={`px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-300 border border-transparent shadow-sm ${activeTab === 'postings' ? 'bg-indigo-600 text-white shadow-md border-indigo-500 transform scale-105' : 'bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:bg-slate-800/50 hover:text-foreground border-slate-200 dark:border-slate-700'}`}
        >
          <Briefcase className="w-4 h-4" /> My Postings & Applicants
        </button>
        <button 
          onClick={() => setActiveTab('create')} 
          className={`px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-300 border border-transparent shadow-sm ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow-md border-indigo-500 transform scale-105' : 'bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:bg-slate-800/50 hover:text-foreground border-slate-200 dark:border-slate-700'}`}
        >
          <CheckCircle className="w-4 h-4" /> Post New Listing
        </button>
      </div>

      <div className="flex-1 overflow-auto pb-8">
        {activeTab === 'create' && (
          <Card className="max-w-2xl mx-auto shadow-card-sm border-indigo-50 dark:border-indigo-900/30">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-border py-4 rounded-t-xl">
              <CardTitle className="text-lg font-bold">Create a New Listing</CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl">
              <form onSubmit={handleCreateJob} className="space-y-5">
                <FormField label="Job Title" id="title" required value={title} onChange={e => setTitle(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Company Name" id="company" required value={company} onChange={e => setCompany(e.target.value)} />
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">Type</label>
                    <select className="flex h-11 w-full rounded-xl border border-input bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={type} onChange={e => setType(e.target.value)}>
                      <option value="Job">Job</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>
                <FormField label="Location" id="location" required value={location} onChange={e => setLocation(e.target.value)} />
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Description</label>
                  <textarea required className="flex w-full rounded-xl border border-input bg-white dark:bg-slate-900 px-4 py-3 text-sm min-h-[150px] shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-base">
                  {isSubmitting ? 'Posting...' : 'Post Listing'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'postings' && (
          <div className="space-y-8">
            {jobs.length === 0 ? (
              <p className="text-muted-foreground text-center p-8">You haven't posted any jobs yet.</p>
            ) : (
              jobs.map(job => {
                const jobApps = applications.filter(a => a.job_id === job.id)
                return (
                  <Card key={job.id} className="overflow-hidden shadow-card-sm border-indigo-50 dark:border-indigo-900/30">
                    <CardHeader className="bg-white dark:bg-slate-900 py-5 border-b border-border">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                        <div>
                          <CardTitle className="text-xl mb-2 font-bold text-foreground">{job.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-indigo-400"/> {job.company}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-400"/> {job.location}</span>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 rounded-full text-xs uppercase tracking-wider">{job.type}</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-border">
                          <p className="text-2xl font-black text-indigo-600">{jobApps.length}</p>
                          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Applicants</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-slate-50/50 dark:bg-slate-800/50">
                      {jobApps.length === 0 ? (
                        <p className="p-8 text-center text-muted-foreground font-medium">No applications yet.</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {jobApps.map(app => {
                              let realName = app.profiles?.full_name || 'Unknown Applicant'
                              let realResumePath = app.resume_path
                              if (app.resume_path && app.resume_path.includes(':::')) {
                                const parts = app.resume_path.split(':::')
                                realResumePath = parts[0] === 'none' ? null : parts[0]
                                realName = parts[1] || realName
                              }
                              
                              return (
                                <div key={app.id} className="p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between hover:bg-white dark:bg-slate-900 transition-colors">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                                      <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-lg text-foreground">{realName}</p>
                                      <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border shadow-sm ${
                                          app.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                          app.status === 'Reviewed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                          app.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'
                                        }`}>
                                          {app.status}
                                        </span>
                                        {realResumePath && (
                                          <Button variant="outline" size="sm" onClick={() => downloadResume(app.resume_path)} className="h-7 text-xs rounded-lg shadow-sm">
                                            <Download className="w-3 h-3 mr-1" /> Resume
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                              
                              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                                {(app.status === 'Pending' || app.status === 'Reviewed') && (
                                  <div className="flex flex-col gap-2 w-full sm:w-auto sm:border-r pr-4 border-border">
                                    <Button size="sm" variant="outline" onClick={() => updateAppStatus(app.id, 'Reviewed')} className={`rounded-lg shadow-sm ${app.status === 'Reviewed' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 text-indigo-700' : ''}`}>Mark Reviewed</Button>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" className="flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 rounded-lg shadow-sm" onClick={() => updateAppStatus(app.id, 'Accepted')}><CheckCircle className="w-4 h-4 mr-1"/> Accept</Button>
                                      <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg shadow-sm" onClick={() => updateAppStatus(app.id, 'Rejected')}><XCircle className="w-4 h-4 mr-1"/> Reject</Button>
                                    </div>
                                  </div>
                                )}
                                <div className="flex flex-col gap-2 w-full sm:w-auto">
                                  <span className="text-xs font-bold text-muted-foreground uppercase mb-1">Award Badges</span>
                                  <Button size="sm" variant="secondary" onClick={() => awardBadge(app.user_id, 'Verified Communicator')} className="text-xs h-8 rounded-lg shadow-sm">
                                    <Award className="w-3.5 h-3.5 mr-1 text-amber-500" /> Verified Communicator
                                  </Button>
                                  <Button size="sm" variant="secondary" onClick={() => awardBadge(app.user_id, 'Technical Excellence')} className="text-xs h-8 rounded-lg shadow-sm">
                                    <Award className="w-3.5 h-3.5 mr-1 text-blue-500" /> Technical Excellence
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )})}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
