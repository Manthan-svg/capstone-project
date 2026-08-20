import { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { Sparkles, Send, User, Bot, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AIAssistant() {
  const { session } = useAuth()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm the SignBridge AI Assistant. You can ask me questions about government schemes, disability benefits, and our supported NGOs. How can I help you today?" }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userQuery = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userQuery }])
    setIsLoading(true)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is missing')

      const prompt = `You are the SignBridge AI Assistant, a specialized helper for the Deaf and Hard of Hearing community. 
Your knowledge base is strictly focused on Government Disability Schemes, Accessibility Rights, and supported NGOs (like deaf-support organizations).
Answer the following user query accurately and kindly. Keep your answer concise (2-4 short paragraphs maximum) and easy to read.

User Query: "${userQuery}"`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5 }
        })
      })

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      const aiText = result.candidates[0].content.parts[0].text
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }])
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error connecting to the knowledge base. Please check your API key or try again later." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in-up flex justify-center pb-8">
      <Card className="w-full max-w-4xl h-[650px] flex flex-col border-indigo-100 dark:border-indigo-900/50 shadow-card-md rounded-3xl overflow-hidden bg-white dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-violet-600 border-none py-6 shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white dark:bg-slate-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <CardTitle className="text-2xl flex items-center gap-3 text-white font-black drop-shadow-sm z-10 relative">
            <div className="p-2 bg-white dark:bg-slate-900/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            SignBridge AI Assistant
          </CardTitle>
          <p className="text-sm text-indigo-100 mt-2 font-medium z-10 relative pl-[52px]">
            Powered by Gemini. Grounded exclusively in verified SignBridge data.
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`px-5 py-4 text-[15px] font-medium leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-white dark:bg-slate-900 border border-border text-foreground rounded-2xl rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-[85%] animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="px-5 py-4 bg-white dark:bg-slate-900 border border-border rounded-2xl rounded-tl-sm flex items-center shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-slate-900 border-t border-border shrink-0 flex gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
          <input
            type="text"
            className="flex-1 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 px-6 py-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:bg-slate-900 transition-all shadow-inner"
            placeholder="Ask about disability schemes or NGOs..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="w-14 h-14 rounded-2xl shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-transform active:scale-95" disabled={!input.trim() || isLoading} aria-label="Send message">
            <Send className="w-5 h-5 ml-0.5" />
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  )
}
