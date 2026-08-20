import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Button = forwardRef(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background'
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95 transition-all',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 active:scale-95 transition-all',
    outline: 'border-2 border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 font-bold active:scale-95 transition-all',
    ghost: 'hover:bg-slate-100 dark:bg-slate-800 hover:text-foreground text-foreground active:scale-95 transition-all',
  }
  
  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10',
  }

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { Button }
