require('dotenv').config();
const logger = require('./logger');

/**
 * Configuración de conexión a MySQL usando Sequelize
 *
 * Define los parámetros de conexión y opciones de pool para
 * gestionar eficientemente las conexiones a la base de datos.
 */

module.exports = {
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'minifun',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dialect: 'mysql',

  // Logging: usa winston en lugar de console.log para mejor trazabilidad
  logging: process.env.NODE_ENV === 'development'
    ? (msg) => logger.debug(`DB: ${msg}`)
    : false,

  // Pool de conexiones: reutiliza conexiones existentes en lugar de crear nuevas
  // Esto mejora el rendimiento y reduce la carga en el servidor MySQL
  pool: {
    max: 5, // Máximo de conexiones simultáneas
    min: 0, // Mínimo de conexiones en idle
    acquire: 30000, // Tiempo máximo (ms) para obtener una conexión antes de error
    idle: 10000, // Tiempo máximo (ms) que una conexión puede estar idle antes de liberarse
  },
};
