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
  if (v.includes('6-7') || v.includes('6–7') || v.includes('alto') || v.includes('trabajo físico') || v.includes('trabajo fisico')) {
    return 'alto'
  }

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

function getNumeroOpcionesPlan(plan) {
  const v = String(plan || '').trim().toLowerCase()
  if (v === 'avanzado_7_opciones') return 7
  if (v === 'recomendado_5_opciones') return 5
  return 1
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

  const ajustesGrasa = {
    muy_tapado: -0.08,
    normal: -0.04,
    marcado: 0,
  }

  let calorias = bmr * (factoresActividad[actividad] || 1.2)
  calorias *= 1 + (ajustesGrasa[grasa] || 0)

  if (sueno < 6) calorias *= 0.97
  else if (sueno > 8) calorias *= 1.01

  let minimo = 0

  if (sexo === 'mujer') {
    minimo = Math.max(1450, peso * 22)
  } else if (sexo === 'hombre') {
    minimo = Math.max(1650, peso * 24)
  } else {
    minimo = peso * 23
  }

  if (calorias < minimo) calorias = minimo

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

function ajustarComida1(deltaKcal) {
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

  const frutaUnidades = ajustarFrutaUnidades(
    1,
    deltaRestante,
    CARB_DB.fruta_unidad.kcal,
    0
  )

  return {
    frutaUnidades,
    avenaGramos,
  }
}

function ajustarComida2(deltaKcal) {
  // Quitamos primero fruta antes que tocar el pan
  let deltaRestante = deltaKcal

  const frutaUnidades = ajustarFrutaUnidades(
    1,
    deltaRestante * 0.75,
    CARB_DB.fruta_unidad.kcal,
    0
  )

  const kcalFrutaNueva = frutaUnidades * CARB_DB.fruta_unidad.kcal
  const kcalFrutaBase = 100
  deltaRestante -= (kcalFrutaNueva - kcalFrutaBase)

  const panGramos = ajustarGramos(
    50,
    deltaRestante,
    CARB_DB.pan_masa_madre.kcalPerGram,
    5,
    20
  )

  return {
    frutaUnidades,
    panGramos,
  }
}

function ajustarComida3Normal(deltaKcal) {
  const patataGramos = ajustarGramos(
    370,
    deltaKcal * 0.75,
    CARB_DB.patata_cocida.kcalPerGram,
    10,
    120
  )

  const boniatoGramos = ajustarGramos(
    240,
    deltaKcal * 0.75,
    CARB_DB.boniato_cocido.kcalPerGram,
    10,
    100
  )

  const arrozGramos = ajustarGramos(
    80,
    deltaKcal * 0.75,
    CARB_DB.arroz_blanco_cocido.kcalPerGram,
    10,
    60
  )

  const frutaUnidades = ajustarFrutaUnidades(
    1,
    deltaKcal * 0.25,
    CARB_DB.fruta_unidad.kcal,
    0
  )

  return {
    mode: 'normal',
    patataGramos,
    boniatoGramos,
    arrozGramos,
    frutaUnidades,
    mielGramos: null,
    avenaGramos: null,
    sweetSource: 'fruta',
  }
}

function ajustarComida3Avena(deltaKcal, sweetSource = 'fruta') {
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
    mode: 'avena',
    frutaUnidades,
    mielGramos,
    avenaGramos,
    sweetSource,
  }
}

function mergeUnique(arr1 = [], arr2 = []) {
  return [...new Set([...arr1, ...arr2])]
}

function getAjustesPrimeraComida(primeraComida) {
  if (primeraComida === 'energia') {
    return {
      ultimaComida: [],
      duranteDia: [],
    }
  }

  if (primeraComida === 'relaja') {
    return {
      ultimaComida: [],
      duranteDia: ['menos_proteina', 'mas_calcio'],
    }
  }

  return {
    ultimaComida: [],
    duranteDia: [],
  }
}

function getAjustesBano(bano) {
  if (bano === 'poco') {
    return {
      ultimaComida: [],
      duranteDia: ['mas_fibra', 'cafe_con_azucar'],
    }
  }

  if (bano === 'normal') {
    return {
      ultimaComida: [],
      duranteDia: [],
    }
  }

  if (bano === 'mucho') {
    return {
      ultimaComida: [],
      duranteDia: ['mas_fibra'],
    }
  }

  return {
    ultimaComida: [],
    duranteDia: [],
  }
}

function getAjustesDespertares(despertaresNoche) {
  if (despertaresNoche === '0' || despertaresNoche === '1_poco') {
    return {
      ultimaComida: [],
      duranteDia: [],
    }
  }

  if (despertaresNoche === '1_2') {
    return {
      ultimaComida: ['mas_dulce_noche'],
      duranteDia: [],
    }
  }

  if (despertaresNoche === '3_mas') {
    return {
      ultimaComida: ['mas_dulce_noche', 'mas_hidrato_noche', 'mas_grasa_noche'],
      duranteDia: [],
    }
  }

  return {
    ultimaComida: [],
    duranteDia: [],
  }
}

function traducirAjustesPersonalizados(data) {
  const a1 = getAjustesPrimeraComida(data.primera_comida)
  const a2 = getAjustesBano(data.bano)
  const a3 = getAjustesDespertares(data.despertares_noche)

  const ultimaComida = mergeUnique(
    mergeUnique(a1.ultimaComida, a2.ultimaComida),
    a3.ultimaComida
  )

  const duranteDia = mergeUnique(
    mergeUnique(a1.duranteDia, a2.duranteDia),
    a3.duranteDia
  )

  const ultimaComidaTexto = ultimaComida.map((code) => {
    const map = {
      mas_dulce_noche: 'En la última comida añade un poco más de azúcar fácil de digerir. Ejemplos: un poco más de miel o una fruta más.',
      mas_hidrato_noche: 'En la última comida mete un poco más de hidratos de digestión lenta. Ejemplos: más patata, más boniato, más arroz cocido o más avena.',
      mas_grasa_noche: 'En la última comida añade un poco más de grasa. Ejemplos: un poco más de aceite de coco, queso curado, aguacate o nueces de macadamia.',
    }

    return map[code] || code
  })

  const duranteDiaTexto = duranteDia.map((code) => {
    const map = {
      menos_proteina: 'Durante el día no cargues tanto las comidas de proteína. Mantén la dieta más ligera en ese punto.',
      mas_calcio: 'Durante el día prioriza alimentos con calcio. Ejemplos: leche, yogur, queso fresco batido o queso.',
      mas_fibra: 'Durante el día mete más fibra para ir mejor al baño. Ejemplos: más verdura, más fruta entera o un poco más de avena si te sienta bien.',
      cafe_con_azucar: 'Puedes tomar café con un poco de azúcar junto a las comidas.',
    }

    return map[code] || code
  })

  return {
    ultimaComida,
    duranteDia,
    ultimaComidaTexto,
    duranteDiaTexto,
  }
}

function generarPlan3Comidas(caloriasObjetivo) {
  const reparto = repartirCaloriasPorComida(caloriasObjetivo, PLAN_3_BASE)

  return {
    caloriasObjetivo,
    reparto,
    ajustes: {
      comida1: ajustarComida1(reparto[0].deltaKcal),
      comida2: ajustarComida2(reparto[1].deltaKcal),
      comida3Normal: ajustarComida3Normal(reparto[2].deltaKcal),
      comida3AvenaFruta: ajustarComida3Avena(reparto[2].deltaKcal, 'fruta'),
      comida3AvenaMiel: ajustarComida3Avena(reparto[2].deltaKcal, 'miel'),
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
      ajustesPersonalizados: traducirAjustesPersonalizados(data),
    }
  }

  const plan3 = generarPlan3Comidas(data.caloriasObjetivo)

  return {
    tituloPlan: 'Plan nutricional personalizado',
    ...plan3,
    numeroOpcionesPlan: data.numeroOpcionesPlan,
    resumenPlan:
      'Se respetan los alimentos de cada opción y solo se ajustan las fuentes de hidratos para adaptar la dieta a las calorías calculadas.',
    ajustesPersonalizados: traducirAjustesPersonalizados(data),
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
    grasa: normalizeGrasa(data.grasa_abdominal),
    plan: data.plan || '',
    numeroOpcionesPlan: getNumeroOpcionesPlan(data.plan),
    primera_comida: data.primera_comida || '',
    bano: data.bano || '',
    despertares_noche: data.despertares_noche || '',
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
