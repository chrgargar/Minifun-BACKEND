const { GameProgress } = require('../models');
const { successResponse, errorResponse } = require('../responses/apiResponse');
const logger = require('../config/logger');

/**
 * Obtener todos los progresos del usuario autenticado
 */
const getAllProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const progress = await GameProgress.findAll({
      where: { user_id: userId },
      order: [['last_played_at', 'DESC']]
    });

    return successResponse(res, progress, 'Progreso obtenido');
  } catch (error) {
    logger.error('Error obteniendo progreso', error);
    return errorResponse(res, 'Error al obtener progreso', 500);
  }
};

/**
 * Obtener progreso de un juego específico
 */
const getProgressByType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameType } = req.params;

    const progress = await GameProgress.findOne({
      where: { user_id: userId, game_type: gameType }
    });

    if (!progress) {
      return successResponse(res, null, 'Sin progreso para este juego');
    }

    return successResponse(res, progress, 'Progreso obtenido');
  } catch (error) {
    logger.error('Error obteniendo progreso por tipo', error);
    return errorResponse(res, 'Error al obtener progreso', 500);
  }
};

/**
 * Guardar o actualizar progreso de un juego
 */
const saveProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      gameType,
      currentLevel,
      highestLevel,
      totalGamesPlayed,
      lastPlayedAt,
      customData
    } = req.body;

    if (!gameType) {
      return errorResponse(res, 'gameType es requerido', 400);
    }

    // Buscar progreso existente
    let progress = await GameProgress.findOne({
      where: { user_id: userId, game_type: gameType }
    });

    if (progress) {
      // Actualizar solo si el nuevo nivel es mayor o igual
      const newHighest = Math.max(progress.highest_level, highestLevel || 1);

      await progress.update({
        current_level: currentLevel || progress.current_level,
        highest_level: newHighest,
        total_games_played: totalGamesPlayed || progress.total_games_played,
        last_played_at: lastPlayedAt || new Date(),
        custom_data: customData || progress.custom_data
      });

      logger.info(`Progreso actualizado: ${gameType} para usuario ${userId}`);
    } else {
      // Crear nuevo progreso
      progress = await GameProgress.create({
        user_id: userId,
        game_type: gameType,
        current_level: currentLevel || 1,
        highest_level: highestLevel || 1,
        total_games_played: totalGamesPlayed || 0,
        last_played_at: lastPlayedAt || new Date(),
        custom_data: customData || {}
      });

      logger.info(`Nuevo progreso creado: ${gameType} para usuario ${userId}`);
    }

    return successResponse(res, progress, 'Progreso guardado');
  } catch (error) {
    logger.error('Error guardando progreso', error);
    return errorResponse(res, 'Error al guardar progreso', 500);
  }
};

/**
 * Eliminar progreso de un juego
 */
const deleteProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameType } = req.params;

    const deleted = await GameProgress.destroy({
      where: { user_id: userId, game_type: gameType }
    });

    if (deleted === 0) {
      return errorResponse(res, 'Progreso no encontrado', 404);
    }

    logger.info(`Progreso eliminado: ${gameType} para usuario ${userId}`);
    return successResponse(res, null, 'Progreso eliminado');
  } catch (error) {
    logger.error('Error eliminando progreso', error);
    return errorResponse(res, 'Error al eliminar progreso', 500);
  }
};

module.exports = {
  getAllProgress,
  getProgressByType,
  saveProgress,
  deleteProgress
};
