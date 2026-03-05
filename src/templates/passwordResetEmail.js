/**
 * Plantilla HTML para el email de recuperación de contraseña
 *
 * @param {string} username - Nombre del usuario
 * @param {string} resetUrl - URL para restablecer la contraseña
 * @returns {string} HTML del email
 */
function getPasswordResetEmailTemplate(username, resetUrl) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupera tu contraseña de MINIFUN</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;">

    <div style="background-color:#f5576c;padding:40px 20px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:600;color:#ffffff;">🔐 MINIFUN</h1>
    </div>

    <div style="padding:40px 30px;color:#333333;line-height:1.6;">
      <h2 style="color:#f5576c;font-size:22px;margin-top:0;">Hola, ${username} 👋</h2>

      <p style="font-size:16px;margin:16px 0;">
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>MINIFUN</strong>.
      </p>

      <p style="font-size:16px;margin:16px 0;">
        Haz clic en el siguiente botón para crear una nueva contraseña:
      </p>

      <div style="text-align:center;margin:35px 0;">
        <a href="${resetUrl}"
           style="display:inline-block;padding:16px 40px;background-color:#f5576c;color:#ffffff;text-decoration:none;border-radius:50px;font-size:16px;font-weight:600;">
          🔑 Restablecer contraseña
        </a>
      </div>

      <div style="margin-top:30px;padding:20px;background-color:#f8f9fa;border-radius:6px;font-size:14px;color:#666666;word-break:break-all;">
        <p style="margin:8px 0;"><strong>¿El botón no funciona?</strong></p>
        <p style="margin:8px 0;">Copia y pega este enlace en tu navegador:</p>
        <p style="margin:8px 0;"><a href="${resetUrl}" style="color:#f5576c;text-decoration:none;">${resetUrl}</a></p>
      </div>

      <div style="margin-top:25px;padding:15px;background-color:#fff3cd;border-left:4px solid #ffc107;border-radius:4px;font-size:14px;color:#856404;">
        <strong>⏰ Importante:</strong> Este enlace expirará en <strong>1 hora</strong>.
        Si no restableces tu contraseña en ese tiempo, deberás solicitar un nuevo enlace.
      </div>

      <div style="margin-top:20px;padding:15px;background-color:#f8d7da;border-left:4px solid #dc3545;border-radius:4px;font-size:14px;color:#721c24;">
        <strong>🛡️ Aviso de seguridad:</strong> Si no solicitaste restablecer tu contraseña,
        ignora este correo. Tu cuenta sigue segura.
      </div>
    </div>

    <div style="padding:30px;text-align:center;background-color:#f8f9fa;color:#999999;font-size:14px;border-top:1px solid #e0e0e0;">
      <p style="margin:8px 0;">Este correo fue enviado porque alguien solicitó restablecer la contraseña de tu cuenta.</p>
      <p style="margin:8px 0;">&copy; ${new Date().getFullYear()} MINIFUN - Todos los derechos reservados</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Versión de texto plano del email de recuperación
 */
function getPasswordResetPlainText(username, resetUrl) {
  return `
Hola, ${username}!

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en MINIFUN.

Para crear una nueva contraseña, visita el siguiente enlace:
${resetUrl}

IMPORTANTE: Este enlace expirará en 1 hora.

Si no solicitaste restablecer tu contraseña, ignora este correo. Tu cuenta sigue segura.

© ${new Date().getFullYear()} MINIFUN - Todos los derechos reservados
  `.trim();
}

module.exports = { getPasswordResetEmailTemplate, getPasswordResetPlainText };
