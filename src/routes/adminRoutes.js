const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const fileLogService = require('../services/fileLogService');
const jwtConfig = require('../config/jwt');

// Clave para firmar cookies de sesión admin
const ADMIN_SESSION_SECRET = process.env.JWT_SECRET || 'admin-session-secret';

/**
 * Genera el HTML de la página de login
 */
function generateLoginPage(error = null) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MINIFUN Admin - Login</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --purple-main: #7B3FF2;
      --purple-glow: rgba(123, 63, 242, 0.4);
      --bg-dark: #0D0D1A;
      --bg-card: #1A1A2E;
      --text-primary: #FFFFFF;
      --text-secondary: #A0A0C0;
      --accent-red: #FF4466;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'JetBrains Mono', monospace;
      background: var(--bg-dark);
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-image:
        radial-gradient(ellipse at top left, rgba(123, 63, 242, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at bottom right, rgba(91, 74, 139, 0.1) 0%, transparent 50%);
    }

    .login-container {
      background: var(--bg-card);
      border: 1px solid rgba(123, 63, 242, 0.3);
      border-radius: 20px;
      padding: 3rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px var(--purple-glow);
    }

    .logo {
      font-family: 'Orbitron', sans-serif;
      font-size: 2rem;
      font-weight: 900;
      text-align: center;
      background: linear-gradient(135deg, var(--purple-main) 0%, #00D4FF 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.8rem;
      letter-spacing: 3px;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
      letter-spacing: 1px;
    }

    input {
      width: 100%;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(123, 63, 242, 0.3);
      border-radius: 10px;
      color: var(--text-primary);
      font-family: 'JetBrains Mono', monospace;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    input:focus {
      outline: none;
      border-color: var(--purple-main);
      box-shadow: 0 0 20px var(--purple-glow);
    }

    input::placeholder {
      color: var(--text-secondary);
      opacity: 0.5;
    }

    button {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, var(--purple-main) 0%, #5B4A8B 100%);
      border: none;
      border-radius: 10px;
      color: white;
      font-family: 'Orbitron', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 2px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px var(--purple-glow);
    }

    .error {
      background: rgba(255, 68, 102, 0.1);
      border: 1px solid var(--accent-red);
      color: var(--accent-red);
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      font-size: 0.85rem;
      text-align: center;
    }

    .footer {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.7rem;
      color: var(--text-secondary);
    }
  </style>
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

/**
 * Genera el HTML de la página de logs
 */
function generateLogsPage(adminUser, users = [], selectedUser = null, logs = null, logContent = null) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MINIFUN Admin - Logs</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --purple-main: #7B3FF2;
      --purple-login: #7B68B8;
      --purple-dark: #5B4A8B;
      --purple-darker: #2D1B3D;
      --purple-glow: rgba(123, 63, 242, 0.4);
      --bg-dark: #0D0D1A;
      --bg-card: #1A1A2E;
      --bg-card-hover: #252542;
      --text-primary: #FFFFFF;
      --text-secondary: #A0A0C0;
      --accent-green: #00FF88;
      --accent-red: #FF4466;
      --accent-yellow: #FFD700;
      --accent-blue: #00D4FF;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'JetBrains Mono', monospace;
      background: var(--bg-dark);
      color: var(--text-primary);
      min-height: 100vh;
      background-image:
        radial-gradient(ellipse at top left, rgba(123, 63, 242, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at bottom right, rgba(91, 74, 139, 0.1) 0%, transparent 50%);
    }

    .header {
      background: linear-gradient(135deg, var(--purple-darker) 0%, var(--bg-dark) 100%);
      border-bottom: 1px solid var(--purple-main);
      padding: 1.5rem 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 30px var(--purple-glow);
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.8rem;
      font-weight: 900;
      background: linear-gradient(135deg, var(--purple-main) 0%, var(--accent-blue) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 3px;
    }

    .logo-sub {
      font-size: 0.7rem;
      color: var(--text-secondary);
      letter-spacing: 5px;
      margin-left: 0.5rem;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .admin-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(0, 255, 136, 0.1);
      border: 1px solid var(--accent-green);
      border-radius: 20px;
      font-size: 0.75rem;
      color: var(--accent-green);
    }

    .logout-btn {
      padding: 0.5rem 1rem;
      background: rgba(255, 68, 102, 0.1);
      border: 1px solid var(--accent-red);
      border-radius: 8px;
      color: var(--accent-red);
      text-decoration: none;
      font-size: 0.8rem;
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background: rgba(255, 68, 102, 0.2);
    }

    .main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 2rem;
      min-height: calc(100vh - 80px);
    }

    .sidebar {
      background: var(--bg-card);
      border-radius: 16px;
      border: 1px solid rgba(123, 63, 242, 0.3);
      overflow: hidden;
      height: fit-content;
      position: sticky;
      top: 100px;
    }

    .sidebar-header {
      padding: 1.25rem;
      border-bottom: 1px solid rgba(123, 63, 242, 0.2);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sidebar-header h2 {
      font-family: 'Orbitron', sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--purple-main);
    }

    .user-count {
      background: var(--purple-main);
      color: white;
      padding: 0.2rem 0.6rem;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .users-list {
      max-height: 60vh;
      overflow-y: auto;
    }

    .users-list::-webkit-scrollbar { width: 6px; }
    .users-list::-webkit-scrollbar-track { background: var(--bg-dark); }
    .users-list::-webkit-scrollbar-thumb { background: var(--purple-dark); border-radius: 3px; }

    .user-item {
      display: block;
      padding: 1rem 1.25rem;
      text-decoration: none;
      color: var(--text-primary);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.2s ease;
    }

    .user-item:hover {
      background: var(--bg-card-hover);
      border-left: 3px solid var(--purple-main);
      padding-left: calc(1.25rem - 3px);
    }

    .user-item.active {
      background: linear-gradient(90deg, rgba(123, 63, 242, 0.2) 0%, transparent 100%);
      border-left: 3px solid var(--purple-main);
      padding-left: calc(1.25rem - 3px);
    }

    .user-name {
      font-weight: 500;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-id {
      font-size: 0.7rem;
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.05);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .user-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.5rem;
    }

    .content {
      background: var(--bg-card);
      border-radius: 16px;
      border: 1px solid rgba(123, 63, 242, 0.3);
      overflow: hidden;
    }

    .content-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(123, 63, 242, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .content-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .content-title .icon {
      width: 32px;
      height: 32px;
      background: var(--purple-main);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .date-pills {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .date-pill {
      padding: 0.5rem 1rem;
      background: rgba(123, 63, 242, 0.1);
      border: 1px solid rgba(123, 63, 242, 0.3);
      border-radius: 20px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.8rem;
      transition: all 0.2s ease;
    }

    .date-pill:hover {
      background: rgba(123, 63, 242, 0.2);
      border-color: var(--purple-main);
      color: var(--text-primary);
    }

    .date-pill.active {
      background: var(--purple-main);
      border-color: var(--purple-main);
      color: white;
    }

    .download-btn {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, var(--accent-green) 0%, #00CC6A 100%);
      border: none;
      border-radius: 8px;
      color: var(--bg-dark);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
    }

    .log-content {
      padding: 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
    }

    .log-content::-webkit-scrollbar { width: 8px; }
    .log-content::-webkit-scrollbar-track { background: var(--bg-dark); border-radius: 4px; }
    .log-content::-webkit-scrollbar-thumb { background: var(--purple-dark); border-radius: 4px; }

    .log-line {
      font-size: 0.8rem;
      line-height: 1.8;
      padding: 0.25rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      word-break: break-all;
    }

    .log-line:hover { background: rgba(123, 63, 242, 0.05); }

    .log-timestamp { color: var(--text-secondary); }

    .log-level {
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      margin: 0 0.5rem;
    }

    .log-level.DEBUG { background: rgba(0, 212, 255, 0.2); color: var(--accent-blue); }
    .log-level.INFO { background: rgba(0, 255, 136, 0.2); color: var(--accent-green); }
    .log-level.WARNING { background: rgba(255, 215, 0, 0.2); color: var(--accent-yellow); }
    .log-level.ERROR { background: rgba(255, 68, 102, 0.2); color: var(--accent-red); }
    .log-level.FATAL { background: rgba(255, 68, 102, 0.4); color: #FF6680; }

    .log-meta { color: var(--purple-login); font-size: 0.75rem; }
    .log-comment { color: var(--text-secondary); font-style: italic; opacity: 0.7; }

    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
      color: var(--text-secondary);
    }

    .empty-state .icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
    .empty-state h3 { font-family: 'Orbitron', sans-serif; font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary); }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(123, 63, 242, 0.2);
    }

    .stat-card {
      background: rgba(123, 63, 242, 0.1);
      border: 1px solid rgba(123, 63, 242, 0.2);
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
    }

    .stat-value { font-family: 'Orbitron', sans-serif; font-size: 1.8rem; font-weight: 700; color: var(--purple-main); }
    .stat-label { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; letter-spacing: 1px; }

    @media (max-width: 900px) {
      .main { grid-template-columns: 1fr; }
      .sidebar { position: relative; top: 0; }
      .users-list { max-height: 300px; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-content">
      <div style="display: flex; align-items: baseline;">
        <span class="logo">MINIFUN</span>
        <span class="logo-sub">ADMIN LOGS</span>
      </div>
      <div class="header-right">
        <div class="admin-badge">
          👤 ${adminUser.username}
        </div>
        <a href="/admin/logs/logout" class="logout-btn">Cerrar sesión</a>
      </div>
    </div>
  </header>

  <main class="main">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>USUARIOS</h2>
        <span class="user-count">${users.length}</span>
      </div>
      <div class="users-list">
        ${users.length === 0 ? `
          <div class="empty-state" style="padding: 2rem;">
            <p>No hay usuarios con logs</p>
          </div>
        ` : users.map(user => `
          <a href="/admin/logs?user=${user.userId}"
             class="user-item ${selectedUser && selectedUser.userId === user.userId ? 'active' : ''}">
            <div class="user-name">
              ${user.username || 'Usuario'}
              <span class="user-id">#${user.userId}</span>
            </div>
            <div class="user-meta">
              <span>📄 ${user.logCount} logs</span>
              <span>📅 ${user.latestLog}</span>
            </div>
          </a>
        `).join('')}
      </div>
    </aside>

    <section class="content">
      ${!selectedUser ? `
        <div class="empty-state">
          <div class="icon">📊</div>
          <h3>Selecciona un usuario</h3>
          <p>Elige un usuario del panel izquierdo para ver sus logs</p>
        </div>
      ` : `
        <div class="content-header">
          <div class="content-title">
            <div class="icon">👤</div>
            <div>
              <div>${selectedUser.username}</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 400;">
                ${selectedUser.email || 'Sin email'}
              </div>
            </div>
          </div>
          ${logs && logs.length > 0 ? `
            <div class="date-pills">
              ${logs.slice(0, 7).map(log => `
                <a href="/admin/logs?user=${selectedUser.userId}&date=${log.date}"
                   class="date-pill ${logContent && logContent.date === log.date ? 'active' : ''}">
                  ${log.date}
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>

        ${logContent && logContent.lines && logContent.lines.length > 0 ? `
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${logContent.lines.filter(l => !l.startsWith('#')).length}</div>
              <div class="stat-label">ENTRADAS</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${logContent.lines.filter(l => l.includes('[ERROR]') || l.includes('[FATAL]')).length}</div>
              <div class="stat-label">ERRORES</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${logContent.lines.filter(l => l.includes('[WARNING]')).length}</div>
              <div class="stat-label">WARNINGS</div>
            </div>
          </div>
          <div style="padding: 1rem 1.5rem; border-bottom: 1px solid rgba(123, 63, 242, 0.2); display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--text-secondary); font-size: 0.8rem;">
              📅 ${logContent.date}
            </span>
            <a href="/admin/logs/download/${selectedUser.userId}/${logContent.date}" class="download-btn">
              ⬇ Descargar .log
            </a>
          </div>
          <div class="log-content">
            ${logContent.lines.map(line => formatLogLine(line)).join('')}
          </div>
        ` : logs && logs.length > 0 ? `
          <div class="empty-state">
            <div class="icon">📅</div>
            <h3>Selecciona una fecha</h3>
            <p>Elige una fecha para ver los logs de ese día</p>
          </div>
        ` : `
          <div class="empty-state">
            <div class="icon">📭</div>
            <h3>Sin logs</h3>
            <p>Este usuario no tiene logs registrados</p>
          </div>
        `}
      `}
    </section>
  </main>
</body>
</html>
  `;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatLogLine(line) {
  if (line.startsWith('#')) {
    return '<div class="log-line log-comment">' + escapeHtml(line) + '</div>';
  }

  const levelMatch = line.match(/\[(DEBUG|INFO|WARNING|ERROR|FATAL)\]/);
  const level = levelMatch ? levelMatch[1] : null;

  let formattedLine = escapeHtml(line);

  // Highlight timestamp
  formattedLine = formattedLine.replace(/\[([^\]]+)\]/, '<span class="log-timestamp">[$1]</span>');

  // Highlight level
  if (level) {
    formattedLine = formattedLine.replace(
      /\[(DEBUG|INFO|WARNING|ERROR|FATAL)\]/,
      '<span class="log-level ' + level + '">' + level + '</span>'
    );
  }

  // Highlight JSON metadata
  formattedLine = formattedLine.replace(/(\{[^}]+\})/g, '<span class="log-meta">$1</span>');

  return '<div class="log-line">' + formattedLine + '</div>';
}

// Middleware para verificar sesión admin
async function requireAdminSession(req, res, next) {
  const token = req.cookies?.adminToken;

  if (!token) {
    return res.redirect('/admin/logs/login');
  }

  try {
    const decoded = jwt.verify(token, ADMIN_SESSION_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || user.role !== 'admin') {
      res.clearCookie('adminToken');
      return res.redirect('/admin/logs/login');
    }

    req.adminUser = user;
    next();
  } catch (error) {
    res.clearCookie('adminToken');
    return res.redirect('/admin/logs/login');
  }
}

// GET /admin/logs/login - Página de login
router.get('/login', (req, res) => {
  // Si ya tiene sesión, redirigir al panel
  const token = req.cookies?.adminToken;
  if (token) {
    try {
      jwt.verify(token, ADMIN_SESSION_SECRET);
      return res.redirect('/admin/logs');
    } catch (e) {
      // Token inválido, continuar al login
    }
  }

  res.send(generateLoginPage());
});

// POST /admin/logs/login - Procesar login
router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.send(generateLoginPage('Email/usuario y contraseña son requeridos'));
  }

  try {
    // Buscar usuario
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email: usernameOrEmail },
          { username: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      return res.send(generateLoginPage('Credenciales incorrectas'));
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.send(generateLoginPage('Credenciales incorrectas'));
    }

    // Verificar rol admin
    if (user.role !== 'admin') {
      return res.send(generateLoginPage('No tienes permisos de administrador'));
    }

    // Crear token de sesión
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      ADMIN_SESSION_SECRET,
      { expiresIn: '24h' }
    );

    // Guardar en cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    res.redirect('/admin/logs');
  } catch (error) {
    console.error('Error en login admin:', error);
    res.send(generateLoginPage('Error interno del servidor'));
  }
});

// GET /admin/logs/logout - Cerrar sesión
router.get('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.redirect('/admin/logs/login');
});

// GET /admin/logs - Panel principal
router.get('/', requireAdminSession, async (req, res) => {
  try {
    const { user: userId, date } = req.query;

    // Obtener usuarios con logs
    const usersWithLogs = await fileLogService.listUsersWithLogs();

    // Obtener info de usuarios desde la BD
    const userIds = usersWithLogs.map(u => u.userId);
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'username', 'email']
    });

    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = { username: u.username, email: u.email };
    });

    const usersData = usersWithLogs.map(u => ({
      ...u,
      username: userMap[u.userId]?.username || 'Unknown',
      email: userMap[u.userId]?.email || null
    }));

    let selectedUser = null;
    let logs = null;
    let logContent = null;

    if (userId) {
      const userInfo = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email']
      });

      if (userInfo) {
        selectedUser = {
          userId: userInfo.id,
          username: userInfo.username,
          email: userInfo.email
        };

        logs = await fileLogService.listUserLogs(userId);

        if (date) {
          logContent = await fileLogService.readLogs(userId, date);
        }
      }
    }

    res.send(generateLogsPage(req.adminUser, usersData, selectedUser, logs, logContent));
  } catch (error) {
    console.error('Error en panel admin:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// GET /admin/logs/download/:userId/:date - Descargar archivo
router.get('/download/:userId/:date', requireAdminSession, (req, res) => {
  const { userId, date } = req.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).send('Formato de fecha inválido');
  }

  const filePath = fileLogService.getLogFilePath(userId, date);
  const fs = require('fs');

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Archivo no encontrado');
  }

  res.download(filePath, `user_${userId}_${date}.log`);
});

module.exports = router;
