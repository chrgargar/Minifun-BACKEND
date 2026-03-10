/**
 * Controladores del panel de administración
 *
 * Maneja autenticación de admins y visualización de logs
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

const { User } = require('../models');
const fileLogService = require('../services/fileLogService');

const STATIC_DIR = path.join(__dirname, '../public/pages/admin');

// Clave para firmar cookies de sesión admin
const ADMIN_SESSION_SECRET = process.env.JWT_SECRET || 'admin-session-secret';

/**
 * GET /admin/logs/login - Página de login
 */
async function showLogin(req, res) {
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

  res.sendFile(path.join(STATIC_DIR, 'login.html'));
}

/**
 * POST /admin/logs/login - Procesar login
 */
async function login(req, res) {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.redirect('/admin/logs/login?error=invalid');
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
      return res.redirect('/admin/logs/login?error=invalid');
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.redirect('/admin/logs/login?error=invalid');
    }

    // Verificar rol admin
    if (!user.is_admin) {
      return res.redirect('/admin/logs/login?error=unauthorized');
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
    res.redirect('/admin/logs/login?error=server');
  }
}

/**
 * GET /admin/logs/logout - Cerrar sesión
 */
async function logout(req, res) {
  res.clearCookie('adminToken');
  res.redirect('/admin/logs/login');
}

/**
 * GET /admin/logs - Panel principal de logs
 */
async function dashboard(req, res) {
  res.sendFile(path.join(STATIC_DIR, 'logs.html'));
}

/**
 * GET /admin/logs/download/:userId/:date - Descargar archivo de log
 */
async function downloadLog(req, res) {
  const { userId, date } = req.params;

  // Validar formato de fecha
  if (!fileLogService.DATE_FORMAT_REGEX.test(date)) {
    return res.status(400).send('Formato de fecha inválido');
  }

  const filePath = fileLogService.getLogFilePath(userId, date);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Archivo no encontrado');
  }

  res.download(filePath, `user_${userId}_${date}.log`);
}

module.exports = { showLogin, login, logout, dashboard, downloadLog };
