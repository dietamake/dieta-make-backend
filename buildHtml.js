function buildHtml(data) {
  const comidasHtml = (data.comidasPlan || [])
    .map(
      (item) => `
        <li class="meal-item">
          <span class="meal-dot"></span>
          <span>${item}</span>
        </li>
      `
    )
    .join('')

  const objetivo = Array.isArray(data.objetivo)
    ? data.objetivo.join(', ')
    : data.objetivo || ''

  return `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <style>
        @page {
          size: A4;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f6f1eb;
          color: #2b2b2b;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 22mm 18mm;
          background: #f6f1eb;
        }

        .header {
          margin-bottom: 22px;
        }

        .brand {
          font-size: 34px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #1f1f1f;
          margin-bottom: 6px;
        }

        .subtitle {
          font-size: 15px;
          color: #6f6a64;
          line-height: 1.5;
          max-width: 460px;
        }

        .hero {
          background: linear-gradient(135deg, #d9c2a6 0%, #efe4d7 100%);
          border-radius: 22px;
          padding: 24px;
          margin-bottom: 18px;
        }

        .hero-title {
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #1f1f1f;
        }

        .hero-text {
          font-size: 15px;
          color: #4d463f;
          margin: 0;
          line-height: 1.6;
        }

        .grid {
          display: table;
          width: 100%;
          border-spacing: 0 14px;
        }

        .card {
          background: #ffffff;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 14px;
          color: #1f1f1f;
        }

        .muted {
          color: #6f6a64;
          font-size: 14px;
          line-height: 1.6;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
        }

        .info-table td {
          padding: 8px 0;
          vertical-align: top;
          font-size: 14px;
          border-bottom: 1px solid #f0ebe5;
        }

        .info-label {
          width: 42%;
          color: #6b645d;
          font-weight: 700;
        }

        .info-value {
          color: #222;
        }

        .meal-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .meal-item {
          display: table;
          width: 100%;
          margin-bottom: 12px;
          padding: 12px 14px;
          background: #faf7f3;
          border-radius: 12px;
        }

        .meal-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #b08968;
          margin-right: 10px;
          vertical-align: middle;
        }

        .tips-list {
          margin: 0;
          padding-left: 18px;
        }

        .tips-list li {
          margin-bottom: 8px;
          color: #3c3a37;
        }

        .footer {
          margin-top: 24px;
          padding-top: 12px;
          text-align: center;
          font-size: 12px;
          color: #8a8178;
        }

        .pill {
          display: inline-block;
          padding: 7px 12px;
          border-radius: 999px;
          background: #efe7de;
          color: #5f564d;
          font-size: 12px;
          font-weight: 700;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="brand">Dieta Make</div>
          <div class="subtitle">
            Plan nutricional personalizado diseñado según tus respuestas, tu objetivo y tu estilo de vida.
          </div>
        </div>

        <div class="hero">
          <h1 class="hero-title">${data.tituloPlan || 'Plan nutricional personalizado'}</h1>
          <p class="hero-text">
            Cliente: <strong>${data.nombre || 'Cliente'}</strong><br />
            Objetivo principal: <strong>${objetivo || 'No indicado'}</strong><br />
            Plan contratado: <strong>${data.plan || 'No indicado'}</strong>
          </p>
          <div class="pill">PDF personalizado</div>
        </div>

        <div class="card">
          <h2 class="section-title">Resumen del perfil</h2>
          <table class="info-table">
            <tr>
              <td class="info-label">Email</td>
              <td class="info-value">${data.email || '-'}</td>
            </tr>
            <tr>
              <td class="info-label">Sexo</td>
              <td class="info-value">${data.sexo || '-'}</td>
            </tr>
            <tr>
              <td class="info-label">Edad</td>
              <td class="info-value">${data.edad || '-'} ${data.edad ? 'años' : ''}</td>
            </tr>
            <tr>
              <td class="info-label">Altura</td>
              <td class="info-value">${data.altura || '-'} ${data.altura ? 'cm' : ''}</td>
            </tr>
            <tr>
              <td class="info-label">Peso</td>
              <td class="info-value">${data.peso || '-'} ${data.peso ? 'kg' : ''}</td>
            </tr>
            <tr>
              <td class="info-label">Actividad diaria</td>
              <td class="info-value">${data.actividad || '-'}</td>
            </tr>
            <tr>
              <td class="info-label">Horas de sueño</td>
              <td class="info-value">${data.sueno || '-'}</td>
            </tr>
            <tr>
              <td class="info-label">Grasa abdominal</td>
              <td class="info-value">${data.grasa_abdominal || '-'}</td>
            </tr>
            <tr>
              <td class="info-label">Primera comida</td>
              <td class="info-value">${data.primera_comida || '-'}</td>
            </tr>
            <tr>
              <td class="info-label">Frecuencia de baño</td>
              <td class="info-value">${data.bano || '-'}</td>
            </tr>
            <tr>
              <td class="info-label">Despertares nocturnos</td>
              <td class="info-value">${data.despertares_noche || '-'}</td>
            </tr>
            <tr>
              <td class="info-label">Comidas al día</td>
              <td class="info-value">${data.comidasDia || '-'}</td>
            </tr>
          </table>
        </div>

        <div class="card">
          <h2 class="section-title">Plan de comidas</h2>
          <p class="muted" style="margin-bottom:14px;">
            Distribución sugerida en función de las respuestas del cliente y del número de comidas seleccionadas.
          </p>
          <ul class="meal-list">
            ${comidasHtml || '<li class="meal-item"><span>No hay comidas definidas todavía.</span></li>'}
          </ul>
        </div>

        <div class="card">
          <h2 class="section-title">Recomendaciones generales</h2>
          <ul class="tips-list">
            <li>Prioriza alimentos frescos y fuentes de proteína en cada comida.</li>
            <li>Mantén una hidratación estable durante el día.</li>
            <li>Intenta mantener horarios de comida lo más regulares posible.</li>
            <li>Ajusta cantidades según hambre, saciedad y evolución semanal.</li>
            <li>La constancia durante varias semanas vale más que hacerlo perfecto dos días.</li>
          </ul>
        </div>

        <div class="footer">
          Dieta Make · Plan generado de forma personalizada
        </div>
      </div>
    </body>
    </html>
  `
}

module.exports = buildHtml
