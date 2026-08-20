import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { RefreshCw, Check, X, ArrowRight, PlayCircle } from 'lucide-react'

// Reusing fixed vocabulary from Phase 1
const VOCABULARY = [
  'hello', 'thank you', 'please', 'help', 'yes', 'no', 'doctor', 
  'pain', 'emergency', 'water', 'food', 'bathroom', 'family', 
  'friend', 'sorry', 'good', 'bad', 'stop', 'wait', 'more'
]

export default function PracticeFlashcards() {
  const [deck, setDeck] = useState(() => [...VOCABULARY].sort(() => Math.random() - 0.5))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  
  const [stats, setStats] = useState({ known: 0, learning: 0 })

  const currentWord = deck[currentIndex]
  const isComplete = currentIndex >= deck.length

  const handleNext = (knewIt) => {
    setStats(prev => ({
      known: knewIt ? prev.known + 1 : prev.known,
      learning: !knewIt ? prev.learning + 1 : prev.learning
    }))
    setIsFlipped(false)
    setCurrentIndex(prev => prev + 1)
  }

  const restart = () => {
    setDeck([...VOCABULARY].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
    setIsFlipped(false)
    setStats({ known: 0, learning: 0 })
  }

  if (isComplete) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] animate-fade-in-up">
        <Card className="max-w-md w-full text-center p-10 shadow-card-lg border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-b from-white to-slate-50/50">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-200">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <CardTitle className="text-3xl font-black mb-2 text-foreground">Practice Complete!</CardTitle>
          <p className="text-muted-foreground mb-8 font-medium">Great job reviewing your vocabulary today.</p>
          
          <div className="flex justify-center gap-12 mb-10">
            <div className="text-emerald-600 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-2 shadow-sm border border-emerald-100">
                <p className="text-3xl font-black">{stats.known}</p>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Known</p>
            </div>
            <div className="text-amber-600 flex flex-col items-center">
               <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-2 shadow-sm border border-amber-100">
                <p className="text-3xl font-black">{stats.learning}</p>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-800">Learning</p>
            </div>
          </div>
          <Button onClick={restart} className="w-full flex items-center justify-center gap-2 h-14 rounded-xl text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md transition-transform active:scale-95" size="lg">
            <RefreshCw className="w-5 h-5" /> Practice Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center text-sm font-bold bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-border">
        <span className="text-foreground px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">Progress: {currentIndex + 1} / {deck.length}</span>
        <div className="flex gap-4">
          <span className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">Known: {stats.known}</span>
          <span className="text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">Learning: {stats.learning}</span>
        </div>
      </div>

      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
        <div className="bg-indigo-600 h-full transition-all duration-500 ease-out rounded-full relative" style={{ width: `${((currentIndex) / deck.length) * 100}%` }}>
           <div className="absolute inset-0 bg-white dark:bg-slate-900/20 animate-pulse"></div>
        </div>
      </div>

      <div 
        className="relative w-full aspect-[4/3] perspective-1000 cursor-pointer group" 
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`w-full h-full transition-transform duration-700 transform-style-preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front of Card */}
          <Card className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-card-lg bg-white dark:bg-slate-900 group-hover:shadow-card-xl transition-shadow rounded-3xl">
            <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-sm mb-6 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-1.5 rounded-full">Sign this word</p>
            <h2 className="text-7xl font-black capitalize text-foreground drop-shadow-sm">{currentWord}</h2>
            <p className="text-muted-foreground mt-12 text-sm font-medium flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Click card to flip</p>
          </Card>

          {/* Back of Card */}
          <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-3xl p-8">
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-sm mb-6">Did you sign it correctly?</p>
            
            <div className="w-56 h-56 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center mb-10 shadow-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-center backdrop-blur-[1px]">
                 <PlayCircle className="w-12 h-12 text-slate-300" />
               </div>
               <span className="text-sm font-medium text-slate-400 text-center px-6 relative z-10">Video demonstration for <br/><b className="capitalize text-foreground">{currentWord}</b></span>
            </div>

            <div className="flex gap-6 w-full max-w-sm px-4">
              <Button size="lg" className="flex-1 h-16 rounded-2xl text-lg font-bold bg-white dark:bg-slate-900 text-rose-600 border-2 border-rose-100 hover:bg-rose-50 hover:border-rose-200 shadow-sm transition-transform active:scale-95" onClick={(e) => { e.stopPropagation(); handleNext(false); }}>
                <X className="w-6 h-6 mr-2" /> No, I didn't
              </Button>
              <Button size="lg" className="flex-1 h-16 rounded-2xl text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-transform active:scale-95 border-b-4 border-emerald-700 hover:border-emerald-800" onClick={(e) => { e.stopPropagation(); handleNext(true); }}>
                <Check className="w-6 h-6 mr-2" /> Yes, I did!
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
