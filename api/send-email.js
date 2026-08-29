const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'DesignCV <noreply@design-cv.com>';
const welcomeEmail = require('./email-templates/welcome');
const passwordResetEmail = require('./email-templates/password-reset');
const emailVerifiedTemplate = require('./email-templates/email-verified');
const cvSavedTemplate = require('./email-templates/cv-saved');

// Rate limiting simple en mémoire (par IP)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 5; // max 5 emails par heure par IP
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 heure

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

// Nettoyer les entrées expirées toutes les 10 min
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.start > RATE_LIMIT_WINDOW) rateLimitMap.delete(ip);
  }
}, 10 * 60 * 1000);

// Types d'emails autorisés (pas de password-reset depuis l'API publique)
const ALLOWED_TYPES = ['welcome', 'cv-saved', 'email-verified'];

// Emails autorisés pour chaque type (whitelist)
const ALLOWED_EMAIL_DOMAINS = null; // null = tous les domaines autorisés (pour le moment)

module.exports = async function handler(req, res) {
  // CORS restreint au domaine design-cv.com uniquement
  const origin = req.headers.origin || '';
  const allowedOrigins = ['https://design-cv.com'];
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

  // Rate limiting par IP
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  try {
    const { type, email, name, resetUrl, cvName, totalCvs, cvId } = req.body;

    // Validation des champs requis
    if (!type || !email) {
      return res.status(400).json({ error: 'type and email are required' });
    }

    // Validation du type d'email
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Unknown email type' });
    }

    // Validation de l'email (format basique)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Validation de la taille des champs
    if (name && name.length > 200) {
      return res.status(400).json({ error: 'Name too long' });
    }
    if (cvName && cvName.length > 200) {
      return res.status(400).json({ error: 'CV name too long' });
    }

    // Les types 'cv-saved' et 'email-verified' nécessitent un token auth valide
    const AUTH_REQUIRED_TYPES = ['cv-saved', 'email-verified'];
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (AUTH_REQUIRED_TYPES.includes(type) && !authToken) {
      return res.status(401).json({ error: 'Authentication required for this email type' });
    }

    let subject = '', html = '';
    // Utiliser des valeurs échappées pour les templates
    const safeName = (name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeCvName = (cvName || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    switch (type) {
      case 'welcome': { const t = welcomeEmail(safeName); subject = t.subject; html = t.html; break; }
      case 'cv-saved': { const t = cvSavedTemplate(safeName, safeCvName, totalCvs, cvId); subject = t.subject; html = t.html; break; }
      case 'email-verified': { const t = emailVerifiedTemplate(safeName); subject = t.subject; html = t.html; break; }
      default: return res.status(400).json({ error: 'Unknown email type' });
    }

    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
    if (error) {
      console.error('[DesignCV] Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error('[DesignCV] send-email error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
