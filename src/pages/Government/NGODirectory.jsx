import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'
import { Search, HeartHandshake, MapPin, Phone, Target } from 'lucide-react'

export default function NGODirectory() {
  const [ngos, setNgos] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchNgos = async () => {
      const { data } = await supabase.from('ngos').select('*').order('name')
      if (data) setNgos(data)
    }
    fetchNgos()
  }, [])

  const filteredNgos = ngos.filter(n => 
    n.name.toLowerCase().includes(search.toLowerCase()) || 
    n.focus_area.toLowerCase().includes(search.toLowerCase()) ||
    n.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="relative bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-border">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by NGO name, focus area, or location..." 
          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all outline-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredNgos.map(ngo => (
          <Card key={ngo.id} className="shadow-card-sm hover:shadow-card-md transition-all duration-300 flex flex-col border-indigo-50 dark:border-indigo-900/30 group hover:-translate-y-1">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-border/50 bg-gradient-to-br from-white to-slate-50/50">
              <CardTitle className="text-xl font-black text-foreground group-hover:text-indigo-600 transition-colors flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                {ngo.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
              <div className="space-y-4 mb-6">
                <p className="text-foreground/80 leading-relaxed font-medium text-[15px]">{ngo.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold shadow-sm">
                    <Target className="w-3.5 h-3.5" /> {ngo.focus_area}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {ngo.location}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-dashed border-border flex items-center justify-between">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact</span>
                 <div className="flex items-center gap-2 text-[15px] font-bold text-indigo-900 dark:text-indigo-100 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl">
                   <Phone className="w-4 h-4 text-indigo-500" /> {ngo.contact_info}
                 </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredNgos.length === 0 && (
          <div className="col-span-full text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-border shadow-sm p-16 text-muted-foreground">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="font-bold text-xl text-foreground mb-1">No organizations found</p>
            <p className="text-sm">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  )
}
