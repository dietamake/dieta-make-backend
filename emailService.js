const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendDietEmail({ to, nombre, pdfUrl, plan }) {
  const html = `
    <div style="font-family: Arial; max-width:600px; margin:auto;">
      <h2>Tu dieta ya está lista 💪</h2>

      <p>Hola ${nombre || ''},</p>

      <p>Ya hemos generado tu plan <strong>${plan}</strong>.</p>

      <p>Puedes descargarlo aquí:</p>

      <a href="${pdfUrl}" 
         style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">
        Descargar PDF
      </a>

      <p style="margin-top:20px;">
        Si el botón no funciona:
        <br/>
        ${pdfUrl}
      </p>

      <p style="margin-top:30px;">
        — Equipo Dieta Make
      </p>
    </div>
  `

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Tu dieta personalizada está lista',
    html,
  })

  if (error) throw error

  return data
}

module.exports = { sendDietEmail }
