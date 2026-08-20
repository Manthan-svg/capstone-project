import { Link, Outlet, useLocation } from 'react-router-dom'
import { Building, BookOpen, HeartHandshake, Shield, Sparkles } from 'lucide-react'
import governmentBuilding from '../../assets/government-building.png'

export default function GovernmentShell() {
  const location = useLocation()
  
  const tabs = [
    { name: 'Disability Schemes', path: '/government/schemes', icon: BookOpen },
    { name: 'NGO Directory', path: '/government/ngos', icon: HeartHandshake },
    { name: 'Document Vault', path: '/government/vault', icon: Shield },
    { name: 'AI Assistant', path: '/government/ai', icon: Sparkles },
  ]

  const currentPath = location.pathname === '/government' ? '/government/schemes' : location.pathname

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col gap-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-card-sm border border-indigo-50 dark:border-indigo-900/30">
        <div className="w-24 h-24 shrink-0 drop-shadow-xl animate-float">
          <img src={governmentBuilding} alt="Government & Accessibility" className="w-full h-full object-contain" />
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-foreground">Government & Accessibility</h1>
          <p className="text-muted-foreground mt-1 text-lg">Discover schemes, support organizations, securely store documents, and ask our AI.</p>
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
