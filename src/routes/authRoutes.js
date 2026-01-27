const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { validateRegister, validateLogin } = require('../middlewares/validators');
const { authLimiter, registerLimiter } = require('../middlewares/rateLimiter');

/**
 * Rutas de autenticación
 *
 * Todas las rutas públicas tienen rate limiting estricto para prevenir:
 * - Ataques de fuerza bruta en login
 * - Spam de registros
 * - Enumeración de usuarios
 */

// ==================== RUTAS PÚBLICAS ====================

/**
 * POST /auth/register
 * Registro de nuevo usuario
 *
 * Rate limit: 3 registros por hora
 * Validaciones: username, email (opcional), password
 */
router.post(
  '/register',
  registerLimiter, // Rate limiting más estricto para registros
  validateRegister,
  authController.register
);

/**
 * POST /auth/login
 * Inicio de sesión con username/email y contraseña
 *
 * Rate limit: 5 intentos por 15 minutos
 * Solo cuenta intentos fallidos
 */
router.post(
  '/login',
  authLimiter,
  validateLogin,
  authController.login
);

// ==================== RUTAS PROTEGIDAS ====================

/**
 * GET /auth/me
 * Obtener información del usuario autenticado
 *
 * Requiere: Token JWT válido en header Authorization
 */
router.get(
  '/me',
  authenticateToken,
  authController.getMe
);

/**
 * POST /auth/logout
 * Cerrar sesión
 *
 * Requiere: Token JWT válido en header Authorization
 * Nota: Con JWT stateless, el logout es principalmente del lado del cliente
 */
router.post(
  '/logout',
  authenticateToken,
  authController.logout
);

module.exports = router;
