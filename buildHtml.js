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

function optionCard(title, lines) {
  return `
    <div class="option-card">
      <div class="option-title">${escapeHtml(title)}</div>
      <ul>
        ${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
      </ul>
    </div>
  `
}

function renderNotas(title, items) {
  if (!items || items.length === 0) return ''
  return `
    <div class="card">
      <div class="section-title">${escapeHtml(title)}</div>
      <ul>
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </div>
  `
}

function renderRange(maxPlanOptions, maxMealOptions, renderFn) {
  const count = Math.min(maxPlanOptions, maxMealOptions)
  return Array.from({ length: count }, (_, i) => renderFn(i + 1)).join('')
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
    const avena = `${c1.avenaGramos}g Copos de avena`

    const options = {
      1: [
        'Café al gusto',
        '500ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '10g Colágeno bovino hidrolizado',
        '1 Lata de mejillones al natural o 1 Lata escurrida (56g) de atún al natural o 100g Almejas salvajes o 75g Ostras o 75 Vieiras o 120g Gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
        fruta,
        '50g Queso de leche cruda o 40g Chocolate 80-100% o 30g Mantequilla / 24g Aceite de coco o 150g Aguacate o 35g Nueces de macadamia',
        avena,
      ],
      2: [
        'Café al gusto',
        '270g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12g Colágeno bovino hidrolizado',
        fruta,
        '50g Queso de leche cruda o 40g Chocolate 80-100% o 30g Mantequilla o 50g Leche condensada + 12g Aceite de coco o 24g Aceite de coco o 150g Aguacate o 35g Nueces de macadamia',
        avena,
      ],
      3: [
        'Café al gusto',
        '500ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12g Colágeno bovino hidrolizado',
        '60g Hígado de vaca o Hígado de cordero',
        fruta,
        '50g Queso de leche cruda o 40g Chocolate 80-100% o 30g Mantequilla o 50g Leche condensada + 12g Aceite de coco o 24g Aceite de coco o 150g Aguacate o 35g Nueces de macadamia',
        avena,
      ],
      4: [
        'Café al gusto',
        '250g Queso fresco desnatado',
        'Canela ceylán al gusto',
        '12g Colágeno bovino hidrolizado',
        fruta,
        '50g Queso de leche cruda o 40g Chocolate 80-100% o 30g Mantequilla o 50g Leche condensada + 12g Aceite de coco o 24g Aceite de coco o 150g Aguacate o 35g Nueces de macadamia',
        avena,
      ],
      5: [
        'Café al gusto',
        '125g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12g Colágeno bovino hidrolizado',
        '150g Claras de huevo pasteurizadas',
        fruta,
        '50g Queso de leche cruda o 40g Chocolate 80-100% o 30g Mantequilla o 50g Leche condensada + 12g Aceite de coco o 24g Aceite de coco o 150g Aguacate o 35g Nueces de macadamia',
        avena,
      ],
      6: [
        'Café al gusto',
        '200g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12g Colágeno bovino hidrolizado',
        '250ml Leche fresca desnatada',
        fruta,
        '50g Queso de leche cruda o 40g Chocolate 80-100% o 30g Mantequilla o 50g Leche condensada + 12g Aceite de coco o 24g Aceite de coco o 150g Aguacate o 35g Nueces de macadamia',
        avena,
      ],
      7: [
        'Café al gusto',
        '250ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12g Colágeno bovino hidrolizado',
        '200g Claras de huevo pasteurizadas',
        fruta,
        '50g Queso de leche cruda o 40g Chocolate 80-100% o 30g Mantequilla o 50g Leche condensada + 12g Aceite de coco o 24g Aceite de coco o 150g Aguacate o 35g Nueces de macadamia',
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
        'Leche fresca desnatada (500 ml)',
        'Colágeno bovino hidrolizado (10 g)',
        '1 lata de mejillones al natural o 1 lata escurrida (56 g) de atún al natural o 100 g almejas salvajes o 75 g ostras o 75 g vieiras o 120 g gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
        fruta,
        pan,
        'Aceite de oliva virgen extra prensado en frío (5 ml)',
        'Tomate al gusto',
      ],
      2: [
        'Queso fresco batido desnatado (270 g)',
        'Colágeno bovino hidrolizado (12 g)',
        fruta,
        pan,
        'Aceite de oliva virgen extra prensado en frío (5 ml)',
        'Tomate al gusto',
      ],
      3: [
        'Leche fresca desnatada (500 ml)',
        'Colágeno bovino hidrolizado (12 g)',
        '60 g hígado de vaca o hígado de cordero',
        fruta,
        pan,
        'Aceite de oliva virgen extra prensado en frío (5 ml)',
        'Tomate al gusto',
      ],
      4: [
        'Queso fresco desnatado (250 g)',
        'Colágeno bovino hidrolizado (12 g)',
        fruta,
        pan,
        'Aceite de oliva virgen extra prensado en frío (5 ml)',
        'Tomate al gusto',
      ],
      5: [
        'Queso fresco batido desnatado (125 g)',
        'Colágeno bovino hidrolizado (12 g)',
        'Claras de huevo pasteurizadas (150 g)',
        fruta,
        pan,
        'Aceite de oliva virgen extra prensado en frío (5 ml)',
        'Tomate al gusto',
      ],
      6: [
        'Queso fresco batido desnatado (200 g)',
        'Colágeno bovino hidrolizado (12 g)',
        'Leche fresca desnatada (250 ml)',
        fruta,
        pan,
        'Aceite de oliva virgen extra prensado en frío (5 ml)',
        'Tomate al gusto',
      ],
      7: [
        'Leche fresca desnatada (250 ml)',
        'Colágeno bovino hidrolizado (12 g)',
        'Claras de huevo pasteurizadas (200 g)',
        fruta,
        pan,
        'Aceite de oliva virgen extra prensado en frío (5 ml)',
        'Tomate al gusto',
      ],
    }

    return optionCard(`Opción ${option}`, options[option])
  }

  const comida3 = (option) => {
    if (option === 4) {
      return optionCard('Opción 4', [
        'Queso fresco batido desnatado (300 g)',
        '11 g aceite de coco o 20 g chocolate 80–100%',
        `${c3a.avenaGramos} g Copos de avena (dejar en remojo en agua la noche anterior con un poco de vinagre de sidra de manzana, en recipiente cerrado, lugar oscuro y a temperatura ambiente; después quitar el agua, lavar varias veces y cocinar antes de consumir)`,
        formatFruitOrMielLine(c3a.frutaUnidades, c3a.mielGramos),
        '50 g queso de leche cruda o 40 g chocolate 80–100% o 150 g aguacate o 35 g nueces de macadamia',
      ])
    }

    const carbLine = `${c3n.patataGramos} g patata o ${c3n.boniatoGramos} g boniato o ${c3n.arrozGramos} g arroz blanco cocido`
    const fruta = formatFruitOptionsLine(c3n.frutaUnidades)

    const options = {
      1: [
        'Carne picada de ternera (150 g)',
        'Aceite de coco (5 g)',
        carbLine,
        '150 g pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
        fruta,
        '50 g queso de leche cruda o 40 g chocolate 80–100% o 150 g aguacate o 35 g nueces de macadamia',
      ],
      2: [
        '290 g gambas salvajes o 175 g ostras o 190 g pulpo cocido o 185 g merluza o 245 g bacalao o 170 g boquerones salvajes (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)',
        'Aceite de oliva virgen extra prensado en frío (8 g)',
        'Aceite de coco (5 g)',
        carbLine,
        '150 g pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
        fruta,
        '50 g queso de leche cruda o 40 g chocolate 80–100% o 150 g aguacate o 35 g nueces de macadamia',
      ],
      3: [
        '140 g pechuga de pollo o pechuga de pavo o lomo de cerdo',
        'Aceite de oliva virgen extra prensado en frío (7 g)',
        'Aceite de coco (5 g)',
        carbLine,
        '150 g pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
        fruta,
        '50 g queso de leche cruda o 40 g chocolate 80–100% o 150 g aguacate o 35 g nueces de macadamia',
      ],
      5: [
        '2 huevos enteros + 180 g claras de huevo',
        'Aceite de oliva virgen extra prensado en frío (7 g)',
        'Aceite de coco (5 g)',
        carbLine,
        '150 g pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
        fruta,
        '50 g queso de leche cruda o 40 g chocolate 80–100% o 150 g aguacate o 35 g nueces de macadamia',
      ],
      6: [
        '200 g salmón',
        'Aceite de oliva virgen extra prensado en frío (5 g)',
        carbLine,
        '150 g pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
        fruta,
        '35 g nueces de macadamia o 150 g aguacate (ligeramente ajustado en grasas para compensar el salmón)',
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
        '1 lata de mejillones al natural o 1 lata escurrida (56 g) de atún al natural o 100 g almejas salvajes o 75 g ostras o 75 vieiras o 120 g gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
        fruta,
        '25 g queso de leche cruda o 20 g chocolate 80–100% o 15 g mantequilla o 25 g leche condensada + 6 g aceite de coco o 12 g aceite de coco',
      ],
      2: [
        'Café al gusto',
        '270 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        fruta,
        '25 g queso de leche cruda o 20 g chocolate 80–100% o 15 g mantequilla o 25 g leche condensada + 6 g aceite de coco o 12 g aceite de coco',
      ],
      3: [
        'Café al gusto',
        '500 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '60 g Hígado de vaca o hígado de cordero',
        fruta,
        '25 g queso de leche cruda o 20 g chocolate 80–100% o 15 g mantequilla o 25 g leche condensada + 6 g aceite de coco o 12 g aceite de coco',
      ],
      4: [
        'Café al gusto',
        '250 g Queso fresco desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        fruta,
        '25 g queso de leche cruda o 20 g chocolate 80–100% o 15 g mantequilla o 25 g leche condensada + 6 g aceite de coco o 12 g aceite de coco',
      ],
      5: [
        'Café al gusto',
        '125 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '150 g Claras de huevo pasteurizadas',
        fruta,
        '25 g queso de leche cruda o 20 g chocolate 80–100% o 15 g mantequilla o 25 g leche condensada + 6 g aceite de coco o 12 g aceite de coco',
      ],
      6: [
        'Café al gusto',
        '200 g Queso fresco batido desnatado',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '250 ml Leche fresca desnatada',
        fruta,
        '25 g queso de leche cruda o 20 g chocolate 80–100% o 15 g mantequilla o 25 g leche condensada + 6 g aceite de coco o 12 g aceite de coco',
      ],
      7: [
        'Café al gusto',
        '250 ml Leche fresca desnatada',
        'Canela ceylán al gusto',
        '12 g Colágeno bovino hidrolizado',
        '200 g Claras de huevo pasteurizadas',
        fruta,
        '25 g queso de leche cruda o 20 g chocolate 80–100% o 15 g mantequilla o 25 g leche condensada + 6 g aceite de coco o 12 g aceite de coco',
      ],
    }

    return optionCard(`Opción ${option}`, options[option])
  }

  const comida2 = (option) => {
    if (option === 5) {
      return optionCard('Opción 5', [
        '300 g Queso fresco batido desnatado',
        '11 g Aceite de coco o 20 g chocolate 80–100%',
        `${c2a.avenaGramos} g Copos de avena (dejar en remojo en agua la noche anterior, con un poco de vinagre de sidra de manzana, dentro de un recipiente cerrado, en un lugar oscuro y a temperatura ambiente. Quitar el agua, lavar varias veces y cocinar antes de consumir)`,
        formatFruitOrMielLine(c2a.frutaUnidades, c2a.mielGramos),
      ])
    }

    const carbLine = `${c2n.patataGramos} g Patata o ${c2n.boniatoGramos} g boniato o ${c2n.calabazaGramos} g calabaza`
    const fruta = formatFruitOptionsLine(c2n.frutaUnidades)

    const options = {
      1: [
        '150 g Carne picada de ternera',
        '5 g Aceite de coco',
        `${carbLine} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
        fruta,
        'Tomate, cebolla cruda y/o pimiento verde crudo al gusto',
      ],
      2: [
        '290 g Gambas salvajes o 175 g ostras o 190 g pulpo cocido o 185 g merluza o 245 g bacalao o 170 g boquerones salvajes (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)',
        '8 g Aceite de oliva virgen extra prensado en frío',
        '5 g Aceite de coco',
        `${carbLine} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
        fruta,
        'Tomate, cebolla cruda y/o pimiento verde crudo al gusto',
      ],
      3: [
        '140 g Pechuga de pollo o pechuga de pavo o lomo de cerdo',
        '7 g Aceite de oliva virgen extra prensado en frío',
        '5 g Aceite de coco',
        `${carbLine} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
        fruta,
        'Tomate, cebolla cruda y/o pimiento verde crudo al gusto',
      ],
      4: [
        '150 g Claras de huevo pasteurizadas',
        '2 Huevos',
        `${carbLine} (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)`,
        '150 g Pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
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
        '1 lata de mejillones al natural o 1 lata escurrida (56 g) de atún al natural o 100 g almejas salvajes o 75 g ostras o 75 vieiras o 120 g gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
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
        '60 g Hígado de vaca o hígado de cordero',
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
        '10 g Chocolate 80–100% o 7 g mantequilla',
        '10 g Colágeno bovino hidrolizado',
        'Canela ceylán al gusto',
        '1 zanahoria cruda pelada',
        '3 g Aceite de coco o 3 g aceite de oliva virgen extra prensado en frío',
      ],
      2: [
        '125 g Helado “Haggen Dazs”',
        '10 g Colágeno bovino hidrolizado',
        '1 zanahoria cruda pelada',
        '3 g Aceite de coco o 3 g aceite de oliva virgen extra prensado en frío',
      ],
      3: [
        '25 g Queso de leche cruda',
        `${fruitOrMiel} (puedes combinar dos opciones tomando la mitad de cada una)`,
        '10 g Chocolate 80–100% o 7 g mantequilla',
        '100 ml Zumo de frutas a elegir + 10 g colágeno bovino hidrolizado',
        '1 zanahoria cruda pelada',
        '3 g Aceite de coco o 3 g aceite de oliva virgen extra prensado en frío',
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

  const repartoRows = (data.reparto || [])
    .map(
      (meal) => `
        <tr>
          <td>${escapeHtml(meal.nombre)}</td>
          <td>${meal.baseKcal} kcal</td>
          <td>${meal.kcalObjetivo} kcal</td>
          <td>${meal.deltaKcal > 0 ? '+' : ''}${meal.deltaKcal} kcal</td>
          <td>${meal.deltaCarbs > 0 ? '+' : ''}${meal.deltaCarbs} g</td>
        </tr>
      `
    )
    .join('')

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
        @page { size: A4; margin: 14mm; }
        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          color: #222;
          background: #fff;
          line-height: 1.45;
          font-size: 12px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .subtitle {
          font-size: 13px;
          color: #666;
          margin-bottom: 18px;
        }

        .card {
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 14px;
        }

        .section-title {
          font-size: 17px;
          font-weight: 700;
          margin: 0 0 10px;
        }

        .metric {
          font-size: 13px;
          margin-bottom: 6px;
        }

        .meal-box {
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 16px;
          page-break-inside: avoid;
        }

        .meal-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .meal-subtext {
          font-size: 11px;
          color: #555;
          margin-bottom: 6px;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .option-card {
          border: 1px solid #e7e7e7;
          border-radius: 10px;
          padding: 10px;
          page-break-inside: avoid;
        }

        .option-title {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }

        th, td {
          border: 1px solid #ddd;
          padding: 7px;
          text-align: left;
          font-size: 11px;
        }

        th { background: #f5f5f5; }

        ul {
          margin: 8px 0 0;
          padding-left: 18px;
        }

        li { margin-bottom: 5px; }

        .small-note {
          color: #666;
          font-size: 11px;
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="title">${escapeHtml(data.tituloPlan || 'Plan nutricional personalizado')}</div>
      <div class="subtitle">Se respetan los alimentos de cada opción y solo se ajustan las fuentes de hidratos</div>

      <div class="card">
        <div class="section-title">Resumen</div>
        <div class="metric"><strong>Calorías objetivo:</strong> ${data.caloriasObjetivo || 0} kcal</div>
        <div class="metric"><strong>Número de comidas:</strong> ${data.comidasDia || 3}</div>
        <div class="metric"><strong>Opciones incluidas por comida:</strong> ${numeroOpcionesPlan}</div>
        <div class="metric">${escapeHtml(data.resumenPlan || '')}</div>
      </div>

      ${renderNotas('Ajustes recomendados para la última comida', ajustesPersonalizados.ultimaComidaTexto)}
      ${renderNotas('Ajustes recomendados durante el día', ajustesPersonalizados.duranteDiaTexto)}

      <div class="card">
        <div class="section-title">Reparto calórico estimado</div>
        <table>
          <thead>
            <tr>
              <th>Comida</th>
              <th>Base</th>
              <th>Objetivo</th>
              <th>Ajuste kcal</th>
              <th>Ajuste carbs</th>
            </tr>
          </thead>
          <tbody>
            ${repartoRows}
          </tbody>
        </table>
      </div>

      ${mealsHtml}
    </body>
    </html>
  `
}

module.exports = buildHtml
