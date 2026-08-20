import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'
import supportImg from '../assets/support-headphones.png'

export function HelpWidget({ className }) {
  return (
    <div className={cn("p-4 rounded-xl bg-card border border-indigo-100 dark:border-indigo-900/50 shadow-card-md relative overflow-hidden group animate-fade-in-up", className)}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-transparent rounded-bl-full opacity-50 -z-10" />
      
      <div className="flex flex-col gap-3">
        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center p-2 mb-1 group-hover:scale-110 transition-transform">
          <img src={supportImg} alt="Support" className="w-full h-full object-contain" />
        </div>
        
        <div>
          <h4 className="font-semibold text-foreground text-sm">Need help?</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Check our guide or contact <a href="#" className="text-indigo-600 hover:underline">support</a>.
          </p>
        </div>
        
        <button className="mt-2 w-full py-2 px-4 bg-white dark:bg-slate-900 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-50 dark:bg-indigo-900/20 hover:border-indigo-300 transition-all shadow-sm">
          Get Help
        </button>
      </div>
    </div>
  )
}
