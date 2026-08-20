import { Menu } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { useAuth } from '../context/AuthContext'

export function Header({ onMenuClick }) {
  const { profile } = useAuth()

  const firstName = profile?.full_name?.split(' ')[0] || 'User'

  return (
    <header className="h-[72px] border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 animate-fade-in-up">
      {/* Mobile Menu Trigger & Logo */}
      <div className="flex items-center gap-3 md:hidden">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="font-bold text-foreground">
          SignBridge <span className="text-indigo-600">AI</span>
        </div>
      </div>

      {/* Desktop Welcome Message */}
      <div className="hidden md:flex flex-col">
        <h2 className="text-lg font-bold text-foreground">
          Welcome back, {firstName}! 👋
        </h2>
        <p className="text-xs text-muted-foreground">
          Let's bridge communication together.
        </p>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <UserAvatar profile={profile} />
      </div>
    </header>
  )
}
