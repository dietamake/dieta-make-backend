require('dotenv').config()

const express = require('express')
const cors = require('cors')
const Stripe = require('stripe')
const { generatePdfForLead } = require('./pdfService')

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.use(cors())

// 1. webhook
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
    const data = session.metadata

    console.log('Pago confirmado:', session.id)
    console.log('Metadata:', data)

    try {
      // Esto seguramente habrá que adaptarlo luego a tu pdfService.js
      // porque quizá espera un formId y no un objeto completo
      // de momento lo dejamos comentado para que Stripe abra bien

      // await generatePdfForLead(data)

      console.log('Pago procesado correctamente')
    } catch (err) {
      console.error('Error generando PDF:', err)
    }
  }

  res.json({ received: true })
})

// 2. json normal
app.use(express.json())

// 3. crear pago
app.post('/create-checkout-session', async (req, res) => {
  try {
    const data = req.body

    const precios = {
      '1_semana': 300,
      '1_mes': 1000,
      '3_meses': 2500,
    }

    const amount = precios[data.plan]

    if (!amount) {
      return res.status(400).json({ error: 'Plan inválido' })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: data.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Dieta Make - ${data.plan}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/gracias',
      cancel_url: 'http://localhost:3000/cancelado',
      metadata: {
        nombre: data.nombre || '',
        email: data.email || '',
        sexo: data.sexo || '',
        edad: String(data.edad || ''),
        altura: String(data.altura || ''),
        peso: String(data.peso || ''),
        objetivo: data.objetivo || '',
        actividad: data.actividad || '',
        preferencias: Array.isArray(data.preferencias)
          ? data.preferencias.join(', ')
          : String(data.preferencias || ''),
        entrenas: data.entrenas || '',
        dias_entreno: String(data.dias_entreno || ''),
        tipo_entreno: data.tipo_entreno || '',
        comidas: String(data.comidas || ''),
        no_gustan: data.no_gustan || '',
        alergias: data.alergias || '',
        plan: data.plan || '',
        precio: String(data.precio || ''),
      },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('ERROR EN CHECKOUT SESSION:', err)
    res.status(500).json({ error: err.message })
  }
})

// 4. tu ruta actual
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
