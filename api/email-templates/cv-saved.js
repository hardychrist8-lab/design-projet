function cvSavedTemplate(name, cvName, totalCvs) {
  const displayName = name || '';
  const siteUrl = 'https://design-cv.com/app.html';
  const firstName = displayName.split(' ')[0] || '';

  return {
    subject: 'CV sauvegardé — DesignCV',
    html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>DesignCV</title>
<!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;"><tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="100%" style="max-width:580px;">
<tr><td align="center" style="padding-bottom:40px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#18181b;padding:12px 24px;border-radius:8px;"><span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Design<span style="color:#10b981;">CV</span></span></td></tr></table></td></tr>
<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04),0 4px 24px rgba(0,0,0,.06);">
<tr><td style="height:4px;background:linear-gradient(90deg,#6366f1,#4f46e5);font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:48px 40px 32px;text-align:center;">
<p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#6366f1;">Sauvegarde</p>
<h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#18181b;line-height:1.2;">CV enregistré avec succès</h1>
<p style="margin:0;font-size:16px;color:#71717a;line-height:1.6;">${firstName ? 'Votre travail est sauvegardé, ' + firstName + '.' : 'Votre travail est sauvegardé.'}</p>
</td></tr>
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f4f4f5;margin:0;"></td></tr>
<tr><td style="padding:28px 40px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:12px;overflow:hidden;">
<tr><td style="padding:24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td><p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#a1a1aa;font-weight:600;">Nom du CV</p></td></tr>
<tr><td><p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#18181b;">${cvName || 'Mon CV'}</p></td>
<tr><td style="border-top:1px solid #e4e4e7;padding-top:20px;"><p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#a1a1aa;font-weight:600;">Total CV sauvegardés</p></td></tr>
<tr><td><p style="margin:0;font-size:18px;font-weight:600;color:#6366f1;">${totalCvs || 1}</p></td></tr>
</table></td></tr>
</table></td></tr>
<tr><td style="padding:0 40px 48px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#18181b;"><a href="${siteUrl}" style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;">Modifier mon CV →</a></td></tr></table></td></tr>
</table></td></tr>
<tr><td style="padding:32px 0 0;text-align:center;"><p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;">DesignCV — Créez des CV qui font la différence</p><p style="margin:0;font-size:12px;color:#d4d4d8;">Cet email a été envoyé automatiquement suite à la sauvegarde de votre CV.</p></td></tr>
</table></td></tr></table></body></html>`
  };
}
module.exports = cvSavedTemplate;
