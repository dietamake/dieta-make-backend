const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendDietEmail({ to, nombre, pdfUrl, plan }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; color:#1a1a1a;">
      
      <p style="font-size:14px; color:#888;">Plan nutricional personalizado</p>

      <h1 style="font-size:26px; margin-bottom:10px;">
        Tu dieta ya está lista 💪
      </h1>

      <p style="font-size:16px;">
        Hola ${nombre || '👋'},
      </p>

      <p style="font-size:16px; line-height:1.5;">
        Hemos creado tu plan <strong>${plan}</strong> en base a tus respuestas.
      </p>

      <p style="font-size:16px; line-height:1.5;">
        Este plan está diseñado para ayudarte a mejorar tu composición corporal, energía y adherencia sin complicarte.
      </p>

      <div style="text-align:center; margin:30px 0;">
        <a href="${pdfUrl}" 
          style="display:inline-block;padding:14px 22px;background:#111;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">
          Descargar mi plan
        </a>
      </div>

      <p style="font-size:14px; color:#666;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:
      </p>

      <p style="font-size:12px; word-break:break-all; color:#999;">
        ${pdfUrl}
      </p>

      <hr style="margin:30px 0; border:none; border-top:1px solid #eee;" />

      <p style="font-size:14px; line-height:1.5;">
        👉 Consejo: guarda este email para acceder a tu dieta cuando lo necesites.
      </p>

      <p style="font-size:14px; margin-top:20px;">
        — Equipo Dieta Make
      </p>

    </div>
  `

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Tu plan ya está listo 💪',
    html,
  })

  if (error) throw error

  return data
}

module.exports = { sendDietEmail }
