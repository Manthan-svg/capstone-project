import { useState, useEffect } from 'react'
import { Sun, Moon, Contrast } from 'lucide-react'
import { cn } from '../lib/utils'

export function ThemeToggle({ className }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'default'
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else if (theme === 'high-contrast') {
      document.documentElement.setAttribute('data-theme', 'high-contrast')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <div className={cn("flex items-center p-1 bg-muted rounded-full border border-border shadow-inner", className)}>
      <button
        onClick={() => setTheme('default')}
        aria-label="Light mode"
        className={cn(
          "p-1.5 rounded-full transition-all duration-200",
          theme === 'default' 
            ? "bg-white dark:bg-slate-900 text-primary shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        aria-label="Dark mode"
        className={cn(
          "p-1.5 rounded-full transition-all duration-200",
          theme === 'dark' 
            ? "bg-slate-800 text-primary shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('high-contrast')}
        aria-label="High contrast mode"
        className={cn(
          "p-1.5 rounded-full transition-all duration-200",
          theme === 'high-contrast' 
            ? "bg-black text-yellow-400 shadow-sm border border-yellow-400" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Contrast className="w-4 h-4" />
      </button>
    </div>
  )
}
