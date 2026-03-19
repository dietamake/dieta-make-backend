const supabase = require('./supabase')
const buildHtml = require('./buildHtml')
const generatePdf = require('./generatePdf')

function formatObjetivo(objetivo) {
  if (Array.isArray(objetivo)) return objetivo.join(', ')
  if (typeof objetivo === 'string') return objetivo
  return ''
}

function calcularCalorias(data) {
  const { sexo, edad, peso, altura, actividad, sueno, grasa } = data

  // 1. Metabolismo basal
  let bmr = 0

  if (sexo === 'hombre') {
    bmr = 10 * peso + 6.25 * altura - 5 * edad + 5
  } else if (sexo === 'mujer') {
    bmr = 10 * peso + 6.25 * altura - 5 * edad - 161
  }

  // 2. Factor de actividad
  const factoresActividad = {
    sedentario: 1.2,
    ligero: 1.4,
    moderado: 1.55,
    alto: 1.75,
  }

  let calorias = bmr * (factoresActividad[actividad] || 1.2)

  // 3. Ajuste por nivel de grasa
  const factoresGrasa = {
    muy_tapado: 0.80,
    normal: 0.85,
    marcado: 0.90,
  }

  calorias = calorias * (factoresGrasa[grasa] || 0.85)

  // 4. Ajuste por sueño
  if (sueno < 6) calorias = calorias * 0.95
  if (sueno > 8) calorias = calorias * 1.02

  // 5. Déficit fijo
  calorias = calorias - 300

  // 6. Límite mínimo
  if (sexo === 'hombre' && calorias < 1600) calorias = 1600
  if (sexo === 'mujer' && calorias < 1300) calorias = 1300

  return Math.round(calorias)
}

function getDietPlan(data) {
  const comidasDia = Math.min(Math.max(Number(data.comidasDia) || 3, 3), 6)

  let tituloPlan = 'Plan nutricional personalizado'
  let comidasPlan = [
    'Desayuno: yogur griego + avena + fruta',
    'Comida: pollo + arroz + verduras',
    'Cena: pescado blanco o huevos + patata cocida + verduras',
  ]

  if (comidasDia === 4) {
    comidasPlan.splice(1, 0, 'Media mañana: fruta + yogur natural')
  }

  if (comidasDia === 5) {
    comidasPlan.splice(1, 0, 'Media mañana: fruta + yogur natural')
    comidasPlan.splice(3, 0, 'Merienda: tortitas de arroz + pavo')
  }

  if (comidasDia === 6) {
    comidasPlan = [
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
    comidasPlan,
  }
}

function normalizeLeadData(data) {
  return {
    ...data,
    objetivo: formatObjetivo(data.objetivo),
    comidasDia: Number(data.comidasDia || data.comidas) || 3,
    comidas: Number(data.comidas) || 3,
    edad: Number(data.edad) || 0,
    altura: Number(data.altura) || 0,
    peso: Number(data.peso) || 0,
    precio: Number(data.precio) || 0,
    sueno: Number(data.sueno) || 0,
    sexo: typeof data.sexo === 'string' ? data.sexo.toLowerCase() : '',
    actividad: typeof data.actividad === 'string' ? data.actividad.toLowerCase() : '',
    grasa: typeof data.grasa === 'string' ? data.grasa.toLowerCase() : '',
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

    const calorias = calcularCalorias(normalizedData)
    const dietPlan = getDietPlan(normalizedData)

    const html = buildHtml({
      ...normalizedData,
      calorias,
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
