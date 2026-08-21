function passwordResetEmail(name, resetUrl) {
  const displayName = name || '';
  const firstName = displayName.split(' ')[0] || '';

  return {
    subject: 'R\u00e9initialisation de mot de passe \u2014 DesignCV',
    html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>DesignCV</title>
<!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;"><tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="100%" style="max-width:580px;">
<tr><td align="center" style="padding-bottom:40px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#18181b;padding:12px 24px;border-radius:8px;"><span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Design<span style="color:#10b981;">CV</span></span></td></tr></table></td></tr>
<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04),0 4px 24px rgba(0,0,0,.06);">
<tr><td style="height:4px;background:linear-gradient(90deg,#f59e0b,#d97706);font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:48px 40px 32px;text-align:center;">
<p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#f59e0b;">S\u00e9curit\u00e9</p>
<h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#18181b;line-height:1.2;">Mot de passe oubli\u00e9 ?</h1>
<p style="margin:0;font-size:16px;color:#71717a;line-height:1.6;">Pas de souci${firstName ? ', ' + firstName : ''}. Cr\u00e9ez un nouveau mot de passe en un clic.</p>
</td></tr>
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f4f4f5;margin:0;"></td></tr>
<tr><td style="padding:32px 40px 12px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#f59e0b;"><a href="${resetUrl}" style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;">R\u00e9initialiser mon mot de passe</a></td></tr></table>
</td></tr>
<tr><td style="padding:16px 40px 40px;text-align:center;">
<p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">Ce lien expire dans <strong style="color:#18181b;">1 heure</strong>.<br>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
</td></tr>
<tr><td style="padding:0 40px 40px;text-align:center;">
<p style="margin:0;font-size:12px;color:#d4d4d8;word-break:break-all;"><a href="${resetUrl}" style="color:#a1a1aa;">${resetUrl}</a></p>
</td></tr>
</table></td></tr>
<tr><td style="padding:32px 0 0;text-align:center;"><p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;">DesignCV \u2014 Cr\u00e9ez des CV qui font la diff\u00e9rence</p><p style="margin:0;font-size:12px;color:#d4d4d8;">Cet email a \u00e9t\u00e9 envoy\u00e9 automatiquement. Si vous n'\u00eates pas \u00e0 l'origine de cette demande, ignorez-le.</p></td></tr>
</table></td></tr></table></body></html>`
  };
}
module.exports = passwordResetEmail;
