import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    // The webhook payload from Supabase
    const payload = await req.json()
    const { record } = payload

    if (!record || !record.user_id) {
      return new Response("Invalid payload", { status: 400 })
    }

    // Initialize Supabase client to fetch the user's emergency contact
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, emergency_contact_email')
      .eq('id', record.user_id)
      .single()

    if (error || !profile?.emergency_contact_email) {
      console.error("Failed to find emergency contact for user:", record.user_id)
      return new Response("No emergency contact found", { status: 200 }) // Return 200 so webhook doesn't retry
    }

    const { lat, lng } = record
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    const userName = profile.full_name || 'A user'

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'SignBridge AI <emergency@signbridge-ai.com>',
        to: [profile.emergency_contact_email],
        subject: `🚨 EMERGENCY SOS ALERT: ${userName}`,
        html: `
          <h1>Emergency SOS Alert</h1>
          <p><strong>${userName}</strong> has triggered an emergency SOS from the SignBridge AI application.</p>
          <p><strong>Last Known Location:</strong> <a href="${mapsLink}">View on Google Maps</a></p>
          <p>Please attempt to contact them or send emergency services to their location immediately.</p>
        `
      })
    })

    const data = await res.json()

    if (res.ok) {
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    } else {
      console.error("Resend API error:", data)
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      })
    }

  } catch (err) {
    console.error("Error processing webhook:", err.message)
    return new Response(err.message, { status: 500 })
  }
})
