function formatFruitLine(frutas, frutaTipo, frutaUnidades) {
  const frutaTexto = frutas[frutaTipo] || frutas.manzana || '1 manzana'

  if (!frutaUnidades || frutaUnidades <= 0) return 'Sin fruta'
  return `${frutaUnidades} × ${frutaTexto}`
}

function formatCenaCarbSource(carbSource, gramos) {
  if (carbSource === 'patata') return `${gramos} g patata cocida`
  if (carbSource === 'boniato') return `${gramos} g boniato cocido`
  if (carbSource === 'arroz') return `${gramos} g arroz blanco cocido`
  return `${gramos} g patata cocida`
}

function formatSweetSource(frutas, sweetSource, frutaTipo, frutaUnidades, mielGramos) {
  if (sweetSource === 'miel') {
    if (!mielGramos || mielGramos <= 0) return 'Sin miel'
    return `${mielGramos} g miel cruda`
  }

  return formatFruitLine(frutas, frutaTipo, frutaUnidades)
}

function buildHtml(data) {
  const frutas = data.FRUTAS || {
    caqui: '1 caqui',
    manzana: '1 manzana',
    naranja: '1 naranja grande',
    pera: '1 pera',
    platano: '1 plátano',
    kiwi: '2 kiwis',
    mandarinas: '3 mandarinas',
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
          margin: 18mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          color: #222;
          background: #fff;
          line-height: 1.45;
          font-size: 13px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .title {
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 20px;
        }

        .card {
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 10px;
        }

        .metric {
          font-size: 15px;
          margin-bottom: 6px;
        }

        .muted {
          color: #666;
        }

        .meal-box {
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 14px;
        }

        .meal-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .food-line {
          margin-bottom: 6px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }

        th {
          background: #f5f5f5;
        }

        ul {
          margin: 8px 0 0;
          padding-left: 18px;
        }

        li {
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <div class="title">${data.tituloPlan || 'Plan nutricional personalizado'}</div>
      <div class="subtitle">Dieta adaptada a las calorías calculadas del formulario</div>

      <div class="card">
        <div class="section-title">Resumen</div>
        <div class="metric"><strong>Calorías objetivo:</strong> ${data.caloriasObjetivo || 0} kcal</div>
        <div class="metric"><strong>Número de comidas:</strong> ${data.comidasDia || 3}</div>
        <div class="metric muted">${data.resumenPlan || ''}</div>
      </div>

      <div class="card">
        <div class="section-title">Reparto calórico</div>
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

      <div class="section-title">Plan de 3 comidas</div>

      <div class="meal-box">
        <div class="meal-title">Comida 1</div>
        <div class="food-line">Café al gusto</div>
        <div class="food-line">+ proteína y grasas según la opción elegida, sin cambios</div>
        <div class="food-line">+ ${formatFruitLine(frutas, comida1.frutaTipo || 'manzana', comida1.frutaUnidades ?? 1)}</div>
        <div class="food-line">+ ${comida1.avenaGramos || 50} g copos de avena</div>
      </div>

      <div class="meal-box">
        <div class="meal-title">Comida 2</div>
        <div class="food-line">+ proteína y grasas según la opción elegida, sin cambios</div>
        <div class="food-line">+ ${formatFruitLine(frutas, comida2.frutaTipo || 'manzana', comida2.frutaUnidades ?? 1)}</div>
        <div class="food-line">+ ${comida2.panGramos ?? 50} g pan de masa madre</div>
        <div class="food-line">+ aceite de oliva y tomate al gusto, sin cambios</div>
      </div>

      <div class="meal-box">
        <div class="meal-title">Comida 3</div>
        <div class="food-line">5 min antes de empezar a comer: vinagre de sidra de manzana en pastilla (500 mg)</div>
        <div class="food-line">Al acabar de comer: bisglicinato de magnesio (2 g)</div>
        <div class="food-line">+ proteína y grasas según la opción elegida, sin cambios</div>
        <div class="food-line">+ ${formatCenaCarbSource(comida3.carbSource || 'patata', comida3.carbPrincipalGramos || 370)}</div>
        <div class="food-line">+ ${formatSweetSource(
          frutas,
          comida3.sweetSource || 'fruta',
          comida3.frutaTipo || 'manzana',
          comida3.frutaUnidades ?? 1,
          comida3.mielGramos ?? 35
        )}</div>
      </div>

      <div class="card">
        <div class="section-title">Reglas aplicadas</div>
        <ul>
          <li>Las proteínas y las grasas se mantienen fijas.</li>
          <li>Solo se ajustan las líneas de hidratos para acercarse a las calorías objetivo.</li>
          <li>La fruta puede bajar a 0 unidades si hace falta.</li>
          <li>El pan puede bajar a 0 g si hace falta.</li>
          <li>La miel puede bajar a 0 g si hace falta.</li>
          <li>El arroz está calculado en cocido.</li>
        </ul>
      </div>
    </body>
    </html>
  `
}

module.exports = buildHtml
