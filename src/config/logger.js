const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * Sistema de logging centralizado usando Winston
 *
 * Proporciona diferentes niveles de log (error, warn, info, debug)
 * y guarda logs en archivos separados según el nivel.
 *
 * Niveles de log:
 * - error: Errores críticos que requieren atención inmediata
 * - warn: Advertencias que no son críticas pero deben revisarse
 * - info: Información general sobre operaciones del sistema
 * - debug: Información detallada para debugging (solo en desarrollo)
 */

// Crear directorio de logs antes de inicializar transports
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Formato personalizado para los logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Agregar metadata si existe
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    // Agregar stack trace si es un error
    if (stack) {
      msg += `\n${stack}`;
    }

    return msg;
  })
);

// Configuración de transports (dónde se guardan los logs)
const transports = [
  // Consola - todos los logs según el nivel del entorno
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    ),
  }),

  // Archivo para errores
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Archivo para todos los logs
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Crear el logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports,
  exitOnError: false,
});

/**
 * Métodos específicos para diferentes contextos
 */

// Log de peticiones HTTP (recibe un solo string formateado por Morgan)
logger.http = (message) => {
  logger.log('info', message);
};

// Log de eventos de autenticación
logger.auth = (event, metadata) => {
  logger.info(`AUTH: ${event}`, metadata);
};

// Log de operaciones de base de datos
logger.database = (operation, metadata) => {
  logger.info(`DB: ${operation}`, metadata);
};

// Log de eventos de seguridad
logger.security = (event, metadata) => {
  logger.warn(`SECURITY: ${event}`, metadata);
};

module.exports = logger;
