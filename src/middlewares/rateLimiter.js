const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Middlewares de rate limiting para prevenir abuso de la API
 *
 * Limita el número de peticiones que un cliente puede hacer en un periodo
 * de tiempo. Esto previene:
 * - Ataques de fuerza bruta en login
 * - Spam de registros
 * - Abuso general de la API
 */

/**
 * Handler personalizado cuando se excede el límite
 */
const rateLimitHandler = (req, res) => {
  logger.security('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
  });

  res.status(429).json({
    success: false,
    message: 'Demasiadas peticiones desde esta IP. Por favor, intenta más tarde.',
  });
};

/**
 * Rate limiter general para toda la API
 *
 * Límite: 100 peticiones por 15 minutos por IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de peticiones
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP. Por favor, intenta más tarde.',
  },
  standardHeaders: true, // Retorna info del rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  handler: rateLimitHandler,
});

/**
 * Rate limiter estricto para autenticación
 *
 * Límite más bajo para prevenir ataques de fuerza bruta
 * Límite: 5 intentos por 15 minutos por IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos de login/registro
  skipSuccessfulRequests: true, // No contar peticiones exitosas
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Rate limiter para registro de usuarios
 *
 * Más restrictivo que el de login para prevenir spam
 * Límite: 3 registros por hora por IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Solo 3 registros por hora
  message: {
    success: false,
    message: 'Demasiados registros desde esta IP. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Rate limiter flexible para desarrollo
 *
 * En desarrollo, los límites son mucho más altos para facilitar testing
 */
const devLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Límite alto para desarrollo
  message: {
    success: false,
    message: 'Rate limit excedido (modo desarrollo)',
  },
});

/**
 * Exporta el limiter apropiado según el entorno
 */
const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  generalLimiter: isDevelopment ? devLimiter : generalLimiter,
  authLimiter: isDevelopment ? devLimiter : authLimiter,
  registerLimiter: isDevelopment ? devLimiter : registerLimiter,
};
