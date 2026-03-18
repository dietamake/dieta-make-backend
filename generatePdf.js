const { chromium } = require('playwright')

async function generatePdfFromHtml(html) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.setContent(html)

  const pdf = await page.pdf({ format: 'A4' })

  await browser.close()
  return pdf
}

module.exports = generatePdfFromHtml