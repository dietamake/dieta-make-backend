const supabase = require('./supabase')
const buildHtml = require('./buildHtml')
const generatePdf = require('./generatePdf')

const PLAN_CONFIG = {
  3: {
    totalKcalBase: 2472,
    meals: [
      { key: 'comida1', nombre: 'Comida 1', pct: 0.33, baseKcal: 816 },
      { key: 'comida2', nombre: 'Comida 2', pct: 0.24, baseKcal: 593 },
      { key: 'comida3', nombre: 'Comida 3', pct: 0.43, baseKcal: 1063 },
    ],
  },
  4: {
    totalKcalBase: 2321,
    meals: [
      { key: 'comida1', nombre: 'Comida 1', pct: 0.27, baseKcal: 620 },
      { key: 'comida2', nombre: 'Comida 2', pct: 0.36, baseKcal: 840 },
      { key: 'comida3', nombre: 'Comida 3', pct: 0.18, baseKcal: 410 },
      { key: 'comida4', nombre: 'Comida 4', pct: 0.19, baseKcal: 450 },
    ],
  },
}

const CARB_DB = {
  fruta_unidad: { kcal: 100, carbs: 25 },
  miel_cruda: { kcalPerGram: 3.04 },
  pan_masa_madre: { kcalPerGram: 2.4 },

  // PESOS EN CRUDO
  patata_cruda: { kcalPerGram: 0.77 },
  boniato_crudo: { kcalPerGram: 0.86 },
  arroz_blanco_crudo: { kcalPerGram: 3.6 },
  calabaza_cruda: { kcalPerGram: 0.26 },

  copos_avena: { kcalPerGram: 3.89 },
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
  if (
    v.includes('6-7') ||
    v.includes('6–7') ||
    v.includes('alto') ||
    v.includes('trabajo físico') ||
    v.includes('trabajo fisico')
  ) {
    return 'alto'
  }

  return 'sedentario'
}

function normalizeGrasa(value) {
  const v = String(value || '').trim().toLowerCase()

  if (v.includes('muy') && v.includes('tap')) return 'muy_tapado'
  if (v.includes('marcad')) return 'marcado'
  if (v.includes('normal')) return 'normal'

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

function normalizeDespertar(value) {
  const v = String(value || '').trim().toLowerCase()

  if (v.includes('cansad')) return 'cansado'
  if (v.includes('activad')) return 'activado'

  return ''
}

function getNumeroOpcionesPlan(plan) {
  const v = String(plan || '').trim().toLowerCase()
  if (v === 'avanzado_3_opciones') return 3
  if (v === 'recomendado_2_opciones') return 2
  return 1
}

function createSeedFromLead(data) {
  const seedSource = [
    data.id || '',
    data.email || '',
    data.nombre || '',
    data.plan || '',
    data.created_at || '',
  ].join('|')

  let hash = 0
  for (let i = 0; i < seedSource.length; i += 1) {
    hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0
  }

  return hash || 123456789
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
    muy_tapado: 0.9,
    normal: 0.95,
    marcado: 1,
  }

  let calorias = bmr * factoresActividad[actividad]
  calorias *= factoresGrasa[grasa]

  if (sueno < 6) calorias *= 0.95
  if (sueno > 8) calorias *= 1.02

  // Déficit del 10%
  calorias *= 0.9

  // Mínimo de seguridad
  if (calorias < 1600) calorias = 1600

  return Math.round(calorias)
}

function repartirCaloriasPorComida(caloriasObjetivo, mealsConfig) {
  return mealsConfig.map((meal) => {
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

/* ========= AJUSTES POR TIPO DE COMIDA ========= */

function ajustarDesayunoAvena(deltaKcal, baseAvena = 50, minAvena = 15) {
  let deltaRestante = deltaKcal

  const avenaGramos = ajustarGramos(
    baseAvena,
    deltaRestante * 0.65,
    CARB_DB.copos_avena.kcalPerGram,
    5,
    minAvena
  )

  const kcalAvenaNueva = avenaGramos * CARB_DB.copos_avena.kcalPerGram
  const kcalAvenaBase = baseAvena * CARB_DB.copos_avena.kcalPerGram
  deltaRestante -= kcalAvenaNueva - kcalAvenaBase

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

function ajustarComidaPan(deltaKcal) {
  let deltaRestante = deltaKcal

  const frutaUnidades = ajustarFrutaUnidades(
    1,
    deltaRestante * 0.75,
    CARB_DB.fruta_unidad.kcal,
    0
  )

  const kcalFrutaNueva = frutaUnidades * CARB_DB.fruta_unidad.kcal
  deltaRestante -= kcalFrutaNueva - 100

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

function ajustarCenaPatataBoniatoArroz(
  deltaKcal,
  base = { patata: 370, boniato: 240, arroz: 30 },
  min = { patata: 120, boniato: 100, arroz: 20 }
) {
  return {
    patataGramos: ajustarGramos(
      base.patata,
      deltaKcal * 0.75,
      CARB_DB.patata_cruda.kcalPerGram,
      10,
      min.patata
    ),
    boniatoGramos: ajustarGramos(
      base.boniato,
      deltaKcal * 0.75,
      CARB_DB.boniato_crudo.kcalPerGram,
      10,
      min.boniato
    ),
    arrozGramos: ajustarGramos(
      base.arroz,
      deltaKcal * 0.75,
      CARB_DB.arroz_blanco_crudo.kcalPerGram,
      5,
      min.arroz
    ),
    frutaUnidades: ajustarFrutaUnidades(
      1,
      deltaKcal * 0.25,
      CARB_DB.fruta_unidad.kcal,
      0
    ),
  }
}

function ajustarComidaPatataBoniatoCalabaza(deltaKcal) {
  return {
    patataGramos: ajustarGramos(
      320,
      deltaKcal * 0.75,
      CARB_DB.patata_cruda.kcalPerGram,
      10,
      120
    ),
    boniatoGramos: ajustarGramos(
      210,
      deltaKcal * 0.75,
      CARB_DB.boniato_crudo.kcalPerGram,
      10,
      100
    ),
    calabazaGramos: ajustarGramos(
      720,
      deltaKcal * 0.75,
      CARB_DB.calabaza_cruda.kcalPerGram,
      20,
      250
    ),
    frutaUnidades: ajustarFrutaUnidades(
      1,
      deltaKcal * 0.25,
      CARB_DB.fruta_unidad.kcal,
      0
    ),
  }
}

function ajustarComidaAvenaMielFruta(
  deltaKcal,
  baseAvena = 70,
  minAvena = 15,
  baseMiel = 35
) {
  let deltaRestante = deltaKcal

  const avenaGramos = ajustarGramos(
    baseAvena,
    deltaRestante * 0.7,
    CARB_DB.copos_avena.kcalPerGram,
    5,
    minAvena
  )

  const kcalAvenaNueva = avenaGramos * CARB_DB.copos_avena.kcalPerGram
  const kcalAvenaBase = baseAvena * CARB_DB.copos_avena.kcalPerGram
  deltaRestante -= kcalAvenaNueva - kcalAvenaBase

  const mielGramos = ajustarGramos(
    baseMiel,
    deltaRestante * 0.5,
    CARB_DB.miel_cruda.kcalPerGram,
    5,
    0
  )

  const kcalMielNueva = mielGramos * CARB_DB.miel_cruda.kcalPerGram
  const kcalMielBase = baseMiel * CARB_DB.miel_cruda.kcalPerGram
  deltaRestante -= kcalMielNueva - kcalMielBase

  const frutaUnidades = ajustarFrutaUnidades(
    1,
    deltaRestante,
    CARB_DB.fruta_unidad.kcal,
    0
  )

  return {
    avenaGramos,
    mielGramos,
    frutaUnidades,
  }
}

function ajustarComidaSoloFruta(deltaKcal) {
  return {
    frutaUnidades: ajustarFrutaUnidades(
      1,
      deltaKcal,
      CARB_DB.fruta_unidad.kcal,
      0
    ),
  }
}

function ajustarComidaFrutaOMiel(deltaKcal, baseMiel = 35) {
  let deltaRestante = deltaKcal

  const mielGramos = ajustarGramos(
    baseMiel,
    deltaRestante * 0.5,
    CARB_DB.miel_cruda.kcalPerGram,
    5,
    0
  )

  const kcalMielNueva = mielGramos * CARB_DB.miel_cruda.kcalPerGram
  const kcalMielBase = baseMiel * CARB_DB.miel_cruda.kcalPerGram
  deltaRestante -= kcalMielNueva - kcalMielBase

  const frutaUnidades = ajustarFrutaUnidades(
    1,
    deltaRestante,
    CARB_DB.fruta_unidad.kcal,
    0
  )

  return {
    mielGramos,
    frutaUnidades,
  }
}

/* ========= AJUSTES PERSONALIZADOS ========= */

function mergeUnique(arr1 = [], arr2 = []) {
  return [...new Set([...arr1, ...arr2])]
}

function getAjustesDespertarYPrimeraComida(despertar, primeraComida) {
  const d = String(despertar || '').trim().toLowerCase()
  const p = String(primeraComida || '').trim().toLowerCase()

  if (d === 'cansado' && p === 'energia') {
    return {
      ultimaComida: [],
      duranteDia: [],
    }
  }

  if (d === 'activado' && p === 'relaja') {
    return {
      ultimaComida: ['mas_hidrato_noche'],
      duranteDia: [],
    }
  }

  if (d === 'cansado' && p === 'relaja') {
    return {
      ultimaComida: [],
      duranteDia: ['menos_proteina', 'mas_calcio'],
    }
  }

  if (d === 'activado' && p === 'energia') {
    return {
      ultimaComida: ['mas_hidrato_noche'],
      duranteDia: [],
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
  if (despertaresNoche === '1_2') {
    return {
      ultimaComida: ['mas_dulce_noche'],
      duranteDia: [],
    }
  }

  if (despertaresNoche === '3_mas') {
    return {
      ultimaComida: [
        'mas_dulce_noche',
        'mas_hidrato_noche',
        'mas_grasa_noche',
      ],
      duranteDia: [],
    }
  }

  return {
    ultimaComida: [],
    duranteDia: [],
  }
}

function traducirAjustesPersonalizados(data) {
  const a1 = getAjustesDespertarYPrimeraComida(
    data.despertar,
    data.primera_comida
  )
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

  return {
    ultimaComidaTexto: ultimaComida.map((code) => {
      const map = {
        mas_dulce_noche:
          'En la última comida te conviene meter un poco más de dulce fácil de digerir. Ejemplos: más miel, fruta o dátiles si esa opción los permite.',
        mas_hidrato_noche:
          'En la última comida te conviene meter un poco más de hidrato de digestión lenta. Ejemplos: más patata, boniato, arroz, calabaza o avena según la opción.',
        mas_grasa_noche:
          'En la última comida te conviene añadir un poco más de grasa. Ejemplos: aceite de coco, queso, aguacate o nueces según la opción.',
      }
      return map[code] || code
    }),
    duranteDiaTexto: duranteDia.map((code) => {
      const map = {
        menos_proteina:
          'Durante el día intenta no cargar demasiado las comidas de proteína.',
        mas_calcio:
          'Durante el día prioriza alimentos con calcio. Ejemplos: leche, yogur, queso fresco batido o queso.',
        mas_fibra:
          'Durante el día mete algo más de fibra. Ejemplos: más verdura, más fruta entera o un poco más de avena si te sienta bien.',
        cafe_con_azucar:
          'Puedes tomar café con un poco de azúcar junto a las comidas.',
      }
      return map[code] || code
    }),
  }
}

/* ========= GENERADOR DE PLAN ========= */

function generarPlanComidas(numeroComidas, caloriasObjetivo) {
  const config = PLAN_CONFIG[numeroComidas]
  const reparto = repartirCaloriasPorComida(caloriasObjetivo, config.meals)

  if (numeroComidas === 3) {
    return {
      caloriasObjetivo,
      reparto,
      ajustes: {
        comida1: ajustarDesayunoAvena(reparto[0].deltaKcal, 50, 15),
        comida2: ajustarComidaPan(reparto[1].deltaKcal),
        comida3Normal: ajustarCenaPatataBoniatoArroz(
          reparto[2].deltaKcal,
          { patata: 370, boniato: 240, arroz: 30 },
          { patata: 120, boniato: 100, arroz: 20 }
        ),
        comida3Avena: ajustarComidaAvenaMielFruta(
          reparto[2].deltaKcal,
          70,
          15,
          35
        ),
      },
    }
  }

  if (numeroComidas === 4) {
    return {
      caloriasObjetivo,
      reparto,
      ajustes: {
        comida1: {
          frutaUnidades: ajustarFrutaUnidades(1, reparto[0].deltaKcal, 100, 0),
        },
        comida2Normal: ajustarComidaPatataBoniatoCalabaza(reparto[1].deltaKcal),
        comida2Avena: ajustarComidaAvenaMielFruta(
          reparto[1].deltaKcal,
          65,
          15,
          35
        ),
        comida3: ajustarComidaSoloFruta(reparto[2].deltaKcal),
        comida4: ajustarComidaFrutaOMiel(reparto[3].deltaKcal, 35),
      },
    }
  }

  return {
    caloriasObjetivo,
    reparto,
    ajustes: {},
  }
}

function getDietPlan(data) {
const comidasDia = Number(data.comidasDia) === 4 ? 4 : 3
  const planGenerado = generarPlanComidas(comidasDia, data.caloriasObjetivo)

  return {
    tituloPlan: 'Plan nutricional personalizado',
    ...planGenerado,
    numeroOpcionesPlan: data.numeroOpcionesPlan,
    comidasDia,
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
    despertar: normalizeDespertar(data.despertar),
    primera_comida: data.primera_comida || '',
    bano: data.bano || '',
    despertares_noche: data.despertares_noche || '',
    randomSeed: createSeedFromLead(data),
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
