/**
 * Plantilla HTML para verificación de cambio de email
 *
 * @param {string} username - Nombre del usuario
 * @param {string} verificationUrl - URL de verificación con el token
 * @returns {string} HTML del email
 */
function getEmailChangeVerificationTemplate(username, verificationUrl) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu nuevo email - MINIFUN</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;">

    <div style="background-color:#764ba2;padding:40px 20px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:600;color:#ffffff;">🎮 MINIFUN</h1>
    </div>

    <div style="padding:40px 30px;color:#333333;line-height:1.6;">
      <h2 style="color:#667eea;font-size:22px;margin-top:0;">¡Hola, ${username}! 👋</h2>

      <p style="font-size:16px;margin:16px 0;">
        Hemos recibido una solicitud para <strong>cambiar la dirección de correo electrónico</strong>
        asociada a tu cuenta de MINIFUN.
      </p>

      <p style="font-size:16px;margin:16px 0;">
        Para confirmar este cambio, necesitamos verificar que tienes acceso a esta nueva
        dirección de correo electrónico.
      </p>

      <div style="text-align:center;margin:35px 0;">
        <a href="${verificationUrl}"
           style="display:inline-block;padding:16px 40px;background-color:#764ba2;color:#ffffff;text-decoration:none;border-radius:50px;font-size:16px;font-weight:600;">
          ✓ Verificar nuevo email
        </a>
      </div>

      <div style="margin-top:30px;padding:20px;background-color:#f8f9fa;border-radius:6px;font-size:14px;color:#666666;word-break:break-all;">
        <p style="margin:8px 0;"><strong>¿El botón no funciona?</strong></p>
        <p style="margin:8px 0;">Copia y pega este enlace en tu navegador:</p>
        <p style="margin:8px 0;"><a href="${verificationUrl}" style="color:#667eea;text-decoration:none;">${verificationUrl}</a></p>
      </div>

      <div style="margin-top:25px;padding:15px;background-color:#fff3cd;border-left:4px solid #ffc107;border-radius:4px;font-size:14px;color:#856404;">
        <strong>⏰ Importante:</strong> Este enlace expirará en <strong>24 horas</strong>.
        Si no solicitaste este cambio, puedes ignorar este correo y tu email seguirá siendo el mismo.
      </div>
    </div>

    <div style="padding:30px;text-align:center;background-color:#f8f9fa;color:#999999;font-size:14px;border-top:1px solid #e0e0e0;">
      <p style="margin:8px 0;">Si no solicitaste cambiar tu email en MINIFUN, puedes ignorar este correo de forma segura.</p>
      <p style="margin:8px 0;">&copy; ${new Date().getFullYear()} MINIFUN - Todos los derechos reservados</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

function getEmailChangePlainText(username, verificationUrl) {
  return `
Hola, ${username}!

Hemos recibido una solicitud para cambiar la dirección de correo electrónico asociada a tu cuenta de MINIFUN.

Para confirmar este cambio, haz clic en el siguiente enlace:
${verificationUrl}

IMPORTANTE: Este enlace expirará en 24 horas.

Si no solicitaste este cambio, puedes ignorar este correo y tu email seguirá siendo el mismo.

© ${new Date().getFullYear()} MINIFUN - Todos los derechos reservados
  `.trim();
}

module.exports = { getEmailChangeVerificationTemplate, getEmailChangePlainText };
