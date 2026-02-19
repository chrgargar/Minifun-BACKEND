const { Sequelize } = require('sequelize');
const config = require('../config/database');
const logger = require('../config/logger');

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    dialectOptions: config.dialectOptions,
    logging: config.logging,
    pool: config.pool
  }
);

const User = require('./User')(sequelize);

// Función para sincronizar base de datos
async function syncDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a MySQL establecida correctamente');

    // sync() sin alter: la tabla ya existe con todas las columnas necesarias.
    // alter: true causaba índices duplicados que superaban el límite de MySQL (64 keys).
    await sequelize.sync();
    logger.info('Modelos sincronizados correctamente');
  } catch (error) {
    logger.error('Error al conectar con MySQL', error);
    process.exit(1);
  }
}

module.exports = {
  sequelize,
  User,
  syncDatabase
};
