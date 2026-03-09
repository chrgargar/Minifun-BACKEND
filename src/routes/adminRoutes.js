/**
 * Rutas del panel de administración
 *
 * Maneja autenticación de admins y visualización de logs
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { Op } = require('sequelize');

const { User } = require('../models');
const fileLogService = require('../services/fileLogService');

// Vistas
const { generateLoginPage } = require('../views/admin/login');
const { generateLogsPage } = require('../views/admin/logs');

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

    if (!user || user.role !== 'admin') {
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

// ==================== RUTAS DE AUTENTICACIÓN ====================

/**
 * GET /admin/logs/login - Página de login
 */
router.get('/login', (req, res) => {
  // Si ya tiene sesión, redirigir al panel
  const token = req.cookies?.adminToken;
  if (token) {
    try {
      jwt.verify(token, ADMIN_SESSION_SECRET);
      return res.redirect('/admin/logs');
    } catch (e) {
      // Token inválido, continuar al login
    }
  }

  res.send(generateLoginPage());
});

/**
 * POST /admin/logs/login - Procesar login
 */
router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.send(generateLoginPage('Email/usuario y contraseña son requeridos'));
  }

  try {
    // Buscar usuario
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: usernameOrEmail },
          { username: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      return res.send(generateLoginPage('Credenciales incorrectas'));
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.send(generateLoginPage('Credenciales incorrectas'));
    }

    // Verificar rol admin
    if (user.role !== 'admin') {
      return res.send(generateLoginPage('No tienes permisos de administrador'));
    }

    // Crear token de sesión
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      ADMIN_SESSION_SECRET,
      { expiresIn: '24h' }
    );

    // Guardar en cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    res.redirect('/admin/logs');
  } catch (error) {
    console.error('Error en login admin:', error);
    res.send(generateLoginPage('Error interno del servidor'));
  }
});

/**
 * GET /admin/logs/logout - Cerrar sesión
 */
router.get('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.redirect('/admin/logs/login');
});

// ==================== RUTAS DEL PANEL ====================

/**
 * GET /admin/logs - Panel principal de logs
 */
router.get('/', requireAdminSession, async (req, res) => {
  try {
    const { user: userId, date } = req.query;

    // Obtener usuarios con logs
    const usersWithLogs = await fileLogService.listUsersWithLogs();

    // Obtener info de usuarios desde la BD
    const userIds = usersWithLogs.map(u => u.userId);
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'username', 'email']
    });

    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = { username: u.username, email: u.email };
    });

    const usersData = usersWithLogs.map(u => ({
      ...u,
      username: userMap[u.userId]?.username || 'Unknown',
      email: userMap[u.userId]?.email || null
    }));

    let selectedUser = null;
    let logs = null;
    let logContent = null;

    if (userId) {
      const userInfo = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email']
      });

      if (userInfo) {
        selectedUser = {
          userId: userInfo.id,
          username: userInfo.username,
          email: userInfo.email
        };

        logs = await fileLogService.listUserLogs(userId);

        if (date) {
          logContent = await fileLogService.readLogs(userId, date);
        }
      }
    }

    res.send(generateLogsPage(req.adminUser, usersData, selectedUser, logs, logContent));
  } catch (error) {
    console.error('Error en panel admin:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * GET /admin/logs/download/:userId/:date - Descargar archivo de log
 */
router.get('/download/:userId/:date', requireAdminSession, (req, res) => {
  const { userId, date } = req.params;

  // Validar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).send('Formato de fecha inválido');
  }

  const filePath = fileLogService.getLogFilePath(userId, date);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Archivo no encontrado');
  }

  res.download(filePath, `user_${userId}_${date}.log`);
});

module.exports = router;
