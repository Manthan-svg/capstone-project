import { Link, useLocation } from 'react-router-dom'
import { Home, Heart, Users, BookOpen, Briefcase, Building, Shield, UserPlus } from 'lucide-react'
import { cn } from '../lib/utils'
import { HelpWidget } from './HelpWidget'
import { useAuth } from '../context/AuthContext'

function NavItem({ to, icon: Icon, label, isActive }) {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isActive 
          ? "bg-indigo-50 dark:bg-indigo-900/20 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium" 
          : "hover:bg-muted text-foreground/80 hover:text-foreground"
      )}
    >
      <Icon className={cn(
        "w-5 h-5 transition-colors",
        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
      )} />
      {label}
      {isActive && (
        <div className="absolute left-0 w-1 h-8 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
      )}
    </Link>
  )
}

function RoleBadge({ role }) {
  if (!role || role === 'Deaf User' || role === 'Hearing User') return null;
  
  const colors = {
    Admin: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    Doctor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Hospital: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Employer: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Interpreter: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
  }

  return (
    <div className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ml-auto", colors[role] || "bg-gray-100 text-gray-700")}>
      {role}
    </div>
  )
}

export function Sidebar({ className }) {
  const { profile } = useAuth()
  const location = useLocation()
  
  const isPathActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className={cn("w-[280px] border-r border-border bg-card flex-col hidden md:flex h-full", className)}>
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <span className="text-white font-bold text-lg leading-none">✨</span>
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            SignBridge <span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </h1>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-hide">
        {/* Role Specific Portals */}
        {profile?.role && (() => {
          const rawRole = profile.role.trim();
          // Title Case normalization just in case
          const normalizedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
          
          if (['Admin', 'Doctor', 'Hospital', 'Employer', 'Interpreter'].includes(normalizedRole)) {
            return (
              <div className="mb-6 space-y-1">
                <Link 
                  to={`/${normalizedRole.toLowerCase()}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {normalizedRole === 'Admin' && <Shield className="w-5 h-5" />}
                  {normalizedRole === 'Doctor' && <Heart className="w-5 h-5" />}
                  {normalizedRole === 'Hospital' && <Building className="w-5 h-5" />}
                  {normalizedRole === 'Employer' && <Briefcase className="w-5 h-5" />}
                  {normalizedRole === 'Interpreter' && <UserPlus className="w-5 h-5" />}
                  <span className="font-medium">{normalizedRole} Portal</span>
                </Link>
              </div>
            );
          }
          return null;
        })()}

        {/* Main Navigation */}
        <NavItem to="/" icon={Home} label="Home" isActive={isPathActive('/')} />
        <NavItem to="/healthcare" icon={Heart} label="Healthcare" isActive={isPathActive('/healthcare')} />
        <NavItem to="/community" icon={Users} label="Community" isActive={isPathActive('/community')} />
        <NavItem to="/learning" icon={BookOpen} label="Learning Hub" isActive={isPathActive('/learning')} />
        <NavItem to="/jobs" icon={Briefcase} label="Jobs" isActive={isPathActive('/jobs')} />
        <NavItem to="/government" icon={Building} label="Government" isActive={isPathActive('/government')} />
        
        <div className="mt-8 mb-4">
          <div className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            OTHER
          </div>
          <NavItem to="/enroll" icon={UserPlus} label="Sign Enrollment" isActive={isPathActive('/enroll')} />
        </div>
      </div>

      <div className="p-4 mt-auto">
        <HelpWidget />
      </div>
    </aside>
  )
}
