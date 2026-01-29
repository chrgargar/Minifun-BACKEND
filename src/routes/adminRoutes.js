const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const bcrypt = require('bcryptjs');

// Clave secreta para proteger los endpoints (cambia esto)
const ADMIN_KEY = 'minifun-admin-2026';

// Middleware de autenticación admin
const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== ADMIN_KEY) {
    return errorResponse(res, 'No autorizado', 401);
  }
  next();
};

/**
 * GET /api/admin/users
 * Ver todos los usuarios
 * Uso: https://backend-minifun.onrender.com/api/admin/users?key=minifun-admin-2026
 */
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'email_verified', 'is_premium', 'created_at', 'last_login', 'password_reset_token', 'password_reset_expires']
    });
    return successResponse(res, { users, count: users.length });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

/**
 * GET /api/admin/user/:email
 * Ver un usuario específico por email
 * Uso: https://backend-minifun.onrender.com/api/admin/user/test@test.com?key=minifun-admin-2026
 */
router.get('/user/:email', adminAuth, async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.params.email }
    });
    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }
    return successResponse(res, { user });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

/**
 * POST /api/admin/reset-password
 * Cambiar contraseña de un usuario manualmente
 * Body: { "email": "user@test.com", "newPassword": "123456" }
 */
router.post('/reset-password', adminAuth, async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return errorResponse(res, 'Email y newPassword son requeridos', 400);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    // Hashear y guardar nueva contraseña
    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await user.save();

    return successResponse(res, {
      message: 'Contraseña actualizada',
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

/**
 * DELETE /api/admin/user/:id
 * Eliminar un usuario
 */
router.delete('/user/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }
    await user.destroy();
    return successResponse(res, { message: 'Usuario eliminado', id: req.params.id });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

module.exports = router;
