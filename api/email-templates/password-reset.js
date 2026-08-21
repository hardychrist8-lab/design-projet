function passwordResetEmail(name, resetUrl) {
  const displayName = name || '';
  const firstName = displayName.split(' ')[0] || '';

  return {
    subject: "Réinitialisation de mot de passe — DesignCV",
    html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>DesignCV</title>
<!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important;}a{color:#f59e0b!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;"><tr><td align="center" style="padding:40px 16px 24px;">

<!-- Logo -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 0 32px;"><span style="font-size:24px;font-weight:800;color:#18181b;letter-spacing:-0.5px;">Design<span style="color:#10b981;">CV</span></span></td></tr></table>

<!-- Main Card -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px 16px 12px 12px;overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,0.03),0 2px 4px rgba(0,0,0,0.03),0 12px 40px rgba(0,0,0,0.06);">

<!-- Hero Section -->
<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:48px 40px 44px;text-align:center;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;"><tr><td style="width:64px;height:64px;background:linear-gradient(135deg,#fbbf24,#d97706);border-radius:16px;text-align:center;line-height:64px;font-size:28px;color:#ffffff;font-weight:300;">&#128274;</td></tr></table>
  <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;letter-spacing:-0.3px;">Mot de passe oublié${firstName ? ', ' + firstName : ''} ?</h1>
  <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.6;max-width:380px;margin:0 auto;">Pas de panique. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe en quelques secondes.</p>
</td></tr>

<!-- Warning Box -->
<tr><td style="padding:32px 40px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;"><tr><td style="padding:16px 20px;"><p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">&#9888; Ce lien expire dans <strong style="color:#78350f;">1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email en toute sécurité.</p></td></tr></table>
</td></tr>

<!-- CTA Button -->
<tr><td style="padding:32px 40px 16px;text-align:center;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);"><a href="${resetUrl}" style="display:inline-block;padding:15px 44px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">Réinitialiser mon mot de passe</a></td></tr></table>
</td></tr>

<!-- Fallback URL -->
<tr><td style="padding:8px 40px 36px;text-align:center;">
  <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">Si le bouton ne fonctionne pas, copiez-collez ce lien :</p>
  <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;word-break:break-all;"><a href="${resetUrl}" style="color:#10b981;text-decoration:none;">${resetUrl}</a></p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #f1f5f9;"></td></tr></table></td></tr>

<!-- Footer inside card -->
<tr><td style="padding:24px 40px 32px;text-align:center;">
  <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;line-height:1.6;">Cet email a été envoyé automatiquement. Si vous n'êtes pas à l'origine de cette demande, ignorez-le.</p>
  <p style="margin:0;font-size:12px;color:#cbd5e1;"><a href="https://design-cv.com" style="color:#10b981;text-decoration:none;font-weight:500;">design-cv.com</a></p>
</td></tr>

</table>

<!-- Bottom branding -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;"><tr><td style="padding:28px 0 8px;text-align:center;"><p style="margin:0;font-size:11px;color:#94a3b8;">DesignCV &mdash; Créez des CV qui font la différence</p></td></tr></table>

</td></tr></table></body></html>`
  };
}
module.exports = passwordResetEmail;
