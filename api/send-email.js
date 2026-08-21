const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'DesignCV <noreply@design-cv.com>';
const welcomeEmail = require('./email-templates/welcome');
const passwordResetEmail = require('./email-templates/password-reset');
const emailVerifiedTemplate = require('./email-templates/email-verified');
const cvSavedTemplate = require('./email-templates/cv-saved');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { type, email, name, resetUrl, cvName, totalCvs, cvId } = req.body;
    if (!type || !email) return res.status(400).json({ error: 'type and email are required' });
    let subject = '', html = '';
    switch (type) {
      case 'welcome': { const t = welcomeEmail(name); subject = t.subject; html = t.html; break; }
      case 'password-reset': { const t = passwordResetEmail(name, resetUrl); subject = t.subject; html = t.html; break; }
      case 'email-verified': { const t = emailVerifiedTemplate(name); subject = t.subject; html = t.html; break; }
      case 'cv-saved': { const t = cvSavedTemplate(name, cvName, totalCvs, cvId); subject = t.subject; html = t.html; break; }
      default: return res.status(400).json({ error: 'Unknown email type: ' + type });
    }
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
    if (error) { console.error('[DesignCV] Resend error:', error); return res.status(500).json({ error: 'Failed to send email' }); }
    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) { console.error('[DesignCV] send-email error:', err); return res.status(500).json({ error: 'Internal server error' }); }
};
