const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const PLANES = {
  basico_1_opcion: {
    amount: 900,
    price: 9,
    label: 'Plan básico',
    opciones: 1,
  },
  recomendado_5_opciones: {
    amount: 1400,
    price: 14,
    label: 'Plan recomendado',
    opciones: 5,
  },
  avanzado_7_opciones: {
    amount: 2400,
    price: 24,
    label: 'Plan avanzado',
    opciones: 7,
  },
}

function formatPlanName(planKey) {
  const plan = PLANES[planKey]
  if (!plan) return 'Plan personalizado'
  return `${plan.label} · ${plan.opciones} opciones por comida`
}

async function sendDietEmail({ to, nombre, pdfUrl, plan }) {
  const planNombre = formatPlanName(plan)

  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; color:#1a1a1a;">
      
      <p style="font-size:14px; color:#888;">
        Plan nutricional personalizado
      </p>

      <h1 style="font-size:26px;">
        Tu dieta ya está lista 💪
      </h1>

      <p style="font-size:16px;">
        Hola ${nombre || '👋'},
      </p>

      <p style="font-size:16px; line-height:1.6;">
        Hemos creado tu <strong>${planNombre}</strong> en base a tus respuestas.
      </p>

      <p style="font-size:16px; line-height:1.6;">
        Este plan está diseñado para mejorar tu composición corporal, energía y adherencia sin complicarte.
      </p>

      <div style="margin:20px 0; padding:14px; border:1px solid #111; border-radius:10px; background:#f8f8f8; text-align:center;">
        <strong style="font-size:15px;">
          IMPORTANTE: LEER TODAS LAS INDICACIONES Y RECOMENDACIONES
        </strong>
      </div>

      <div style="text-align:center; margin:30px 0;">
        <a href="${pdfUrl}" 
          style="display:inline-block;padding:14px 22px;background:#111;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">
          Descargar mi plan
        </a>
      </div>

      <p style="font-size:14px; color:#666;">
        Si el botón no funciona, copia y pega este enlace:
      </p>

      <p style="font-size:12px; word-break:break-all; color:#999;">
        ${pdfUrl}
      </p>

      <hr style="margin:30px 0; border:none; border-top:1px solid #eee;" />

      <p style="font-size:14px;">
        Guarda este email para acceder a tu dieta cuando lo necesites.
      </p>

      <p style="margin-top:20px;">
        — Equipo Dieta Make
      </p>
    </div>
  `

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Tu ${planNombre} ya está listo 💪`,
    html,
  })

  if (error) throw error

  return data
}

module.exports = { sendDietEmail }
