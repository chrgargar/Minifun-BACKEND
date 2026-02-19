/**
 * Templates HTML para las páginas de verificación de email
 */

/**
 * Página de verificación exitosa
 * @param {string} username - Nombre del usuario
 * @returns {string} HTML de la página
 */
const getVerificationSuccessPage = (username) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verificado - MINIFUN</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 24px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .icon {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      animation: bounce 0.6s ease-out 0.3s both;
    }

    @keyframes bounce {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .icon svg {
      width: 50px;
      height: 50px;
      color: white;
    }

    .checkmark {
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      animation: draw 0.6s ease-out 0.6s forwards;
    }

    @keyframes draw {
      to { stroke-dashoffset: 0; }
    }

    h1 {
      color: #1f2937;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .username {
      color: #667eea;
      font-weight: 600;
    }

    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 24px;
    }

    .cta {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      display: inline-block;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .footer {
      margin-top: 32px;
      color: #9ca3af;
      font-size: 14px;
    }

    .logo {
      font-size: 32px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🎮</div>
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline class="checkmark" points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    <h1>¡Email Verificado!</h1>
    <p>
      Hola <span class="username">${username}</span>, tu cuenta ha sido activada correctamente.
      Ya puedes disfrutar de todos los minijuegos educativos.
    </p>
    <div class="badge">🎉 Cuenta Activada</div>
    <br><br>
    <p style="margin-bottom: 16px;">Ya puedes cerrar esta ventana y volver a la app.</p>
    <div class="footer">
      © ${new Date().getFullYear()} MINIFUN - Aprende jugando
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Página de error en verificación
 * @param {string} errorMessage - Mensaje de error
 * @returns {string} HTML de la página
 */
const getVerificationErrorPage = (errorMessage) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error de Verificación - MINIFUN</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 24px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .icon {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #fca5a5 0%, #ef4444 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      animation: shake 0.6s ease-out 0.3s;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-10px); }
      40%, 80% { transform: translateX(10px); }
    }

    .icon svg {
      width: 50px;
      height: 50px;
      color: white;
    }

    h1 {
      color: #1f2937;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 24px;
      font-size: 14px;
    }

    .tips {
      text-align: left;
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .tips h3 {
      color: #374151;
      font-size: 14px;
      margin-bottom: 12px;
    }

    .tips ul {
      color: #6b7280;
      font-size: 14px;
      padding-left: 20px;
    }

    .tips li {
      margin-bottom: 8px;
    }

    .footer {
      margin-top: 32px;
      color: #9ca3af;
      font-size: 14px;
    }

    .logo {
      font-size: 32px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🎮</div>
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
    <h1>Error de Verificación</h1>
    <div class="error-message">
      ${errorMessage}
    </div>
    <div class="tips">
      <h3>💡 ¿Qué puedes hacer?</h3>
      <ul>
        <li>Solicita un nuevo correo de verificación desde la app</li>
        <li>Revisa que el enlace no esté cortado o incompleto</li>
        <li>El enlace expira en 24 horas</li>
      </ul>
    </div>
    <p>Si el problema continúa, contacta con soporte.</p>
    <div class="footer">
      © ${new Date().getFullYear()} MINIFUN - Aprende jugando
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Página de confirmación de verificación
 * El GET muestra esta página; el usuario hace clic en el botón para confirmar (POST)
 * Esto previene que bots de email pre-fetch consuman el token
 * @param {string} token - Token de verificación
 * @returns {string} HTML de la página
 */
const getVerificationConfirmPage = (token) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificar Email - MINIFUN</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 24px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .icon {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .icon svg {
      width: 50px;
      height: 50px;
      color: white;
    }

    h1 {
      color: #1f2937;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    .verify-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 16px 48px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .verify-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .verify-btn:active {
      transform: translateY(0);
    }

    .verify-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .footer {
      margin-top: 32px;
      color: #9ca3af;
      font-size: 14px;
    }

    .logo {
      font-size: 32px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🎮</div>
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
    </div>
    <h1>Verificar Email</h1>
    <p>Haz clic en el botón para confirmar la verificación de tu correo electrónico.</p>
    <form method="POST" action="/api/auth/verify-email">
      <input type="hidden" name="token" value="${token}">
      <button type="submit" class="verify-btn" id="verifyBtn" onclick="this.disabled=true;this.textContent='Verificando...';this.form.submit();">
        ✓ Confirmar verificación
      </button>
    </form>
    <div class="footer">
      © ${new Date().getFullYear()} MINIFUN - Aprende jugando
    </div>
  </div>
</body>
</html>
  `.trim();
};

module.exports = {
  getVerificationSuccessPage,
  getVerificationErrorPage,
  getVerificationConfirmPage
};
