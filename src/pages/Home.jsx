import { Link } from 'react-router-dom'
import { Video, Mic, Send } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

// Assets
import heroAvatar from '../assets/hero-avatar.png'
import handSigning from '../assets/hand-signing.png'
import earListening from '../assets/ear-listening.png'
import emptyChat from '../assets/empty-chat.png'

export default function Home() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
      
      {/* Hero Banner Section */}
      <Card className="border-indigo-50 dark:border-indigo-900/30 shadow-card-sm relative z-10" key="home-hero-banner">
        <CardContent className="p-0 relative flex flex-col md:flex-row items-stretch min-h-[320px] bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-xl">
          
          <div className="flex-1 p-8 md:p-12 z-30 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 leading-tight">
              Break <span className="text-indigo-600">Barriers</span>.<br/>
              Start Communicating.
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-md">
              Real-time sign language translation for a more inclusive world.
            </p>
            <div>
              <Link to="/core">
                <Button size="lg" className="rounded-full shadow-md hover:shadow-lg transition-all pl-6 pr-4 gap-2">
                  Start a Conversation
                  <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-900/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full border-2 border-white" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex-1 relative w-full h-[280px] md:h-auto md:min-h-[250px] mt-2 md:mt-0 overflow-visible z-20">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-bl from-indigo-100/50 to-transparent pointer-events-none rounded-b-xl md:rounded-b-none md:rounded-r-xl" />
            
            {/* Avatar Image */}
            <div className="absolute bottom-0 inset-x-0 md:inset-0 flex items-end justify-center md:items-center md:justify-end pointer-events-none">
              <img 
                src={heroAvatar} 
                alt="Friendly 3D Avatar signing" 
                className="w-auto h-full md:h-[120%] max-h-[280px] md:max-h-[400px] object-contain object-bottom animate-float md:drop-shadow-2xl md:mr-10 transform origin-bottom opacity-50 md:opacity-85 transition-opacity" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dual Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        
        {/* Deaf User Card */}
        <Card className="overflow-hidden hover:shadow-card-md transition-shadow group border-indigo-50 dark:border-indigo-900/30">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between h-full bg-white dark:bg-slate-900 relative">
            <div className="flex flex-col gap-4 w-full md:max-w-[60%] z-10">
              <h3 className="text-xl font-bold text-foreground">Deaf User (Sign-to-Text)</h3>
              <p className="text-sm text-muted-foreground pr-24 md:pr-0">
                Use your camera to sign and see the text instantly.
              </p>
              <div className="mt-2 flex gap-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <Link to="/core">
                  <Button className="rounded-lg shadow-sm">Start Signing</Button>
                </Link>
              </div>
            </div>
            
            <div className="absolute right-0 md:-right-4 bottom-0 md:top-1/2 md:-translate-y-1/2 w-32 h-32 md:w-48 md:h-48 opacity-90 group-hover:scale-105 transition-transform duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50" />
              <img src={handSigning} alt="Hand Signing" className="w-full h-full object-contain object-bottom md:object-center drop-shadow-xl relative z-10" />
            </div>
          </CardContent>
        </Card>

        {/* Hearing User Card */}
        <Card className="overflow-hidden hover:shadow-card-md transition-shadow group border-indigo-50 dark:border-indigo-900/30">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between h-full bg-white dark:bg-slate-900 relative">
            <div className="flex flex-col gap-4 w-full md:max-w-[60%] z-10">
              <h3 className="text-xl font-bold text-foreground">Hearing User (Speech-to-Sign)</h3>
              <p className="text-sm text-muted-foreground pr-24 md:pr-0">
                Speak and see the sign language in real-time.
              </p>
              <div className="mt-2 flex gap-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <Link to="/core">
                  <Button className="rounded-lg bg-purple-600 hover:bg-purple-700 shadow-sm text-white">Start Speaking</Button>
                </Link>
              </div>
            </div>
            
            <div className="absolute right-0 md:-right-4 bottom-0 md:top-1/2 md:-translate-y-1/2 w-32 h-32 md:w-48 md:h-48 opacity-90 group-hover:scale-105 transition-transform duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-purple-100 rounded-full blur-3xl opacity-50" />
              <img src={earListening} alt="Ear Listening" className="w-full h-full object-contain object-bottom md:object-center drop-shadow-xl relative z-10" />
            </div>
          </CardContent>
        </Card>
        
      </div>

      {/* Conversation Preview Section */}
      <Card className="animate-fade-in-up border-indigo-50 dark:border-indigo-900/30 shadow-card-sm" style={{ animationDelay: '200ms' }}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold">Conversation</h3>
        </div>
        <CardContent className="p-0">
          
          <div className="h-[250px] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/50">
            <div className="w-24 h-24 mb-4 relative">
              <img src={emptyChat} alt="Empty Conversation" className="w-full h-full object-contain animate-float" />
            </div>
            <p className="font-semibold text-foreground text-center">Your conversation will appear here</p>
            <p className="text-sm text-muted-foreground mt-1">Start signing or speaking to begin</p>
          </div>
          
          <div className="p-4 border-t border-border bg-white dark:bg-slate-900 rounded-b-xl">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                disabled
              />
              <button disabled className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-600 transition-colors opacity-50 cursor-not-allowed">
                <Send className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>
  )
}
