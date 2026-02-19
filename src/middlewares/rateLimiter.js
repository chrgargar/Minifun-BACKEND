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

  const accept = req.headers['accept'] || '';
  if (accept.includes('text/html')) {
    return res.status(429).send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demasiadas peticiones - MINIFUN</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .container { max-width: 500px; margin: 20px; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; color: #333; }
    .content p { font-size: 16px; line-height: 1.6; }
    .warning { margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; font-size: 14px; color: #856404; text-align: left; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MINIFUN</h1>
    </div>
    <div class="content">
      <p style="font-size: 48px; margin: 0;">⏳</p>
      <h2 style="color: #667eea;">Demasiadas peticiones</h2>
      <p>Has realizado demasiadas peticiones desde esta IP. Por favor, espera unos minutos antes de intentarlo de nuevo.</p>
      <div class="warning">
        <strong>Consejo:</strong> Espera unos minutos y vuelve a intentarlo.
      </div>
    </div>
  </div>
</body>
</html>
    `);
  }

  res.status(429).json({
    success: false,
    message: 'Demasiadas peticiones desde esta IP. Por favor, intenta más tarde.',
  });
};

/**
 * Rate limiter general para toda la API
 *
 * Límite: 100 peticiones por 5 minutos por IP
 */
const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Rate limiter estricto para autenticación
 *
 * Límite más bajo para prevenir ataques de fuerza bruta
 * Límite: 5 intentos por 5 minutos por IP
 */
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
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
  windowMs: 60 * 60 * 1000,
  max: 3,
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
  max: 1000,
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
