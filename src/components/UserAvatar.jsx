import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

export function UserAvatar({ profile, className }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!profile) return null

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U'

  // Deterministic color based on name string length for variety
  const colors = [
    'bg-indigo-500 text-white',
    'bg-purple-500 text-white',
    'bg-blue-500 text-white',
    'bg-emerald-500 text-white',
    'bg-rose-500 text-white',
    'bg-amber-500 text-white'
  ]
  const colorIndex = profile.full_name ? profile.full_name.length % colors.length : 0
  const colorClass = colors[colorIndex]

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border"
      >
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm", colorClass)}>
          {initials}
        </div>
        <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">
          {profile.full_name || 'User'}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl border border-border shadow-card-lg py-2 z-50 animate-scale-in origin-top-right">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.role}</p>
          </div>
          <div className="p-2 space-y-1">
            <Link 
              to="/community/profile" 
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4 text-muted-foreground" />
              Profile
            </Link>
            <button 
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground transition-colors cursor-not-allowed opacity-50"
              disabled
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              Settings
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors mt-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
