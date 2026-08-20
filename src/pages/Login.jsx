import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { Button } from '../components/ui/Button'
import { SignAvatar } from '../components/SignAvatar'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [communityType, setCommunityType] = useState('Deaf User')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const ROLES = ['Deaf User', 'Hearing User', 'Doctor', 'Hospital', 'Employer', 'Interpreter']

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: communityType, // TEMPORARY FOR TESTING: Auto-assign role based on selection
              community_type: communityType, 
            }
          }
        })
        if (error) throw error
        
        if (data.session) {
          // Email confirmation is disabled, user is logged in instantly
          navigate('/')
        } else {
          // Email confirmation is enabled
          alert('Check your email for the confirmation link!')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })
      if (error) throw error
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-background flex flex-col md:flex-row">
      {/* Left Branding Panel */}
      <div className="hidden md:flex flex-col flex-1 bg-slate-50 relative overflow-hidden">
        {/* Minimal Logo Top Left */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shadow-sm border border-indigo-100">
            <span className="text-indigo-600 font-bold text-sm leading-none">✨</span>
          </div>
          <span className="text-sm font-semibold text-slate-700 tracking-tight">SignBridge AI</span>
        </div>
        
        {/* Centered Avatar Fallback (using real SignAvatar component) */}
        <div className="relative z-10 flex-1 flex items-center justify-center w-full h-full p-4 min-h-0">
          <SignAvatar 
            idleMode={true} 
            fallbackType="hearing"
            className="w-[300px] h-[300px] md:w-[400px] md:h-[400px]" 
          />
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 bg-background relative min-h-0">
        <div className="w-full max-w-sm space-y-4 relative z-10 animate-fade-in-up">
          <div className="text-center md:text-left mb-4">
            <div className="flex justify-center md:hidden mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-800 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl leading-none">✨</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp ? 'Sign up to get started with SignBridge AI' : 'Sign in to your account to continue'}
            </p>
          </div>

          <Card className="border-indigo-50 shadow-card-lg overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-600" />
            <CardContent className="p-4 sm:p-6 pb-2">
              <form onSubmit={handleAuth} className="space-y-3">
                {isSignUp && (
                  <div className="animate-fade-in-up flex flex-col gap-3">
                    <FormField
                      label="Full Name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                    <div className="grid w-full items-center gap-1.5">
                      <label className="text-xs font-medium leading-none">I identify as</label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:border-indigo-300 transition-colors cursor-pointer"
                        value={communityType}
                        onChange={(e) => setCommunityType(e.target.value)}
                        required
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                
                <FormField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                />
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none">Password</label>
                    {!isSignUp && (
                      <a href="#" className="text-xs text-indigo-600 hover:underline">Forgot password?</a>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:border-indigo-300 transition-colors"
                  />
                </div>

                {error && (
                  <div className="p-2 rounded-md bg-red-50 text-red-600 text-xs font-medium border border-red-100 animate-scale-in">
                    {error}
                  </div>
                )}
                
                <Button type="submit" className="w-full h-10 text-sm shadow-sm mt-1" disabled={loading}>
                  {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium">Or continue with</span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-sm shadow-sm transition-all" 
                onClick={handleGoogleAuth} 
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Google
              </Button>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t border-border/50 bg-muted/30 py-4">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus:outline-none focus:underline transition-colors"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
