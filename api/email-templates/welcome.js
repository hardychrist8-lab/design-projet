function welcomeEmail(name) {
  const displayName = name || '';
  const siteUrl = 'https://design-cv.com';
  const firstName = displayName.split(' ')[0] || '';

  return {
    subject: "Bienvenue sur DesignCV — Votre compte est pr\u00eat",
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

<!-- Hero Section -->
<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:48px 40px 44px;text-align:center;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;"><tr><td style="width:64px;height:64px;background:linear-gradient(135deg,#10b981,#059669);border-radius:16px;text-align:center;line-height:64px;font-size:28px;color:#ffffff;font-weight:300;">&#9998;</td></tr></table>
  <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;letter-spacing:-0.3px;">Bienvenue${firstName ? ', ' + firstName : ''} !</h1>
  <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.6;max-width:380px;margin:0 auto;">Votre compte DesignCV est cr\u00e9\u00e9 et pr\u00eat \u00e0 l'emploi. Voici comment tirer le meilleur de votre nouvelle plateforme.</p>
</td></tr>

<!-- Steps -->
<tr><td style="padding:36px 40px 8px;">

  <!-- Step 1 -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
    <tr><td style="vertical-align:top;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:40px;height:40px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-radius:12px;text-align:center;line-height:40px;"><span style="font-size:13px;font-weight:700;color:#059669;">01</span></td></tr></table></td><td style="padding-left:16px;vertical-align:top;"><p style="margin:0 0 3px;font-size:15px;font-weight:600;color:#18181b;">V\u00e9rifiez votre adresse email</p><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Consultez votre bo\u00eete de r\u00e9ception et cliquez sur le lien de confirmation pour activer votre compte.</p></td></tr>
  </table>

  <!-- Step 2 -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
    <tr><td style="vertical-align:top;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:40px;height:40px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:12px;text-align:center;line-height:40px;"><span style="font-size:13px;font-weight:700;color:#0284c7;">02</span></td></tr></table></td><td style="padding-left:16px;vertical-align:top;"><p style="margin:0 0 3px;font-size:15px;font-weight:600;color:#18181b;">Choisissez un th\u00e8me et cr\u00e9ez votre CV</p><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">S\u00e9lectionnez parmi nos mod\u00e8les professionnels et remplissez vos informations.</p></td></tr>
  </table>

  <!-- Step 3 -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="vertical-align:top;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:40px;height:40px;background:linear-gradient(135deg,#fefce8,#fef3c7);border-radius:12px;text-align:center;line-height:40px;"><span style="font-size:13px;font-weight:700;color:#d97706;">03</span></td></tr></table></td><td style="padding-left:16px;vertical-align:top;"><p style="margin:0 0 3px;font-size:15px;font-weight:600;color:#18181b;">Exportez et partagez</p><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">T\u00e9l\u00e9chargez votre CV en PDF ou sauvegardez-le dans le cloud.</p></td></tr>
  </table>

</td></tr>

<!-- CTA Button -->
<tr><td style="padding:32px 40px 44px;text-align:center;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);"><a href="${siteUrl}" style="display:inline-block;padding:15px 44px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">Cr\u00e9er mon premier CV</a></td></tr></table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #f1f5f9;"></td></tr></table></td></tr>

<!-- Footer inside card -->
<tr><td style="padding:24px 40px 32px;text-align:center;">
  <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;line-height:1.6;">Vous recevez cet email car un compte a \u00e9t\u00e9 cr\u00e9\u00e9 avec cette adresse.</p>
  <p style="margin:0;font-size:12px;color:#cbd5e1;"><a href="${siteUrl}" style="color:#10b981;text-decoration:none;font-weight:500;">design-cv.com</a></p>
</td></tr>

</table>

<!-- Bottom branding -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;"><tr><td style="padding:28px 0 8px;text-align:center;"><p style="margin:0;font-size:11px;color:#94a3b8;">DesignCV &mdash; Cr\u00e9ez des CV qui font la diff\u00e9rence</p></td></tr></table>

</td></tr></table></body></html>`
  };
}
module.exports = welcomeEmail;
