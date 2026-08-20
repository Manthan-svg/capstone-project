import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { BookOpen, CheckCircle, PlayCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CourseCatalog() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [progressData, setProgressData] = useState({}) // course_id -> { total, completed }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // 1. Fetch all courses
    const { data: cData } = await supabase.from('courses').select('*').order('created_at', { ascending: true })
    if (!cData) return
    setCourses(cData)

    // 2. Fetch all lessons to get total count per course
    const { data: lData } = await supabase.from('lessons').select('id, course_id')
    
    // 3. Fetch user progress
    const { data: pData } = await supabase.from('user_progress').select('lesson_id').eq('user_id', user.id)
    const completedLessonIds = new Set(pData?.map(p => p.lesson_id) || [])

    // Calculate progress map
    const progMap = {}
    cData.forEach(c => {
      const courseLessons = lData?.filter(l => l.course_id === c.id) || []
      const completed = courseLessons.filter(l => completedLessonIds.has(l.id)).length
      progMap[c.id] = {
        total: courseLessons.length,
        completed: completed
      }
    })
    setProgressData(progMap)
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
      {courses.map(course => {
        const prog = progressData[course.id] || { total: 0, completed: 0 }
        const progressPercent = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0
        const isComplete = prog.total > 0 && prog.completed === prog.total

        return (
          <Card key={course.id} className="flex flex-col shadow-card-sm hover:shadow-card-md hover:-translate-y-1 transition-all duration-300 border-indigo-50 dark:border-indigo-900/30 overflow-hidden group">
            <CardHeader className="pb-3 border-b border-border bg-white dark:bg-slate-900 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 flex items-center justify-center mb-4 shadow-sm border border-indigo-100 dark:border-indigo-900/50 group-hover:scale-105 transition-transform">
                <BookOpen className="w-7 h-7 text-indigo-600" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider w-fit px-3 py-1 rounded-full mb-3 shadow-sm ${
                course.level === 'Beginner' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                course.level === 'Intermediate' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 border border-indigo-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {course.level}
              </span>
              <CardTitle className="line-clamp-2 text-xl font-bold">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-6 p-6 bg-slate-50/50 dark:bg-slate-800/50">
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{course.description}</p>
              
              <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-border shadow-sm">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span className="text-indigo-600">{prog.completed} / {prog.total} Lessons</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-indigo-600 h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden" style={{ width: `${progressPercent}%` }}>
                    <div className="absolute inset-0 bg-white dark:bg-slate-900/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-5 bg-white dark:bg-slate-900 border-t border-border">
              {isComplete ? (
                <Button variant="outline" className="w-full rounded-xl h-11 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold shadow-sm" onClick={() => navigate(`/learning/course/${course.id}`)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Review Course
                </Button>
              ) : (
                <Button className="w-full rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition-transform active:scale-95" onClick={() => navigate(`/learning/course/${course.id}`)}>
                  <PlayCircle className="w-4 h-4 mr-2" /> {prog.completed > 0 ? 'Continue Learning' : 'Start Course'}
                </Button>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
