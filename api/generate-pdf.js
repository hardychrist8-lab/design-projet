const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

module.exports = async (req, res) => {
  // CORS headers + preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;

  try {
    const { html, filename } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // FIX: executablePath est une méthode dans v122+ → appel avec ()
    // On passe l'URL de la fonction pour que Chromium soit mis en cache par Vercel
    const executablePath = await chromium.executablePath(
      'https://design-projet.vercel.app/api/generate-pdf'
    );

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // FIX: domcontentloaded au lieu de networkidle0 (plus rapide, évite le timeout)
    // Les fonts sont gérées par printBackground: true de page.pdf()
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 5000,
    });

    // Générer le PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
      preferCSSPageSize: true,
    });

    await browser.close();
    browser = null;

    // Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'cv.pdf'}"`);
    res.send(pdf);

  } catch (error) {
    console.error('PDF generation error:', error);
    if (browser) {
      await browser.close().catch(() => {});
    }
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};