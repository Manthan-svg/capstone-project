import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'
import { Search, HeartHandshake, MapPin, Phone, Target, ExternalLink } from 'lucide-react'

const INITIAL_NGOS = [
  {
    id: 'ngo-1',
    name: 'Ali Yavar Jung National Institute of Speech and Hearing Disabilities (AYJNISHD)',
    description: 'Apex national autonomous institute under DEPwD providing clinical diagnosis, speech therapy, cochlear implant rehabilitation, and ISL interpreter courses.',
    focus_area: 'Healthcare, Audiology & Higher Education',
    location: 'Bandra West, Mumbai, Maharashtra',
    contact_info: '022-2640-0211 | ayjnihh-mum@nic.in'
  },
  {
    id: 'ngo-2',
    name: 'National Association of the Deaf (NAD) - Maharashtra',
    description: 'Premier deaf-led organization working for legal advocacy, rights under RPwD Act 2016, and promoting Indian Sign Language recognition across Maharashtra.',
    focus_area: 'Advocacy & Legal Rights',
    location: 'Dadar West, Mumbai, Maharashtra',
    contact_info: 'nad.maharashtra@nadindia.org | 98110-12345 (Text/WhatsApp)'
  },
  {
    id: 'ngo-3',
    name: 'Deaf Enabled Foundation (DEF)',
    description: 'Empowering deaf youth through vocational computer training, English literacy, mobile apps, and job placement assistance across Maharashtra.',
    focus_area: 'Skill Training & Employment',
    location: 'Shivaji Nagar, Pune & Vashi, Navi Mumbai',
    contact_info: 'contact@def.org.in | 020-2565-1122'
  },
  {
    id: 'ngo-4',
    name: 'All India Federation of the Deaf (AIFD) - Western Outreach',
    description: 'National federation uniting regional deaf welfare associations, organizing cultural conferences, and providing matrimonial and vocational support.',
    focus_area: 'Community Welfare & Culture',
    location: 'Fort, Mumbai, Maharashtra',
    contact_info: 'aifd.west@deafindia.org | 022-2261-4400'
  },
  {
    id: 'ngo-5',
    name: 'Yuva Deaf Association',
    description: 'Youth-focused community group organizing ISL workshops, deaf sports leagues, accessible tech hackathons, and youth leadership mentorship.',
    focus_area: 'Youth Leadership & Sports',
    location: 'Kothrud, Pune, Maharashtra',
    contact_info: 'yuvadeaf.pune@gmail.com | 98901-23456 (Video Call)'
  },
  {
    id: 'ngo-6',
    name: 'v-shesh Learning & Accessibility Services',
    description: 'Award-winning impact enterprise training and placing educated deaf professionals into top banking, technology, and corporate careers.',
    focus_area: 'Corporate Inclusion & Jobs',
    location: 'Vashi, Navi Mumbai, Maharashtra',
    contact_info: 'contact@v-shesh.com | 022-4972-8800'
  },
  {
    id: 'ngo-7',
    name: 'SignBridge Foundation',
    description: 'Our dedicated technology foundation offering free ISL AI communication tools, digital literacy bootcamps, and emergency sign translation for deaf citizens.',
    focus_area: 'AI Assistive Tech & Education',
    location: 'Hinjawadi, Pune, Maharashtra',
    contact_info: 'foundation@signbridge.ai | signbridge.ai'
  }
]

export default function NGODirectory() {
  const [ngos, setNgos] = useState(INITIAL_NGOS)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        const { data } = await supabase.from('ngos').select('*').order('name')
        if (data && data.length > 0) {
          const dbMap = new Map(data.map(d => [d.name.toLowerCase().trim(), d]))
          const merged = INITIAL_NGOS.map(n => dbMap.get(n.name.toLowerCase().trim()) || n)
          data.forEach(d => {
            if (!INITIAL_NGOS.some(n => n.name.toLowerCase().trim() === d.name.toLowerCase().trim())) {
              merged.push(d)
            }
          })
          setNgos(merged)
        }
      } catch (err) {
        console.warn("Could not load NGOs from supabase, using offline fallback:", err)
      }
    }
    fetchNgos()
  }, [])

  const filteredNgos = ngos.filter(n => 
    n.name.toLowerCase().includes(search.toLowerCase()) || 
    n.focus_area.toLowerCase().includes(search.toLowerCase()) ||
    n.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-border">
        <h2 className="text-2xl font-black text-foreground">Deaf Welfare & NGO Support Directory</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect with trusted non-governmental organizations, institutes, and advocacy groups supporting the deaf community across Maharashtra and India.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-border">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by NGO name, focus area, or city (e.g. Mumbai, Pune, Advocacy, Audiology)..." 
          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all outline-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* NGO Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredNgos.map(ngo => (
          <Card key={ngo.id} className="shadow-card-sm hover:shadow-card-md transition-all duration-300 flex flex-col border-indigo-50 dark:border-indigo-900/30 group hover:-translate-y-1">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-border/50 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900">
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
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 rounded-lg text-xs font-bold shadow-sm">
                    <Target className="w-3.5 h-3.5" /> {ngo.focus_area}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {ngo.location}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-dashed border-border flex items-center justify-between">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact</span>
                 <div className="flex items-center gap-2 text-[14px] font-bold text-indigo-900 dark:text-indigo-100 bg-indigo-50 dark:bg-indigo-900/20 px-3.5 py-2 rounded-xl truncate max-w-[280px]">
                   <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                   <span className="truncate">{ngo.contact_info}</span>
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
