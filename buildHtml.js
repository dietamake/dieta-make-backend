function buildHtml(data) {
  const comidasHtml = (data.comidasPlan || [])
    .map((item) => `<li style="margin-bottom:8px;">${item}</li>`)
    .join('')

  return `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <style>
        @page { size: A4; margin: 20mm; }

        body {
          font-family: Arial, sans-serif;
          color: #222;
          line-height: 1.5;
          font-size: 14px;
        }

        h1, h2, h3 {
          margin: 0 0 12px;
        }

        h1 {
          font-size: 28px;
        }

        h2 {
          font-size: 20px;
        }

        h3 {
          font-size: 16px;
        }

        p {
          margin: 0 0 8px;
        }

        ul {
          margin: 0;
          padding-left: 20px;
        }

        .section {
          margin-bottom: 24px;
        }

        .card {
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .muted {
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>Dieta Make</h1>

      <div class="section">
        <p><strong>Nombre:</strong> ${data.nombre || ''}</p>
        <p><strong>Email:</strong> ${data.email || ''}</p>
        <p><strong>Objetivo principal:</strong> ${data.objetivo || ''}</p>
        <p><strong>Plan comprado:</strong> ${data.plan || ''}</p>
      </div>

      <div class="section card">
        <h2>${data.tituloPlan || 'Plan nutricional'}</h2>
        <p class="muted">Distribución sugerida según el número de comidas indicado por el cliente.</p>
        <ul>
          ${comidasHtml}
        </ul>
      </div>

      <div class="section card">
        <h3>Datos del cliente</h3>
        <p><strong>Sexo:</strong> ${data.sexo || ''}</p>
        <p><strong>Edad:</strong> ${data.edad || ''}</p>
        <p><strong>Altura:</strong> ${data.altura || ''} cm</p>
        <p><strong>Peso:</strong> ${data.peso || ''} kg</p>
        <p><strong>Actividad diaria:</strong> ${data.actividad || ''}</p>
        <p><strong>Horas de sueño:</strong> ${data.sueno || ''}</p>
        <p><strong>Grasa abdominal:</strong> ${data.grasa_abdominal || ''}</p>
        <p><strong>Primera comida del día:</strong> ${data.primera_comida || ''}</p>
        <p><strong>Frecuencia de baño:</strong> ${data.bano || ''}</p>
        <p><strong>Despertares nocturnos:</strong> ${data.despertares_noche || ''}</p>
        <p><strong>Comidas al día:</strong> ${data.comidasDia || ''}</p>
      </div>
    </body>
    </html>
  `
}

module.exports = buildHtml
