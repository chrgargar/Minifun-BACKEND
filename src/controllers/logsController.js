const { Log, User } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const logger = require('../config/logger');
const { Op } = require('sequelize');

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

    // Preparar logs para inserción masiva
    const logsToInsert = logs.map(log => ({
      user_id: userId,
      level: log.level || 'info',
      message: log.message,
      metadata: log.metadata || null,
      device_info: deviceInfo || null,
      app_version: appVersion || null,
      client_timestamp: log.timestamp ? new Date(log.timestamp) : null
    }));

    // Insertar en batch
    await Log.bulkCreate(logsToInsert);

    logger.info(`Recibidos ${logs.length} logs del usuario ${userId}`);

    return successResponse(res, { received: logs.length }, 'Logs recibidos correctamente');
  } catch (error) {
    logger.error('Error al recibir logs', error);
    return errorResponse(res, 'Error al procesar logs', 500);
  }
};

/**
 * Obtener logs de un usuario específico (solo admin)
 * GET /api/admin/logs/:userId
 */
exports.getUserLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      level,
      startDate,
      endDate,
      page = 1,
      limit = 100,
      search
    } = req.query;

    // Verificar que el usuario existe
    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    // Construir filtros
    const where = { user_id: userId };

    if (level) {
      where.level = level;
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.created_at[Op.lte] = new Date(endDate);
      }
    }

    if (search) {
      where.message = { [Op.like]: `%${search}%` };
    }

    // Calcular offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Obtener logs con paginación
    const { count, rows: logs } = await Log.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return successResponse(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      logs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error al obtener logs del usuario', error);
    return errorResponse(res, 'Error al obtener logs', 500);
  }
};

/**
 * Listar todos los usuarios con sus estadísticas de logs (solo admin)
 * GET /api/admin/logs/users
 */
exports.getUsersWithLogStats = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'created_at', 'last_login'],
      include: [{
        model: Log,
        as: 'logs',
        attributes: []
      }],
      group: ['User.id'],
      raw: true
    });

    // Obtener conteo de logs por usuario
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const logCount = await Log.count({ where: { user_id: user.id } });
      const lastLog = await Log.findOne({
        where: { user_id: user.id },
        order: [['created_at', 'DESC']],
        attributes: ['created_at']
      });

      return {
        ...user,
        logCount,
        lastLogAt: lastLog?.created_at || null
      };
    }));

    return successResponse(res, { users: usersWithStats });
  } catch (error) {
    logger.error('Error al obtener usuarios con estadísticas', error);
    return errorResponse(res, 'Error al obtener usuarios', 500);
  }
};

/**
 * Eliminar logs antiguos (solo admin)
 * DELETE /api/admin/logs/cleanup
 */
exports.cleanupOldLogs = async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));

    const deleted = await Log.destroy({
      where: {
        created_at: { [Op.lt]: cutoffDate }
      }
    });

    logger.info(`Eliminados ${deleted} logs anteriores a ${cutoffDate.toISOString()}`);

    return successResponse(res, {
      deleted,
      cutoffDate: cutoffDate.toISOString()
    }, `Se eliminaron ${deleted} logs antiguos`);
  } catch (error) {
    logger.error('Error al limpiar logs', error);
    return errorResponse(res, 'Error al limpiar logs', 500);
  }
};
