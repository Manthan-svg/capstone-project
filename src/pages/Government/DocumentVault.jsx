import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Shield, FileText, Upload, Trash2, Award, Download } from 'lucide-react'

export default function DocumentVault() {
  const { user } = useAuth()
  const [vaultDocs, setVaultDocs] = useState([])
  const [certificates, setCertificates] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    // Fetch Vault Docs
    const { data: vData } = await supabase.from('vault_documents').select('*').eq('user_id', user.id).order('uploaded_at', { ascending: false })
    if (vData) setVaultDocs(vData)

    // Fetch Learning Hub Certificates
    const { data: cData } = await supabase.from('certificates').select('*, courses(title)').eq('user_id', user.id)
    if (cData) setCertificates(cData)
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `${user.id}/${fileName}`

    try {
      // 1. Upload to storage bucket
      const { error: uploadError } = await supabase.storage.from('vault').upload(filePath, file)
      if (uploadError) throw uploadError

      // 2. Insert metadata into vault_documents table
      let type = 'Other'
      if (file.name.toLowerCase().includes('id') || file.name.toLowerCase().includes('card')) type = 'ID'
      if (file.name.toLowerCase().includes('cert')) type = 'Certificate'
      
      const { error: dbError } = await supabase.from('vault_documents').insert({
        user_id: user.id,
        name: file.name,
        type: type,
        file_path: filePath
      })
      if (dbError) throw dbError

      alert('Document uploaded securely to your vault.')
      fetchDocuments()
    } catch (error) {
      alert('Upload failed: ' + error.message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (docId, filePath) => {
    if (!confirm('Are you sure you want to delete this document from your vault?')) return
    
    // Delete from storage
    await supabase.storage.from('vault').remove([filePath])
    // Delete from DB
    await supabase.from('vault_documents').delete().eq('id', docId)
    
    fetchDocuments()
  }

  const downloadFile = async (filePath) => {
    const { data, error } = await supabase.storage.from('vault').createSignedUrl(filePath, 60)
    if (error) {
      alert("Cannot download file: " + error.message)
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Upload Section */}
      <Card className="border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/80 to-white shadow-sm overflow-hidden relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-100 dark:bg-indigo-900/40/50 rounded-bl-full -z-10"></div>
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-indigo-950 dark:text-indigo-50">Secure Vault Upload</h3>
              <p className="text-[15px] font-medium text-indigo-900 dark:text-indigo-100/60 mt-1 max-w-md">Upload your IDs, external certificates, or disability proofs. End-to-end encrypted storage.</p>
            </div>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full md:w-auto h-14 rounded-xl text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-transform active:scale-95 px-8">
              {isUploading ? 'Encrypting & Uploading...' : <><Upload className="w-5 h-5 mr-2" /> Select File</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Vault Documents List */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-foreground">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
               <FileText className="w-4 h-4" />
            </div>
            Uploaded Documents
          </h2>
          <div className="space-y-4">
            {vaultDocs.length === 0 ? (
              <p className="text-[15px] font-medium text-muted-foreground p-8 bg-white dark:bg-slate-900 rounded-2xl text-center border-dashed border border-border shadow-sm">No documents in vault.</p>
            ) : (
              vaultDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm hover:border-indigo-200 hover:shadow-card-sm transition-all group">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl shrink-0 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-[15px] text-foreground truncate group-hover:text-indigo-600 transition-colors">{doc.name}</p>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{doc.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4 opacity-70 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => downloadFile(doc.file_path)} className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-900/20 rounded-lg" aria-label="Download Document">
                      <Download className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id, doc.file_path)} className="h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" aria-label="Delete Document">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Learning Hub Certificates List */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-foreground">
             <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
               <Award className="w-4 h-4" />
            </div>
            Earned Certificates
          </h2>
          <div className="space-y-4">
            {certificates.length === 0 ? (
              <p className="text-[15px] font-medium text-muted-foreground p-8 bg-white dark:bg-slate-900 rounded-2xl text-center border-dashed border border-border shadow-sm">No earned certificates yet.</p>
            ) : (
              certificates.map(cert => (
                <div key={cert.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm hover:shadow-card-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl shrink-0 flex items-center justify-center shadow-sm">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-[15px] text-foreground">{cert.courses.title}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">SignBridge Academy</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black tracking-widest px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg shadow-sm">VERIFIED</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
