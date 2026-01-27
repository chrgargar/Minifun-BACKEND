const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool
  }
);

const User = require('./User')(sequelize);

// Función para sincronizar base de datos
async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente.');

    // Sincronizar modelos (alter: true actualiza sin borrar datos)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados correctamente.');
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error);
    process.exit(1);
  }
}

module.exports = {
  sequelize,
  User,
  syncDatabase
};
