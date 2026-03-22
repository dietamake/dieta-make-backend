const supabase = require('./supabase')
const buildHtml = require('./buildHtml')
const generatePdf = require('./generatePdf')

const PLAN_3_BASE = {
  totalKcal: 2470,
  meals: [
    { id: 1, nombre: 'Comida 1', baseKcal: 820, pct: 0.33 },
    { id: 2, nombre: 'Comida 2', baseKcal: 600, pct: 0.24 },
    { id: 3, nombre: 'Comida 3', baseKcal: 1050, pct: 0.43 },
  ],
}

const FRUTAS = {
  caqui: '1 caqui',
  manzana: '1 manzana',
  naranja: '1 naranja grande',
  pera: '1 pera',
  platano: '1 plátano',
  kiwi: '2 kiwis',
  mandarinas: '3 mandarinas',
}

const FRUTA_DEFAULT = 'manzana'

const CARB_DB = {
  fruta_unidad: {
    kcal: 100,
    carbs: 25,
    unit: 'unidad',
  },

  miel_cruda: {
    kcalPerGram: 3.04,
    carbsPerGram: 0.82,
    unit: 'g',
  },

  pan_masa_madre: {
    kcalPerGram: 2.4,
    carbsPerGram: 0.48,
    unit: 'g',
  },

  patata_cocida: {
    kcalPerGram: 0.77,
    carbsPerGram: 0.17,
    unit: 'g',
  },

  boniato_cocido: {
    kcalPerGram: 0.86,
    carbsPerGram: 0.20,
    unit: 'g',
  },

  arroz_blanco_cocido: {
    kcalPerGram: 1.3,
    carbsPerGram: 0.28,
    unit: 'g',
  },

  copos_avena: {
    kcalPerGram: 3.89,
    carbsPerGram: 0.66,
    unit: 'g',
  },
}

function formatObjetivo(objetivo) {
  if (Array.isArray(objetivo)) return objetivo.join(', ')
  if (typeof objetivo === 'string') return objetivo
  return ''
}

function roundToStep(n, step) {
  return Math.round(n / step) * step
}

function clamp(n, min, max = Infinity) {
  return Math.max(min, Math.min(max, n))
}

function ajustarGramos(baseGramos, deltaKcal, kcalPerGram, step = 5, min = 0) {
  const raw = baseGramos + deltaKcal / kcalPerGram
  return clamp(roundToStep(raw, step), min)
}

function ajustarFrutaUnidades(baseUnits, deltaKcal, kcalPorUnidad = 100, min = 0) {
  const raw = baseUnits + Math.round(deltaKcal / kcalPorUnidad)
  return clamp(raw, min)
}

function calcularCaloriasObjetivo(data) {
  const { sexo, edad, peso, altura, actividad, sueno, grasa } = data

  let bmr = 0

  if (sexo === 'hombre') {
    bmr = 10 * peso + 6.25 * altura - 5 * edad + 5
  } else if (sexo === 'mujer') {
    bmr = 10 * peso + 6.25 * altura - 5 * edad - 161
  }

  const factoresActividad = {
    sedentario: 1.2,
    ligero: 1.4,
    moderado: 1.55,
    alto: 1.75,
  }

  const factoresGrasa = {
    muy_tapado: 0.8,
    normal: 0.85,
    marcado: 0.9,
  }

  let calorias = bmr * (factoresActividad[actividad] || 1.2)
  calorias = calorias * (factoresGrasa[grasa] || 0.85)

  if (sueno < 6) calorias *= 0.95
  if (sueno > 8) calorias *= 1.02

  // Déficit fijo
  calorias -= 200

  // Límite mínimo igual para ambos
  if (calorias < 1600) calorias = 1600

  return Math.round(calorias)
}

function repartirCaloriasPorComida(caloriasObjetivo, planBase) {
  return planBase.meals.map((meal) => {
    const kcalObjetivo = Math.round(caloriasObjetivo * meal.pct)
    const deltaKcal = kcalObjetivo - meal.baseKcal
    const deltaCarbs = Math.round(deltaKcal / 4)

    return {
      ...meal,
      kcalObjetivo,
      deltaKcal,
      deltaCarbs,
    }
  })
}

function getCarbSourceDb(carbSource) {
  if (carbSource === 'patata') return CARB_DB.patata_cocida
  if (carbSource === 'boniato') return CARB_DB.boniato_cocido
  if (carbSource === 'arroz') return CARB_DB.arroz_blanco_cocido
  return CARB_DB.patata_cocida
}

function getBaseCarbGrams(carbSource) {
  if (carbSource === 'patata') return 370
  if (carbSource === 'boniato') return 240
  if (carbSource === 'arroz') return 80
  return 370
}

function getMinCarbGrams(carbSource) {
  if (carbSource === 'patata') return 120
  if (carbSource === 'boniato') return 100
  if (carbSource === 'arroz') return 60
  return 120
}

function ajustarComida1(deltaKcal, frutaTipo = FRUTA_DEFAULT) {
  let deltaRestante = deltaKcal

  const avenaGramos = ajustarGramos(
    50,
    deltaRestante * 0.65,
    CARB_DB.copos_avena.kcalPerGram,
    5,
    15
  )

  const kcalAvenaNueva = avenaGramos * CARB_DB.copos_avena.kcalPerGram
  const kcalAvenaBase = 50 * CARB_DB.copos_avena.kcalPerGram
  deltaRestante -= kcalAvenaNueva - kcalAvenaBase

  const frutaUnidades = ajustarFrutaUnidades(
    1,
    deltaRestante,
    CARB_DB.fruta_unidad.kcal,
    0
  )

  return {
    frutaTipo,
    frutaUnidades,
    avenaGramos,
  }
}

function ajustarComida2(deltaKcal, frutaTipo = FRUTA_DEFAULT) {
  let deltaRestante = deltaKcal

  const panGramos = ajustarGramos(
    50,
    deltaRestante * 0.7,
    CARB_DB.pan_masa_madre.kcalPerGram,
    5,
    0
  )

  const kcalPanNueva = panGramos * CARB_DB.pan_masa_madre.kcalPerGram
  const kcalPanBase = 50 * CARB_DB.pan_masa_madre.kcalPerGram
  deltaRestante -= kcalPanNueva - kcalPanBase

  const frutaUnidades = ajustarFrutaUnidades(
    1,
    deltaRestante,
    CARB_DB.fruta_unidad.kcal,
    0
  )

  return {
    frutaTipo,
    frutaUnidades,
    panGramos,
  }
}

function ajustarComida3(
  deltaKcal,
  carbSource = 'patata',
  sweetSource = 'fruta',
  frutaTipo = FRUTA_DEFAULT
) {
  let deltaRestante = deltaKcal

  const carbDb = getCarbSourceDb(carbSource)
  const baseCarbGrams = getBaseCarbGrams(carbSource)
  const minCarbGrams = getMinCarbGrams(carbSource)

  const carbPrincipalGramos = ajustarGramos(
    baseCarbGrams,
    deltaRestante * 0.75,
    carbDb.kcalPerGram,
    10,
    minCarbGrams
  )

  const kcalPrincipalNueva = carbPrincipalGramos * carbDb.kcalPerGram
  const kcalPrincipalBase = baseCarbGrams * carbDb.kcalPerGram
  deltaRestante -= kcalPrincipalNueva - kcalPrincipalBase

  let frutaUnidades = null
  let mielGramos = null

  if (sweetSource === 'miel') {
    mielGramos = ajustarGramos(
      35,
      deltaRestante,
      CARB_DB.miel_cruda.kcalPerGram,
      5,
      0
    )
  } else {
    frutaUnidades = ajustarFrutaUnidades(
      1,
      deltaRestante,
      CARB_DB.fruta_unidad.kcal,
      0
    )
  }

  return {
    carbSource,
    carbPrincipalGramos,
    sweetSource,
    frutaTipo,
    frutaUnidades,
    mielGramos,
  }
}

function generarPlan3Comidas(caloriasObjetivo, preferencias = {}) {
  const reparto = repartirCaloriasPorComida(caloriasObjetivo, PLAN_3_BASE)

  const frutaTipo = preferencias.frutaTipo || FRUTA_DEFAULT
  const carbSourceCena = preferencias.carbSourceCena || 'patata'
  const sweetSourceCena = preferencias.sweetSourceCena || 'fruta'

  const comida1 = ajustarComida1(reparto[0].deltaKcal, frutaTipo)
  const comida2 = ajustarComida2(reparto[1].deltaKcal, frutaTipo)
  const comida3 = ajustarComida3(
    reparto[2].deltaKcal,
    carbSourceCena,
    sweetSourceCena,
    frutaTipo
  )

  return {
    caloriasObjetivo,
    reparto,
    ajustes: {
      comida1,
      comida2,
      comida3,
    },
  }
}

function getDietPlan(data) {
  const comidasDia = Math.min(Math.max(Number(data.comidasDia) || 3, 3), 6)

  if (comidasDia !== 3) {
    return {
      tituloPlan: 'Plan nutricional personalizado',
      caloriasObjetivo: data.caloriasObjetivo,
      reparto: [],
      ajustes: {},
      resumenPlan: 'De momento solo está implementada la dieta de 3 comidas.',
    }
  }

  const plan3 = generarPlan3Comidas(data.caloriasObjetivo, {
    frutaTipo: data.frutaTipo || FRUTA_DEFAULT,
    carbSourceCena: data.carbSourceCena || 'patata',
    sweetSourceCena: data.sweetSourceCena || 'fruta',
  })

  return {
    tituloPlan: 'Plan nutricional personalizado',
    ...plan3,
    resumenPlan:
      'Se mantienen proteínas y grasas fijas. Solo se ajustan las líneas de hidratos para adaptarse a las calorías calculadas.',
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
    frutaTipo: typeof data.frutaTipo === 'string' ? data.frutaTipo.toLowerCase() : FRUTA_DEFAULT,
    carbSourceCena:
      typeof data.carbSourceCena === 'string' ? data.carbSourceCena.toLowerCase() : 'patata',
    sweetSourceCena:
      typeof data.sweetSourceCena === 'string' ? data.sweetSourceCena.toLowerCase() : 'fruta',
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
    const caloriasObjetivo = calcularCaloriasObjetivo(normalizedData)

    const dietPlan = getDietPlan({
      ...normalizedData,
      caloriasObjetivo,
    })

    const html = buildHtml({
      ...normalizedData,
      FRUTAS,
      caloriasObjetivo,
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
