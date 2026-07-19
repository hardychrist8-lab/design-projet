const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { html, filename } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // DIAGNOSTIC: test each step
    let diagnostic = {};
    try {
      diagnostic.execPath = await chromium.executablePath;
      diagnostic.execPathType = typeof diagnostic.execPath;
    } catch (e) {
      return res.status(500).json({ step: 'chromium.executablePath', error: e.message, stack: e.stack });
    }

    try {
      diagnostic.args = chromium.args;
      diagnostic.headless = chromium.headless;
      diagnostic.viewport = chromium.defaultViewport;
    } catch (e) {
      return res.status(500).json({ step: 'chromium.config', error: e.message });
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: diagnostic.execPath,
        headless: chromium.headless,
      });
    } catch (e) {
      return res.status(500).json({ step: 'puppeteer.launch', error: e.message, stack: e.stack, diagnostic });
    }

    let page;
    try {
      page = await browser.newPage();
    } catch (e) {
      await browser.close();
      return res.status(500).json({ step: 'browser.newPage', error: e.message, diagnostic });
    }

    try {
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });
    } catch (e) {
      await browser.close();
      return res.status(500).json({ step: 'page.setContent', error: e.message, diagnostic });
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      // ignore
    }

    let pdf;
    try {
      pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        preferCSSPageSize: true,
      });
    } catch (e) {
      await browser.close();
      return res.status(500).json({ step: 'page.pdf', error: e.message, diagnostic });
    }

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'cv.pdf'}"`);
    res.send(pdf);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', detail: error.message, stack: error.stack });
  }
};