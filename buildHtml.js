function buildHtml(data) {
  return `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <style>
        @page { size: A4; margin: 0; }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          color: #2b2b2b;
          -webkit-print-color-adjust: exact;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
          padding: 24mm 18mm;
          background: #f7f1ea;
        }

        .brand {
          font-size: 34px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .subtitle {
          font-size: 16px;
          color: #6a625c;
          margin-bottom: 24px;
        }

        .card {
          background: #ffffff;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 20px;
          margin: 0 0 12px;
        }

        p, li {
          margin: 6px 0;
          font-size: 14px;
          line-height: 1.5;
        }

        ul {
          padding-left: 18px;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="brand">DIETA MAKE</div>
        <div class="subtitle">Plan personalizado para ${data.nombre || ''}</div>

        <div class="card">
          <h2 class="section-title">Resumen del perfil</h2>
          <p><strong>Nombre:</strong> ${data.nombre || ''}</p>
          <p><strong>Objetivo:</strong> ${data.objetivo || ''}</p>
          <p><strong>Comidas al día:</strong> ${data.comidas_dia || ''}</p>
        </div>

        <div class="card">
          <h2 class="section-title">${data.tituloPlan || 'Tu plan'}</h2>
          <ul>
            ${(data.comidas || []).map(comida => `<li>${comida}</li>`).join('')}
          </ul>
        </div>
      </div>
    </body>
    </html>
  `
}

module.exports = buildHtml