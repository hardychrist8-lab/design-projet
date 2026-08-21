function welcomeEmail(name) {
  const displayName = name || '';
  const siteUrl = 'https://design-cv.com';
  const firstName = displayName.split(' ')[0] || '';

  return {
    subject: 'Votre compte DesignCV est pr\u00eat',
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
<tr><td style="padding:48px 40px 32px;text-align:center;">
<p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#10b981;">Nouveau compte</p>
<h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#18181b;line-height:1.2;">Bienvenue${firstName ? ', ' + firstName : ''}</h1>
<p style="margin:0;font-size:16px;color:#71717a;line-height:1.6;">Votre compte est pr\u00eat. Voici comment commencer.</p>
</td></tr>
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f4f4f5;margin:0;"></td></tr>
<tr><td style="padding:32px 40px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:16px 0;border-bottom:1px solid #fafafa;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="44" valign="top"><div style="width:36px;height:36px;background:#f0fdf4;border-radius:10px;text-align:center;line-height:36px;font-size:18px;color:#10b981;font-weight:700;">1</div></td><td style="padding-left:16px;"><p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#18181b;">V\u00e9rifiez votre email</p><p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.5;">Consultez votre bo\u00eete de r\u00e9ception et confirmez votre adresse.</p></td></tr></table></td></tr>
<tr><td style="padding:16px 0;border-bottom:1px solid #fafafa;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="44" valign="top"><div style="width:36px;height:36px;background:#eff6ff;border-radius:10px;text-align:center;line-height:36px;font-size:18px;color:#3b82f6;font-weight:700;">2</div></td><td style="padding-left:16px;"><p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#18181b;">Cr\u00e9ez votre premier CV</p><p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.5;">Remplissez vos informations et choisissez un design.</p></td></tr></table></td></tr>
<tr><td style="padding:16px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="44" valign="top"><div style="width:36px;height:36px;background:#fef3c7;border-radius:10px;text-align:center;line-height:36px;font-size:18px;color:#f59e0b;font-weight:700;">3</div></td><td style="padding-left:16px;"><p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#18181b;">Sauvegardez et partagez</p><p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.5;">Exportez en PDF et sauvegardez dans le cloud.</p></td></tr></table></td></tr>
</table></td></tr>
<tr><td style="padding:0 40px 48px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#18181b;"><a href="${siteUrl}" style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;">Commencer maintenant \u2192</a></td></tr></table></td></tr>
</table></td></tr>
<tr><td style="padding:32px 0 0;text-align:center;"><p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;">DesignCV \u2014 Cr\u00e9ez des CV qui font la diff\u00e9rence</p><p style="margin:0;font-size:12px;color:#d4d4d8;">Vous recevez cet email car un compte a \u00e9t\u00e9 cr\u00e9\u00e9 avec cette adresse.</p></td></tr>
</table></td></tr></table></body></html>`
  };
}
module.exports = welcomeEmail;
