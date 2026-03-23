function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function pluralize(word, amount) {
  if (amount === 1) return word
  if (word === 'Caqui') return 'Caquis'
  if (word === 'Manzana') return 'Manzanas'
  if (word === 'Naranja grande') return 'Naranjas grandes'
  if (word === 'Pera') return 'Peras'
  if (word === 'Plátano') return 'Plátanos'
  if (word === 'Kiwi') return 'Kiwis'
  if (word === 'Mandarina') return 'Mandarinas'
  return `${word}s`
}

function formatFruitOptionsLine(frutaUnidades) {
  if (!frutaUnidades || frutaUnidades <= 0) return 'Sin fruta'

  const caqui = `${frutaUnidades} ${pluralize('Caqui', frutaUnidades)}`
  const manzana = `${frutaUnidades} ${pluralize('Manzana', frutaUnidades)}`
  const naranja = `${frutaUnidades} ${pluralize('Naranja grande', frutaUnidades)}`
  const pera = `${frutaUnidades} ${pluralize('Pera', frutaUnidades)}`
  const platano = `${frutaUnidades} ${pluralize('Plátano', frutaUnidades)}`
  const kiwi = `${frutaUnidades * 2} ${pluralize('Kiwi', frutaUnidades * 2)}`
  const mandarina = `${frutaUnidades * 3} ${pluralize('Mandarina', frutaUnidades * 3)}`

  return `${caqui} o ${manzana} o ${naranja} o ${pera} o ${platano} o ${kiwi} o ${mandarina}`
}

function formatFruitOrMielLine(frutaUnidades, mielGramos, extra = '') {
  const fruta = formatFruitOptionsLine(frutaUnidades)
  const miel = mielGramos > 0 ? `${mielGramos} g Miel cruda` : 'Sin miel'
  return `${miel} o ${fruta}${extra ? ` ${extra}` : ''}`
}

function normalizeSpaces(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function removeCombineNote(text) {
  return normalizeSpaces(
    String(text || '')
      .replace(/\s*\(puedes combinar dos opciones tomando la mitad de cada una\)\s*/gi, '')
      .replace(/\s*\(puedes combinar dos opciones tomando la mitad de la cantidad de cada una\)\s*/gi, '')
  )
}

function splitByOr(text) {
  if (!text) return []
  return removeCombineNote(text)
    .split(/\s+o\s+/gi)
    .map((part) => part.trim())
    .filter(Boolean)
}

function hasChoice(line) {
  return splitByOr(removeCombineNote(line)).length > 1
}

function renderChoiceBoxes(line) {
  const parts = splitByOr(removeCombineNote(line))
  if (parts.length <= 1) return ''

  return `
    <div class="choice-box-label">Elige una opción</div>
    <div class="choice-box-grid">
      ${parts
        .map(
          (part) => `
            <div class="choice-box-item">${escapeHtml(part)}</div>
          `
        )
        .join('')}
    </div>
  `
}

function renderFoodLine(line, index, total) {
  const cleanedLine = removeCombineNote(line)
  const choice = hasChoice(cleanedLine)

  return `
    <div class="food-line">
      ${choice ? renderChoiceBoxes(cleanedLine) : `<div class="food-pill">${escapeHtml(cleanedLine)}</div>`}
      ${index < total - 1 ? '<div class="line-separator">+</div>' : ''}
    </div>
  `
}

function optionCard(title, lines) {
  return `
    <div class="option-card">
      <div class="option-title">${escapeHtml(title)}</div>
      <div class="option-lines">
        ${lines.map((line, index) => renderFoodLine(line, index, lines.length)).join('')}
      </div>
    </div>
  `
}

function renderNotas(title, items) {
  if (!items || items.length === 0) return ''
  return `
    <div class="card compact-card">
      <div class="section-title">${escapeHtml(title)}</div>
      <div class="notes-list">
        ${items
          .map(
            (item) => `
              <div class="note-item">
                <span class="note-dot"></span>
                <span>${escapeHtml(item)}</span>
              </div>
            `
          )
          .join('')}
      </div>
    </div>
  `
}

function renderIndicacionesGenerales(items) {
  const defaultItems = [
    'Prioriza la constancia semanal frente a la perfección diaria.',
    'Mantén horarios de comida lo más regulares posible.',
    'Ajusta cantidades en función de hambre, saciedad y evolución.',
    'Hidrátate de forma estable durante todo el día.',
    'Todos los pesos de patata, boniato, arroz y calabaza están expresados en crudo.',
  ]

  const finalItems = Array.isArray(items) && items.length > 0
    ? [
        ...items,
        'Todos los pesos de patata, boniato, arroz y calabaza están expresados en crudo.',
      ]
    : defaultItems

  return `
    <div class="card compact-card">
      <div class="section-title">Indicaciones generales</div>
      <div class="notes-list">
        ${finalItems
          .map(
            (item) => `
              <div class="note-item">
                <span class="note-dot"></span>
                <span>${escapeHtml(item)}</span>
              </div>
            `
          )
          .join('')}
      </div>
    </div>
  `
}

function hashString(str) {
  const text = String(str || '')
  let hash = 2166136261

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function createSeededRandom(seed) {
  let t = seed >>> 0
  return function random() {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pickRandomStable(items, count, baseSeed, mealKey) {
  const safeItems = Array.isArray(items) ? [...items] : []
  const finalCount = Math.min(Math.max(Number(count) || 1, 1), safeItems.length)

  if (finalCount >= safeItems.length) return safeItems

  const seed = ((Number(baseSeed) || 1) + hashString(mealKey)) >>> 0
  const rng = createSeededRandom(seed)

  for (let i = safeItems.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[safeItems[i], safeItems[j]] = [safeItems[j], safeItems[i]]
  }

  return safeItems.slice(0, finalCount)
}

function renderRandomOptionCards(optionEntries, count, baseSeed, mealKey) {
  const selected = pickRandomStable(optionEntries, count, baseSeed, mealKey)

  return selected
    .map((entry, index) => optionCard(`Opción ${index + 1}`, entry.lines))
    .join('')
}

function formatObjetivo(data) {
  if (Array.isArray(data.objetivo)) return data.objetivo.join(', ')
  return data.objetivo || data.tituloPlan || '-'
}

function formatFecha(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date()
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function formatDespertar(value) {
  if (value === 'cansado') return 'Me despierto cansado'
  if (value === 'activado') return 'Me despierto activado'
  return '-'
}

function formatPrimeraComida(value) {
  if (value === 'energia') return 'Me da energía'
  if (value === 'relaja') return 'Me relaja'
  return '-'
}

function formatActividad(value) {
  const map = {
    sedentario: 'Sedentario',
    ligero: 'Ligero',
    moderado: 'Moderado',
    alto: 'Alto',
  }
  return map[value] || value || '-'
}

function formatGrasa(value) {
  const map = {
    muy_tapado: 'Muy tapado',
    normal: 'Normal',
    marcado: 'Marcado',
  }
  return map[value] || value || '-'
}

function formatSueno(value) {
  if (value === 5) return 'Menos de 6 h'
  if (value === 7) return '6–8 h'
  if (value === 9) return 'Más de 8 h'
  return value || '-'
}

function renderControlInterno(data) {
  const reparto = Array.isArray(data.reparto) ? data.reparto : []
  const ajustes = data.ajustes || {}

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

  let bmr = '-'
  if (data.sexo === 'hombre') {
    bmr = Math.round(
      10 * Number(data.peso || 0) +
        6.25 * Number(data.altura || 0) -
        5 * Number(data.edad || 0) +
        5
    )
  } else if (data.sexo === 'mujer') {
    bmr = Math.round(
      10 * Number(data.peso || 0) +
        6.25 * Number(data.altura || 0) -
        5 * Number(data.edad || 0) -
        161
    )
  }

  const factorActividad = factoresActividad[data.actividad] || '-'
  const factorGrasa = factoresGrasa[data.grasa] || '-'
  const ajusteSueno =
    Number(data.sueno) < 6
      ? '-5%'
      : Number(data.sueno) > 8
        ? '+2%'
        : '0%'
  const deficitFinal = '-10%'

  const ajustesRows = [
    ['comida1', JSON.stringify(ajustes.comida1 || {})],
    ['comida2', JSON.stringify(ajustes.comida2 || {})],
    ['comida2Normal', JSON.stringify(ajustes.comida2Normal || {})],
    ['comida2Avena', JSON.stringify(ajustes.comida2Avena || {})],
    ['comida3', JSON.stringify(ajustes.comida3 || {})],
    ['comida3Normal', JSON.stringify(ajustes.comida3Normal || {})],
    ['comida3Avena', JSON.stringify(ajustes.comida3Avena || {})],
    ['comida4', JSON.stringify(ajustes.comida4 || {})],
  ].filter(([, value]) => value !== '{}')

  return `
    <div class="card compact-card internal-card">
      <div class="section-title">Control interno · cálculo y ajustes</div>

      <div class="internal-subtitle">1. Cálculo de calorías</div>
      <table class="internal-table">
        <tbody>
          <tr><th>Sexo</th><td>${escapeHtml(data.sexo || '-')}</td></tr>
          <tr><th>Edad</th><td>${escapeHtml(data.edad || '-')}</td></tr>
          <tr><th>Altura</th><td>${escapeHtml(data.altura || '-')}</td></tr>
          <tr><th>Peso</th><td>${escapeHtml(data.peso || '-')}</td></tr>
          <tr><th>BMR estimado</th><td>${escapeHtml(bmr)}</td></tr>
          <tr><th>Actividad</th><td>${escapeHtml(formatActividad(data.actividad))} · factor ${escapeHtml(factorActividad)}</td></tr>
          <tr><th>Grasa abdominal</th><td>${escapeHtml(formatGrasa(data.grasa))} · factor ${escapeHtml(factorGrasa)}</td></tr>
          <tr><th>Sueño</th><td>${escapeHtml(formatSueno(data.sueno))} · ajuste ${escapeHtml(ajusteSueno)}</td></tr>
          <tr><th>Ajuste final</th><td>${escapeHtml(deficitFinal)}</td></tr>
          <tr><th>Calorías objetivo</th><td><strong>${escapeHtml(data.caloriasObjetivo || '-')} kcal</strong></td></tr>
          <tr><th>Seed aleatoria</th><td>${escapeHtml(data.randomSeed || '-')}</td></tr>
          <tr><th>Número de opciones plan</th><td>${escapeHtml(data.numeroOpcionesPlan || '-')}</td></tr>
        </tbody>
      </table>

      <div class="internal-subtitle">2. Reparto por comida</div>
      <table class="internal-table">
        <thead>
          <tr>
            <th>Comida</th>
            <th>%</th>
            <th>Base kcal</th>
            <th>Objetivo kcal</th>
            <th>Delta kcal</th>
            <th>Delta carbs aprox.</th>
          </tr>
        </thead>
        <tbody>
          ${
            reparto.length
              ? reparto
                  .map(
                    (item) => `
                      <tr>
                        <td>${escapeHtml(item.nombre || item.key || '-')}</td>
                        <td>${escapeHtml(Math.round((item.pct || 0) * 100))}%</td>
                        <td>${escapeHtml(item.baseKcal ?? '-')}</td>
                        <td>${escapeHtml(item.kcalObjetivo ?? '-')}</td>
                        <td>${escapeHtml(item.deltaKcal ?? '-')}</td>
                        <td>${escapeHtml(item.deltaCarbs ?? '-')} g</td>
                      </tr>
                    `
                  )
                  .join('')
              : `
                <tr>
                  <td colspan="6">Sin datos de reparto</td>
                </tr>
              `
          }
        </tbody>
      </table>

      <div class="internal-subtitle">3. Ajustes aplicados para cuadrar la dieta</div>
      <table class="internal-table">
        <thead>
          <tr>
            <th>Bloque</th>
            <th>Ajuste</th>
          </tr>
        </thead>
        <tbody>
          ${
            ajustesRows.length
              ? ajustesRows
                  .map(
                    ([key, value]) => `
                      <tr>
                        <td>${escapeHtml(key)}</td>
                        <td class="mono-cell">${escapeHtml(value)}</td>
                      </tr>
                    `
                  )
                  .join('')
              : `
                <tr>
                  <td colspan="2">Sin ajustes calculados</td>
                </tr>
              `
          }
        </tbody>
      </table>
    </div>
  `
}

function renderCover(data) {
  const objetivo = formatObjetivo(data)
  const nombre = data.nombre || 'Cliente'
  const plan = data.plan || 'Plan personalizado'
  const fecha = formatFecha(data.fechaGeneracion)

  const profileItems = [
    ['Cliente', nombre],
    ['Objetivo', objetivo || '-'],
    ['Plan', plan],
    ['Fecha', fecha],
    ['Email', data.email || '-'],
    ['Sexo', data.sexo || '-'],
    ['Edad', data.edad ? `${data.edad} años` : '-'],
    ['Altura', data.altura ? `${data.altura} cm` : '-'],
    ['Peso', data.peso ? `${data.peso} kg` : '-'],
    ['Despertar', formatDespertar(data.despertar)],
    ['Primera comida', formatPrimeraComida(data.primera_comida)],
    ['Comidas/día', data.comidasDia || data.comidas || '-'],
  ]

  return `
    <section class="cover">
      <div class="cover-shell">
        <div class="cover-brand">DIETA MAKE</div>
        <div class="cover-brand-line"></div>

        <div class="cover-plan-name">${escapeHtml(data.tituloPlan || 'Plan nutricional personalizado')}</div>

        <div class="cover-description">
          Diseñado según tu perfil, tu objetivo y la estructura de comidas seleccionada.
        </div>

        <div class="cover-profile-grid">
          ${profileItems
            .map(
              ([label, value]) => `
                <div class="cover-profile-item">
                  <div class="cover-profile-label">${escapeHtml(label)}</div>
                  <div class="cover-profile-value">${escapeHtml(value)}</div>
                </div>
              `
            )
            .join('')}
        </div>

        ${
          data.resumenPlan
            ? `<div class="cover-summary">${escapeHtml(data.resumenPlan)}</div>`
            : ''
        }
      </div>
    </section>
  `
}

/* ====== 3 COMIDAS ====== */

function render3Meals(data, numeroOpcionesPlan) {
  const a = data.ajustes || {}
  const c1 = a.comida1 || {}
  const c2 = a.comida2 || {}
  const c3n = a.comida3Normal || {}
  const c3a = a.comida3Avena || {}
  const seed = Number(data.randomSeed) || 1

  const fruta1 = formatFruitOptionsLine(c1.frutaUnidades)
  const avena1 = `${c1.avenaGramos} g Copos de avena`

  const comida1Options = [
    {
      key: 'c1_o1',
      lines: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '10 g Colágeno bovino hidrolizado',
        '1 lata de mejillones al natural o 1 lata escurrida (56 g) de atún al natural o 100 g almejas salvajes o 75 g ostras o 75 g vieiras o 120 g gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
        fruta1,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena1,
      ],
    },
    {
      key: 'c1_o2',
      lines: [
        'Café al gusto',
        '270 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        fruta1,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena1,
      ],
    },
    {
      key: 'c1_o3',
      lines: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '60 g Hígado de vaca o 60 g Hígado de cordero',
        fruta1,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena1,
      ],
    },
    {
      key: 'c1_o4',
      lines: [
        'Café al gusto',
        '250 g Queso fresco desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        fruta1,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena1,
      ],
    },
    {
      key: 'c1_o5',
      lines: [
        'Café al gusto',
        '125 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '150 g Claras de huevo pasteurizadas',
        fruta1,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena1,
      ],
    },
    {
      key: 'c1_o6',
      lines: [
        'Café al gusto',
        '200 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '250 ml Leche fresca desnatada',
        fruta1,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena1,
      ],
    },
    {
      key: 'c1_o7',
      lines: [
        'Café al gusto',
        '250 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '200 g Claras de huevo pasteurizadas',
        fruta1,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena1,
      ],
    },
  ]

  const fruta2 = formatFruitOptionsLine(c2.frutaUnidades)
  const pan2 = `${c2.panGramos} g Pan de masa madre`

  const comida2Options = [
    {
      key: 'c2_o1',
      lines: [
        '500 ml Leche fresca desnatada',
        '10 g Colágeno bovino hidrolizado',
        '1 lata de mejillones al natural o 1 lata escurrida (56 g) de atún al natural o 100 g almejas salvajes o 75 g ostras o 75 g vieiras o 120 g gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
        fruta2,
        pan2,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
    },
    {
      key: 'c2_o2',
      lines: [
        '270 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        fruta2,
        pan2,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
    },
    {
      key: 'c2_o3',
      lines: [
        '500 ml Leche fresca desnatada',
        '12 g Colágeno bovino hidrolizado',
        '60 g Hígado de vaca o 60 g Hígado de cordero',
        fruta2,
        pan2,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
    },
    {
      key: 'c2_o4',
      lines: [
        '250 g Queso fresco desnatado',
        '12 g Colágeno bovino hidrolizado',
        fruta2,
        pan2,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
    },
    {
      key: 'c2_o5',
      lines: [
        '125 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        '150 g Claras de huevo pasteurizadas',
        fruta2,
        pan2,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
    },
    {
      key: 'c2_o6',
      lines: [
        '200 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        '250 ml Leche fresca desnatada',
        fruta2,
        pan2,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
    },
    {
      key: 'c2_o7',
      lines: [
        '250 ml Leche fresca desnatada',
        '12 g Colágeno bovino hidrolizado',
        '200 g Claras de huevo pasteurizadas',
        fruta2,
        pan2,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
    },
  ]

  const carb3 = `${c3n.patataGramos} g Patata o ${c3n.boniatoGramos} g Boniato o ${c3n.arrozGramos} g Arroz blanco crudo`
  const fruta3 = formatFruitOptionsLine(c3n.frutaUnidades)

  const comida3Options = [
    {
      key: 'c3_o1',
      lines: [
        '150 g Carne picada de ternera',
        '5 g Aceite de coco',
        carb3,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta3,
        '50 g Queso de leche cruda o 40 g Chocolate 80–100% o 150 g Aguacate o 35 g Nueces de macadamia',
      ],
    },
    {
      key: 'c3_o2',
      lines: [
        '290 g Gambas salvajes o 175 g Ostras o 190 g Pulpo cocido o 185 g Merluza o 245 g Bacalao o 170 g Boquerones salvajes (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)',
        '8 g Aceite de oliva virgen extra prensado en frío',
        '5 g Aceite de coco',
        carb3,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta3,
        '50 g Queso de leche cruda o 40 g Chocolate 80–100% o 150 g Aguacate o 35 g Nueces de macadamia',
      ],
    },
    {
      key: 'c3_o3',
      lines: [
        '140 g Pechuga de pollo o 140 g Pechuga de pavo o 140 g Lomo de cerdo',
        '7 g Aceite de oliva virgen extra prensado en frío',
        '5 g Aceite de coco',
        carb3,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta3,
        '50 g Queso de leche cruda o 40 g Chocolate 80–100% o 150 g Aguacate o 35 g Nueces de macadamia',
      ],
    },
    {
      key: 'c3_o4',
      lines: [
        '300 g Queso fresco batido desnatado',
        '11 g Aceite de coco o 20 g Chocolate 80–100%',
        `${c3a.avenaGramos} g Copos de avena`,
        formatFruitOrMielLine(c3a.frutaUnidades, c3a.mielGramos),
        '50 g Queso de leche cruda o 40 g Chocolate 80–100% o 150 g Aguacate o 35 g Nueces de macadamia',
      ],
    },
  ]

  return `
    <div class="meal-box">
      <div class="meal-title">COMIDA 1</div>
      <div class="options-grid meal-options-grid">
        ${renderRandomOptionCards(comida1Options, numeroOpcionesPlan, seed, '3m_comida1')}
      </div>
    </div>

    <div class="meal-box">
      <div class="meal-title">COMIDA 2</div>
      <div class="options-grid meal-options-grid">
        ${renderRandomOptionCards(comida2Options, numeroOpcionesPlan, seed, '3m_comida2')}
      </div>
    </div>

    <div class="meal-box">
      <div class="meal-title">COMIDA 3</div>
      <div class="meal-subtext">5 min antes de empezar a comer: Vinagre de sidra de manzana en pastilla (500 mg)</div>
      <div class="meal-subtext">Al acabar de comer: Bisglicinato de magnesio (2 g)</div>
      <div class="options-grid meal-options-grid">
        ${renderRandomOptionCards(comida3Options, numeroOpcionesPlan, seed, '3m_comida3')}
      </div>
    </div>
  `
}

/* ====== 4 COMIDAS ====== */

function render4Meals(data, numeroOpcionesPlan) {
  const a = data.ajustes || {}
  const c1 = a.comida1 || {}
  const c2n = a.comida2Normal || {}
  const c2a = a.comida2Avena || {}
  const c3 = a.comida3 || {}
  const c4 = a.comida4 || {}
  const seed = Number(data.randomSeed) || 1

  const fruta1 = formatFruitOptionsLine(c1.frutaUnidades)

  const comida1Options = [
    {
      key: 'c1_o1',
      lines: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '10 g Colágeno bovino hidrolizado',
        '1 lata de mejillones al natural o 1 lata escurrida (56 g) de atún al natural o 100 g almejas salvajes o 75 g ostras o 75 g vieiras o 120 g gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
        fruta1,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
    },
    {
      key: 'c1_o2',
      lines: [
        'Café al gusto',
        '270 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        fruta1,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
    },
    {
      key: 'c1_o3',
      lines: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '60 g Hígado de vaca o 60 g Hígado de cordero',
        fruta1,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
    },
    {
      key: 'c1_o4',
      lines: [
        'Café al gusto',
        '250 g Queso fresco desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        fruta1,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
    },
    {
      key: 'c1_o5',
      lines: [
        'Café al gusto',
        '125 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '150 g Claras de huevo pasteurizadas',
        fruta1,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
    },
    {
      key: 'c1_o6',
      lines: [
        'Café al gusto',
        '200 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '250 ml Leche fresca desnatada',
        fruta1,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
    },
    {
      key: 'c1_o7',
      lines: [
        'Café al gusto',
        '250 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '200 g Claras de huevo pasteurizadas',
        fruta1,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
    },
  ]

  const carb2 = `${c2n.patataGramos} g Patata o ${c2n.boniatoGramos} g Boniato o ${c2n.calabazaGramos} g Calabaza`
  const fruta2 = formatFruitOptionsLine(c2n.frutaUnidades)

  const comida2Options = [
    {
      key: 'c2_o1',
      lines: [
        '150 g Carne picada de ternera',
        '5 g Aceite de coco',
        `${carb2} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta2,
        'Tomate, cebolla cruda y/o pimiento verde crudo al gusto',
      ],
    },
    {
      key: 'c2_o2',
      lines: [
        '290 g Gambas salvajes o 175 g Ostras o 190 g Pulpo cocido o 185 g Merluza o 245 g Bacalao o 170 g Boquerones salvajes (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)',
        '8 g Aceite de oliva virgen extra prensado en frío',
        '5 g Aceite de coco',
        `${carb2} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta2,
        'Tomate, cebolla cruda y/o pimiento verde crudo al gusto',
      ],
    },
    {
      key: 'c2_o3',
      lines: [
        '140 g Pechuga de pollo o 140 g Pechuga de pavo o 140 g Lomo de cerdo',
        '7 g Aceite de oliva virgen extra prensado en frío',
        '5 g Aceite de coco',
        `${carb2} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta2,
        'Tomate, cebolla cruda y/o pimiento verde crudo al gusto',
      ],
    },
    {
      key: 'c2_o4',
      lines: [
        '150 g Claras de huevo pasteurizadas',
        '2 Huevos',
        `${carb2} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta2,
        'Tomate, cebolla cruda y/o pimiento verde crudo al gusto',
      ],
    },
    {
      key: 'c2_o5',
      lines: [
        '300 g Queso fresco batido desnatado',
        '11 g Aceite de coco o 20 g Chocolate 80–100%',
        `${c2a.avenaGramos} g Copos de avena`,
        formatFruitOrMielLine(c2a.frutaUnidades, c2a.mielGramos),
      ],
    },
  ]

  const fruta3 = formatFruitOptionsLine(c3.frutaUnidades)

  const comida3Options = [
    {
      key: 'c3_o1',
      lines: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        '10 g Colágeno bovino hidrolizado',
        '1 lata de mejillones al natural o 1 lata escurrida (56 g) de atún al natural o 100 g almejas salvajes o 75 g ostras o 75 g vieiras o 120 g gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
        fruta3,
      ],
    },
    {
      key: 'c3_o2',
      lines: [
        'Café al gusto',
        '270 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        fruta3,
      ],
    },
    {
      key: 'c3_o3',
      lines: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        '12 g Colágeno bovino hidrolizado',
        '60 g Hígado de vaca o 60 g Hígado de cordero',
        fruta3,
      ],
    },
    {
      key: 'c3_o4',
      lines: [
        'Café al gusto',
        '250 g Queso fresco desnatado',
        '12 g Colágeno bovino hidrolizado',
        fruta3,
      ],
    },
    {
      key: 'c3_o5',
      lines: [
        'Café al gusto',
        '125 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        '150 g Claras de huevo pasteurizadas',
        fruta3,
      ],
    },
    {
      key: 'c3_o6',
      lines: [
        'Café al gusto',
        '200 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        '250 ml Leche fresca desnatada',
        fruta3,
      ],
    },
    {
      key: 'c3_o7',
      lines: [
        'Café al gusto',
        '250 ml Leche fresca desnatada',
        '12 g Colágeno bovino hidrolizado',
        '200 g Claras de huevo pasteurizadas',
        fruta3,
      ],
    },
  ]

  const fruitOrMiel4 = formatFruitOrMielLine(c4.frutaUnidades, c4.mielGramos)

  const comida4Options = [
    {
      key: 'c4_o1',
      lines: [
        '200 g Yogur entero de leche de cabra',
        `${fruitOrMiel4} (puedes combinar dos opciones tomando la mitad de cada una)`,
        '10 g Chocolate 80–100% o 7 g Mantequilla',
        '10 g Colágeno bovino hidrolizado',
        'Canela ceylán al gusto',
        '1 Zanahoria cruda pelada',
        '3 g Aceite de coco o 3 g Aceite de oliva virgen extra prensado en frío',
      ],
    },
    {
      key: 'c4_o2',
      lines: [
        '125 g Helado “Haggen Dazs”',
        '10 g Colágeno bovino hidrolizado',
        '1 Zanahoria cruda pelada',
        '3 g Aceite de coco o 3 g Aceite de oliva virgen extra prensado en frío',
      ],
    },
    {
      key: 'c4_o3',
      lines: [
        '25 g Queso de leche cruda',
        `${fruitOrMiel4} (puedes combinar dos opciones tomando la mitad de cada una)`,
        '10 g Chocolate 80–100% o 7 g Mantequilla',
        '100 ml Zumo de frutas a elegir + 10 g Colágeno bovino hidrolizado',
        '1 Zanahoria cruda pelada',
        '3 g Aceite de coco o 3 g Aceite de oliva virgen extra prensado en frío',
      ],
    },
  ]

  return `
    <div class="meal-box">
      <div class="meal-title">COMIDA 1</div>
      <div class="meal-subtext">5–10 min antes de empezar a comer, con todas las opciones: 10 g Jengibre crudo pelado (masticar hasta poder tragar sin agua)</div>
      <div class="meal-subtext">Al acabar de comer, con todas las opciones: 1 g Bisglicinato de magnesio</div>
      <div class="options-grid meal-options-grid">
        ${renderRandomOptionCards(comida1Options, numeroOpcionesPlan, seed, '4m_comida1')}
      </div>
    </div>

    <div class="meal-box">
      <div class="meal-title">COMIDA 2</div>
      <div class="meal-subtext">5–10 min antes de empezar a comer, con todas las opciones: 500 mg Vinagre de sidra de manzana en pastilla</div>
      <div class="meal-subtext">Al acabar de comer, con todas las opciones: 1 g Bisglicinato de magnesio</div>
      <div class="options-grid meal-options-grid">
        ${renderRandomOptionCards(comida2Options, numeroOpcionesPlan, seed, '4m_comida2')}
      </div>
    </div>

    <div class="meal-box">
      <div class="meal-title">COMIDA 3</div>
      <div class="meal-subtext">Al acabar de comer, con todas las opciones: 1 g Bisglicinato de magnesio</div>
      <div class="options-grid meal-options-grid">
        ${renderRandomOptionCards(comida3Options, numeroOpcionesPlan, seed, '4m_comida3')}
      </div>
    </div>

    <div class="meal-box">
      <div class="meal-title">COMIDA 4</div>
      <div class="meal-subtext">Al acabar de comer, con todas las opciones: 2 g Bisglicinato de magnesio</div>
      <div class="options-grid meal-options-grid">
        ${renderRandomOptionCards(comida4Options, numeroOpcionesPlan, seed, '4m_comida4')}
      </div>
    </div>
  `
}

function buildHtml(data) {
  const numeroOpcionesPlan =
    data.numeroOpcionesPlan === 2 || data.numeroOpcionesPlan === 3
      ? data.numeroOpcionesPlan
      : 1

  const ajustesPersonalizados = data.ajustesPersonalizados || {
    ultimaComidaTexto: [],
    duranteDiaTexto: [],
  }

  const indicacionesGenerales = data.indicacionesGenerales || []

  const mealsHtml =
    data.comidasDia === 4
      ? render4Meals(data, numeroOpcionesPlan)
      : render3Meals(data, numeroOpcionesPlan)

  return `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <style>
        @page {
          size: A4;
          margin: 8mm;
        }

        * {
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          color: #2f241d;
          background: #ffffff;
          line-height: 1.28;
          font-size: 9.4px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body {
          background: #ffffff;
        }

        .page {
          width: 100%;
          background: #ffffff;
          border-radius: 18px;
          padding: 6px;
        }

        .cover {
          min-height: 279mm;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 30%),
            linear-gradient(180deg, #f4e9df 0%, #ecdfd2 100%);
          border: 1px solid #dcc5b2;
          border-radius: 22px;
          padding: 12mm;
          page-break-after: always;
        }

        .cover-shell {
          width: 100%;
          background: rgba(255, 251, 247, 0.82);
          border: 1px solid #e2cfbf;
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 8px 24px rgba(91, 67, 51, 0.08);
        }

        .cover-brand {
          text-align: center;
          font-size: 42px;
          font-weight: 800;
          letter-spacing: 3px;
          color: #7b5a43;
          margin-bottom: 6px;
        }

        .cover-brand-line {
          width: 110px;
          height: 4px;
          background: #b08968;
          border-radius: 999px;
          margin: 0 auto 14px;
        }

        .cover-plan-name {
          text-align: center;
          font-size: 20px;
          line-height: 1.12;
          color: #4d3527;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .cover-description {
          text-align: center;
          font-size: 11px;
          color: #6d5646;
          line-height: 1.45;
          margin: 0 auto 12px;
          max-width: 130mm;
        }

        .cover-profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }

        .cover-profile-item {
          background: #fbf6f1;
          border: 1px solid #e1cdbc;
          border-radius: 12px;
          padding: 8px 9px;
          min-height: 50px;
        }

        .cover-profile-label {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.45px;
          color: #8a6a55;
          margin-bottom: 3px;
          text-align: center;
        }

        .cover-profile-value {
          font-size: 9.4px;
          color: #2f241d;
          font-weight: 600;
          line-height: 1.28;
          text-align: center;
        }

        .cover-summary {
          margin-top: 10px;
          background: #f7eee6;
          border: 1px solid #e7d7ca;
          border-radius: 12px;
          padding: 8px 10px;
          color: #5b4333;
          text-align: center;
          font-size: 9.6px;
          line-height: 1.4;
        }

        .section-stack {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }

        .card {
          background: #fffaf5;
          border: 1px solid #e2d1c2;
          border-radius: 14px;
          padding: 10px;
          box-shadow: 0 2px 6px rgba(123, 90, 67, 0.05);
        }

        .compact-card {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #6e4d39;
          text-align: center;
        }

        .notes-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .note-item {
          display: flex;
          gap: 7px;
          align-items: flex-start;
          background: #f7ede4;
          border: 1px solid #e7d7ca;
          border-radius: 10px;
          padding: 7px 8px;
        }

        .note-dot {
          width: 7px;
          height: 7px;
          min-width: 7px;
          border-radius: 50%;
          background: #b08968;
          margin-top: 3px;
        }

        .meal-box {
          background: #fffaf5;
          border: 1px solid #deccb9;
          border-radius: 14px;
          padding: 10px;
          margin-bottom: 10px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .meal-title {
          font-size: 14px;
          font-weight: 800;
          color: #6b4b36;
          margin-bottom: 10px;
          text-align: center;
        }

        .meal-subtext {
          font-size: 8.8px;
          color: #725947;
          background: #f4e7db;
          border: 1px solid #e3cfbe;
          border-radius: 8px;
          padding: 5px 7px;
          margin-bottom: 6px;
          text-align: center;
        }

        .meal-options-grid,
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          align-items: start;
          margin-top: 0;
        }

        .meal-options-grid > .option-card:last-child:nth-child(odd),
        .options-grid > .option-card:last-child:nth-child(odd) {
          grid-column: 1 / -1;
          max-width: calc(50% - 4px);
          justify-self: center;
        }

        .option-card {
          background: #ffffff;
          border: 1px solid #e5d4c4;
          border-radius: 12px;
          padding: 8px;
          break-inside: avoid;
          page-break-inside: avoid;
          min-height: 100%;
          text-align: center;
        }

        .option-title {
          display: inline-block;
          background: #7b5a43;
          color: #fff;
          border-radius: 999px;
          padding: 4px 9px;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .option-lines {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .food-line {
          display: block;
        }

        .food-pill {
          display: block;
          width: 100%;
          background: #f6eee6;
          border: 1px solid #ddc7b5;
          color: #2f241d;
          border-radius: 10px;
          padding: 6px 7px;
          font-size: 8.9px;
          line-height: 1.22;
          text-align: center;
        }

        .choice-box-label {
          display: inline-block;
          background: #fff8f2;
          border: 1px solid #e3cdbc;
          color: #7b5a43;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 8px;
          font-weight: 700;
          margin: 0 auto 5px;
        }

        .choice-box-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4px;
        }

        .choice-box-item {
          background: #fff;
          border: 1px solid #e3cfbe;
          border-radius: 8px;
          padding: 5px 6px;
          font-size: 8.5px;
          line-height: 1.18;
          color: #4f3728;
        }

        .line-separator {
          text-align: center;
          font-size: 10px;
          font-weight: 800;
          color: #7b5a43;
          margin: 4px 0 1px;
        }

        .footer-space {
          height: 2px;
        }

        .internal-card {
          background: #fff6ef;
          border: 1px solid #d9bfa7;
        }

        .internal-subtitle {
          font-size: 11px;
          font-weight: 700;
          color: #6b4b36;
          margin: 10px 0 6px;
        }

        .internal-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          table-layout: fixed;
        }

        .internal-table th,
        .internal-table td {
          border: 1px solid #dcc8b7;
          padding: 6px 7px;
          font-size: 8.4px;
          line-height: 1.2;
          vertical-align: top;
          text-align: left;
          word-break: break-word;
        }

        .internal-table th {
          background: #f2e3d6;
          color: #5a4030;
          font-weight: 700;
        }

        .mono-cell {
          font-family: "Courier New", monospace;
          font-size: 7.8px;
        }
      </style>
    </head>
    <body>
      ${renderCover(data)}

      <div class="page">
        <div class="section-stack">
          ${renderIndicacionesGenerales(indicacionesGenerales)}
          ${renderNotas('Ajustes recomendados durante el día', ajustesPersonalizados.duranteDiaTexto)}
          ${renderNotas('Ajustes recomendados para la última comida', ajustesPersonalizados.ultimaComidaTexto)}
          ${renderControlInterno(data)}
        </div>

        ${mealsHtml}

        <div class="footer-space"></div>
      </div>
    </body>
    </html>
  `
}

module.exports = buildHtml
