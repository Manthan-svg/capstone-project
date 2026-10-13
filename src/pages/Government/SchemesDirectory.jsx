import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { 
  Search, 
  Info, 
  CheckCircle, 
  ExternalLink, 
  BookOpen, 
  Building2, 
  Sparkles, 
  GraduationCap, 
  Ear, 
  Briefcase, 
  Award,
  Globe
} from 'lucide-react'

// Official Government Portals for Quick Access
const OFFICIAL_PORTALS = [
  {
    name: 'Maharashtra Divyang Sahayak',
    domain: 'divyangsahayak.maharashtra.gov.in',
    url: 'https://divyangsahayak.maharashtra.gov.in/',
    description: 'Official Maharashtra Disability Welfare & Schemes Portal',
    badge: 'State Portal'
  },
  {
    name: 'MahaDBT Scholarship Portal',
    domain: 'mahadbt.maharashtra.gov.in',
    url: 'https://mahadbt.maharashtra.gov.in/',
    description: 'Direct Benefit Transfer for Maharashtra Pre & Post-Matric Scholarships',
    badge: 'MahaDBT'
  },
  {
    name: 'Central ADIP & ARJUN Portal',
    domain: 'adip.depwd.gov.in',
    url: 'https://adip.depwd.gov.in/',
    description: 'Free Digital Hearing Aids & Cochlear Implant Nominations',
    badge: 'Central Scheme'
  },
  {
    name: 'UDID Swavlamban Portal',
    domain: 'swavlambancard.gov.in',
    url: 'https://www.swavlambancard.gov.in/',
    description: 'Unique Disability Identity Card (National Swavlamban ID)',
    badge: 'National ID'
  },
  {
    name: 'National Scholarship Portal',
    domain: 'scholarships.gov.in',
    url: 'https://scholarships.gov.in/',
    description: 'Central Disability Pre-Matric, Post-Matric & Top Class Scholarships',
    badge: 'NSP Central'
  }
]

// Complete List of Government Schemes (Extracted from official DEPwD and Maharashtra Divyang Sahayak portals)
const INITIAL_SCHEMES = [
  // --- A. MAHARASHTRA GOVERNMENT SCHEMES ---
  {
    id: 'mh-1',
    name: 'State Pre-Matric Scholarship for Disabled Persons',
    category: 'Maharashtra State',
    type: 'Scholarships & Education',
    description: 'Maharashtra State educational financial assistance and stipend for school students with speech, hearing, and other benchmark disabilities from Class 1 to 10.',
    eligibility: 'Maharashtra domicile; minimum 40% certified benchmark disability; enrolled in recognized government or aided school; family income within state guidelines.',
    how_to_apply: 'Apply online via the Aaple Sarkar MahaDBT portal under the Social Justice & Special Assistance Department.',
    apply_url: 'https://mahadbt.maharashtra.gov.in/'
  },
  {
    id: 'mh-2',
    name: 'State Post-Matric Scholarship for Disabled Persons',
    category: 'Maharashtra State',
    type: 'Scholarships & Education',
    description: 'Maharashtra State scholarship providing tuition fee reimbursement and monthly maintenance allowances for students pursuing higher secondary, degree, diploma, and post-graduate education.',
    eligibility: 'Students studying post-Class 10 in recognized Maharashtra colleges and universities; certified 40%+ disability; valid UDID card; family income up to ₹2.5 Lakhs/year.',
    how_to_apply: 'Apply online on the MahaDBT portal. Submit college fee receipts, previous marksheets, and UDID certificate.',
    apply_url: 'https://mahadbt.maharashtra.gov.in/'
  },
  {
    id: 'mh-3',
    name: 'Merit Awards for Disabled Students (गुणवंत दिव्यांग विद्यार्थी पुरस्कार)',
    category: 'Maharashtra State',
    type: 'Awards & Incentives',
    description: 'Cash awards and state commendation certificates recognizing outstanding academic excellence for disabled students achieving top ranks in SSC, HSC, and university examinations in Maharashtra.',
    eligibility: 'Hearing and speech-impaired students who scored distinction/merit in Maharashtra State Board SSC (10th) or HSC (12th) examinations.',
    how_to_apply: 'Applications are submitted through the school or college principal to the District Social Welfare Officer (Zilla Parishad).',
    apply_url: 'https://depwd.maharashtra.gov.in/'
  },
  {
    id: 'mh-4',
    name: 'Financial Assistance for Self-Employment to Trained Disabled Persons',
    category: 'Maharashtra State',
    type: 'Self-Employment & Loans',
    description: 'Specialized equipment grants, vocational toolkits, and financial subsidies for disabled persons who have completed vocational or technical training to establish their own business or workshop.',
    eligibility: 'Age between 18 and 50 years; completed recognized technical or vocational trade course; 40%+ hearing/speech disability; resident of Maharashtra.',
    how_to_apply: 'Submit application with vocational training certificate to the District Disability Rehabilitation Centre (DDRC) or the District Social Welfare Office.',
    apply_url: 'https://depwd.maharashtra.gov.in/'
  },
  {
    id: 'mh-5',
    name: 'Financial Assistance to Disabled Persons for Self-Employment (Seed Capital)',
    category: 'Maharashtra State',
    type: 'Self-Employment & Loans',
    description: 'Subsidized low-interest seed capital loans and financial assistance to help deaf and speech-disabled individuals set up kiosks, repair shops, computer centers, and small enterprise ventures.',
    eligibility: 'Resident of Maharashtra; age 18 to 55; minimum 40% disability; registered with the local Employment Exchange / Divyang Sahayak portal.',
    how_to_apply: 'Apply online through the Maharashtra State Divyang Finance and Development Corporation (MSDFDC) portal or via the District Social Welfare Office.',
    apply_url: 'https://divyangsahayak.maharashtra.gov.in/'
  },
  {
    id: 'mh-6',
    name: 'Financial Assistance for Aids and Appliances for Disabled Persons (State Scheme)',
    category: 'Maharashtra State',
    type: 'Aids & Hearing Devices',
    description: 'Free distribution and financial grants toward assistive equipment including digital hearing aids, vibrating alarm alerts, and communication devices for hearing-impaired residents.',
    eligibility: 'Maharashtra resident; certified hearing/speech impairment of 40% or more; family income within state poverty criteria.',
    how_to_apply: 'Apply via the Divyang Sahayak portal or attend medical assessment camps organized by Zilla Parishad.',
    apply_url: 'https://divyangsahayak.maharashtra.gov.in/site/new-schemes'
  },
  {
    id: 'mh-7',
    name: 'Matrimonial Incentives for Persons with Disabilities (विवाह प्रोत्साहन योजना)',
    category: 'Maharashtra State',
    type: 'Awards & Incentives',
    description: 'A one-time financial grant of ₹50,000 provided by the Maharashtra Government to encourage marriages where at least one or both spouses have a disability.',
    eligibility: 'At least one partner must have 40%+ certified disability; marriage registered under Maharashtra Marriage Registration Act; legal age of marriage.',
    how_to_apply: 'Apply within one year of marriage to the District Social Welfare Officer (Zilla Parishad) with marriage registration certificate and UDID.',
    apply_url: 'https://depwd.maharashtra.gov.in/'
  },
  {
    id: 'mh-8',
    name: 'State Award for Disabled Persons (राज्य दिव्यांग पुरस्कार)',
    category: 'Maharashtra State',
    type: 'Awards & Incentives',
    description: 'Annual state-level honor including citations, medals, and cash prizes recognizing exemplary personal achievements, community service, and outstanding work by disabled individuals in Maharashtra.',
    eligibility: 'Individuals with disabilities residing in Maharashtra who demonstrated exceptional accomplishments in academics, employment, sports, or social impact.',
    how_to_apply: 'Annual nominations are invited by the Department of Empowerment of Persons with Disabilities, Maharashtra.',
    apply_url: 'https://depwd.maharashtra.gov.in/'
  },

  // --- B. CENTRAL GOVERNMENT SCHEMES AVAILABLE IN MAHARASHTRA ---
  {
    id: 'ct-1',
    name: 'ADIP Scheme (Assistance to Disabled Persons for Purchase/Fitting of Aids and Appliances)',
    category: 'Central Government',
    type: 'Aids & Hearing Devices',
    description: 'Central Government flagship program providing modern, technologically advanced digital programmable hearing aids, assistive listening devices, and post-fitting services completely free of cost.',
    eligibility: 'Indian citizen; 40%+ certified hearing disability; monthly family income up to ₹22,500 (100% free subsidy) or ₹22,501 to ₹30,000 (50% subsidy).',
    how_to_apply: 'Register on the Central ARJUN portal or visit authorized ALIMCO distribution camps and AYJNISHD Mumbai.',
    apply_url: 'https://adip.depwd.gov.in/'
  },
  {
    id: 'ct-2',
    name: 'Pre-Matric Scholarship for Students with Disabilities (Central Sector)',
    category: 'Central Government',
    type: 'Scholarships & Education',
    description: 'Central Government educational scholarship providing monthly maintenance allowance, book grant, and disability allowance for school students in Classes 9 and 10.',
    eligibility: 'Regular full-time students in recognized schools; holding 40%+ disability certificate; annual family income not exceeding ₹2.5 Lakhs.',
    how_to_apply: 'Apply online through the National Scholarship Portal (scholarships.gov.in) under the Ministry of Social Justice and Empowerment.',
    apply_url: 'https://scholarships.gov.in/'
  },
  {
    id: 'ct-3',
    name: 'Post-Matric Scholarship for Students with Disabilities (Central Sector)',
    category: 'Central Government',
    type: 'Scholarships & Education',
    description: 'Comprehensive financial support covering maintenance allowances, book grants, and non-refundable institutional fees for students studying from Class 11 up to Master\'s level.',
    eligibility: '40%+ benchmark disability; studying in recognized higher secondary, college, or university; annual parental income not exceeding ₹2.5 Lakhs.',
    how_to_apply: 'Submit application online on the National Scholarship Portal. Upload fee receipt, UDID, and bonafide student certificate.',
    apply_url: 'https://scholarships.gov.in/'
  },
  {
    id: 'ct-4',
    name: 'Top Class Education Scholarship for Students with Benchmark Disabilities',
    category: 'Central Government',
    type: 'Scholarships & Education',
    description: 'Full reimbursement of tuition fees (up to ₹7 Lakhs/yr in private institutions, actual in govt), ₹3,000/month living expense allowance, and ₹30,000 computer allowance for premier national institutes.',
    eligibility: 'Students admitted to notified premier institutions (IITs, IIMs, NITs, AIIMS, NLUs, etc.); family income up to ₹6 Lakhs/year; 40%+ disability.',
    how_to_apply: 'Apply through the National Scholarship Portal under the Top Class Education Scheme of DEPwD.',
    apply_url: 'https://scholarships.gov.in/'
  },
  {
    id: 'ct-5',
    name: 'National Fellowship for Persons with Disabilities (NFPwD)',
    category: 'Central Government',
    type: 'Scholarships & Education',
    description: 'Prestigious research fellowship providing ₹37,000/month (JRF) and ₹42,000/month (SRF) plus annual contingency grants to pursue full-time M.Phil and Ph.D. degrees in Indian universities.',
    eligibility: 'Enrolled in full-time M.Phil / Ph.D. programs in recognized universities; hold 40%+ benchmark disability certificate; qualified UGC-NET/CSIR-NET.',
    how_to_apply: 'Apply online on the official UGC / DEPwD portal when annual fellowship selection notices are published.',
    apply_url: 'https://depwd.gov.in/en/scholarship/'
  },
  {
    id: 'ct-6',
    name: 'National Overseas Scholarship for Students with Disabilities',
    category: 'Central Government',
    type: 'Scholarships & Education',
    description: 'Full funding for overseas higher education including complete tuition fees, annual living allowance ($15,400+ or £9,900+), contingency, and international airfare for Master\'s and Ph.D. degrees abroad.',
    eligibility: 'Below 35 years of age; minimum 55% marks in qualifying degree; family income up to ₹8 Lakhs/year; certified 40%+ benchmark disability.',
    how_to_apply: 'Apply online on the Ministry of Social Justice & Empowerment DEPwD portal during the annual application window.',
    apply_url: 'https://depwd.gov.in/en/schemes/'
  },
  {
    id: 'ct-7',
    name: 'Free Coaching Scholarship for Students with Disabilities',
    category: 'Central Government',
    type: 'Scholarships & Education',
    description: 'Free coaching fees and monthly stipends (up to ₹6,000/month for outstation students) for competitive exams including UPSC, MPSC, Banking, SSC, Railways, JEE, and NEET.',
    eligibility: '40%+ certified disability; completed qualifying educational criteria; total family income up to ₹8 Lakhs per annum.',
    how_to_apply: 'Apply online via the DEPwD portal or directly through empaneled coaching institutes offering specialized sign-language-accessible batches.',
    apply_url: 'https://depwd.gov.in/en/schemes/'
  },
  {
    id: 'ct-8',
    name: 'National Fund for Persons with Disabilities',
    category: 'Central Government',
    type: 'Self-Employment & Loans',
    description: 'Financial support for organizing disability conferences, exhibitions, art showcases, assistive technology incubation, and specialized capacity-building initiatives.',
    eligibility: 'Individuals with disabilities, innovators, and registered non-governmental organizations working to advance disability inclusion.',
    how_to_apply: 'Submit detailed project proposals directly to the Governing Body of the National Fund under DEPwD, New Delhi.',
    apply_url: 'https://depwd.gov.in/'
  },
  {
    id: 'ct-9',
    name: 'Deendayal Disabled Rehabilitation Scheme (DDRS)',
    category: 'Central Government',
    type: 'Special Benefits & Services',
    description: 'Central grant-in-aid providing infrastructure, specialized teacher salaries, and assistive operational funds for non-profit special schools, speech clinics, and vocational centers.',
    eligibility: 'Registered non-profit voluntary organizations running recognized special schools and rehabilitation facilities for speech/hearing-impaired youth.',
    how_to_apply: 'NGOs submit grant applications through the Central e-Anudaan portal (eanudaan.gov.in) with state government endorsement.',
    apply_url: 'https://eanudaan.gov.in/'
  },
  {
    id: 'ct-10',
    name: 'Scheme for Implementation of the Rights of Persons with Disabilities Act (SIPDA)',
    category: 'Central Government',
    type: 'Special Benefits & Services',
    description: 'Central funding to transform public buildings, educational campuses, hospitals, and websites into barrier-free and universally accessible spaces with ISL interpreter infrastructure.',
    eligibility: 'State Government departments, municipal corporations, public sector undertakings, and recognized educational institutions in Maharashtra.',
    how_to_apply: 'Proposals for accessibility retrofitting are submitted to the Central Ministry of Social Justice & Empowerment under SIPDA guidelines.',
    apply_url: 'https://depwd.gov.in/scheme/sipda/'
  },
  {
    id: 'ct-11',
    name: 'District Disability Rehabilitation Centre (DDRC)',
    category: 'Central Government',
    type: 'Special Benefits & Services',
    description: 'District-level comprehensive rehabilitation centers offering free audiometric hearing tests, assistive aid fittings, speech therapy sessions, and UDID certification support.',
    eligibility: 'All citizens with suspected or diagnosed hearing, speech, or physical disabilities residing within the district.',
    how_to_apply: 'Walk in directly to your local District Hospital DDRC or Zilla Parishad Social Welfare office in Maharashtra.',
    apply_url: 'https://depwd.maharashtra.gov.in/en/provider/central-government/'
  },

  // --- C. SPECIAL WELFARE SERVICES & BENEFITS ---
  {
    id: 'sv-1',
    name: 'UDID Card (Unique Disability ID - Swavlamban Card)',
    category: 'Special Benefits & Services',
    type: 'Special Benefits & Services',
    description: 'The official national biometric digital identity card accepted across all state departments, public transit, hospitals, and welfare schemes without needing repeated medical examinations.',
    eligibility: 'Any Indian citizen with a permanent or temporary disability certified by a government medical board.',
    how_to_apply: 'Apply online on the Swavlamban portal (swavlambancard.gov.in). Attend medical verification at your local District Civil Hospital.',
    apply_url: 'https://www.swavlambancard.gov.in/'
  },
  {
    id: 'sv-2',
    name: 'Cochlear Implant Assistance under ADIP',
    category: 'Special Benefits & Services',
    type: 'Aids & Hearing Devices',
    description: 'Financial assistance up to ₹6,00,000 covering the complete cost of the multi-channel cochlear implant device, surgical procedure, and two years of post-operative auditory-verbal therapy.',
    eligibility: 'Children with severe to profound congenital hearing loss up to 5 years of age (up to 7 years in exceptional cases); family income ≤ ₹22,500/month.',
    how_to_apply: 'Apply through empaneled government medical colleges / hospitals (e.g., KEM Hospital Mumbai) or the ARJUN ADIP portal.',
    apply_url: 'https://adip.depwd.gov.in/'
  },
  {
    id: 'sv-3',
    name: 'Skill Development for Persons with Disabilities (SCPwD)',
    category: 'Special Benefits & Services',
    type: 'Self-Employment & Loans',
    description: 'Industry-aligned, market-relevant vocational training courses in IT, graphic design, hospitality, and assembly equipped with certified Indian Sign Language (ISL) interpreters.',
    eligibility: 'Age between 15 and 59 years; holding 40%+ disability certificate; basic educational qualification matching the selected trade.',
    how_to_apply: 'Enroll through the Skill Council for Persons with Disability (SCPwD) or via the Divyang Sahayak portal.',
    apply_url: 'https://divyangsahayak.maharashtra.gov.in/'
  },
  {
    id: 'sv-4',
    name: 'Early Intervention Services for Deaf Children',
    category: 'Special Benefits & Services',
    type: 'Aids & Hearing Devices',
    description: 'Comprehensive early screening (OAE and BERA audiometry), family counseling, speech therapy kits, and early developmental interventions for deaf and hard-of-hearing infants.',
    eligibility: 'Infants and children from 0 to 6 years of age suspected of or diagnosed with speech and hearing impairment.',
    how_to_apply: 'Available at Ali Yavar Jung National Institute (AYJNISHD) Bandra West, Mumbai and District Early Intervention Centers (DEIC) across Maharashtra.',
    apply_url: 'https://ayjnihh.nic.in/'
  },
  {
    id: 'sv-5',
    name: 'Accessible Education Support (Inclusive Education)',
    category: 'Special Benefits & Services',
    type: 'Scholarships & Education',
    description: 'Educational accessibility provisions including barrier-free classrooms, ISL visual instructional materials, reader/scribe allowances for board exams, and specialized resource teachers.',
    eligibility: 'Hearing and speech-impaired students enrolled in primary, secondary, and higher secondary schools across Maharashtra.',
    how_to_apply: 'Coordinated directly through the School Education & Sports Department, Government of Maharashtra.',
    apply_url: 'https://education.maharashtra.gov.in/'
  },
  {
    id: 'sv-6',
    name: 'Disability Employment Support & 4% Public Sector Reservation',
    category: 'Special Benefits & Services',
    type: 'Self-Employment & Loans',
    description: 'Mandatory 4% horizontal reservation in Maharashtra State Government jobs, public sector undertakings, and autonomous bodies, with age relaxations of up to 10 years.',
    eligibility: 'Persons with 40%+ certified disability holding required educational and technical qualifications for advertised recruitment posts.',
    how_to_apply: 'Apply on the Maharashtra Public Service Commission (MPSC) portal or Mahaswayam Employment Exchange portal with UDID.',
    apply_url: 'https://www.mahaswayam.gov.in/'
  },
  {
    id: 'sv-7',
    name: 'Maharashtra State Divyang Finance & Development Corporation (MSDFDC)',
    category: 'Special Benefits & Services',
    type: 'Self-Employment & Loans',
    description: 'Concessional interest rate financing (4% to 6% per annum) of up to ₹5,00,000 for self-employment businesses, purchase of commercial electric three-wheelers, and small enterprise ventures.',
    eligibility: 'Resident of Maharashtra; age 18 to 55; minimum 40% certified disability; annual family income within corporation ceiling.',
    how_to_apply: 'Apply online via the Divyang Sahayak portal or submit applications at the MSDFDC district office located in each Maharashtra district.',
    apply_url: 'https://divyangsahayak.maharashtra.gov.in/'
  }
]

export default function SchemesDirectory() {
  const [schemes, setSchemes] = useState(INITIAL_SCHEMES)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All') // 'All' | 'Maharashtra State' | 'Central Government' | 'Special Benefits & Services'
  const [selectedType, setSelectedType] = useState('All') // 'All' | 'Scholarships & Education' | 'Aids & Hearing Devices' | 'Self-Employment & Loans' | 'Awards & Incentives'

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const { data } = await supabase.from('schemes').select('*').order('name')
        if (data && data.length > 0) {
          // Merge or update if DB returns more or custom schemes
          const dbMap = new Map(data.map(d => [d.name.toLowerCase().trim(), d]))
          const merged = INITIAL_SCHEMES.map(s => {
            const match = dbMap.get(s.name.toLowerCase().trim())
            return match ? { ...s, ...match, apply_url: s.apply_url } : s
          })
          
          // Append any extra DB schemes not in initial list
          data.forEach(d => {
            if (!INITIAL_SCHEMES.some(s => s.name.toLowerCase().trim() === d.name.toLowerCase().trim())) {
              merged.push({
                ...d,
                category: 'Government Scheme',
                type: 'Special Benefits & Services',
                apply_url: 'https://www.india.gov.in/'
              })
            }
          })
          
          setSchemes(merged)
        }
      } catch (err) {
        console.warn("Could not load from supabase, using offline fallback schemes:", err)
      }
    }
    fetchSchemes()
  }, [])

  const filteredSchemes = schemes.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.eligibility.toLowerCase().includes(search.toLowerCase())
    
    const matchesCategory = 
      selectedCategory === 'All' 
        ? true 
        : selectedCategory === 'Divyang Sahayak Portal'
        ? (s.category === 'Maharashtra State' || s.apply_url?.includes('divyangsahayak') || s.how_to_apply?.toLowerCase().includes('divyang sahayak') || s.id?.startsWith('mh-'))
        : s.category === selectedCategory

    const matchesType = selectedType === 'All' || s.type === selectedType

    return matchesSearch && matchesCategory && matchesType
  })

  const categories = ['All', 'Divyang Sahayak Portal', 'Maharashtra State', 'Central Government', 'Special Benefits & Services']
  const types = ['All', 'Scholarships & Education', 'Aids & Hearing Devices', 'Self-Employment & Loans', 'Awards & Incentives']

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white p-8 rounded-3xl shadow-card-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Official Maharashtra & Central Portals
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Government Disability Welfare & Assistance Directory
          </h1>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
            Consolidated directory of all 26 Maharashtra State and Central Government welfare schemes, scholarships, assistive hearing aids, cochlear implants, and employment subsidies for individuals with hearing and speech disabilities.
          </p>
        </div>
      </div>

      {/* Official Government Portals Quick Access */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          Official Government Portals (Direct Access)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {OFFICIAL_PORTALS.map(portal => (
            <a
              key={portal.name}
              href={portal.url}
              target="_blank"
              rel="noreferrer"
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {portal.badge}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-foreground leading-snug group-hover:text-indigo-600 transition-colors">
                  {portal.name}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                  {portal.description}
                </p>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 mt-3 block truncate">
                {portal.domain} ➔
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-border space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by scheme name, benefits, eligibility, or keywords (e.g. ADIP, scholarship, hearing aid, pension, loan)..." 
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filters (Maharashtra vs Central vs Services) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs font-bold text-muted-foreground mr-2">Jurisdiction:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat === 'All' ? `All Jurisdictions (${schemes.length})` : cat}
            </button>
          ))}
        </div>

        {/* Type Filters (Scholarships, Hearing Aids, Loans, etc.) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground mr-2">Benefit Type:</span>
          {types.map(typ => (
            <button
              key={typ}
              onClick={() => setSelectedType(typ)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedType === typ
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
              }`}
            >
              {typ}
            </button>
          ))}
        </div>

      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center text-sm font-bold text-muted-foreground px-2">
        <span>Showing {filteredSchemes.length} matching government schemes</span>
        {(search || selectedCategory !== 'All' || selectedType !== 'All') && (
          <button 
            onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedType('All'); }}
            className="text-xs text-indigo-600 hover:underline font-bold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Schemes Grid */}
      <div className="grid gap-6">
        {filteredSchemes.map((scheme, idx) => (
          <Card key={scheme.id || idx} className="overflow-hidden shadow-card-sm hover:shadow-card-md hover:-translate-y-1 transition-all duration-300 border-indigo-50 dark:border-indigo-900/30 group">
            
            <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 dark:from-slate-800/80 dark:to-slate-900 border-b border-border py-5 px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-sm">
                    {scheme.type === 'Scholarships & Education' && <GraduationCap className="w-5 h-5" />}
                    {scheme.type === 'Aids & Hearing Devices' && <Ear className="w-5 h-5" />}
                    {scheme.type === 'Self-Employment & Loans' && <Briefcase className="w-5 h-5" />}
                    {scheme.type === 'Awards & Incentives' && <Award className="w-5 h-5" />}
                    {scheme.type === 'Special Benefits & Services' && <Building2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-foreground group-hover:text-indigo-600 transition-colors leading-tight">
                      {scheme.name}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        {scheme.category}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {scheme.type}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={scheme.apply_url || 'https://www.india.gov.in/'}
                  target="_blank"
                  rel="noreferrer"
                  className="sm:self-center shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                >
                  <span>Apply on Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-8 space-y-6 bg-white dark:bg-slate-900">
              <p className="text-[16px] leading-relaxed text-foreground/90 font-medium">
                {scheme.description}
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-border">
                
                {/* Eligibility Box */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-border shadow-sm">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4" /> Eligibility Criteria
                  </h4>
                  <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                    {scheme.eligibility}
                  </p>
                </div>

                {/* How to Apply Box */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4" /> How to Apply & Required Steps
                    </h4>
                    <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                      {scheme.how_to_apply}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/60 flex justify-end">
                    <a
                      href={scheme.apply_url || 'https://www.india.gov.in/'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Direct Official Portal Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

              </div>
            </CardContent>

          </Card>
        ))}

        {filteredSchemes.length === 0 && (
          <div className="text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-border shadow-sm p-16 text-muted-foreground space-y-3">
             <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
             <p className="font-bold text-xl text-foreground">No government schemes found</p>
             <p className="text-sm">Try searching with other terms like "ADIP", "Scholarship", "Hearing", or "Maharashtra".</p>
             <Button 
               variant="outline" 
               onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedType('All'); }}
               className="mt-2 text-xs font-bold"
             >
               Reset Filters
             </Button>
          </div>
        )}
      </div>

    </div>
  )
}
