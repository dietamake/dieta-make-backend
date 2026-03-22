const supabase = require('./supabase')
const buildHtml = require('./buildHtml')
const generatePdf = require('./generatePdf')

const PLAN_3_BASE = {
  totalKcal: 2470,
  meals: [
    { id: 1, nombre: 'Comida 1', pct: 0.33, baseKcal: 820 },
    { id: 2, nombre: 'Comida 2', pct: 0.24, baseKcal: 600 },
    { id: 3, nombre: 'Comida 3', pct: 0.43, baseKcal: 1050 },
  ],
}

const FRUTAS = {
  caqui: '1 Caqui',
  manzana: '1 Manzana',
  naranja: '1 Naranja grande',
  pera: '1 Pera',
  platano: '1 Plátano',
  kiwi: '2 Kiwis',
  mandarinas: '3 Mandarinas',
}

const FRUTA_DEFAULT = 'manzana'

const CARB_DB = {
  fruta_unidad: { kcal: 100, carbs: 25 },
  miel_cruda: { kcalPerGram: 3.04, carbsPerGram: 0.82 },
  pan_masa_madre: { kcalPerGram: 2.4, carbsPerGram: 0.48 },
  patata_cocida: { kcalPerGram: 0.77, carbsPerGram: 0.17 },
  boniato_cocido: { kcalPerGram: 0.86, carbsPerGram: 0.2 },
  arroz_blanco_cocido: { kcalPerGram: 1.3, carbsPerGram: 0.28 },
  copos_avena: { kcalPerGram: 3.89, carbsPerGram: 0.66 },
}

function formatObjetivo(objetivo) {
  if (Array.isArray(objetivo)) return objetivo.join(', ')
  if (typeof objetivo === 'string') return objetivo
  return ''
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp(n, min, max = Infinity) {
  return Math.max(min, Math.min(max, n))
}

function roundToStep(n, step) {
  return Math.round(n / step) * step
}

function ajustarGramos(baseGramos, deltaKcal, kcalPerGram, step = 5, min = 0) {
  const raw = baseGramos + deltaKcal / kcalPerGram
  return clamp(roundToStep(raw, step), min)
}

function ajustarFrutaUnidades(baseUnits, deltaKcal, kcalPorUnidad = 100, min = 0) {
  const raw = baseUnits + Math.round(deltaKcal / kcalPorUnidad)
  return clamp(raw, min)
}

function normalizeSexo(value) {
  const v = String(value || '').trim().toLowerCase()
  if (v.includes('hombre')) return 'hombre'
  if (v.includes('mujer')) return 'mujer'
  return ''
}

function normalizeActividad(value) {
  const v = String(value || '').trim().toLowerCase()

  if (v.includes('sedent')) return 'sedentario'
  if (v.includes('1-3') || v.includes('1–3') || v.includes('liger')) return 'ligero'
  if (v.includes('3-5') || v.includes('3–5') || v.includes('moderad') || v.includes('media')) return 'moderado'
  if (v.includes('6-7') || v.includes('6–7') || v.includes('alto') || v.includes('trabajo físico') || v.includes('trabajo fisico')) return 'alto'

  if (['sedentario', 'ligero', 'moderado', 'alto'].includes(v)) return v
  return 'sedentario'
}

function normalizeGrasa(value) {
  const v = String(value || '').trim().toLowerCase()

  if (v.includes('muy') && v.includes('tap')) return 'muy_tapado'
  if (v.includes('marcad')) return 'marcado'
  if (v.includes('normal')) return 'normal'

  if (['muy_tapado', 'normal', 'marcado'].includes(v)) return v
  return 'normal'
}

function normalizeSueno(value) {
  if (typeof value === 'number') return value

  const v = String(value || '').trim().toLowerCase()

  if (v.includes('menos de 6') || v.includes('<6')) return 5
  if (v.includes('6-8') || v.includes('6–8')) return 7
  if (v.includes('más de 8') || v.includes('mas de 8') || v.includes('>8')) return 9

  const parsed = Number(v)
  if (Number.isFinite(parsed)) return parsed

  return 7
}

function normalizeFruit(value) {
  const v = String(value || '').trim().toLowerCase()

  if (v.includes('caqui')) return 'caqui'
  if (v.includes('manzana')) return 'manzana'
  if (v.includes('naranja')) return 'naranja'
  if (v.includes('pera')) return 'pera'
  if (v.includes('plátano') || v.includes('platano')) return 'platano'
  if (v.includes('kiwi')) return 'kiwi'
  if (v.includes('mandarina')) return 'mandarinas'

  return FRUTA_DEFAULT
}

function normalizeCarbSource(value) {
  const v = String(value || '').trim().toLowerCase()
  if (v.includes('boniato')) return 'boniato'
  if (v.includes('arroz')) return 'arroz'
  return 'patata'
}

function normalizeSweetSource(value) {
  const v = String(value || '').trim().toLowerCase()
  if (v.includes('miel')) return 'miel'
  return 'fruta'
}

function calcularCaloriasObjetivo(data) {
  const { sexo, edad, peso, altura, actividad, sueno, grasa } = data

  let bmr = 0

  if (sexo === 'hombre') {
    bmr = 10 * peso + 6.25 * altura - 5 * edad + 5
  } else if (sexo === 'mujer') {
    bmr = 10 * peso + 6.25 * altura - 5 * edad - 161
  } else {
    bmr = 10 * peso + 6.25 * altura - 5 * edad
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

  let calorias = bmr * factoresActividad[actividad]
  calorias *= factoresGrasa[grasa]

  if (sueno < 6) calorias *= 0.95
  if (sueno > 8) calorias *= 1.02

  calorias -= 200

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
  deltaRestante -= (kcalAvenaNueva - kcalAvenaBase)

  const frutaUnidades = ajustarFrutaUnidades(1, deltaRestante, CARB_DB.fruta_unidad.kcal, 0)

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
  deltaRestante -= (kcalPanNueva - kcalPanBase)

  const frutaUnidades = ajustarFrutaUnidades(1, deltaRestante, CARB_DB.fruta_unidad.kcal, 0)

  return {
    frutaTipo,
    frutaUnidades,
    panGramos,
  }
}

function ajustarComida3Normal(deltaKcal, carbSource = 'patata', frutaTipo = FRUTA_DEFAULT) {
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
  deltaRestante -= (kcalPrincipalNueva - kcalPrincipalBase)

  const frutaUnidades = ajustarFrutaUnidades(1, deltaRestante, CARB_DB.fruta_unidad.kcal, 0)

  return {
    mode: 'normal',
    carbSource,
    carbPrincipalGramos,
    frutaTipo,
    frutaUnidades,
    mielGramos: null,
    avenaGramos: null,
    sweetSource: 'fruta',
  }
}

function ajustarComida3Avena(deltaKcal, sweetSource = 'fruta', frutaTipo = FRUTA_DEFAULT) {
  let deltaRestante = deltaKcal

  const avenaGramos = ajustarGramos(
    70,
    deltaRestante * 0.7,
    CARB_DB.copos_avena.kcalPerGram,
    5,
    15
  )

  const kcalAvenaNueva = avenaGramos * CARB_DB.copos_avena.kcalPerGram
  const kcalAvenaBase = 70 * CARB_DB.copos_avena.kcalPerGram
  deltaRestante -= (kcalAvenaNueva - kcalAvenaBase)

  let frutaUnidades = null
  let mielGramos = null

  if (sweetSource === 'miel') {
    mielGramos = ajustarGramos(35, deltaRestante, CARB_DB.miel_cruda.kcalPerGram, 5, 0)
  } else {
    frutaUnidades = ajustarFrutaUnidades(1, deltaRestante, CARB_DB.fruta_unidad.kcal, 0)
  }

  return {
    mode: 'avena',
    carbSource: null,
    carbPrincipalGramos: null,
    frutaTipo,
    frutaUnidades,
    mielGramos,
    avenaGramos,
    sweetSource,
  }
}

function ajustarComida3(deltaKcal, meal3Option, preferencias = {}) {
  const frutaTipo = preferencias.frutaTipo || FRUTA_DEFAULT
  const carbSourceCena = preferencias.carbSourceCena || 'patata'
  const sweetSourceCena = preferencias.sweetSourceCena || 'fruta'

  if (meal3Option === 4 || meal3Option === 7) {
    return ajustarComida3Avena(deltaKcal, sweetSourceCena, frutaTipo)
  }

  return ajustarComida3Normal(deltaKcal, carbSourceCena, frutaTipo)
}

function generarPlan3Comidas(caloriasObjetivo, preferencias = {}) {
  const reparto = repartirCaloriasPorComida(caloriasObjetivo, PLAN_3_BASE)

  return {
    caloriasObjetivo,
    reparto,
    ajustes: {
      comida1: ajustarComida1(reparto[0].deltaKcal, preferencias.frutaTipo || FRUTA_DEFAULT),
      comida2: ajustarComida2(reparto[1].deltaKcal, preferencias.frutaTipo || FRUTA_DEFAULT),
      comida3: ajustarComida3(reparto[2].deltaKcal, preferencias.comida3Opcion || 1, preferencias),
    },
  }
}

function getDietPlan(data) {
  const plan3 = generarPlan3Comidas(data.caloriasObjetivo, {
    frutaTipo: data.frutaTipo || FRUTA_DEFAULT,
    carbSourceCena: data.carbSourceCena || 'patata',
    sweetSourceCena: data.sweetSourceCena || 'fruta',
    comida3Opcion: data.comida3Opcion || 1,
  })

  return {
    tituloPlan: 'Plan nutricional personalizado',
    ...plan3,
    resumenPlan:
      'Se respetan las opciones de alimentos tal cual. Solo se modifican las fuentes de hidratos para ajustar la dieta a las calorías calculadas.',
  }
}

function normalizeLeadData(data) {
  return {
    ...data,
    objetivo: formatObjetivo(data.objetivo),
    comidasDia: toNumber(data.comidasDia || data.comidas, 3),
    comidas: toNumber(data.comidas, 3),
    edad: toNumber(data.edad, 0),
    altura: toNumber(data.altura, 0),
    peso: toNumber(data.peso, 0),
    precio: toNumber(data.precio, 0),
    sueno: normalizeSueno(data.sueno),
    sexo: normalizeSexo(data.sexo),
    actividad: normalizeActividad(data.actividad),
    grasa: normalizeGrasa(data.grasa),
    frutaTipo: normalizeFruit(data.frutaTipo),
    carbSourceCena: normalizeCarbSource(data.carbSourceCena),
    sweetSourceCena: normalizeSweetSource(data.sweetSourceCena),
    comida1Opcion: toNumber(data.comida1Opcion, 1),
    comida2Opcion: toNumber(data.comida2Opcion, 1),
    comida3Opcion: toNumber(data.comida3Opcion, 1),
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

  await supabase.from('leads_dietas').update({ estado_pdf: 'generating' }).eq('id', formId)

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

    if (uploadError) throw uploadError

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
    await supabase.from('leads_dietas').update({ estado_pdf: 'error' }).eq('id', formId)
    console.error('ERROR GENERANDO PDF:', err)
    throw err
  }
}

module.exports = {
  generatePdfForLead,
}
