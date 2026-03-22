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

function splitByOr(text) {
  if (!text) return []
  return normalizeSpaces(text)
    .split(/\s+o\s+/gi)
    .map((part) => part.trim())
    .filter(Boolean)
}

function extractLeadingAmount(text) {
  const clean = normalizeSpaces(text)
  const patterns = [
    /^(\d+(?:[.,]\d+)?\s*(?:g|gr|kg|ml|l|ud|uds|unidad|unidades))\s+/i,
    /^(\d+(?:[.,]\d+)?)\s+(huevos?|claras?)\b/i,
    /^(\d+\s*lata(?:s)?(?:\s+escurrida)?(?:\s*\([^)]+\))?)\s+/i,
    /^(\d+\s*huevos?\s+enteros?\s*\+\s*\d+(?:[.,]\d+)?\s*g\s*claras?\s+de\s+huevo)\b/i,
  ]

  for (const pattern of patterns) {
    const match = clean.match(pattern)
    if (match) return match[1]
  }

  return null
}

function startsWithAmount(text) {
  return !!extractLeadingAmount(text)
}

function expandChoiceAmounts(parts) {
  if (!parts || parts.length <= 1) return parts || []

  const firstAmount = extractLeadingAmount(parts[0])
  if (!firstAmount) return parts

  return parts.map((part, index) => {
    const clean = normalizeSpaces(part)
    if (index === 0) return clean
    if (startsWithAmount(clean)) return clean
    return `${firstAmount} ${clean}`
  })
}

function renderFoodLine(line) {
  const rawParts = splitByOr(line)

  if (rawParts.length <= 1) {
    return `
      <div class="food-line">
        <div class="food-pill">${escapeHtml(line)}</div>
      </div>
    `
  }

  const parts = expandChoiceAmounts(rawParts)

  return `
    <div class="food-line choice-stack">
      ${parts
        .map(
          (part, index) => `
            <div class="choice-item">
              <div class="food-pill choice-pill">${escapeHtml(part)}</div>
              ${index < parts.length - 1 ? '<div class="choice-separator">o</div>' : ''}
            </div>
          `
        )
        .join('')}
    </div>
  `
}

function optionCard(title, lines) {
  return `
    <div class="option-card">
      <div class="option-title">${escapeHtml(title)}</div>
      <div class="option-lines">
        ${lines.map((line) => renderFoodLine(line)).join('')}
      </div>
    </div>
  `
}

function renderNotas(title, items) {
  if (!items || items.length === 0) return ''
  return `
    <div class="card">
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

function renderRange(maxPlanOptions, maxMealOptions, renderFn) {
  const count = Math.min(maxPlanOptions, maxMealOptions)
  return Array.from({ length: count }, (_, i) => renderFn(i + 1)).join('')
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

function renderCover(data, numeroOpcionesPlan) {
  const objetivo = formatObjetivo(data)
  const nombre = data.nombre || 'Cliente'
  const plan = data.plan || 'Plan personalizado'
  const fecha = formatFecha(data.fechaGeneracion)

  const badges = [
    `Objetivo: ${objetivo || '-'}`,
    `Comidas: ${data.comidasDia || 3}`,
    `Opciones por comida: ${numeroOpcionesPlan}`,
    data.caloriasObjetivo ? `Kcal objetivo: ${data.caloriasObjetivo}` : '',
  ].filter(Boolean)

  return `
    <section class="cover">
      <div class="cover-brand-wrap">
        <div class="cover-brand">DIETA MAKE</div>
        <div class="cover-brand-line"></div>
      </div>

      <div class="cover-panel">
        <div class="cover-kicker">Plan nutricional personalizado</div>
        <h1 class="cover-title">${escapeHtml(data.tituloPlan || 'Plan nutricional personalizado')}</h1>
        <p class="cover-text">
          Diseñado según el perfil, el objetivo y la estructura de comidas del cliente.
        </p>

        <div class="cover-client">
          <div class="cover-client-item">
            <div class="cover-label">Cliente</div>
            <div class="cover-value">${escapeHtml(nombre)}</div>
          </div>
          <div class="cover-client-item">
            <div class="cover-label">Objetivo</div>
            <div class="cover-value">${escapeHtml(objetivo)}</div>
          </div>
          <div class="cover-client-item">
            <div class="cover-label">Plan</div>
            <div class="cover-value">${escapeHtml(plan)}</div>
          </div>
          <div class="cover-client-item">
            <div class="cover-label">Fecha</div>
            <div class="cover-value">${escapeHtml(fecha)}</div>
          </div>
        </div>

        <div class="cover-badges">
          ${badges.map((badge) => `<span class="cover-badge">${escapeHtml(badge)}</span>`).join('')}
        </div>
      </div>

      <div class="cover-footer">Guía visual de comidas y opciones</div>
    </section>
  `
}

function renderClientProfile(data, numeroOpcionesPlan) {
  const objetivo = formatObjetivo(data)

  const profileItems = [
    ['Nombre', data.nombre || '-'],
    ['Email', data.email || '-'],
    ['Sexo', data.sexo || '-'],
    ['Edad', data.edad ? `${data.edad} años` : '-'],
    ['Altura', data.altura ? `${data.altura} cm` : '-'],
    ['Peso', data.peso ? `${data.peso} kg` : '-'],
    ['Objetivo', objetivo || '-'],
    ['Actividad diaria', data.actividad || '-'],
    ['Horas de sueño', data.sueno || '-'],
    ['Grasa abdominal', data.grasa_abdominal || '-'],
    ['Primera comida', data.primera_comida || '-'],
    ['Frecuencia de baño', data.bano || '-'],
    ['Despertares nocturnos', data.despertares_noche || '-'],
    ['Comidas al día', data.comidasDia || 3],
    ['Opciones por comida', numeroOpcionesPlan],
    ['Calorías objetivo', data.caloriasObjetivo ? `${data.caloriasObjetivo} kcal` : '-'],
  ]

  return `
    <div class="card">
      <div class="section-title">Perfil de cliente</div>
      <div class="profile-grid">
        ${profileItems
          .map(
            ([label, value]) => `
              <div class="profile-item">
                <div class="profile-label">${escapeHtml(label)}</div>
                <div class="profile-value">${escapeHtml(value)}</div>
              </div>
            `
          )
          .join('')}
      </div>
      ${
        data.resumenPlan
          ? `<div class="profile-summary">${escapeHtml(data.resumenPlan)}</div>`
          : ''
      }
    </div>
  `
}

/* ====== 3 COMIDAS ====== */

function render3Meals(data, numeroOpcionesPlan) {
  const a = data.ajustes || {}
  const c1 = a.comida1 || {}
  const c2 = a.comida2 || {}
  const c3n = a.comida3Normal || {}
  const c3a = a.comida3Avena || {}

  const comida1 = (option) => {
    const fruta = formatFruitOptionsLine(c1.frutaUnidades)
    const avena = `${c1.avenaGramos} g Copos de avena`

    const options = {
      1: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '10 g Colágeno bovino hidrolizado',
        '1 lata de mejillones al natural o 1 lata escurrida (56 g) de atún al natural o 100 g almejas salvajes o 75 g ostras o 75 g vieiras o 120 g gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
        fruta,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena,
      ],
      2: [
        'Café al gusto',
        '270 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        fruta,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena,
      ],
      3: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '60 g Hígado de vaca o 60 g Hígado de cordero',
        fruta,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena,
      ],
      4: [
        'Café al gusto',
        '250 g Queso fresco desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        fruta,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena,
      ],
      5: [
        'Café al gusto',
        '125 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '150 g Claras de huevo pasteurizadas',
        fruta,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena,
      ],
      6: [
        'Café al gusto',
        '200 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '250 ml Leche fresca desnatada',
        fruta,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena,
      ],
      7: [
        'Café al gusto',
        '250 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '200 g Claras de huevo pasteurizadas',
        fruta,
        '50 g Queso de leche cruda o 40 g Chocolate 80-100% o 30 g Mantequilla o 50 g Leche condensada + 12 g Aceite de coco o 24 g Aceite de coco o 150 g Aguacate o 35 g Nueces de macadamia',
        avena,
      ],
    }

    return optionCard(`Opción ${option}`, options[option])
  }

  const comida2 = (option) => {
    const fruta = formatFruitOptionsLine(c2.frutaUnidades)
    const pan = `${c2.panGramos} g Pan de masa madre`

    const options = {
      1: [
        '500 ml Leche fresca desnatada',
        '10 g Colágeno bovino hidrolizado',
        '1 lata de mejillones al natural o 1 lata escurrida (56 g) de atún al natural o 100 g almejas salvajes o 75 g ostras o 75 g vieiras o 120 g gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
        fruta,
        pan,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
      2: [
        '270 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        fruta,
        pan,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
      3: [
        '500 ml Leche fresca desnatada',
        '12 g Colágeno bovino hidrolizado',
        '60 g Hígado de vaca o 60 g Hígado de cordero',
        fruta,
        pan,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
      4: [
        '250 g Queso fresco desnatado',
        '12 g Colágeno bovino hidrolizado',
        fruta,
        pan,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
      5: [
        '125 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        '150 g Claras de huevo pasteurizadas',
        fruta,
        pan,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
      6: [
        '200 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        '250 ml Leche fresca desnatada',
        fruta,
        pan,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
      7: [
        '250 ml Leche fresca desnatada',
        '12 g Colágeno bovino hidrolizado',
        '200 g Claras de huevo pasteurizadas',
        fruta,
        pan,
        '5 ml Aceite de oliva virgen extra prensado en frío',
        'Tomate al gusto',
      ],
    }

    return optionCard(`Opción ${option}`, options[option])
  }

  const comida3 = (option) => {
    if (option === 4) {
      return optionCard('Opción 4', [
        '300 g Queso fresco batido desnatado',
        '11 g Aceite de coco o 20 g Chocolate 80–100%',
        `${c3a.avenaGramos} g Copos de avena (dejar en remojo en agua la noche anterior con un poco de vinagre de sidra de manzana, en recipiente cerrado, lugar oscuro y a temperatura ambiente; después quitar el agua, lavar varias veces y cocinar antes de consumir)`,
        formatFruitOrMielLine(c3a.frutaUnidades, c3a.mielGramos),
        '50 g Queso de leche cruda o 40 g Chocolate 80–100% o 150 g Aguacate o 35 g Nueces de macadamia',
      ])
    }

    const carbLine = `${c3n.patataGramos} g Patata o ${c3n.boniatoGramos} g Boniato o ${c3n.arrozGramos} g Arroz blanco cocido`
    const fruta = formatFruitOptionsLine(c3n.frutaUnidades)

    const options = {
      1: [
        '150 g Carne picada de ternera',
        '5 g Aceite de coco',
        carbLine,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta,
        '50 g Queso de leche cruda o 40 g Chocolate 80–100% o 150 g Aguacate o 35 g Nueces de macadamia',
      ],
      2: [
        '290 g Gambas salvajes o 175 g Ostras o 190 g Pulpo cocido o 185 g Merluza o 245 g Bacalao o 170 g Boquerones salvajes (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)',
        '8 g Aceite de oliva virgen extra prensado en frío',
        '5 g Aceite de coco',
        carbLine,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta,
        '50 g Queso de leche cruda o 40 g Chocolate 80–100% o 150 g Aguacate o 35 g Nueces de macadamia',
      ],
      3: [
        '140 g Pechuga de pollo o 140 g Pechuga de pavo o 140 g Lomo de cerdo',
        '7 g Aceite de oliva virgen extra prensado en frío',
        '5 g Aceite de coco',
        carbLine,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta,
        '50 g Queso de leche cruda o 40 g Chocolate 80–100% o 150 g Aguacate o 35 g Nueces de macadamia',
      ],
      5: [
        '2 huevos enteros + 180 g Claras de huevo',
        '7 g Aceite de oliva virgen extra prensado en frío',
        '5 g Aceite de coco',
        carbLine,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta,
        '50 g Queso de leche cruda o 40 g Chocolate 80–100% o 150 g Aguacate o 35 g Nueces de macadamia',
      ],
      6: [
        '200 g Salmón',
        '5 g Aceite de oliva virgen extra prensado en frío',
        carbLine,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta,
        '35 g Nueces de macadamia o 150 g Aguacate (ligeramente ajustado en grasas para compensar el salmón)',
      ],
    }

    return optionCard(`Opción ${option}`, options[option])
  }

  return `
    <div class="meal-box">
      <div class="meal-title">COMIDA 1</div>
      <div class="options-grid">
        ${renderRange(numeroOpcionesPlan, 7, comida1)}
      </div>
    </div>

    <div class="meal-box">
      <div class="meal-title">COMIDA 2</div>
      <div class="options-grid">
        ${renderRange(numeroOpcionesPlan, 7, comida2)}
      </div>
    </div>

    <div class="meal-box">
      <div class="meal-title">COMIDA 3</div>
      <div class="meal-subtext">5 min antes de empezar a comer: Vinagre de sidra de manzana en pastilla (500 mg)</div>
      <div class="meal-subtext">Al acabar de comer: Bisglicinato de magnesio (2 g)</div>
      <div class="options-grid">
        ${renderRange(numeroOpcionesPlan, 6, comida3)}
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

  const comida1 = (option) => {
    const fruta = formatFruitOptionsLine(c1.frutaUnidades)

    const options = {
      1: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '10 g Colágeno bovino hidrolizado',
        '1 lata de mejillones al natural o 1 lata escurrida (56 g) de atún al natural o 100 g almejas salvajes o 75 g ostras o 75 g vieiras o 120 g gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
        fruta,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
      2: [
        'Café al gusto',
        '270 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        fruta,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
      3: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '60 g Hígado de vaca o 60 g Hígado de cordero',
        fruta,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
      4: [
        'Café al gusto',
        '250 g Queso fresco desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        fruta,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
      5: [
        'Café al gusto',
        '125 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '150 g Claras de huevo pasteurizadas',
        fruta,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
      6: [
        'Café al gusto',
        '200 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '250 ml Leche fresca desnatada',
        fruta,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
      7: [
        'Café al gusto',
        '250 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '200 g Claras de huevo pasteurizadas',
        fruta,
        '25 g Queso de leche cruda o 20 g Chocolate 80–100% o 15 g Mantequilla o 25 g Leche condensada + 6 g Aceite de coco o 12 g Aceite de coco',
      ],
    }

    return optionCard(`Opción ${option}`, options[option])
  }

  const comida2 = (option) => {
    if (option === 5) {
      return optionCard('Opción 5', [
        '300 g Queso fresco batido desnatado',
        '11 g Aceite de coco o 20 g Chocolate 80–100%',
        `${c2a.avenaGramos} g Copos de avena (dejar en remojo en agua la noche anterior, con un poco de vinagre de sidra de manzana, dentro de un recipiente cerrado, en un lugar oscuro y a temperatura ambiente. Quitar el agua, lavar varias veces y cocinar antes de consumir)`,
        formatFruitOrMielLine(c2a.frutaUnidades, c2a.mielGramos),
      ])
    }

    const carbLine = `${c2n.patataGramos} g Patata o ${c2n.boniatoGramos} g Boniato o ${c2n.calabazaGramos} g Calabaza`
    const fruta = formatFruitOptionsLine(c2n.frutaUnidades)

    const options = {
      1: [
        '150 g Carne picada de ternera',
        '5 g Aceite de coco',
        `${carbLine} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta,
        'Tomate, cebolla cruda y/o pimiento verde crudo al gusto',
      ],
      2: [
        '290 g Gambas salvajes o 175 g Ostras o 190 g Pulpo cocido o 185 g Merluza o 245 g Bacalao o 170 g Boquerones salvajes (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)',
        '8 g Aceite de oliva virgen extra prensado en frío',
        '5 g Aceite de coco',
        `${carbLine} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta,
        'Tomate, cebolla cruda y/o pimiento verde crudo al gusto',
      ],
      3: [
        '140 g Pechuga de pollo o 140 g Pechuga de pavo o 140 g Lomo de cerdo',
        '7 g Aceite de oliva virgen extra prensado en frío',
        '5 g Aceite de coco',
        `${carbLine} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta,
        'Tomate, cebolla cruda y/o pimiento verde crudo al gusto',
      ],
      4: [
        '150 g Claras de huevo pasteurizadas',
        '2 Huevos',
        `${carbLine} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g Calabacín o 150 g Pepino o 200 g Champiñones (hervir como mínimo durante 1 h)',
        fruta,
        'Tomate, cebolla cruda y/o pimiento verde crudo al gusto',
      ],
    }

    return optionCard(`Opción ${option}`, options[option])
  }

  const comida3 = (option) => {
    const fruta = formatFruitOptionsLine(c3.frutaUnidades)

    const options = {
      1: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        '10 g Colágeno bovino hidrolizado',
        '1 lata de mejillones al natural o 1 lata escurrida (56 g) de atún al natural o 100 g almejas salvajes o 75 g ostras o 75 g vieiras o 120 g gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
        fruta,
      ],
      2: [
        'Café al gusto',
        '270 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        fruta,
      ],
      3: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        '12 g Colágeno bovino hidrolizado',
        '60 g Hígado de vaca o 60 g Hígado de cordero',
        fruta,
      ],
      4: [
        'Café al gusto',
        '250 g Queso fresco desnatado',
        '12 g Colágeno bovino hidrolizado',
        fruta,
      ],
      5: [
        'Café al gusto',
        '125 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        '150 g Claras de huevo pasteurizadas',
        fruta,
      ],
      6: [
        'Café al gusto',
        '200 g Queso fresco batido desnatado',
        '12 g Colágeno bovino hidrolizado',
        '250 ml Leche fresca desnatada',
        fruta,
      ],
      7: [
        'Café al gusto',
        '250 ml Leche fresca desnatada',
        '12 g Colágeno bovino hidrolizado',
        '200 g Claras de huevo pasteurizadas',
        fruta,
      ],
    }

    return optionCard(`Opción ${option}`, options[option])
  }

  const comida4 = (option) => {
    const fruitOrMiel = formatFruitOrMielLine(c4.frutaUnidades, c4.mielGramos)

    const options = {
      1: [
        '200 g Yogur entero de leche de cabra',
        `${fruitOrMiel} (puedes combinar dos opciones tomando la mitad de cada una)`,
        '10 g Chocolate 80–100% o 7 g Mantequilla',
        '10 g Colágeno bovino hidrolizado',
        'Canela ceylán al gusto',
        '1 Zanahoria cruda pelada',
        '3 g Aceite de coco o 3 g Aceite de oliva virgen extra prensado en frío',
      ],
      2: [
        '125 g Helado “Haggen Dazs”',
        '10 g Colágeno bovino hidrolizado',
        '1 Zanahoria cruda pelada',
        '3 g Aceite de coco o 3 g Aceite de oliva virgen extra prensado en frío',
      ],
      3: [
        '25 g Queso de leche cruda',
        `${fruitOrMiel} (puedes combinar dos opciones tomando la mitad de cada una)`,
        '10 g Chocolate 80–100% o 7 g Mantequilla',
        '100 ml Zumo de frutas a elegir + 10 g Colágeno bovino hidrolizado',
        '1 Zanahoria cruda pelada',
        '3 g Aceite de coco o 3 g Aceite de oliva virgen extra prensado en frío',
      ],
    }

    return optionCard(`Opción ${option}`, options[option])
  }

  return `
    <div class="meal-box">
      <div class="meal-title">COMIDA 1</div>
      <div class="meal-subtext">5–10 min antes de empezar a comer, con todas las opciones: 10 g Jengibre crudo pelado (masticar hasta poder tragar sin agua)</div>
      <div class="meal-subtext">Al acabar de comer, con todas las opciones: 1 g Bisglicinato de magnesio</div>
      <div class="options-grid">
        ${renderRange(numeroOpcionesPlan, 7, comida1)}
      </div>
    </div>

    <div class="meal-box">
      <div class="meal-title">COMIDA 2</div>
      <div class="meal-subtext">5–10 min antes de empezar a comer, con todas las opciones: 500 mg Vinagre de sidra de manzana en pastilla</div>
      <div class="meal-subtext">Al acabar de comer, con todas las opciones: 1 g Bisglicinato de magnesio</div>
      <div class="options-grid">
        ${renderRange(numeroOpcionesPlan, 5, comida2)}
      </div>
    </div>

    <div class="meal-box">
      <div class="meal-title">COMIDA 3</div>
      <div class="meal-subtext">Al acabar de comer, con todas las opciones: 1 g Bisglicinato de magnesio</div>
      <div class="options-grid">
        ${renderRange(numeroOpcionesPlan, 7, comida3)}
      </div>
    </div>

    <div class="meal-box">
      <div class="meal-title">COMIDA 4</div>
      <div class="meal-subtext">Al acabar de comer, con todas las opciones: 2 g Bisglicinato de magnesio</div>
      <div class="options-grid">
        ${renderRange(numeroOpcionesPlan, 3, comida4)}
      </div>
    </div>
  `
}

function buildHtml(data) {
  const numeroOpcionesPlan =
    data.numeroOpcionesPlan === 5 || data.numeroOpcionesPlan === 7 ? data.numeroOpcionesPlan : 1

  const ajustesPersonalizados = data.ajustesPersonalizados || {
    ultimaComidaTexto: [],
    duranteDiaTexto: [],
  }

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
          margin: 12mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          color: #2f241d;
          background: #f8f2eb;
          line-height: 1.42;
          font-size: 11px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page {
          width: 100%;
        }

        .cover {
          min-height: 245mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          page-break-after: always;
          background: linear-gradient(180deg, #f8f2eb 0%, #efe3d7 100%);
          border: 1px solid #dfc7b5;
          border-radius: 26px;
          padding: 28mm 18mm;
        }

        .cover-brand-wrap {
          text-align: center;
          margin-bottom: 26px;
        }

        .cover-brand {
          font-size: 34px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #7b5a43;
        }

        .cover-brand-line {
          width: 120px;
          height: 4px;
          background: #b08968;
          border-radius: 999px;
          margin: 10px auto 0;
        }

        .cover-panel {
          background: rgba(255, 250, 245, 0.88);
          border: 1px solid #e2cdbd;
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 8px 24px rgba(123, 90, 67, 0.08);
        }

        .cover-kicker {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #8a6954;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .cover-title {
          font-size: 28px;
          line-height: 1.15;
          margin: 0 0 10px;
          color: #4d3527;
        }

        .cover-text {
          margin: 0 0 18px;
          font-size: 13px;
          color: #6d5646;
        }

        .cover-client {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
        }

        .cover-client-item {
          background: #f4e7db;
          border: 1px solid #e2cdbd;
          border-radius: 14px;
          padding: 12px;
        }

        .cover-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #8b6c57;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .cover-value {
          font-size: 13px;
          font-weight: 700;
          color: #34271f;
        }

        .cover-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .cover-badge {
          display: inline-block;
          background: #7b5a43;
          color: #fff;
          border-radius: 999px;
          padding: 7px 11px;
          font-size: 10px;
          font-weight: 700;
        }

        .cover-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 11px;
          color: #7f6553;
          font-weight: 600;
        }

        .brand-wrap {
          text-align: center;
          margin-bottom: 14px;
        }

        .brand {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #7b5a43;
          margin-bottom: 4px;
        }

        .brand-line {
          width: 110px;
          height: 3px;
          background: #b08968;
          margin: 0 auto;
          border-radius: 999px;
        }

        .hero {
          background: linear-gradient(135deg, #ead9c8 0%, #f5ece3 100%);
          border: 1px solid #dcc4af;
          border-radius: 18px;
          padding: 15px;
          margin-bottom: 14px;
        }

        .title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #4f3728;
        }

        .subtitle {
          font-size: 12px;
          color: #6f5644;
          margin: 0;
        }

        .card {
          background: #fffaf5;
          border: 1px solid #e2d1c2;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 14px;
          box-shadow: 0 2px 8px rgba(123, 90, 67, 0.05);
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px;
          color: #6e4d39;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .profile-item {
          background: #f4e8dc;
          border: 1px solid #e2cdbb;
          border-radius: 12px;
          padding: 10px 12px;
        }

        .profile-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #8a6a55;
          margin-bottom: 4px;
        }

        .profile-value {
          font-size: 12px;
          color: #2f241d;
          font-weight: 600;
        }

        .profile-summary {
          margin-top: 12px;
          background: #f8efe7;
          border: 1px solid #ead7c8;
          border-radius: 12px;
          padding: 10px 12px;
          color: #5b4333;
        }

        .notes-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .note-item {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          background: #f7ede4;
          border: 1px solid #e7d7ca;
          border-radius: 12px;
          padding: 9px 10px;
        }

        .note-dot {
          width: 8px;
          height: 8px;
          min-width: 8px;
          border-radius: 50%;
          background: #b08968;
          margin-top: 5px;
        }

        .meal-box {
          background: #fffaf5;
          border: 1px solid #deccb9;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 16px;
          page-break-inside: avoid;
        }

        .meal-title {
          font-size: 17px;
          font-weight: 800;
          color: #6b4b36;
          margin-bottom: 8px;
        }

        .meal-subtext {
          font-size: 11px;
          color: #725947;
          background: #f4e7db;
          border: 1px solid #e3cfbe;
          border-radius: 10px;
          padding: 8px 10px;
          margin-bottom: 7px;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 10px;
        }

        .option-card {
          background: #ffffff;
          border: 1px solid #e5d4c4;
          border-radius: 14px;
          padding: 12px;
          page-break-inside: avoid;
          break-inside: avoid;
          min-height: 100%;
        }

        .option-title {
          display: inline-block;
          background: #7b5a43;
          color: #fff;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .option-lines {
          display: flex;
          flex-direction: column;
          gap: 8px;
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
          border-radius: 14px;
          padding: 9px 11px;
          font-size: 11px;
          line-height: 1.4;
        }

        .choice-stack {
          background: #fbf6f1;
          border: 1px dashed #dcc2af;
          border-radius: 14px;
          padding: 8px;
        }

        .choice-pill {
          background: #fff8f2;
        }

        .choice-item + .choice-item {
          margin-top: 6px;
        }

        .choice-separator {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #8b6a55;
          margin: 5px 0 2px;
        }

        .footer-space {
          height: 6px;
        }
      </style>
    </head>
    <body>
      ${renderCover(data, numeroOpcionesPlan)}

      <div class="page">
        <div class="brand-wrap">
          <div class="brand">DIETA MAKE</div>
          <div class="brand-line"></div>
        </div>

        <div class="hero">
          <div class="title">${escapeHtml(data.tituloPlan || 'Plan nutricional personalizado')}</div>
          <p class="subtitle">Se respetan los alimentos de cada opción y solo se ajustan las fuentes de hidratos.</p>
        </div>

        ${renderClientProfile(data, numeroOpcionesPlan)}

        ${renderNotas('Ajustes recomendados para la última comida', ajustesPersonalizados.ultimaComidaTexto)}
        ${renderNotas('Ajustes recomendados durante el día', ajustesPersonalizados.duranteDiaTexto)}

        ${mealsHtml}

        <div class="footer-space"></div>
      </div>
    </body>
    </html>
  `
}

module.exports = buildHtml
