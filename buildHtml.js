function buildHtml(data) {
  const comidasHtml = (data.comidas || [])
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
        }
        h1, h2, h3 {
          margin: 0 0 12px;
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
      </style>
    </head>
    <body>
      <h1>Dieta Make</h1>
      <p><strong>Nombre:</strong> ${data.nombre || ''}</p>
      <p><strong>Email:</strong> ${data.email || ''}</p>
      <p><strong>Objetivo:</strong> ${data.objetivo || ''}</p>
      <p><strong>Plan:</strong> ${data.plan || ''}</p>

      <div class="section card">
        <h2>${data.tituloPlan || 'Plan nutricional'}</h2>
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
        <p><strong>Actividad:</strong> ${data.actividad || ''}</p>
        <p><strong>Entrenas:</strong> ${data.entrenas || ''}</p>
        <p><strong>Días de entreno:</strong> ${data.dias_entreno || ''}</p>
        <p><strong>Tipo de entreno:</strong> ${data.tipo_entreno || ''}</p>
        <p><strong>Comidas al día:</strong> ${data.comidas || ''}</p>
        <p><strong>No le gustan:</strong> ${data.no_gustan || ''}</p>
        <p><strong>Alergias:</strong> ${data.alergias || ''}</p>
        <p><strong>Preferencias:</strong> ${data.preferencias || ''}</p>
      </div>
    </body>
    </html>
  `
}

module.exports = buildHtml
