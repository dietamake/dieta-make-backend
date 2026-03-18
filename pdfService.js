const supabase = require('./supabase')
const buildHtml = require('./buildHtml')
const generatePdf = require('./generatePdf')

function getDietPlan(data) {
  const objetivo = (data.objetivo || '').toLowerCase()
  const comidasDia = Number(data.comidas_dia || 3)

  let tituloPlan = 'Plan general'
  let comidas = []

  if (objetivo.includes('perder')) {
    tituloPlan = 'Plan de pérdida de grasa'
    comidas = [
      'Desayuno: yogur + avena + fruta',
      'Comida: pollo + arroz + verduras',
      'Cena: tortilla + ensalada'
    ]
  } else if (objetivo.includes('ganar')) {
    tituloPlan = 'Plan de ganancia muscular'
    comidas = [
      'Desayuno: avena + proteína + plátano',
      'Comida: ternera + pasta + verduras',
      'Cena: salmón + patata'
    ]
  } else {
    tituloPlan = 'Plan de mantenimiento'
    comidas = [
      'Desayuno: tostadas + huevos',
      'Comida: arroz + pollo',
      'Cena: pescado + verduras'
    ]
  }

  if (comidasDia === 4) {
    comidas.splice(1, 0, 'Media mañana: fruta + yogur')
  }

  if (comidasDia >= 5) {
    comidas.splice(1, 0, 'Media mañana: fruta + yogur')
    comidas.splice(3, 0, 'Merienda: tortitas de arroz + pavo')
  }

  return {
    tituloPlan,
    comidas,
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

  const dietPlan = getDietPlan(data)

  const html = buildHtml({
    ...data,
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
    await supabase
      .from('leads_dietas')
      .update({ estado_pdf: 'error' })
      .eq('id', formId)

    throw uploadError
  }

  await supabase
    .from('leads_dietas')
    .update({
      estado_pdf: 'done',
      pdf_path: filePath,
    })
    .eq('id', formId)

  return filePath
}

module.exports = {
  generatePdfForLead,
}
