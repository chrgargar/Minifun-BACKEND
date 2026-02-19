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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      color: #667eea;
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
    .verify-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s;
    }
    .verify-button:hover {
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
      color: #667eea;
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
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🎮 MINIFUN</h1>
    </div>

    <div class="content">
      <h2>¡Hola, ${username}! 👋</h2>

      <p>
        Hemos recibido una solicitud para <strong>cambiar la dirección de correo electrónico</strong>
        asociada a tu cuenta de MINIFUN.
      </p>

      <p>
        Para confirmar este cambio, necesitamos verificar que tienes acceso a esta nueva
        dirección de correo electrónico.
      </p>

      <div class="button-container">
        <a href="${verificationUrl}" class="verify-button">
          ✓ Verificar nuevo email
        </a>
      </div>

      <div class="alternative-link">
        <p><strong>¿El botón no funciona?</strong></p>
        <p>Copia y pega este enlace en tu navegador:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      </div>

      <div class="warning">
        <strong>⏰ Importante:</strong> Este enlace expirará en <strong>24 horas</strong>.
        Si no solicitaste este cambio, puedes ignorar este correo y tu email seguirá siendo el mismo.
      </div>
    </div>

    <div class="footer">
      <p>
        Si no solicitaste cambiar tu email en MINIFUN, puedes ignorar este correo de forma segura.
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
