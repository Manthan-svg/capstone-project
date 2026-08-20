import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { FileText, Download, UploadCloud, CheckCircle } from 'lucide-react'
import jsPDF from 'jspdf'

export default function ResumeBuilder() {
  const { user, profile } = useAuth()
  
  const [name, setName] = useState(profile?.full_name || '')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [summary, setSummary] = useState('')
  const [experience, setExperience] = useState('')
  const [education, setEducation] = useState('')
  const [skills, setSkills] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  const generatePDF = async () => {
    setIsGenerating(true)
    try {
      const doc = new jsPDF()

      // Styling and Content
      doc.setFont("helvetica", "bold")
      doc.setFontSize(24)
      doc.setTextColor(0, 51, 102)
      doc.text(name, 20, 20)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`${email}  |  ${phone}`, 20, 28)

      let yPos = 40
      doc.setTextColor(0, 0, 0)
      
      const addSection = (title, content) => {
        if (!content) return
        doc.setFont("helvetica", "bold")
        doc.setFontSize(14)
        doc.text(title, 20, yPos)
        yPos += 2
        doc.setLineWidth(0.5)
        doc.line(20, yPos, 190, yPos)
        yPos += 8
        
        doc.setFont("helvetica", "normal")
        doc.setFontSize(11)
        const lines = doc.splitTextToSize(content, 170)
        doc.text(lines, 20, yPos)
        yPos += (lines.length * 5) + 10
      }

      addSection("Professional Summary", summary)
      addSection("Work Experience", experience)
      addSection("Education", education)
      addSection("Skills", skills)

      // 1. Trigger Download for user
      doc.save(`${name.replace(/\s+/g, '_')}_Resume.pdf`)

      // 2. Upload to Supabase Storage for applications
      const pdfBlob = doc.output('blob')
      const filePath = `${user.id}/resume.pdf`
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, pdfBlob, { upsert: true, contentType: 'application/pdf' })

      if (uploadError) throw uploadError

      setLastSaved(new Date().toLocaleTimeString())
    } catch (error) {
      console.error(error)
      alert("Error generating or saving resume: " + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <Card className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30">
        <CardHeader className="bg-white dark:bg-slate-900 border-b border-border pb-6 pt-8 px-8">
          <CardTitle className="flex items-center gap-3 text-3xl font-black">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            Resume Builder
          </CardTitle>
          <p className="text-muted-foreground text-[15px] font-medium leading-relaxed mt-2 pl-[60px]">
            Fill out your details below to generate a professional PDF resume. Saving it will also make it available to attach to job applications within SignBridge.
          </p>
        </CardHeader>
        <CardContent className="space-y-8 p-8 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Full Name" id="name" value={name} onChange={e => setName(e.target.value)} />
            <FormField label="Email" id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <FormField label="Phone Number" id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground uppercase tracking-wider">Professional Summary</label>
            <textarea className="flex w-full rounded-xl border border-input bg-white dark:bg-slate-900 px-4 py-3 text-[15px] shadow-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="Brief overview of your professional background and goals..." value={summary} onChange={e => setSummary(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground uppercase tracking-wider">Work Experience</label>
            <textarea className="flex w-full rounded-xl border border-input bg-white dark:bg-slate-900 px-4 py-3 text-[15px] shadow-sm min-h-[150px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="Company Name - Role (Dates)&#10;- Key responsibility or achievement..." value={experience} onChange={e => setExperience(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground uppercase tracking-wider">Education</label>
            <textarea className="flex w-full rounded-xl border border-input bg-white dark:bg-slate-900 px-4 py-3 text-[15px] shadow-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="University Name - Degree (Year graduated)..." value={education} onChange={e => setEducation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground uppercase tracking-wider">Skills</label>
            <textarea className="flex w-full rounded-xl border border-input bg-white dark:bg-slate-900 px-4 py-3 text-[15px] shadow-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="React, Node.js, ASL Fluency, Project Management..." value={skills} onChange={e => setSkills(e.target.value)} />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-border mt-4">
            <Button onClick={generatePDF} disabled={isGenerating || !name} className="w-full md:w-auto h-14 rounded-xl text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-transform active:scale-95 px-8">
              {isGenerating ? <UploadCloud className="w-5 h-5 mr-2 animate-pulse" /> : <Download className="w-5 h-5 mr-2" />}
              {isGenerating ? 'Generating & Saving...' : 'Generate & Save PDF'}
            </Button>
            {lastSaved && (
              <div className="text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 flex items-center font-bold">
                <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Resume updated at {lastSaved}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
