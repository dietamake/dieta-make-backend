function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function formatFruitBase(frutas, frutaTipo) {
  return frutas[frutaTipo] || frutas.manzana || '1 Manzana'
}

function formatFruitLine(frutas, frutaTipo, frutaUnidades) {
  const frutaBase = formatFruitBase(frutas, frutaTipo)
  if (!frutaUnidades || frutaUnidades <= 0) return 'Sin fruta'
  if (frutaUnidades === 1) return frutaBase
  return `${frutaUnidades} × ${frutaBase}`
}

function formatCenaCarbSource(carbSource, gramos) {
  if (carbSource === 'patata') return `${gramos} g patata`
  if (carbSource === 'boniato') return `${gramos} g boniato`
  if (carbSource === 'arroz') return `${gramos} g arroz blanco cocido`
  return `${gramos} g patata`
}

function formatSweetSource(frutas, sweetSource, frutaTipo, frutaUnidades, mielGramos) {
  if (sweetSource === 'miel') {
    if (!mielGramos || mielGramos <= 0) return 'Sin miel'
    return `${mielGramos} g miel cruda`
  }
  return formatFruitLine(frutas, frutaTipo, frutaUnidades)
}

function li(text) {
  return `<li>${escapeHtml(text)}</li>`
}

function renderComida1Option(option, ajustes, frutas) {
  const fruta = formatFruitLine(frutas, ajustes.frutaTipo, ajustes.frutaUnidades)
  const avena = `${ajustes.avenaGramos}g Copos de avena`

  const commonTail = [
    fruta,
    '50g Queso de leche cruda o 40g Chocolate 80-100% o 30g Mantequilla / 24g Aceite de coco o 150g Aguacate o 35g Nueces de macadamia',
    avena,
  ]

  const options = {
    1: [
      'Café al gusto',
      '500ml Leche fresca desnatada',
      'Canela ceylán al gusto',
      '10g Colágeno bovino hidrolizado',
      '1 Lata de mejillones al natural o 1 Lata escurrida (56g) de atún al natural o 100g Almejas salvajes o 75g Ostras o 75 Vieiras o 120g Gambas salvajes (puedes combinar dos opciones tomando la mitad de cada una)',
      ...commonTail,
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

  return (options[option] || options[1]).map(li).join('')
}

function renderComida2Option(option, ajustes, frutas) {
  const fruta = formatFruitLine(frutas, ajustes.frutaTipo, ajustes.frutaUnidades)
  const pan = `${ajustes.panGramos} g Pan de masa madre`

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

  return (options[option] || options[1]).map(li).join('')
}

function renderComida3Option(option, ajustes, frutas) {
  const fruta = formatFruitLine(frutas, ajustes.frutaTipo, ajustes.frutaUnidades)
  const carbPrincipal = formatCenaCarbSource(ajustes.carbSource, ajustes.carbPrincipalGramos)
  const sweet = formatSweetSource(
    frutas,
    ajustes.sweetSource,
    ajustes.frutaTipo,
    ajustes.frutaUnidades,
    ajustes.mielGramos
  )
  const avena = `${ajustes.avenaGramos} g Copos de avena`

  const options = {
    1: [
      '5 min antes de empezar a comer: Vinagre de sidra de manzana en pastilla (500 mg)',
      'Al acabar de comer: Bisglicinato de magnesio (2 g)',
      'Carne picada de ternera (150 g)',
      'Aceite de coco (5 g)',
      carbPrincipal,
      '150 g pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
      fruta,
      '50 g queso de leche cruda o 40 g chocolate 80–100% o 150 g aguacate o 35 g nueces de macadamia',
    ],
    2: [
      '5 min antes de empezar a comer: Vinagre de sidra de manzana en pastilla (500 mg)',
      'Al acabar de comer: Bisglicinato de magnesio (2 g)',
      '290 g gambas salvajes o 175 g ostras o 190 g pulpo cocido o 185 g merluza o 245 g bacalao o 170 g boquerones salvajes (puedes combinar dos opciones tomando la mitad de la cantidad de cada una)',
      'Aceite de oliva virgen extra prensado en frío (8 g)',
      'Aceite de coco (5 g)',
      carbPrincipal,
      '150 g pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
      fruta,
      '50 g queso de leche cruda o 40 g chocolate 80–100% o 150 g aguacate o 35 g nueces de macadamia',
    ],
    3: [
      '5 min antes de empezar a comer: Vinagre de sidra de manzana en pastilla (500 mg)',
      'Al acabar de comer: Bisglicinato de magnesio (2 g)',
      '140 g pechuga de pollo o pechuga de pavo o lomo de cerdo',
      'Aceite de oliva virgen extra prensado en frío (7 g)',
      'Aceite de coco (5 g)',
      carbPrincipal,
      '150 g pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
      fruta,
      '50 g queso de leche cruda o 40 g chocolate 80–100% o 150 g aguacate o 35 g nueces de macadamia',
    ],
    4: [
      '5 min antes de empezar a comer: Vinagre de sidra de manzana en pastilla (500 mg)',
      'Al acabar de comer: Bisglicinato de magnesio (2 g)',
      'Queso fresco batido desnatado (300 g)',
      '11 g aceite de coco o 20 g chocolate 80–100%',
      `${avena} (dejar en remojo en agua la noche anterior con un poco de vinagre de sidra de manzana, en recipiente cerrado, lugar oscuro y a temperatura ambiente; después quitar el agua, lavar varias veces y cocinar antes de consumir)`,
      sweet,
      '50 g queso de leche cruda o 40 g chocolate 80–100% o 150 g aguacate o 35 g nueces de macadamia',
    ],
    5: [
      '5 min antes de empezar a comer: Vinagre de sidra de manzana en pastilla (500 mg)',
      'Al acabar de comer: Bisglicinato de magnesio (2 g)',
      '2 huevos enteros + 180 g claras de huevo',
      'Aceite de oliva virgen extra prensado en frío (7 g)',
      'Aceite de coco (5 g)',
      carbPrincipal,
      '150 g pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
      fruta,
      '50 g queso de leche cruda o 40 g chocolate 80–100% o 150 g aguacate o 35 g nueces de macadamia',
    ],
    6: [
      '5 min antes de empezar a comer: Vinagre de sidra de manzana en pastilla (500 mg)',
      'Al acabar de comer: Bisglicinato de magnesio (2 g)',
      '200 g salmón',
      'Aceite de oliva virgen extra prensado en frío (5 g)',
      carbPrincipal,
      '150 g pimientos rojos o 150 g calabacín o 150 g pepino o 200 g champiñones (hervir como mínimo durante 1 h)',
      fruta,
      '35 g nueces de macadamia o 150 g aguacate (ligeramente ajustado en grasas para compensar el salmón)',
    ],
    7: [
      '5 min antes de empezar a comer: Vinagre de sidra de manzana en pastilla (500 mg)',
      'Al acabar de comer: Bisglicinato de magnesio (2 g)',
      '250 g yogur griego natural entero',
      '150 g claras de huevo pasteurizadas',
      'Aceite de coco (10 g)',
      `${avena} (opcional: mismo protocolo de remojo que opción 4)`,
      sweet,
      '50 g queso de leche cruda o 40 g chocolate 80–100% o 150 g aguacate o 35 g nueces de macadamia',
    ],
  }

  return (options[option] || options[1]).map(li).join('')
}

function buildHtml(data) {
  const frutas = data.FRUTAS || {
    caqui: '1 Caqui',
    manzana: '1 Manzana',
    naranja: '1 Naranja grande',
    pera: '1 Pera',
    platano: '1 Plátano',
    kiwi: '2 Kiwis',
    mandarinas: '3 Mandarinas',
  }

  const comida1 = data.ajustes?.comida1 || {}
  const comida2 = data.ajustes?.comida2 || {}
  const comida3 = data.ajustes?.comida3 || {}

  const repartoRows = (data.reparto || [])
    .map(
      (meal) => `
        <tr>
          <td>${meal.nombre}</td>
          <td>${meal.baseKcal} kcal</td>
          <td>${meal.kcalObjetivo} kcal</td>
          <td>${meal.deltaKcal > 0 ? '+' : ''}${meal.deltaKcal} kcal</td>
          <td>${meal.deltaCarbs > 0 ? '+' : ''}${meal.deltaCarbs} g</td>
        </tr>
      `
    )
    .join('')

  return `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <style>
        @page {
          size: A4;
          margin: 16mm;
        }

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
          margin: 0 0 8px;
        }

        .metric {
          font-size: 14px;
          margin-bottom: 6px;
        }

        .meal-box {
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 14px;
          page-break-inside: avoid;
        }

        .meal-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .option-tag {
          display: inline-block;
          font-size: 11px;
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-radius: 999px;
          margin-bottom: 8px;
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

        th {
          background: #f5f5f5;
        }

        ul {
          margin: 8px 0 0;
          padding-left: 18px;
        }

        li {
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="title">${escapeHtml(data.tituloPlan || 'Plan nutricional personalizado')}</div>
      <div class="subtitle">Se respetan las opciones de alimentos y solo se ajustan las fuentes de hidratos</div>

      <div class="card">
        <div class="section-title">Resumen</div>
        <div class="metric"><strong>Calorías objetivo:</strong> ${data.caloriasObjetivo || 0} kcal</div>
        <div class="metric"><strong>Número de comidas:</strong> ${data.comidasDia || 3}</div>
        <div class="metric"><strong>Reparto base:</strong> Comida 1 → 33% | Comida 2 → 24% | Comida 3 → 43%</div>
        <div class="metric">${escapeHtml(data.resumenPlan || '')}</div>
      </div>

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

      <div class="meal-box">
        <div class="meal-title">COMIDA 1</div>
        <div class="option-tag">Opción ${data.comida1Opcion || 1}</div>
        <ul>
          ${renderComida1Option(data.comida1Opcion || 1, comida1, frutas)}
        </ul>
      </div>

      <div class="meal-box">
        <div class="meal-title">COMIDA 2</div>
        <div class="option-tag">Opción ${data.comida2Opcion || 1}</div>
        <ul>
          ${renderComida2Option(data.comida2Opcion || 1, comida2, frutas)}
        </ul>
      </div>

      <div class="meal-box">
        <div class="meal-title">COMIDA 3</div>
        <div class="option-tag">Opción ${data.comida3Opcion || 1}</div>
        <ul>
          ${renderComida3Option(data.comida3Opcion || 1, comida3, frutas)}
        </ul>
      </div>
    </body>
    </html>
  `
}

module.exports = buildHtml
