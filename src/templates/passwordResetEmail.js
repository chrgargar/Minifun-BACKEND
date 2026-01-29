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
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.6;
    }
    .content h2 {
      color: #f5576c;
      font-size: 22px;
      margin-top: 0;
    }
    .content p {
      font-size: 16px;
      margin: 16px 0;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .reset-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      text-decoration: none;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
      transition: transform 0.2s;
    }
    .reset-button:hover {
      transform: translateY(-2px);
    }
    .alternative-link {
      margin-top: 30px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 6px;
      font-size: 14px;
      color: #666666;
      word-break: break-all;
    }
    .alternative-link p {
      margin: 8px 0;
    }
    .alternative-link a {
      color: #f5576c;
      text-decoration: none;
    }
    .footer {
      padding: 30px;
      text-align: center;
      background-color: #f8f9fa;
      color: #999999;
      font-size: 14px;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 8px 0;
    }
    .warning {
      margin-top: 25px;
      padding: 15px;
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
      font-size: 14px;
      color: #856404;
    }
    .security-notice {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      border-radius: 4px;
      font-size: 14px;
      color: #721c24;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🔐 MINIFUN</h1>
    </div>

    <div class="content">
      <h2>Hola, ${username} 👋</h2>

      <p>
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>MINIFUN</strong>.
      </p>

      <p>
        Haz clic en el siguiente botón para crear una nueva contraseña:
      </p>

      <div class="button-container">
        <a href="${resetUrl}" class="reset-button">
          🔑 Restablecer contraseña
        </a>
      </div>

      <div class="alternative-link">
        <p><strong>¿El botón no funciona?</strong></p>
        <p>Copia y pega este enlace en tu navegador:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
      </div>

      <div class="warning">
        <strong>⏰ Importante:</strong> Este enlace expirará en <strong>1 hora</strong>.
        Si no restableces tu contraseña en ese tiempo, deberás solicitar un nuevo enlace.
      </div>

      <div class="security-notice">
        <strong>🛡️ Aviso de seguridad:</strong> Si no solicitaste restablecer tu contraseña,
        ignora este correo. Tu cuenta sigue segura.
      </div>
    </div>

    <div class="footer">
      <p>
        Este correo fue enviado porque alguien solicitó restablecer la contraseña de tu cuenta.
      </p>
      <p>
        &copy; ${new Date().getFullYear()} MINIFUN - Todos los derechos reservados
      </p>
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
