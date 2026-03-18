require('dotenv').config()

const express = require('express')
const cors = require('cors')
const Stripe = require('stripe')
const supabase = require('./supabase')
const { generatePdfForLead } = require('./pdfService')

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.use(cors())

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
          preferencias: data.preferencias || '',
          entrenas: data.entrenas || '',
          dias_entreno: Number(data.dias_entreno) || 0,
          tipo_entreno: data.tipo_entreno || '',
          comidas: Number(data.comidas) || 0,
          no_gustan: data.no_gustan || '',
          alergias: data.alergias || '',
          plan: data.plan || '',
          precio: Number(data.precio) || 0,
          pagado: true,
          estado_pdf: 'pendiente',
        })
        .select('id')
        .single()

      if (insertError) {
        throw insertError
      }

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

      console.log('PDF generado y subido:', filePath)
      console.log('PDF URL:', publicUrlData?.publicUrl || 'sin url pública')
    } catch (err) {
      console.error('Error procesando pedido:', err)
    }
  }

  res.json({ received: true })
})

app.use(express.json())

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
success_url: `${process.env.FRONTEND_URL}`,
cancel_url: `${process.env.FRONTEND_URL}`,
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
