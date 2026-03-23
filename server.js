require('dotenv').config()

const express = require('express')
const cors = require('cors')
const Stripe = require('stripe')
const supabase = require('./supabase')
const { generatePdfForLead } = require('./pdfService')
const { sendDietEmail } = require('./emailService')

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.use(cors())

function normalizeObjetivo(value) {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'string') return value
  return ''
}

function getPlanConfig(plan) {
  const plans = {
    basico_1_opcion: {
      amount: 900,
      price: 9,
      label: 'Plan básico',
    },
    recomendado_5_opciones: {
      amount: 1400,
      price: 14,
      label: 'Plan recomendado',
    },
    avanzado_7_opciones: {
      amount: 2400,
      price: 24,
      label: 'Plan avanzado',
    },
  }

  return plans[plan] || null
}

// WEBHOOK
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Firma inválida:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const data = session.metadata || {}

    console.log('Pago confirmado:', session.id)
    console.log('Metadata:', data)

    try {
      const { data: insertedLead, error: insertError } = await supabase
        .from('leads_dietas')
        .insert({
          nombre: data.nombre || '',
          email: data.email || '',
          sexo: data.sexo || '',
          edad: Number(data.edad) || 0,
          altura: Number(data.altura) || 0,
          peso: Number(data.peso) || 0,
          objetivo: data.objetivo || '',
          actividad: data.actividad || '',
          sueno: data.sueno || '',
          grasa_abdominal: data.grasa_abdominal || '',
          despertar: data.despertar || '',
          primera_comida: data.primera_comida || '',
          bano: data.bano || '',
          despertares_noche: data.despertares_noche || '',
          comidas: Number(data.comidas) || 0,
          plan: data.plan || '',
          precio: Number(data.precio) || 0,
          pagado: true,
          estado_pdf: 'pending',
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      console.log('Lead guardado con id:', insertedLead.id)

      const filePath = await generatePdfForLead(insertedLead.id)

      const { data: publicUrlData } = supabase
        .storage
        .from('pdfs')
        .getPublicUrl(filePath)

      await supabase
        .from('leads_dietas')
        .update({
          pdf_url: publicUrlData?.publicUrl || null,
        })
        .eq('id', insertedLead.id)

      await sendDietEmail({
        to: data.email,
        nombre: data.nombre,
        pdfUrl: publicUrlData?.publicUrl,
        plan: data.plan,
      })

      console.log('PDF generado y subido:', filePath)
      console.log('PDF URL:', publicUrlData?.publicUrl || 'sin url pública')
    } catch (err) {
      console.error('Error procesando pedido:', err)
    }
  }

  res.json({ received: true })
})

// JSON normal
app.use(express.json())

// CREAR CHECKOUT
app.post('/create-checkout-session', async (req, res) => {
  try {
    const data = req.body

    if (!data.email) {
      return res.status(400).json({ error: 'Email obligatorio' })
    }

    const planConfig = getPlanConfig(data.plan)

    if (!planConfig) {
      return res.status(400).json({ error: 'Plan inválido' })
    }

    const objetivoTexto = normalizeObjetivo(data.objetivo)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: data.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Dieta Make - ${planConfig.label}`,
            },
            unit_amount: planConfig.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}?pago=ok`,
      cancel_url: `${process.env.FRONTEND_URL}?pago=cancelado`,
      metadata: {
        nombre: data.nombre || '',
        email: data.email || '',
        sexo: data.sexo || '',
        edad: String(data.edad || ''),
        altura: String(data.altura || ''),
        peso: String(data.peso || ''),
        objetivo: objetivoTexto,
        actividad: data.actividad || '',
        sueno: data.sueno || '',
        grasa_abdominal: data.grasa_abdominal || '',
        despertar: data.despertar || '',
        primera_comida: data.primera_comida || '',
        bano: data.bano || '',
        despertares_noche: data.despertares_noche || '',
        comidas: String(data.comidas || ''),
        plan: data.plan || '',
        precio: String(planConfig.price),
      },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('ERROR EN CHECKOUT SESSION:', err)
    res.status(500).json({ error: err.message })
  }
})

// RUTA MANUAL DE PRUEBA
app.post('/generate-pdf', async (req, res) => {
  const { formId } = req.body

  try {
    const filePath = await generatePdfForLead(formId)

    return res.json({
      ok: true,
      path: filePath,
    })
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    })
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
