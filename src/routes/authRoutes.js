const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { validateRegister, validateLogin, validateProfileUpdate } = require('../middlewares/validators');
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

/**
 * GET /auth/verify-email/:token
 * Muestra página de confirmación de verificación
 *
 * NO verifica directamente - previene que bots de email consuman el token.
 * El usuario debe hacer clic en "Confirmar" para verificar (POST).
 */
router.get(
  '/verify-email/:token',
  authLimiter,
  authController.verifyEmail
);

/**
 * POST /auth/verify-email
 * Confirma la verificación del email (acción real)
 *
 * Se ejecuta cuando el usuario hace clic en "Confirmar verificación"
 */
router.post(
  '/verify-email',
  authLimiter,
  authController.confirmVerifyEmail
);

/**
 * POST /auth/forgot-password
 * Solicitar restablecimiento de contraseña
 *
 * Envía un email con enlace de reset
 * Rate limit: 3 intentos por hora
 */
router.post(
  '/forgot-password',
  registerLimiter, // Mismo límite que registro para prevenir spam
  authController.forgotPassword
);

/**
 * GET /auth/reset-password/:token
 * Mostrar formulario para nueva contraseña
 *
 * Ruta pública
 */
router.get(
  '/reset-password/:token',
  authLimiter,
  authController.showResetPasswordForm
);

/**
 * POST /auth/reset-password
 * Procesar el cambio de contraseña
 *
 * Ruta pública
 */
router.post(
  '/reset-password',
  authLimiter,
  authController.resetPassword
);

/**
 * POST /auth/refresh-token
 * Renovar access token usando refresh token
 *
 * Ruta pública (no requiere JWT, usa refresh token en body)
 * Rate limit: 5 intentos por 15 minutos
 */
router.post(
  '/refresh-token',
  authLimiter,
  authController.refreshToken
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
 * PATCH /auth/profile
 * Actualizar perfil del usuario (username, email)
 *
 * Requiere: Token JWT válido en header Authorization
 */
router.patch(
  '/profile',
  authenticateToken,
  validateProfileUpdate,
  authController.updateProfile
);

/**
 * PUT /auth/avatar
 * Actualizar avatar del usuario (Base64)
 *
 * Requiere: Token JWT válido en header Authorization
 */
router.put(
  '/avatar',
  authenticateToken,
  authController.updateAvatar
);

/**
 * DELETE /auth/avatar
 * Eliminar avatar del usuario
 *
 * Requiere: Token JWT válido en header Authorization
 */
router.delete(
  '/avatar',
  authenticateToken,
  authController.deleteAvatar
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

/**
 * POST /auth/resend-verification
 * Reenviar email de verificación
 *
 * Requiere: Token JWT válido en header Authorization
 * Rate limit: 3 intentos por hora (reutiliza registerLimiter)
 */
router.post(
  '/resend-verification',
  authenticateToken,
  registerLimiter, // Mismo límite que registro para prevenir spam
  authController.resendVerification
);

module.exports = router;
