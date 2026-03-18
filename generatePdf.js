const { chromium } = require('playwright')

async function generatePdfFromHtml(html) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    })

    return pdf
  } finally {
    await browser.close()
  }
}

module.exports = generatePdfFromHtml
