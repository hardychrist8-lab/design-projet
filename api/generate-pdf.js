const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

// Rate limiting par IP
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (record.count >= RATE_LIMIT_MAX) return true;
  record.count++;
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.start > RATE_LIMIT_WINDOW) rateLimitMap.delete(ip);
  }
}, 10 * 60 * 1000);

// Taille max du HTML (500KB)
const MAX_HTML_SIZE = 500 * 1024;

module.exports = async (req, res) => {
  // CORS restreint
  const origin = req.headers.origin || '';
  const allowedOrigins = ['https://design-cv.com', 'https://'];
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  let browser = null;

  try {
    const { html, filename } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // Limiter la taille du HTML
    if (html.length > MAX_HTML_SIZE) {
      return res.status(413).json({ error: 'HTML content too large' });
    }

    // Sanitiser le filename (empêcher l'injection de headers)
    const safeFilename = (filename || 'cv.pdf')
      .replace(/[^a-zA-Z0-9_.\-\sàâéèêëïîôùûüçÀÂÉÈÊËÏÎÔÙÛÜÇ]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100) || 'cv.pdf';

    const executablePath = await chromium.executablePath(
      'https:///api/generate-pdf'
    );

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 5000,
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      preferCSSPageSize: true,
    });

    await browser.close();
    browser = null;

    res.setHeader('Content-Type', 'application/pdf');
    // Utiliser encodeURIComponent pour le filename — empêche toute injection
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
    res.send(pdf);

  } catch (error) {
    console.error('PDF generation error:', error);
    if (browser) {
      await browser.close().catch(() => {});
    }
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
