const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendEmail({ to, nombre, pdfUrl }) {
  const { data, error } = await resend.emails.send({
    from: 'Dieta Make <hola@dietamake.com>',
    to,
    subject: 'Tu plan ya está listo',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2>Hola ${nombre || 'cliente'},</h2>
        <p>Tu plan en PDF ya está preparado.</p>
        <p>
          Puedes verlo aquí:
          <a href="${pdfUrl}" target="_blank">Abrir PDF</a>
        </p>
        <p>Si el botón no funciona, copia este enlace en tu navegador:</p>
        <p>${pdfUrl}</p>
      </div>
    `,
  })

  if (error) {
    console.error('ERROR ENVIANDO EMAIL:', error)
    throw new Error(error.message || 'No se pudo enviar el email')
  }

  return data
}

module.exports = sendEmail
