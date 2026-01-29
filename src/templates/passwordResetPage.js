/**
 * Templates HTML para las páginas de restablecimiento de contraseña
 */

/**
 * Página con formulario para ingresar nueva contraseña
 * @param {string} token - Token de reset
 * @param {string} error - Mensaje de error (opcional)
 * @returns {string} HTML de la página
 */
const getPasswordResetFormPage = (token, error = null) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña - MINIFUN</title>
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
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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

    .logo {
      font-size: 48px;
      margin-bottom: 8px;
    }

    h1 {
      color: #1f2937;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 32px;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 24px;
      font-size: 14px;
      text-align: left;
    }

    .form-group {
      margin-bottom: 20px;
      text-align: left;
    }

    label {
      display: block;
      color: #374151;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 16px;
      font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:focus {
      outline: none;
      border-color: #f5576c;
      box-shadow: 0 0 0 3px rgba(245, 87, 108, 0.1);
    }

    .password-requirements {
      margin-top: 8px;
      font-size: 12px;
      color: #9ca3af;
    }

    .submit-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      margin-top: 8px;
    }

    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .footer {
      margin-top: 32px;
      color: #9ca3af;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🔐</div>
    <h1>Nueva Contraseña</h1>
    <p class="subtitle">Ingresa tu nueva contraseña para MINIFUN</p>

    ${error ? `<div class="error-message">${error}</div>` : ''}

    <form action="/api/auth/reset-password" method="POST" id="resetForm">
      <input type="hidden" name="token" value="${token}">

      <div class="form-group">
        <label for="password">Nueva contraseña</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Mínimo 6 caracteres"
          required
          minlength="6"
        >
        <p class="password-requirements">La contraseña debe tener al menos 6 caracteres</p>
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirmar contraseña</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Repite tu contraseña"
          required
          minlength="6"
        >
      </div>

      <button type="submit" class="submit-btn" id="submitBtn">
        Cambiar contraseña
      </button>
    </form>

    <div class="footer">
      © ${new Date().getFullYear()} MINIFUN - Aprende jugando
    </div>
  </div>

  <script>
    document.getElementById('resetForm').addEventListener('submit', function(e) {
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (password !== confirmPassword) {
        e.preventDefault();
        alert('Las contraseñas no coinciden');
        return;
      }

      if (password.length < 6) {
        e.preventDefault();
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      document.getElementById('submitBtn').disabled = true;
      document.getElementById('submitBtn').textContent = 'Procesando...';
    });
  </script>
</body>
</html>
  `.trim();
};

/**
 * Página de contraseña cambiada exitosamente
 * @param {string} username - Nombre del usuario
 * @returns {string} HTML de la página
 */
const getPasswordResetSuccessPage = (username) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contraseña Actualizada - MINIFUN</title>
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
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
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

    .logo {
      font-size: 32px;
      margin-bottom: 8px;
    }

    h1 {
      color: #1f2937;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .username {
      color: #22c55e;
      font-weight: 600;
    }

    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .success-badge {
      display: inline-block;
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
      color: white;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 24px;
    }

    .footer {
      margin-top: 32px;
      color: #9ca3af;
      font-size: 14px;
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
    <h1>¡Contraseña Actualizada!</h1>
    <p>
      <span class="username">${username}</span>, tu contraseña ha sido cambiada exitosamente.
    </p>
    <div class="success-badge">🔐 Contraseña segura</div>
    <p>Ya puedes cerrar esta ventana y volver a iniciar sesión en la app con tu nueva contraseña.</p>
    <div class="footer">
      © ${new Date().getFullYear()} MINIFUN - Aprende jugando
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Página de error en el reset de contraseña
 * @param {string} errorMessage - Mensaje de error
 * @returns {string} HTML de la página
 */
const getPasswordResetErrorPage = (errorMessage) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - MINIFUN</title>
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

    .logo {
      font-size: 32px;
      margin-bottom: 8px;
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
      margin-bottom: 24px;
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
    <h1>Error</h1>
    <div class="error-message">
      ${errorMessage}
    </div>
    <div class="tips">
      <h3>💡 ¿Qué puedes hacer?</h3>
      <ul>
        <li>Solicita un nuevo enlace de recuperación desde la app</li>
        <li>El enlace expira en 1 hora</li>
        <li>Asegúrate de usar el enlace más reciente</li>
      </ul>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} MINIFUN - Aprende jugando
    </div>
  </div>
</body>
</html>
  `.trim();
};

module.exports = {
  getPasswordResetFormPage,
  getPasswordResetSuccessPage,
  getPasswordResetErrorPage
};
