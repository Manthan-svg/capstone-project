import { forwardRef, useId } from 'react'
import { cn } from '../../lib/utils'

const FormField = forwardRef(({ label, error, className, ...props }, ref) => {
  const id = useId()
  return (
    <div className={cn("grid w-full max-w-sm items-center gap-1.5", className)}>
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          "flex w-full rounded-xl border border-input bg-white dark:bg-slate-900 px-4 py-3 text-[15px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          error && "border-rose-500 focus-visible:ring-rose-500/20 focus-visible:border-rose-500"
        )}
        {...props}
      />
      {error && (
        <p className="text-sm font-medium text-red-500">{error}</p>
      )}
    </div>
  )
})
FormField.displayName = "FormField"

export { FormField }
