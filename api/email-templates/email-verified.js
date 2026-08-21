function emailVerifiedTemplate(name) {
  const displayName = name || '';
  const siteUrl = 'https://design-cv.com';
  const firstName = displayName.split(' ')[0] || '';

  return {
    subject: 'Email vérifié — DesignCV',
    html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>DesignCV</title>
<!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;"><tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="100%" style="max-width:580px;">
<tr><td align="center" style="padding-bottom:40px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#18181b;padding:12px 24px;border-radius:8px;"><span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Design<span style="color:#10b981;">CV</span></span></td></tr></table></td></tr>
<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04),0 4px 24px rgba(0,0,0,.06);">
<tr><td style="height:4px;background:linear-gradient(90deg,#10b981,#059669);font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:52px 40px 32px;text-align:center;">
<div style="width:56px;height:56px;background:#f0fdf4;border-radius:50%;margin:0 auto 20px;text-align:center;line-height:56px;font-size:28px;color:#10b981;font-weight:700;border:2px solid #bbf7d0;">&#10003;</div>
<p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#10b981;">Vérifié</p>
<h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#18181b;line-height:1.2;">Votre email est confirmé${firstName ? ', ' + firstName : ''}</h1>
<p style="margin:0;font-size:16px;color:#71717a;line-height:1.6;">Votre compte est maintenant activé. Vous avez accès à toutes les fonctionnalités.</p>
</td></tr>
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f4f4f5;margin:0;"></td></tr>
<tr><td style="padding:32px 40px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:14px 0;border-bottom:1px solid #fafafa;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="8" valign="middle"><div style="width:6px;height:6px;background:#10b981;border-radius:50%;"></div></td><td style="padding-left:14px;"><p style="margin:0;font-size:15px;font-weight:500;color:#18181b;">3 thèmes de CV professionnels</p></td></tr></table></td></tr>
<tr><td style="padding:14px 0;border-bottom:1px solid #fafafa;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="8" valign="middle"><div style="width:6px;height:6px;background:#10b981;border-radius:50%;"></div></td><td style="padding-left:14px;"><p style="margin:0;font-size:15px;font-weight:500;color:#18181b;">Export PDF haute qualité</p></td></tr></table></td></tr>
<tr><td style="padding:14px 0;border-bottom:1px solid #fafafa;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="8" valign="middle"><div style="width:6px;height:6px;background:#10b981;border-radius:50%;"></div></td><td style="padding-left:14px;"><p style="margin:0;font-size:15px;font-weight:500;color:#18181b;">Sauvegarde cloud sécurisée</p></td></tr></table></td></tr>
<tr><td style="padding:14px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="8" valign="middle"><div style="width:6px;height:6px;background:#10b981;border-radius:50%;"></div></td><td style="padding-left:14px;"><p style="margin:0;font-size:15px;font-weight:500;color:#18181b;">Optimisé mobile et desktop</p></td></tr></table></td></tr>
</table></td></tr>
<tr><td style="padding:0 40px 48px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#18181b;"><a href="${siteUrl}/app.html" style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;">Créer mon premier CV →</a></td></tr></table></td></tr>
</table></td></tr>
<tr><td style="padding:32px 0 0;text-align:center;"><p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;">DesignCV — Créez des CV qui font la différence</p><p style="margin:0;font-size:12px;color:#d4d4d8;">Cet email a été envoyé automatiquement suite à la vérification de votre email.</p></td></tr>
</table></td></tr></table></body></html>`
  };
}
module.exports = emailVerifiedTemplate;
