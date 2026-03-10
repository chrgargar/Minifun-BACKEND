/**
 * API endpoints para el panel de administración
 * Estas rutas devuelven JSON para ser consumidas por el frontend estático
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const fileLogService = require('../services/fileLogService');
const { successResponse, errorResponse } = require('../responses/apiResponse');

const ADMIN_SESSION_SECRET = process.env.JWT_SECRET || 'minifun-admin-secret';

/**
 * Middleware para verificar sesión de admin via cookie
 */
const requireAdminApi = async (req, res, next) => {
  try {
    const token = req.cookies.adminToken;
    if (!token) {
      return errorResponse(res, 'No autenticado', 401);
    }

    const decoded = jwt.verify(token, ADMIN_SESSION_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_admin) {
      return errorResponse(res, 'Acceso denegado', 403);
    }

    req.adminUser = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Sesión inválida', 401);
  }
};

/**
 * GET /api/admin/me
 * Obtener información del admin actual
 */
router.get('/me', requireAdminApi, (req, res) => {
  return successResponse(res, {
    id: req.adminUser.id,
    username: req.adminUser.username,
    email: req.adminUser.email
  });
});

/**
 * GET /api/admin/users
 * Listar usuarios con logs
 */
router.get('/users', requireAdminApi, async (req, res) => {
  try {
    const usersWithLogs = await fileLogService.listUsersWithLogs();
    const userIds = usersWithLogs.map(u => u.userId);

    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'username', 'email']
    });

    const enrichedUsers = fileLogService.enrichLogsWithUserData(usersWithLogs, users);

    return successResponse(res, { users: enrichedUsers });
  } catch (error) {
    return errorResponse(res, 'Error al obtener usuarios', 500);
  }
});

/**
 * GET /api/admin/logs/:userId
 * Listar fechas de logs disponibles para un usuario
 */
router.get('/logs/:userId', requireAdminApi, async (req, res) => {
  try {
    const { userId } = req.params;

    // Obtener info del usuario
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email']
    });

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    // Obtener lista de logs
    const logs = await fileLogService.listUserLogs(userId);

    return successResponse(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      logs
    });
  } catch (error) {
    return errorResponse(res, 'Error al obtener logs', 500);
  }
});

/**
 * GET /api/admin/logs/:userId/:date
 * Obtener contenido de un log específico
 */
router.get('/logs/:userId/:date', requireAdminApi, async (req, res) => {
  try {
    const { userId, date } = req.params;

    // Validar formato de fecha
    if (!fileLogService.DATE_FORMAT_REGEX.test(date)) {
      return errorResponse(res, 'Formato de fecha inválido. Use YYYY-MM-DD', 400);
    }

    const logContent = await fileLogService.readLog(userId, date);

    if (!logContent) {
      return errorResponse(res, 'Log no encontrado', 404);
    }

    return successResponse(res, {
      date,
      lines: logContent.split('\n')
    });
  } catch (error) {
    return errorResponse(res, 'Error al leer log', 500);
  }
});

/**
 * GET /api/admin/logs/:userId/:date/download
 * Descargar archivo de log
 */
router.get('/logs/:userId/:date/download', requireAdminApi, async (req, res) => {
  try {
    const { userId, date } = req.params;
    const fs = require('fs');

    if (!fileLogService.DATE_FORMAT_REGEX.test(date)) {
      return errorResponse(res, 'Formato de fecha inválido', 400);
    }

    const filePath = fileLogService.getLogFilePath(userId, date);

    if (!fs.existsSync(filePath)) {
      return errorResponse(res, 'Archivo no encontrado', 404);
    }

    res.download(filePath, `user-${userId}-${date}.log`);
  } catch (error) {
    return errorResponse(res, 'Error al descargar', 500);
  }
});

module.exports = router;
