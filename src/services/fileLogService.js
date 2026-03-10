const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Directorio base para logs de usuarios
const LOGS_DIR = path.join(process.cwd(), 'logs', 'users');

const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Días de retención de logs
const RETENTION_DAYS = 30;

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Obtiene el timestamp actual en formato ISO
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Asegura que el directorio existe
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

/**
 * Escribe logs de un usuario a su archivo correspondiente
 * @param {number} userId - ID del usuario
 * @param {Array} logs - Array de logs a escribir
 * @param {Object} metadata - Metadata adicional (deviceInfo, appVersion)
 */
async function writeLogs(userId, logs, metadata = {}) {
  const userDir = path.join(LOGS_DIR, String(userId));
  await ensureDir(userDir);

  const dateString = getDateString();
  const logFile = path.join(userDir, `${dateString}.log`);

  const lines = logs.map(log => {
    const timestamp = log.timestamp || getTimestamp();
    const level = (log.level || 'info').toUpperCase();
    const message = log.message || '';

    let metaStr = '';
    if (log.metadata && Object.keys(log.metadata).length > 0) {
      metaStr = ` ${JSON.stringify(log.metadata)}`;
    }

    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  });

  // Agregar info del dispositivo como comentario al inicio si es nuevo archivo
  let content = '';
  const fileExists = fsSync.existsSync(logFile);

  if (!fileExists && metadata.deviceInfo) {
    content += `# Device: ${JSON.stringify(metadata.deviceInfo)}\n`;
    content += `# App Version: ${metadata.appVersion || 'unknown'}\n`;
    content += `# ----------------------------------------\n`;
  }

  content += lines.join('\n') + '\n';

  await fs.appendFile(logFile, content, 'utf8');

  return { written: logs.length, file: `${userId}/${dateString}.log` };
}

/**
 * Lee los logs de un usuario para una fecha específica
 * @param {number} userId - ID del usuario
 * @param {string} date - Fecha en formato YYYY-MM-DD (opcional, default: hoy)
 */
async function readLogs(userId, date = null) {
  const userDir = path.join(LOGS_DIR, String(userId));
  const dateString = date || getDateString();
  const logFile = path.join(userDir, `${dateString}.log`);

  try {
    const content = await fs.readFile(logFile, 'utf8');
    return {
      date: dateString,
      content,
      lines: content.split('\n').filter(line => line.trim())
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { date: dateString, content: '', lines: [] };
    }
    throw error;
  }
}

/**
 * Lista todos los archivos de log de un usuario
 * @param {number} userId - ID del usuario
 */
async function listUserLogs(userId) {
  const userDir = path.join(LOGS_DIR, String(userId));

  try {
    const files = await fs.readdir(userDir);
    const logFiles = files
      .filter(f => f.endsWith('.log'))
      .map(f => {
        const filePath = path.join(userDir, f);
        const stats = fsSync.statSync(filePath);
        return {
          date: f.replace('.log', ''),
          filename: f,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024 * 100) / 100
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Más reciente primero

    return logFiles;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Lista todos los usuarios que tienen logs
 */
async function listUsersWithLogs() {
  try {
    await ensureDir(LOGS_DIR);
    const userDirs = await fs.readdir(LOGS_DIR);

    const users = await Promise.all(
      userDirs.map(async (userId) => {
        const userDir = path.join(LOGS_DIR, userId);
        const stat = await fs.stat(userDir);

        if (!stat.isDirectory()) return null;

        const files = await fs.readdir(userDir);
        const logFiles = files.filter(f => f.endsWith('.log'));

        if (logFiles.length === 0) return null;

        // Obtener fecha del log más reciente
        const sortedFiles = logFiles.sort().reverse();
        const latestLog = sortedFiles[0].replace('.log', '');

        // Calcular tamaño total
        let totalSize = 0;
        for (const file of logFiles) {
          const filePath = path.join(userDir, file);
          const fileStat = await fs.stat(filePath);
          totalSize += fileStat.size;
        }

        return {
          userId: parseInt(userId),
          logCount: logFiles.length,
          latestLog,
          totalSizeKB: Math.round(totalSize / 1024 * 100) / 100
        };
      })
    );

    return users.filter(u => u !== null);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Obtiene la ruta del archivo de log para descarga
 * @param {number} userId - ID del usuario
 * @param {string} date - Fecha en formato YYYY-MM-DD
 */
function getLogFilePath(userId, date) {
  return path.join(LOGS_DIR, String(userId), `${date}.log`);
}

/**
 * Elimina logs más antiguos que RETENTION_DAYS
 */
async function cleanupOldLogs() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  const cutoffStr = getDateString(cutoffDate);

  let deletedCount = 0;

  try {
    const userDirs = await fs.readdir(LOGS_DIR);

    for (const userId of userDirs) {
      const userDir = path.join(LOGS_DIR, userId);
      const stat = await fs.stat(userDir);

      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(userDir);

      for (const file of files) {
        if (!file.endsWith('.log')) continue;

        const fileDate = file.replace('.log', '');
        if (fileDate < cutoffStr) {
          await fs.unlink(path.join(userDir, file));
          deletedCount++;
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up logs:', error);
  }

  return deletedCount;
}

/**
 * Enriquece registros de logs con datos de usuario
 * @param {Array} usersWithLogs - Array de objetos con userId
 * @param {Array} users - Array de usuarios con id, username, email
 * @returns {Array} - usersWithLogs enriquecido con username y email
 */
const enrichLogsWithUserData = (usersWithLogs, users) => {
  const userMap = {};
  users.forEach(u => { userMap[u.id] = { username: u.username, email: u.email }; });
  return usersWithLogs.map(u => ({
    ...u,
    username: userMap[u.userId]?.username || 'Unknown',
    email: userMap[u.userId]?.email || null
  }));
};

module.exports = {
  writeLogs,
  readLogs,
  listUserLogs,
  listUsersWithLogs,
  getLogFilePath,
  cleanupOldLogs,
  RETENTION_DAYS,
  DATE_FORMAT_REGEX,
  enrichLogsWithUserData
};
