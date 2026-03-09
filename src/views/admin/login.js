/**
 * HTML de la página de login del panel de administración
 */

const { loginStyles, fontsLink } = require('./styles');

/**
 * Genera el HTML de la página de login
 * @param {string|null} error - Mensaje de error a mostrar
 * @returns {string} HTML completo
 */
function generateLoginPage(error = null) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MINIFUN Admin - Login</title>
  ${fontsLink}
  <style>${loginStyles}</style>
</head>
<body>
  <div class="login-container">
    <h1 class="logo">MINIFUN</h1>
    <p class="subtitle">ADMIN PANEL</p>

    ${error ? `<div class="error">${error}</div>` : ''}

    <form method="POST" action="/admin/logs/login">
      <div class="form-group">
        <label>EMAIL O USUARIO</label>
        <input type="text" name="usernameOrEmail" placeholder="admin@example.com" required>
      </div>
      <div class="form-group">
        <label>CONTRASEÑA</label>
        <input type="password" name="password" placeholder="••••••••" required>
      </div>
      <button type="submit">INICIAR SESIÓN</button>
    </form>

    <p class="footer">Solo usuarios con rol admin pueden acceder</p>
  </div>
</body>
</html>
  `;
}

module.exports = { generateLoginPage };
