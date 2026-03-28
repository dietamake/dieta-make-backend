function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatDateSpanish(date = new Date()) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatUnitsFruta(unidades) {
  const n = Number(unidades || 0)
  if (n <= 0) return '0 piezas de fruta'
  if (n === 1) return '1 pieza de fruta'
  return `${n} piezas de fruta`
}

function renderIndicaciones(items = []) {
  if (!items.length) return ''
  return `
    <section class="section">
      <h2 class="section-title">Indicaciones generales</h2>
      <div class="card">
        <ol class="indicaciones-lista">
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ol>
      </div>
    </section>
  `
}

function renderAjustesPersonalizados(ajustesPersonalizados = {}) {
  const ultimaComida = ajustesPersonalizados.ultimaComidaTexto || []
  const duranteDia = ajustesPersonalizados.duranteDiaTexto || []

  if (!ultimaComida.length && !duranteDia.length) return ''

  return `
    <section class="section">
      <h2 class="section-title">Observaciones personalizadas</h2>
      <div class="card">
        ${
          ultimaComida.length
            ? `
              <div class="observacion-bloque">
                <h3>Última comida</h3>
                <ul>
                  ${ultimaComida.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
              </div>
            `
            : ''
        }

        ${
          duranteDia.length
            ? `
              <div class="observacion-bloque">
                <h3>Durante el día</h3>
                <ul>
                  ${duranteDia.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
              </div>
            `
            : ''
        }
      </div>
    </section>
  `
}

function renderSuplementacion(texto) {
  if (!texto) return ''
  return `<div class="suplementacion-box">${escapeHtml(texto)}</div>`
}

function renderPlan3Comidas(data) {
  const { ajustes = {}, suplementacionComidas = {} } = data
  const comida1 = ajustes.comida1 || {}
  const comida2 = ajustes.comida2 || {}
  const comida3Normal = ajustes.comida3Normal || {}
  const comida3Avena = ajustes.comida3Avena || {}

  return `
    <section class="section">
      <h2 class="section-title">Plan de comidas</h2>

      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-badge">Comida 1</span>
          <h3>Primera comida del día</h3>
        </div>

        ${renderSuplementacion(suplementacionComidas.comida1)}

        <div class="option-card">
          <div class="option-title">Opciones</div>
          <ul class="food-list">
            <li>${formatUnitsFruta(comida1.frutaUnidades)}</li>
            <li>${Number(comida1.avenaGramos || 0)} g de copos de avena</li>
          </ul>
        </div>
      </div>

      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-badge">Comida 2</span>
          <h3>Segunda comida del día</h3>
        </div>

        ${renderSuplementacion(suplementacionComidas.comida2)}

        <div class="option-card">
          <div class="option-title">Opciones</div>
          <ul class="food-list">
            <li>${formatUnitsFruta(comida2.frutaUnidades)}</li>
            <li>${Number(comida2.panGramos || 0)} g de pan de masa madre</li>
          </ul>
        </div>
      </div>

      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-badge">Comida 3</span>
          <h3>Tercera comida del día</h3>
        </div>

        <div class="option-card">
          <div class="option-title">Opción 1</div>
          <ul class="food-list">
            <li>${Number(comida3Normal.patataGramos || 0)} g de patata cruda</li>
            <li>${Number(comida3Normal.boniatoGramos || 0)} g de boniato crudo</li>
            <li>${Number(comida3Normal.arrozGramos || 0)} g de arroz blanco crudo</li>
            <li>${formatUnitsFruta(comida3Normal.frutaUnidades)}</li>
          </ul>
        </div>

        <div class="option-card">
          <div class="option-title">Opción 2</div>
          <ul class="food-list">
            <li>${Number(comida3Avena.avenaGramos || 0)} g de copos de avena</li>
            <li>${Number(comida3Avena.mielGramos || 0)} g de miel cruda</li>
            <li>${formatUnitsFruta(comida3Avena.frutaUnidades)}</li>
          </ul>
        </div>
      </div>
    </section>
  `
}

function renderPlan4Comidas(data) {
  const { ajustes = {} } = data
  const comida1 = ajustes.comida1 || {}
  const comida2Normal = ajustes.comida2Normal || {}
  const comida2Avena = ajustes.comida2Avena || {}
  const comida3 = ajustes.comida3 || {}
  const comida4 = ajustes.comida4 || {}

  return `
    <section class="section">
      <h2 class="section-title">Plan de comidas</h2>

      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-badge">Comida 1</span>
          <h3>Primera comida del día</h3>
        </div>

        <div class="option-card">
          <div class="option-title">Opciones</div>
          <ul class="food-list">
            <li>${formatUnitsFruta(comida1.frutaUnidades)}</li>
          </ul>
        </div>
      </div>

      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-badge">Comida 2</span>
          <h3>Segunda comida del día</h3>
        </div>

        <div class="option-card">
          <div class="option-title">Opción 1</div>
          <ul class="food-list">
            <li>${Number(comida2Normal.patataGramos || 0)} g de patata cruda</li>
            <li>${Number(comida2Normal.boniatoGramos || 0)} g de boniato crudo</li>
            <li>${Number(comida2Normal.calabazaGramos || 0)} g de calabaza cruda</li>
            <li>${formatUnitsFruta(comida2Normal.frutaUnidades)}</li>
          </ul>
        </div>

        <div class="option-card">
          <div class="option-title">Opción 2</div>
          <ul class="food-list">
            <li>${Number(comida2Avena.avenaGramos || 0)} g de copos de avena</li>
            <li>${Number(comida2Avena.mielGramos || 0)} g de miel cruda</li>
            <li>${formatUnitsFruta(comida2Avena.frutaUnidades)}</li>
          </ul>
        </div>
      </div>

      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-badge">Comida 3</span>
          <h3>Tercera comida del día</h3>
        </div>

        <div class="option-card">
          <div class="option-title">Opciones</div>
          <ul class="food-list">
            <li>${formatUnitsFruta(comida3.frutaUnidades)}</li>
          </ul>
        </div>
      </div>

      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-badge">Comida 4</span>
          <h3>Cuarta comida del día</h3>
        </div>

        <div class="option-card">
          <div class="option-title">Opciones</div>
          <ul class="food-list">
            <li>${Number(comida4.mielGramos || 0)} g de miel cruda</li>
            <li>${formatUnitsFruta(comida4.frutaUnidades)}</li>
          </ul>
        </div>
      </div>
    </section>
  `
}

function buildHtml(data) {
  const {
    tituloPlan = 'Plan nutricional personalizado',
    textoNumeroComidas = '',
    comidasDia = 3,
    instruccionesGenerales = [],
    ajustesPersonalizados = {},
  } = data

  const planHtml =
    comidasDia === 4 ? renderPlan4Comidas(data) : renderPlan3Comidas(data)

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(tituloPlan)}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          @page {
            size: A4;
            margin: 22mm 16mm 22mm 16mm;
          }

          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #1f1a17;
            background: #f7f2eb;
          }

          .page {
            width: 100%;
          }

          .hero {
            background: linear-gradient(135deg, #efe4d6 0%, #e4d3bf 100%);
            border-radius: 28px;
            padding: 42px 38px;
            margin-bottom: 28px;
            border: 1px solid #ddc9b4;
          }

          .hero-title {
            margin: 0;
            font-size: 38px;
            line-height: 1.08;
            font-weight: 800;
            letter-spacing: -0.8px;
            color: #201813;
          }

          .hero-subtitle {
            margin: 14px 0 0;
            font-size: 18px;
            line-height: 1.6;
            color: #4d4036;
          }

          .hero-date {
            margin-top: 18px;
            font-size: 14px;
            color: #6b5b4d;
          }

          .section {
            margin-bottom: 24px;
          }

          .section-title {
            margin: 0 0 12px;
            font-size: 27px;
            line-height: 1.2;
            font-weight: 800;
            color: #201813;
          }

          .card {
            background: #ffffff;
            border-radius: 22px;
            padding: 22px 22px;
            border: 1px solid #eadccd;
          }

          .indicaciones-lista {
            margin: 0;
            padding-left: 24px;
          }

          .indicaciones-lista li {
            font-size: 18px;
            line-height: 1.75;
            margin-bottom: 10px;
          }

          .meal-card {
            background: #ffffff;
            border: 1px solid #eadccd;
            border-radius: 24px;
            padding: 24px;
            margin-bottom: 18px;
            page-break-inside: avoid;
          }

          .meal-header {
            margin-bottom: 14px;
          }

          .meal-badge {
            display: inline-block;
            background: #efe4d6;
            color: #5e4b3d;
            padding: 8px 14px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 10px;
          }

          .meal-header h3 {
            margin: 0;
            font-size: 26px;
            line-height: 1.25;
            color: #201813;
          }

          .option-card {
            background: #fcf9f5;
            border: 1px solid #eee2d7;
            border-radius: 18px;
            padding: 18px 18px;
            margin-top: 14px;
          }

          .option-title {
            font-size: 21px;
            line-height: 1.3;
            font-weight: 800;
            margin-bottom: 10px;
            color: #2a211b;
          }

          .food-list {
            margin: 0;
            padding-left: 22px;
          }

          .food-list li {
            font-size: 18px;
            line-height: 1.75;
            margin-bottom: 8px;
          }

          .suplementacion-box {
            background: #f3eadf;
            border: 1px solid #e2d1bd;
            color: #3c2d21;
            border-radius: 16px;
            padding: 14px 16px;
            font-size: 18px;
            line-height: 1.65;
            font-weight: 700;
            margin-bottom: 14px;
          }

          .observacion-bloque + .observacion-bloque {
            margin-top: 18px;
          }

          .observacion-bloque h3 {
            margin: 0 0 8px;
            font-size: 21px;
            line-height: 1.3;
          }

          .observacion-bloque ul {
            margin: 0;
            padding-left: 22px;
          }

          .observacion-bloque li {
            font-size: 18px;
            line-height: 1.7;
            margin-bottom: 8px;
          }

          .footer-note {
            margin-top: 28px;
            text-align: center;
            font-size: 13px;
            color: #7a6a5b;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <section class="hero">
            <h1 class="hero-title">${escapeHtml(tituloPlan)}</h1>
            <p class="hero-subtitle">${escapeHtml(textoNumeroComidas)}</p>
            <div class="hero-date">Fecha de generación: ${escapeHtml(formatDateSpanish())}</div>
          </section>

          ${renderIndicaciones(instruccionesGenerales)}

          ${planHtml}

          ${renderAjustesPersonalizados(ajustesPersonalizados)}

          <div class="footer-note">
            Sigue las cantidades indicadas y revisa cada comida antes de empezar el plan.
          </div>
        </div>
      </body>
    </html>
  `
}

module.exports = buildHtml
