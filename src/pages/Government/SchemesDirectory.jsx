import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'
import { Search, Info, CheckCircle, ExternalLink, BookOpen } from 'lucide-react'

export default function SchemesDirectory() {
  const [schemes, setSchemes] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchSchemes = async () => {
      const { data } = await supabase.from('schemes').select('*').order('name')
      if (data) setSchemes(data)
    }
    fetchSchemes()
  }, [])

  const filteredSchemes = schemes.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="relative bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-border">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search government schemes..." 
          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all outline-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        {filteredSchemes.map(scheme => (
          <Card key={scheme.id} className="overflow-hidden shadow-card-sm hover:shadow-card-md hover:-translate-y-1 transition-all duration-300 border-indigo-50 dark:border-indigo-900/30 group">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-50 dark:border-indigo-900/30 py-5">
              <CardTitle className="text-xl font-black text-indigo-900 dark:text-indigo-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                  <Info className="w-5 h-5" /> 
                </div>
                {scheme.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6 bg-slate-50/30 dark:bg-slate-800/30">
              <p className="text-[17px] leading-relaxed text-foreground/90 font-medium">{scheme.description}</p>
              
              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-border">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-sm group-hover:border-indigo-100 dark:border-indigo-900/50 transition-colors">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-600 flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4" /> Eligibility
                  </h4>
                  <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-300 leading-snug">{scheme.eligibility}</p>
                </div>
                <a 
                  href="https://www.india.gov.in/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-sm group-hover:border-indigo-100 dark:border-indigo-900/50 transition-colors block hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-blue-600 flex items-center gap-2 mb-3">
                    <ExternalLink className="w-4 h-4" /> How to Apply
                  </h4>
                  <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-300 leading-snug">{scheme.how_to_apply}</p>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredSchemes.length === 0 && (
          <div className="text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-border shadow-sm p-16 text-muted-foreground">
             <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <p className="font-bold text-xl text-foreground mb-1">No schemes found</p>
             <p className="text-sm">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  )
}
