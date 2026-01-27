/**
 * Middleware global de manejo de errores
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Error de Sequelize - Validación
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Error de Sequelize - Unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'El registro ya existe',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Error de base de datos
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      message: 'Error de base de datos'
    });
  }

  // Error genérico
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
};

/**
 * Middleware para rutas no encontradas
 */
exports.notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
};
