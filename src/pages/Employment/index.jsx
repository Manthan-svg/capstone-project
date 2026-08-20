import { Link, Outlet, useLocation } from 'react-router-dom'
import { Briefcase, FileText, Send } from 'lucide-react'
import briefcaseImage from '../../assets/briefcase-3d.png'

export default function EmploymentShell() {
  const location = useLocation()
  
  const tabs = [
    { name: 'Job Board', path: '/jobs/board', icon: Briefcase },
    { name: 'My Applications', path: '/jobs/applications', icon: Send },
    { name: 'Resume Builder', path: '/jobs/resume', icon: FileText },
  ]

  const currentPath = location.pathname === '/jobs' ? '/jobs/board' : location.pathname

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col gap-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-card-sm border border-indigo-50 dark:border-indigo-900/30">
        <div className="w-24 h-24 shrink-0 drop-shadow-xl animate-float">
          <img src={briefcaseImage} alt="Employment Support" className="w-full h-full object-contain" />
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-foreground">Employment Support</h1>
          <p className="text-muted-foreground mt-1 text-lg">Find jobs, track applications, and build your professional resume.</p>
        </div>
      </div>

      <div className="flex gap-3 pb-2 overflow-x-auto scrollbar-hide w-full border-b border-border">
        {tabs.map(tab => {
          const isActive = currentPath.startsWith(tab.path)
          const activeStyle = "bg-indigo-600 text-white shadow-md border-indigo-500 transform scale-105"
          const inactiveStyle = "bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:bg-slate-800/50 hover:text-foreground border-slate-200 dark:border-slate-700"
          
          return (
            <Link 
              key={tab.path} 
              to={tab.path}
              className={`px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-300 flex-shrink-0 border border-transparent shadow-sm ${isActive ? activeStyle : inactiveStyle}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </Link>
          )
        })}
      </div>

      <div className="flex-1 overflow-auto pb-8">
        <Outlet />
      </div>
    </div>
  )
}
