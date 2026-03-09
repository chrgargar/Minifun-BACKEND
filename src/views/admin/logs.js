/**
 * HTML de la página principal de logs del panel de administración
 */

const { logsStyles, fontsLink } = require('./styles');

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formatea una línea de log con highlighting
 */
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

/**
 * Genera la lista de usuarios en el sidebar
 */
function generateUsersList(users, selectedUser) {
  if (users.length === 0) {
    return `
      <div class="empty-state" style="padding: 2rem;">
        <p>No hay usuarios con logs</p>
      </div>
    `;
  }

  return users.map(user => `
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
  `).join('');
}

/**
 * Genera las pills de fechas
 */
function generateDatePills(logs, selectedUser, logContent) {
  if (!logs || logs.length === 0) return '';

  return `
    <div class="date-pills">
      ${logs.slice(0, 7).map(log => `
        <a href="/admin/logs?user=${selectedUser.userId}&date=${log.date}"
           class="date-pill ${logContent && logContent.date === log.date ? 'active' : ''}">
          ${log.date}
        </a>
      `).join('')}
    </div>
  `;
}

/**
 * Genera las estadísticas del log
 */
function generateStats(logContent) {
  const entries = logContent.lines.filter(l => !l.startsWith('#')).length;
  const errors = logContent.lines.filter(l => l.includes('[ERROR]') || l.includes('[FATAL]')).length;
  const warnings = logContent.lines.filter(l => l.includes('[WARNING]')).length;

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${entries}</div>
        <div class="stat-label">ENTRADAS</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${errors}</div>
        <div class="stat-label">ERRORES</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${warnings}</div>
        <div class="stat-label">WARNINGS</div>
      </div>
    </div>
  `;
}

/**
 * Genera el contenido principal según el estado
 */
function generateContent(selectedUser, logs, logContent) {
  // Sin usuario seleccionado
  if (!selectedUser) {
    return `
      <div class="empty-state">
        <div class="icon">📊</div>
        <h3>Selecciona un usuario</h3>
        <p>Elige un usuario del panel izquierdo para ver sus logs</p>
      </div>
    `;
  }

  // Usuario seleccionado, mostrar header
  let html = `
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
      ${generateDatePills(logs, selectedUser, logContent)}
    </div>
  `;

  // Con contenido de log
  if (logContent && logContent.lines && logContent.lines.length > 0) {
    html += generateStats(logContent);
    html += `
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
    `;
  }
  // Con fechas pero sin fecha seleccionada
  else if (logs && logs.length > 0) {
    html += `
      <div class="empty-state">
        <div class="icon">📅</div>
        <h3>Selecciona una fecha</h3>
        <p>Elige una fecha para ver los logs de ese día</p>
      </div>
    `;
  }
  // Sin logs
  else {
    html += `
      <div class="empty-state">
        <div class="icon">📭</div>
        <h3>Sin logs</h3>
        <p>Este usuario no tiene logs registrados</p>
      </div>
    `;
  }

  return html;
}

/**
 * Genera el HTML de la página de logs
 * @param {Object} adminUser - Usuario admin actual
 * @param {Array} users - Lista de usuarios con logs
 * @param {Object|null} selectedUser - Usuario seleccionado
 * @param {Array|null} logs - Lista de logs del usuario
 * @param {Object|null} logContent - Contenido del log seleccionado
 * @returns {string} HTML completo
 */
function generateLogsPage(adminUser, users = [], selectedUser = null, logs = null, logContent = null) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MINIFUN Admin - Logs</title>
  ${fontsLink}
  <style>${logsStyles}</style>
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
        ${generateUsersList(users, selectedUser)}
      </div>
    </aside>

    <section class="content">
      ${generateContent(selectedUser, logs, logContent)}
    </section>
  </main>
</body>
</html>
  `;
}

module.exports = { generateLogsPage };
