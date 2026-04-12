export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    const record = payload.record; // Dữ liệu từ Supabase Webhook
    
    if (!record) {
      return res.status(400).json({ error: 'No record object found in payload' });
    }

    const { name, email, message } = record;

    // Gọi API Resend
    const resendReq = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'MN Studio <onboarding@resend.dev>', // Email mặc định của Resend để test
        to: ['pttich1989@gmail.com'], // Gửi tới hộp thư của bạn
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
    });

    const data = await resendReq.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
