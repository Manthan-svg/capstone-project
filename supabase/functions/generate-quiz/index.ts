import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    const prompt = `
    You are an expert ASL instructor. Generate a 3-question multiple choice quiz based strictly on the following lesson text.
    Return ONLY a raw JSON array of objects (do not wrap in markdown \`\`\`json blocks).
    Each object must have:
    - "question": a string
    - "options": an array of 4 string options
    - "correctIndex": an integer (0-3) representing the correct option.
    
    Lesson text: "${text}"
    `

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    })

    const data = await response.json()
    if (data.error) {
      throw new Error(data.error.message)
    }

    let generatedText = data.candidates[0].content.parts[0].text
    
    // Clean up potential markdown formatting if the model disobeys
    generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim()
    
    let quiz
    try {
      quiz = JSON.parse(generatedText)
    } catch (e) {
      throw new Error('Failed to parse AI output as JSON: ' + generatedText)
    }

    return new Response(JSON.stringify({ quiz }), {
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
