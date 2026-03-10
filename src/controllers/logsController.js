const { User } = require('../models');
const fileLogService = require('../services/fileLogService');
const { enrichLogsWithUserData, DATE_FORMAT_REGEX } = require('../services/fileLogService');
const { successResponse, errorResponse } = require('../responses/apiResponse');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs');

/**
 * Recibir logs del frontend (batch)
 * POST /api/logs
 */
exports.receiveLogs = async (req, res) => {
  try {
    const { logs, deviceInfo, appVersion } = req.body;
    const userId = req.userId;

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return errorResponse(res, 'No se proporcionaron logs válidos', 400);
    }

    const result = await fileLogService.writeLogs(userId, logs, { deviceInfo, appVersion });

    logger.info(`Recibidos ${result.written} logs del usuario ${userId}`);

    return successResponse(res, result, 'Logs recibidos correctamente');
  } catch (error) {
    logger.error('Error al recibir logs', error);
    return errorResponse(res, 'Error al procesar logs', 500);
  }
};

/**
 * Listar usuarios con logs (solo admin)
 * GET /api/logs/admin/users
 */
exports.getUsersWithLogs = async (req, res) => {
  try {
    const usersWithLogs = await fileLogService.listUsersWithLogs();

    // Obtener info de usuarios desde la BD
    const userIds = usersWithLogs.map(u => u.userId);
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'username', 'email']
    });

    const result = enrichLogsWithUserData(usersWithLogs, users);

    return successResponse(res, { users: result });
  } catch (error) {
    logger.error('Error al listar usuarios con logs', error);
    return errorResponse(res, 'Error al obtener usuarios', 500);
  }
};

/**
 * Listar archivos de log de un usuario (solo admin)
 * GET /api/logs/admin/:userId
 */
exports.listUserLogs = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario existe
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email']
    });

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    const logs = await fileLogService.listUserLogs(userId);

    return successResponse(res, {
      user: { id: user.id, username: user.username, email: user.email },
      logs
    });
  } catch (error) {
    logger.error('Error al listar logs del usuario', error);
    return errorResponse(res, 'Error al obtener logs', 500);
  }
};

/**
 * Ver contenido de un log específico (solo admin)
 * GET /api/logs/admin/:userId/:date
 */
exports.readUserLog = async (req, res) => {
  try {
    const { userId, date } = req.params;

    // Validar formato de fecha
    if (!DATE_FORMAT_REGEX.test(date)) {
      return errorResponse(res, 'Formato de fecha inválido. Usar YYYY-MM-DD', 400);
    }

    const logData = await fileLogService.readLogs(userId, date);

    return successResponse(res, logData);
  } catch (error) {
    logger.error('Error al leer log', error);
    return errorResponse(res, 'Error al leer log', 500);
  }
};

/**
 * Descargar archivo de log (solo admin)
 * GET /api/logs/admin/:userId/:date/download
 */
exports.downloadLog = async (req, res) => {
  try {
    const { userId, date } = req.params;

    // Validar formato de fecha
    if (!DATE_FORMAT_REGEX.test(date)) {
      return errorResponse(res, 'Formato de fecha inválido. Usar YYYY-MM-DD', 400);
    }

    const filePath = fileLogService.getLogFilePath(userId, date);

    if (!fs.existsSync(filePath)) {
      return errorResponse(res, 'Archivo de log no encontrado', 404);
    }

    const filename = `user_${userId}_${date}.log`;
    res.download(filePath, filename);
  } catch (error) {
    logger.error('Error al descargar log', error);
    return errorResponse(res, 'Error al descargar log', 500);
  }
};

/**
 * Limpiar logs antiguos (solo admin)
 * DELETE /api/logs/admin/cleanup
 */
exports.cleanupOldLogs = async (req, res) => {
  try {
    const deleted = await fileLogService.cleanupOldLogs();

    logger.info(`Limpieza de logs: ${deleted} archivos eliminados`);

    return successResponse(res, {
      deleted,
      retentionDays: fileLogService.RETENTION_DAYS
    }, `Se eliminaron ${deleted} archivos de log antiguos`);
  } catch (error) {
    logger.error('Error al limpiar logs', error);
    return errorResponse(res, 'Error al limpiar logs', 500);
  }
};
