const supabase = require('./supabase')
const buildHtml = require('./buildHtml')
const generatePdf = require('./generatePdf')
const sendEmail = require('./sendEmail')

function getDietPlan(data) {
  const objetivo = (data.objetivo || '').toLowerCase()
  const comidasDia = Number(data.comidas || 3)

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

  try {
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
      throw uploadError
    }

    const { data: publicUrlData } = supabase.storage
      .from('pdfs')
      .getPublicUrl(filePath)

    const pdfUrl = publicUrlData.publicUrl

    await supabase
      .from('leads_dietas')
      .update({
        estado_pdf: 'done',
        pdf_path: filePath,
        pdf_url: pdfUrl,
        pdf_generado_at: new Date().toISOString(),
      })
      .eq('id', formId)

    if (data.email) {
      await sendEmail({
        to: data.email,
        nombre: data.nombre,
        pdfUrl,
      })
    } else {
      console.log(`El lead ${formId} no tiene email, no se envió el PDF`)
    }

    return {
      filePath,
      pdfUrl,
    }
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
