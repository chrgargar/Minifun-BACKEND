const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { errorResponse } = require('../utils/responseUtils');
const { User } = require('../models');

/**
 * Middleware para verificar JWT
 */
exports.authenticateToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return errorResponse(res, 'Token de acceso no proporcionado', 401);
    }

    // Verificar token
    jwt.verify(token, jwtConfig.secret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return errorResponse(res, 'Token expirado', 401);
        }
        return errorResponse(res, 'Token inválido', 403);
      }

      // Agregar userId al request para usarlo en controladores
      req.userId = decoded.userId;
      req.username = decoded.username;
      next();
    });

  } catch (error) {
    return errorResponse(res, 'Error al autenticar token', 500);
  }
};

/**
 * Middleware opcional para rutas que pueden o no estar autenticadas
 */
exports.optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continuar sin autenticación
    }

    jwt.verify(token, jwtConfig.secret, (err, decoded) => {
      if (!err) {
        req.userId = decoded.userId;
        req.username = decoded.username;
      }
      next();
    });

  } catch (error) {
    next();
  }
};

/**
 * Middleware para verificar que el usuario es admin
 * Debe usarse DESPUÉS de authenticateToken
 */
exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    if (user.role !== 'admin') {
      return errorResponse(res, 'Acceso denegado. Se requiere rol de administrador', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Error al verificar permisos', 500);
  }
};
