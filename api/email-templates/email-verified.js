function emailVerifiedTemplate(name) {
  const displayName = name || '';
  const siteUrl = 'https://design-cv.com';
  const firstName = displayName.split(' ')[0] || '';

  return {
    subject: 'Email vérifié — DesignCV',
    html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>DesignCV</title>
<!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important;}a{color:#10b981!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;"><tr><td align="center" style="padding:40px 16px 24px;">

<!-- Logo -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 0 32px;"><span style="font-size:24px;font-weight:800;color:#18181b;letter-spacing:-0.5px;">Design<span style="color:#10b981;">CV</span></span></td></tr></table>

<!-- Main Card -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px 16px 12px 12px;overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,0.03),0 2px 4px rgba(0,0,0,0.03),0 12px 40px rgba(0,0,0,0.06);">

<!-- Hero Section with Success -->
<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:48px 40px 44px;text-align:center;">
  <!-- Animated-style success circle -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;"><tr><td style="width:72px;height:72px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;text-align:center;line-height:72px;"><span style="font-size:32px;color:#ffffff;font-weight:300;">&#10003;</span></td></tr></table>
  <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;letter-spacing:-0.3px;">Email vérifié${firstName ? ', ' + firstName : ''} !</h1>
  <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.6;max-width:380px;margin:0 auto;">Votre compte est entièrement activé. Vous avez maintenant accès à toutes les fonctionnalités de DesignCV.</p>
</td></tr>

<!-- Feature list -->
<tr><td style="padding:36px 40px 8px;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
    <tr><td width="32" valign="top" style="padding-top:1px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:24px;height:24px;background:#ecfdf5;border-radius:6px;text-align:center;line-height:24px;"><span style="font-size:12px;color:#10b981;font-weight:700;">&#10003;</span></td></tr></table></td><td style="padding-left:14px;vertical-align:top;"><p style="margin:0;font-size:15px;font-weight:500;color:#18181b;">3 thèmes de CV professionnels</p></td></tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
    <tr><td width="32" valign="top" style="padding-top:1px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:24px;height:24px;background:#ecfdf5;border-radius:6px;text-align:center;line-height:24px;"><span style="font-size:12px;color:#10b981;font-weight:700;">&#10003;</span></td></tr></table></td><td style="padding-left:14px;vertical-align:top;"><p style="margin:0;font-size:15px;font-weight:500;color:#18181b;">Export PDF haute qualité</p></td></tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
    <tr><td width="32" valign="top" style="padding-top:1px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:24px;height:24px;background:#ecfdf5;border-radius:6px;text-align:center;line-height:24px;"><span style="font-size:12px;color:#10b981;font-weight:700;">&#10003;</span></td></tr></table></td><td style="padding-left:14px;vertical-align:top;"><p style="margin:0;font-size:15px;font-weight:500;color:#18181b;">Sauvegarde cloud sécurisée</p></td></tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td width="32" valign="top" style="padding-top:1px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:24px;height:24px;background:#ecfdf5;border-radius:6px;text-align:center;line-height:24px;"><span style="font-size:12px;color:#10b981;font-weight:700;">&#10003;</span></td></tr></table></td><td style="padding-left:14px;vertical-align:top;"><p style="margin:0;font-size:15px;font-weight:500;color:#18181b;">Optimisé mobile et desktop</p></td></tr>
  </table>

</td></tr>

<!-- CTA Button -->
<tr><td style="padding:32px 40px 44px;text-align:center;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);"><a href="${siteUrl}/app.html" style="display:inline-block;padding:15px 44px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">Créer mon premier CV</a></td></tr></table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #f1f5f9;"></td></tr></table></td></tr>

<!-- Footer inside card -->
<tr><td style="padding:24px 40px 32px;text-align:center;">
  <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;line-height:1.6;">Cet email a été envoyé automatiquement suite à la vérification de votre email.</p>
  <p style="margin:0;font-size:12px;color:#cbd5e1;"><a href="${siteUrl}" style="color:#10b981;text-decoration:none;font-weight:500;">design-cv.com</a></p>
</td></tr>

</table>

<!-- Bottom branding -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;"><tr><td style="padding:28px 0 8px;text-align:center;"><p style="margin:0;font-size:11px;color:#94a3b8;">DesignCV &mdash; Créez des CV qui font la différence</p></td></tr></table>

</td></tr></table></body></html>`
  };
}
module.exports = emailVerifiedTemplate;
