import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Award, ShieldCheck } from 'lucide-react'

export default function CommunityProfile() {
  const { user, profile } = useAuth()
  
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState('')
  const [location, setLocation] = useState('')
  const [isMentor, setIsMentor] = useState(false)
  const [mentorAvail, setMentorAvail] = useState('')
  const [saving, setSaving] = useState(false)
  
  const [skillBadges, setSkillBadges] = useState([])
  const [certificates, setCertificates] = useState([])

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '')
      setInterests(profile.interests || '')
      setLocation(profile.location || '')
      setIsMentor(profile.is_mentor || false)
      setMentorAvail(profile.mentor_availability || '')
      fetchBadges()
    }
  }, [profile])

  const fetchBadges = async () => {
    // Employer Endorsed Badges
    const { data: bData } = await supabase.from('skill_badges').select('*').eq('user_id', user.id)
    if (bData) setSkillBadges(bData)

    // Platform Verified Certificates
    const { data: cData } = await supabase.from('certificates').select('*, courses(title)').eq('user_id', user.id)
    if (cData) setCertificates(cData)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    const { error } = await supabase
      .from('profiles')
      .update({
        bio,
        interests,
        location,
        is_mentor: isMentor,
        mentor_availability: mentorAvail
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      alert("Error saving profile: " + error.message)
    } else {
      alert("Profile updated successfully!")
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* Badges Section */}
      {(skillBadges.length > 0 || certificates.length > 0) && (
        <Card className="border-indigo-50 dark:border-indigo-900/30 shadow-card-sm bg-gradient-to-br from-indigo-50/50 to-white">
          <CardHeader className="pb-2 border-b border-indigo-100 dark:border-indigo-900/50/50">
            <CardTitle className="text-lg flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-100">
              <ShieldCheck className="w-5 h-5 text-indigo-600" /> Verified Skills & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              {certificates.map(cert => (
                <div key={cert.id} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl shadow-sm text-sm font-bold">
                  <Award className="w-4 h-4" /> 
                  <span className="uppercase text-[10px] opacity-70 tracking-wider mr-1 font-bold">Platform Verified:</span>
                  {cert.courses.title}
                </div>
              ))}
              {skillBadges.map(badge => (
                <div key={badge.id} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl shadow-sm text-sm font-bold">
                  <Award className="w-4 h-4" /> 
                  <span className="uppercase text-[10px] opacity-70 tracking-wider mr-1 font-bold">Employer Endorsed:</span>
                  {badge.badge_name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card-sm border-indigo-50 dark:border-indigo-900/30 overflow-hidden">
        <CardHeader className="bg-white dark:bg-slate-900 border-b border-border py-5">
          <CardTitle className="text-xl font-bold">Your Community Profile</CardTitle>
        </CardHeader>
        <CardContent className="bg-slate-50/50 dark:bg-slate-800/50 p-6">
          <form id="profile-form" onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Bio</label>
              <textarea 
                className="w-full min-h-[120px] rounded-xl border border-input bg-white dark:bg-slate-900 px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                placeholder="Tell the community about yourself..."
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
            </div>
            <FormField label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. New York, NY" />
            <FormField label="Interests" value={interests} onChange={e => setInterests(e.target.value)} placeholder="e.g. Technology, ISL, Sports" />
            
            <div className="pt-6 border-t border-border mt-6">
              <h3 className="font-bold text-lg mb-3">Mentorship Program</h3>
              <div className="flex items-center gap-3 mb-5 bg-white dark:bg-slate-900 p-4 rounded-xl border border-border shadow-sm">
                <input 
                  type="checkbox" 
                  id="is_mentor" 
                  checked={isMentor} 
                  onChange={e => setIsMentor(e.target.checked)} 
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor="is_mentor" className="text-sm font-bold cursor-pointer">I want to be a mentor in the community</label>
              </div>
              
              {isMentor && (
                <div className="animate-fade-in-up">
                  <FormField 
                    label="Mentor Availability & Topics" 
                    value={mentorAvail} 
                    onChange={e => setMentorAvail(e.target.value)} 
                    placeholder="e.g. Available weekends for career advice in tech" 
                  />
                </div>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-white dark:bg-slate-900 border-t border-border p-5">
          <Button type="submit" form="profile-form" disabled={saving} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold text-base">
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
