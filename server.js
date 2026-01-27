require('dotenv').config();

const app = require('./src/app');
const { syncDatabase } = require('./src/models');
const logger = require('./src/config/logger');
const { validateConfig } = require('./src/config/validateConfig');
const emailService = require('./src/services/emailService');

const PORT = process.env.PORT || 3000;

/**
 * Iniciar servidor
 *
 * Valida la configuración, sincroniza la base de datos y levanta el servidor Express.
 * Si algo falla en el proceso, el servidor no inicia y se registra el error.
 */
async function startServer() {
  try {
    // 1. Validar configuración antes de iniciar
    logger.info('Validando configuración...');
    validateConfig();

    // 2. Crear directorio de logs si no existe
    const fs = require('fs');
    const logsDir = 'logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
      logger.info('Directorio de logs creado');
    }

    // 3. Sincronizar base de datos
    logger.info('Conectando a base de datos...');
    await syncDatabase();

    // 4. Inicializar servicio de email
    logger.info('Inicializando servicio de email...');
    emailService.initialize();

    // Verificar conexión con servidor SMTP (opcional, no bloqueante)
    emailService.verifyConnection().catch(err => {
      logger.warn('No se pudo verificar la conexión con el servidor SMTP', err);
    });

    // 5. Iniciar servidor Express
    app.listen(PORT, () => {
      logger.info('═══════════════════════════════════════════════════');
      logger.info(`🚀 Servidor MINIFUN corriendo en puerto ${PORT}`);
      logger.info(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 URL: http://localhost:${PORT}`);
      logger.info(`📚 Health Check: http://localhost:${PORT}/api/health`);
      logger.info('═══════════════════════════════════════════════════\n');
    });

  } catch (error) {
    logger.error('Error fatal al iniciar servidor', error);
    process.exit(1);
  }
}

startServer();

/**
 * Manejo de errores no capturados
 *
 * Estos handlers previenen que el proceso termine abruptamente sin logging.
 * En producción, aquí se podría integrar con servicios de monitoreo como Sentry.
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

/**
 * Manejo de señales de terminación
 *
 * Permite un shutdown graceful del servidor, cerrando conexiones activas
 * antes de terminar el proceso
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor gracefully');
  process.exit(0);
});
