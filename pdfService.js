const supabase = require('./supabase')
const buildHtml = require('./buildHtml')
const generatePdf = require('./generatePdf')

function formatObjetivo(objetivo) {
  if (Array.isArray(objetivo)) return objetivo.join(', ')
  if (typeof objetivo === 'string') return objetivo
  return ''
}

function getDietPlan(data) {
  const comidasDia = Math.min(Math.max(Number(data.comidas) || 3, 3), 6)

  let tituloPlan = 'Plan nutricional personalizado'
  let comidas = [
    'Desayuno: yogur griego + avena + fruta',
    'Comida: pollo + arroz + verduras',
    'Cena: pescado blanco o huevos + patata cocida + verduras',
  ]

  if (comidasDia === 4) {
    comidas.splice(1, 0, 'Media mañana: fruta + yogur natural')
  }

  if (comidasDia === 5) {
    comidas.splice(1, 0, 'Media mañana: fruta + yogur natural')
    comidas.splice(3, 0, 'Merienda: tortitas de arroz + pavo')
  }

  if (comidasDia === 6) {
    comidas = [
      'Desayuno: yogur griego + avena + fruta',
      'Media mañana: fruta + yogur natural',
      'Comida: pollo + arroz + verduras',
      'Merienda: tortitas de arroz + pavo',
      'Cena: pescado blanco o huevos + patata cocida + verduras',
      'Recena: queso fresco batido o yogur alto en proteína',
    ]
  }

  return {
    tituloPlan,
    comidas,
  }
}

function normalizeLeadData(data) {
  return {
    ...data,
    objetivo: formatObjetivo(data.objetivo),
    comidas: Number(data.comidas) || 3,
    edad: Number(data.edad) || 0,
    altura: Number(data.altura) || 0,
    peso: Number(data.peso) || 0,
    precio: Number(data.precio) || 0,
  }
}

async function generatePdfForLead(formId) {
  const { data, error } = await supabase
    .from('leads_dietas')
    .select('*')
    .eq('id', formId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('No se encontró ninguna fila con ese id')

  await supabase
    .from('leads_dietas')
    .update({ estado_pdf: 'generating' })
    .eq('id', formId)

  try {
    const normalizedData = normalizeLeadData(data)
    const dietPlan = getDietPlan(normalizedData)

    const html = buildHtml({
      ...normalizedData,
      ...dietPlan,
    })

    const pdfBuffer = await generatePdf(html)
    const filePath = `dietas/${formId}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    await supabase
      .from('leads_dietas')
      .update({
        estado_pdf: 'done',
        pdf_path: filePath,
        pdf_generado_at: new Date().toISOString(),
      })
      .eq('id', formId)

    return filePath
  } catch (err) {
    await supabase
      .from('leads_dietas')
      .update({ estado_pdf: 'error' })
      .eq('id', formId)

    console.error('ERROR GENERANDO PDF:', err)
    throw err
  }
}

module.exports = {
  generatePdfForLead,
}
