import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Fetch seeded content
    const { data: schemes } = await supabaseClient.from('schemes').select('*')
    const { data: ngos } = await supabaseClient.from('ngos').select('*')

    const contextStr = `
      AVAILABLE SCHEMES:
      ${schemes?.map(s => `- ${s.name}: ${s.description} (Eligibility: ${s.eligibility}, Apply: ${s.how_to_apply})`).join('\n')}

      AVAILABLE NGOs:
      ${ngos?.map(n => `- ${n.name}: ${n.description} (Focus: ${n.focus_area}, Location: ${n.location}, Contact: ${n.contact_info})`).join('\n')}
    `

    const systemPrompt = `
      You are SignBridge AI, a helpful assistant for deaf and hard-of-hearing individuals. 
      You MUST answer the user's question using ONLY the following context about Government Schemes and NGOs. 
      Do NOT use outside knowledge about real-world government policies, laws, or NGOs not listed here.
      If the user asks something that cannot be answered using this context, explicitly state: 
      "I do not have information about that in my database."
      
      CONTEXT:
      ${contextStr}
      
      USER QUESTION: ${query}
    `

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }]
      })
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const answer = data.candidates[0].content.parts[0].text

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
