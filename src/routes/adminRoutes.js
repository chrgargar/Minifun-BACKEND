/**
 * Rutas del panel de administración
 *
 * Maneja autenticación de admins y visualización de logs
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { User } = require('../models');
const adminController = require('../controllers/adminController');

// Clave para firmar cookies de sesión admin
const ADMIN_SESSION_SECRET = process.env.JWT_SECRET || 'admin-session-secret';

// ==================== MIDDLEWARE ====================

/**
 * Middleware para verificar sesión de admin
 */
async function requireAdminSession(req, res, next) {
  const token = req.cookies?.adminToken;

  if (!token) {
    return res.redirect('/admin/logs/login');
  }

  try {
    const decoded = jwt.verify(token, ADMIN_SESSION_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_admin) {
      res.clearCookie('adminToken');
      return res.redirect('/admin/logs/login');
    }

    req.adminUser = user;
    next();
  } catch (error) {
    res.clearCookie('adminToken');
    return res.redirect('/admin/logs/login');
  }
}

// ==================== RUTAS ====================

router.get('/login', adminController.showLogin);
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);
router.get('/', requireAdminSession, adminController.dashboard);
router.get('/download/:userId/:date', requireAdminSession, adminController.downloadLog);

module.exports = router;
