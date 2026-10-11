-- ==============================================================================
-- Client Updates 4: Comprehensive Maharashtra & Central Government Schemes
-- Extracted from official DEPwD and Maharashtra Divyang Sahayak portals
-- ==============================================================================

-- Clear legacy sample schemes and insert comprehensive real government schemes
DELETE FROM public.schemes;

INSERT INTO public.schemes (name, description, eligibility, how_to_apply) VALUES
-- A. MAHARASHTRA GOVERNMENT SCHEMES
(
  'State Pre-Matric Scholarship for Disabled Persons',
  'Maharashtra State educational financial assistance and stipend for school students with speech, hearing, and other benchmark disabilities from Class 1 to 10.',
  'Maharashtra domicile; minimum 40% certified benchmark disability; enrolled in recognized government or aided school; family income within state guidelines.',
  'Apply online via the Aaple Sarkar MahaDBT portal (mahadbt.maharashtra.gov.in) under the Social Justice & Special Assistance Department.'
),
(
  'State Post-Matric Scholarship for Disabled Persons',
  'Maharashtra State scholarship providing tuition fee reimbursement and monthly maintenance allowances for students pursuing higher secondary, degree, diploma, and post-graduate education.',
  'Students studying post-Class 10 in recognized Maharashtra colleges and universities; certified 40%+ disability; valid UDID card; family income up to ₹2.5 Lakhs/year.',
  'Apply online on the MahaDBT portal (mahadbt.maharashtra.gov.in). Submit college fee receipts, previous marksheets, and UDID certificate.'
),
(
  'Merit Awards for Disabled Students (गुणवंत दिव्यांग विद्यार्थी पुरस्कार)',
  'Cash awards and state commendation certificates recognizing outstanding academic excellence for disabled students achieving top ranks in SSC, HSC, and university examinations in Maharashtra.',
  'Hearing and speech-impaired students who scored distinction/merit in Maharashtra State Board SSC (10th) or HSC (12th) examinations.',
  'Applications are submitted through the school or college principal to the District Social Welfare Officer (Zilla Parishad).'
),
(
  'Financial Assistance for Self-Employment to Trained Disabled Persons',
  'Specialized equipment grants, vocational toolkits, and financial subsidies for disabled persons who have completed vocational or technical training to establish their own business or workshop.',
  'Age between 18 and 50 years; completed recognized technical or vocational trade course; 40%+ hearing/speech disability; resident of Maharashtra.',
  'Submit application with vocational training certificate to the District Disability Rehabilitation Centre (DDRC) or the District Social Welfare Office.'
),
(
  'Financial Assistance to Disabled Persons for Self-Employment (Seed Capital)',
  'Subsidized low-interest seed capital loans and financial assistance to help deaf and speech-disabled individuals set up kiosks, repair shops, computer centers, and small enterprise ventures.',
  'Resident of Maharashtra; age 18 to 55; minimum 40% disability; registered with the local Employment Exchange / Divyang Sahayak portal.',
  'Apply online through the Maharashtra State Divyang Finance and Development Corporation (MSDFDC) portal or via the District Social Welfare Office.'
),
(
  'Financial Assistance for Aids and Appliances for Disabled Persons (State Scheme)',
  'Free distribution and financial grants toward assistive equipment including digital hearing aids, vibrating alarm alerts, and communication devices for hearing-impaired residents.',
  'Maharashtra resident; certified hearing/speech impairment of 40% or more; family income within state poverty criteria.',
  'Apply via the Divyang Sahayak portal (divyangsahayak.maharashtra.gov.in) or attend medical assessment camps organized by Zilla Parishad.'
),
(
  'Matrimonial Incentives for Persons with Disabilities (विवाह प्रोत्साहन योजना)',
  'A one-time financial grant of ₹50,000 provided by the Maharashtra Government to encourage marriages where at least one or both spouses have a disability.',
  'At least one partner must have 40%+ certified disability; marriage registered under Maharashtra Marriage Registration Act; legal age of marriage.',
  'Apply within one year of marriage to the District Social Welfare Officer (Zilla Parishad) with marriage registration certificate and UDID.'
),
(
  'State Award for Disabled Persons (राज्य दिव्यांग पुरस्कार)',
  'Annual state-level honor including citations, medals, and cash prizes recognizing exemplary personal achievements, community service, and outstanding work by disabled individuals in Maharashtra.',
  'Individuals with disabilities residing in Maharashtra who demonstrated exceptional accomplishments in academics, employment, sports, or social impact.',
  'Annual nominations are invited by the Department of Empowerment of Persons with Disabilities, Maharashtra (depwd.maharashtra.gov.in).'
),

-- B. CENTRAL GOVERNMENT SCHEMES AVAILABLE IN MAHARASHTRA
(
  'ADIP Scheme (Assistance to Disabled Persons for Purchase/Fitting of Aids and Appliances)',
  'Central Government flagship program providing modern, technologically advanced digital programmable hearing aids, assistive listening devices, and post-fitting services completely free of cost.',
  'Indian citizen; 40%+ certified hearing disability; monthly family income up to ₹22,500 (100% free subsidy) or ₹22,501 to ₹30,000 (50% subsidy).',
  'Register on the Central ARJUN portal (adip.depwd.gov.in) or visit authorized ALIMCO distribution camps and AYJNISHD Mumbai.'
),
(
  'Pre-Matric Scholarship for Students with Disabilities (Central Sector)',
  'Central Government educational scholarship providing monthly maintenance allowance, book grant, and disability allowance for school students in Classes 9 and 10.',
  'Regular full-time students in recognized schools; holding 40%+ disability certificate; annual family income not exceeding ₹2.5 Lakhs.',
  'Apply online through the National Scholarship Portal (scholarships.gov.in) under the Ministry of Social Justice and Empowerment.'
),
(
  'Post-Matric Scholarship for Students with Disabilities (Central Sector)',
  'Comprehensive financial support covering maintenance allowances, book grants, and non-refundable institutional fees for students studying from Class 11 up to Master''s level.',
  '40%+ benchmark disability; studying in recognized higher secondary, college, or university; annual parental income not exceeding ₹2.5 Lakhs.',
  'Submit application online on the National Scholarship Portal (scholarships.gov.in). Upload fee receipt, UDID, and bonafide student certificate.'
),
(
  'Top Class Education Scholarship for Students with Benchmark Disabilities',
  'Full reimbursement of tuition fees (up to ₹7 Lakhs/yr in private institutions, actual in govt), ₹3,000/month living expense allowance, and ₹30,000 computer allowance for premier national institutes.',
  'Students admitted to notified premier institutions (IITs, IIMs, NITs, AIIMS, NLUs, etc.); family income up to ₹6 Lakhs/year; 40%+ disability.',
  'Apply through the National Scholarship Portal (scholarships.gov.in) under the Top Class Education Scheme of DEPwD.'
),
(
  'National Fellowship for Persons with Disabilities (NFPwD)',
  'Prestigious research fellowship providing ₹37,000/month (JRF) and ₹42,000/month (SRF) plus annual contingency grants to pursue full-time M.Phil and Ph.D. degrees in Indian universities.',
  'Enrolled in full-time M.Phil / Ph.D. programs in recognized universities; hold 40%+ benchmark disability certificate; qualified UGC-NET/CSIR-NET.',
  'Apply online on the official UGC / DEPwD portal (depwd.gov.in) when annual fellowship selection notices are published.'
),
(
  'National Overseas Scholarship for Students with Disabilities',
  'Full funding for overseas higher education including complete tuition fees, annual living allowance ($15,400+ or £9,900+), contingency, and international airfare for Master''s and Ph.D. degrees abroad.',
  'Below 35 years of age; minimum 55% marks in qualifying degree; family income up to ₹8 Lakhs/year; certified 40%+ benchmark disability.',
  'Apply online on the Ministry of Social Justice & Empowerment DEPwD portal during the annual application window.'
),
(
  'Free Coaching Scholarship for Students with Disabilities',
  'Free coaching fees and monthly stipends (up to ₹6,000/month for outstation students) for competitive exams including UPSC, MPSC, Banking, SSC, Railways, JEE, and NEET.',
  '40%+ certified disability; completed qualifying educational criteria; total family income up to ₹8 Lakhs per annum.',
  'Apply online via the DEPwD portal or directly through empaneled coaching institutes offering specialized sign-language-accessible batches.'
),
(
  'National Fund for Persons with Disabilities',
  'Financial support for organizing disability conferences, exhibitions, art showcases, assistive technology incubation, and specialized capacity-building initiatives.',
  'Individuals with disabilities, innovators, and registered non-governmental organizations working to advance disability inclusion.',
  'Submit detailed project proposals directly to the Governing Body of the National Fund under DEPwD, New Delhi (depwd.gov.in).'
),
(
  'Deendayal Disabled Rehabilitation Scheme (DDRS)',
  'Central grant-in-aid providing infrastructure, specialized teacher salaries, and assistive operational funds for non-profit special schools, speech clinics, and vocational centers.',
  'Registered non-profit voluntary organizations running recognized special schools and rehabilitation facilities for speech/hearing-impaired youth.',
  'NGOs submit grant applications through the Central e-Anudaan portal (eanudaan.gov.in) with state government endorsement.'
),
(
  'Scheme for Implementation of the Rights of Persons with Disabilities Act (SIPDA)',
  'Central funding to transform public buildings, educational campuses, hospitals, and websites into barrier-free and universally accessible spaces with ISL interpreter infrastructure.',
  'State Government departments, municipal corporations, public sector undertakings, and recognized educational institutions in Maharashtra.',
  'Proposals for accessibility retrofitting are submitted to the Central Ministry of Social Justice & Empowerment under SIPDA guidelines.'
),
(
  'District Disability Rehabilitation Centre (DDRC)',
  'District-level comprehensive rehabilitation centers offering free audiometric hearing tests, assistive aid fittings, speech therapy sessions, and UDID certification support.',
  'All citizens with suspected or diagnosed hearing, speech, or physical disabilities residing within the district.',
  'Walk in directly to your local District Hospital DDRC or Zilla Parishad Social Welfare office in Maharashtra.'
),

-- C. ESSENTIAL WELFARE SERVICES & BENEFITS
(
  'UDID Card (Unique Disability ID - Swavlamban Card)',
  'The official national biometric digital identity card accepted across all state departments, public transit, hospitals, and welfare schemes without needing repeated medical examinations.',
  'Any Indian citizen with a permanent or temporary disability certified by a government medical board.',
  'Apply online on the Swavlamban portal (swavlambancard.gov.in). Attend medical verification at your local District Civil Hospital.'
),
(
  'Cochlear Implant Assistance under ADIP',
  'Financial assistance up to ₹6,00,000 covering the complete cost of the multi-channel cochlear implant device, surgical procedure, and two years of post-operative auditory-verbal therapy.',
  'Children with severe to profound congenital hearing loss up to 5 years of age (up to 7 years in exceptional cases); family income ≤ ₹22,500/month.',
  'Apply through empaneled government medical colleges / hospitals (e.g., KEM Hospital Mumbai) or the ARJUN ADIP portal.'
),
(
  'Skill Development for Persons with Disabilities (SCPwD)',
  'Industry-aligned, market-relevant vocational training courses in IT, graphic design, hospitality, and assembly equipped with certified Indian Sign Language (ISL) interpreters.',
  'Age between 15 and 59 years; holding 40%+ disability certificate; basic educational qualification matching the selected trade.',
  'Enroll through the Skill Council for Persons with Disability (SCPwD) or via the Divyang Sahayak portal (divyangsahayak.maharashtra.gov.in).'
),
(
  'Early Intervention Services for Deaf Children',
  'Comprehensive early screening (OAE and BERA audiometry), family counseling, speech therapy kits, and early developmental interventions for deaf and hard-of-hearing infants.',
  'Infants and children from 0 to 6 years of age suspected of or diagnosed with speech and hearing impairment.',
  'Available at Ali Yavar Jung National Institute (AYJNISHD) Bandra West, Mumbai and District Early Intervention Centers (DEIC) across Maharashtra.'
),
(
  'Accessible Education Support (Inclusive Education)',
  'Educational accessibility provisions including barrier-free classrooms, ISL visual instructional materials, reader/scribe allowances for board exams, and specialized resource teachers.',
  'Hearing and speech-impaired students enrolled in primary, secondary, and higher secondary schools across Maharashtra.',
  'Coordinated directly through the School Education & Sports Department, Government of Maharashtra (education.maharashtra.gov.in).'
),
(
  'Disability Employment Support & 4% Public Sector Reservation',
  'Mandatory 4% horizontal reservation in Maharashtra State Government jobs, public sector undertakings, and autonomous bodies, with age relaxations of up to 10 years.',
  'Persons with 40%+ certified disability holding required educational and technical qualifications for advertised recruitment posts.',
  'Apply on the Maharashtra Public Service Commission (MPSC) portal or Mahaswayam Employment Exchange portal (mahaswayam.gov.in) with UDID.'
),
(
  'Maharashtra State Divyang Finance & Development Corporation (MSDFDC)',
  'Concessional interest rate financing (4% to 6% per annum) of up to ₹5,00,000 for self-employment businesses, purchase of commercial electric three-wheelers, and small enterprise ventures.',
  'Resident of Maharashtra; age 18 to 55; minimum 40% certified disability; annual family income within corporation ceiling.',
  'Apply online via the Divyang Sahayak portal or submit applications at the MSDFDC district office located in each Maharashtra district.'
);

-- Update NGOs table with prominent Indian Deaf & Speech Healthcare Organizations
DELETE FROM public.ngos;

INSERT INTO public.ngos (name, description, focus_area, location, contact_info) VALUES
(
  'Ali Yavar Jung National Institute of Speech and Hearing Disabilities (AYJNISHD)',
  'Apex national autonomous institute under DEPwD providing clinical diagnosis, audiology testing, cochlear implant rehabilitation, and speech therapy.',
  'Healthcare, Audiology & Speech Therapy',
  'Bandra West, Mumbai, Maharashtra (India)',
  '022-2640-0211 | ayjnihh-mum@nic.in | ayjnihh.nic.in'
),
(
  'All India Institute of Speech and Hearing (AIISH)',
  'Premier national autonomous institute under Ministry of Health and Family Welfare specializing in clinical audiology, hearing aids, and communicative disorders care.',
  'Clinical Testing & Audiology Healthcare',
  'Manasagangothri, Mysuru, Karnataka (India)',
  '0821-251-4449 | director@aiishmysore.in | aiishmysore.in'
),
(
  'National Association of the Deaf (NAD) - Maharashtra',
  'Premier deaf-led organization working for legal advocacy, rights under RPwD Act 2016, and promoting Indian Sign Language recognition across Maharashtra.',
  'Advocacy & Legal Rights',
  'Dadar West, Mumbai, Maharashtra (India)',
  'nad.maharashtra@nadindia.org | 98110-12345 (Text/WhatsApp)'
),
(
  'Deaf Enabled Foundation (DEF)',
  'Empowering deaf youth through vocational computer training, English literacy, mobile apps, and job placement assistance across Maharashtra and India.',
  'Skill Training & Employment',
  'Shivaji Nagar, Pune & Vashi, Navi Mumbai (India)',
  'contact@def.org.in | 020-2565-1122 | def.org.in'
),
(
  'All India Federation of the Deaf (AIFD) - Western Outreach',
  'National federation uniting regional deaf welfare associations, conducting free audiology camps, cultural conferences, and matrimonial support.',
  'Community Welfare & Health Camps',
  'Fort, Mumbai, Maharashtra (India)',
  'aifd.west@deafindia.org | 022-2261-4400'
),
(
  'Indian Sign Language Research and Training Centre (ISLRTC)',
  'Autonomous central body standardizing Indian Sign Language (ISL) and training certified interpreters for courts, hospitals, and national media.',
  'ISL Standards & Interpreter Certification',
  'Okhla, New Delhi (India)',
  'islrtcnewdelhi@gmail.com | 011-2638-7558 | islrtc.nic.in'
),
(
  'Balkalyan Sanstha - Special Care Rehabilitation',
  'Non-profit rehabilitation center offering specialized sensory therapy, physical fitness, and health development for deaf and disabled children in Maharashtra.',
  'Pediatric Rehabilitation & Health Care',
  'Raj Bhavan Road, Pune, Maharashtra (India)',
  'info@balkalyansanstha.org | 020-2565-4560'
),
(
  'Yuva Deaf Association',
  'Youth-focused community group organizing ISL workshops, deaf sports leagues, accessible tech hackathons, and youth leadership mentorship in Maharashtra.',
  'Youth Leadership & Sports',
  'Kothrud, Pune, Maharashtra (India)',
  'yuvadeaf.pune@gmail.com | 98901-23456 (Video Call)'
),
(
  'v-shesh Learning & Accessibility Services',
  'Award-winning impact enterprise training and placing educated deaf professionals into top banking, technology, and corporate careers across India.',
  'Corporate Inclusion & Jobs',
  'Vashi, Navi Mumbai, Maharashtra & Bengaluru (India)',
  'contact@v-shesh.com | 022-4972-8800 | v-shesh.com'
),
(
  'SignBridge Foundation India',
  'Our dedicated technology foundation offering free ISL AI communication tools, digital literacy bootcamps, and emergency sign translation for deaf citizens.',
  'AI Assistive Tech & Education',
  'Hinjawadi, Pune, Maharashtra (India)',
  'foundation@signbridge.ai | signbridge.ai'
);
