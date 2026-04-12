import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record 

    const { name, email, message } = record;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'MN Studio <onboarding@resend.dev>', 
        to: ['pttich1989@gmail.com'], 
        subject: `🚀 [Website MN Studio] Có liên hệ mới từ ${name}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2 style="color: #333;">Bạn có tin nhắn mới từ Website MN Studio</h2>
            <p><strong>Khách hàng:</strong> ${name}</p>
            <p><strong>Email khách:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Nội dung lời nhắn:</strong></p>
            <div style="background-color: #f5f5f5; padding: 15px; border-left: 5px solid #333; margin-top: 10px;">
              ${message.replace(/\n/g, '<br/>')}
            </div>
          </div>
        `
      })
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
