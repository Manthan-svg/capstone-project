import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Award, Download } from 'lucide-react'
import jsPDF from 'jspdf'

export default function Certificates() {
  const { user, profile } = useAuth()
  const [certificates, setCertificates] = useState([])

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    const { data } = await supabase
      .from('certificates')
      .select('*, courses(title, level)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false })
    if (data) setCertificates(data)
  }

  const downloadCertificate = (cert) => {
    // Generate PDF client-side
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: 'letter'
    })

    const name = profile?.full_name || 'SignBridge Student'
    const courseTitle = cert.courses.title
    const dateStr = new Date(cert.issued_at).toLocaleDateString()

    // Border
    doc.setLineWidth(0.1)
    doc.setDrawColor(0, 102, 204)
    doc.rect(0.5, 0.5, 10, 7.5)
    
    doc.setLineWidth(0.02)
    doc.rect(0.6, 0.6, 9.8, 7.3)

    // Title
    doc.setFont("helvetica", "bold")
    doc.setFontSize(40)
    doc.setTextColor(0, 51, 102)
    doc.text("Certificate of Completion", 5.5, 2.5, { align: "center" })

    // Body
    doc.setFont("helvetica", "normal")
    doc.setFontSize(20)
    doc.setTextColor(50, 50, 50)
    doc.text("This is to certify that", 5.5, 3.5, { align: "center" })

    // Name
    doc.setFont("helvetica", "bolditalic")
    doc.setFontSize(30)
    doc.setTextColor(0, 0, 0)
    doc.text(name, 5.5, 4.3, { align: "center" })

    // Course
    doc.setFont("helvetica", "normal")
    doc.setFontSize(20)
    doc.setTextColor(50, 50, 50)
    doc.text("has successfully completed the course", 5.5, 5.1, { align: "center" })

    doc.setFont("helvetica", "bold")
    doc.setFontSize(24)
    doc.setTextColor(0, 102, 204)
    doc.text(courseTitle, 5.5, 5.8, { align: "center" })

    // Footer
    doc.setFont("helvetica", "normal")
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text(`Issued on: ${dateStr}`, 5.5, 6.8, { align: "center" })
    doc.text("SignBridge AI Learning Hub", 5.5, 7.2, { align: "center" })

    doc.save(`Certificate_${courseTitle.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center mb-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-card-sm border border-indigo-50 dark:border-indigo-900/30">
        <h2 className="text-3xl font-bold text-foreground mb-2">Your Certificates</h2>
        <p className="text-lg text-muted-foreground">Complete courses to earn official certificates of completion.</p>
      </div>

      {certificates.length === 0 ? (
        <Card className="bg-slate-50/50 dark:bg-slate-800/50 border-dashed border-2 border-border shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
              <Award className="w-12 h-12 text-slate-300" />
            </div>
            <p className="font-bold text-xl text-foreground mb-2">No certificates yet.</p>
            <p className="text-base max-w-sm">Head over to the Course Catalog and complete all lessons in a course to earn one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {certificates.map(cert => (
            <Card key={cert.id} className="overflow-hidden border-indigo-50 dark:border-indigo-900/30 shadow-card-sm hover:shadow-card-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <Award className="w-32 h-32 text-white absolute opacity-10 -right-4 -bottom-4 transform rotate-12 group-hover:scale-110 transition-transform duration-700" />
                <div className="text-center z-10 relative">
                  <p className="text-xs font-black text-indigo-200 uppercase tracking-[0.3em] mb-3">Certificate of Completion</p>
                  <h3 className="text-2xl font-bold text-white drop-shadow-md">{cert.courses.title}</h3>
                </div>
              </div>
              <CardContent className="p-6 space-y-5 bg-white dark:bg-slate-900">
                <div className="flex justify-between text-[15px] pb-3 border-b border-border">
                  <span className="text-muted-foreground font-medium">Issued On</span>
                  <span className="font-bold text-foreground">{new Date(cert.issued_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-[15px] pb-3 border-b border-border">
                  <span className="text-muted-foreground font-medium">Course Level</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider ${
                    cert.courses.level === 'Beginner' ? 'bg-emerald-100 text-emerald-800' :
                    cert.courses.level === 'Intermediate' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800' : 'bg-rose-100 text-rose-800'
                  }`}>{cert.courses.level}</span>
                </div>
                <Button className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md mt-4 transition-transform active:scale-95" onClick={() => downloadCertificate(cert)}>
                  <Download className="w-5 h-5" /> Download Official PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
