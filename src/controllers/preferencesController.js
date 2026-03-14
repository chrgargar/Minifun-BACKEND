const { UserPreferences } = require('../models');
const { successResponse, errorResponse } = require('../responses/apiResponse');
const logger = require('../config/logger');

/**
 * Obtener preferencias del usuario
 */
const getPreferences = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Verificar que el usuario solo acceda a sus propias preferencias
    if (parseInt(userId) !== req.user.id && !req.user.is_admin) {
      return errorResponse(res, 'No autorizado', 403);
    }

    let preferences = await UserPreferences.findOne({
      where: { user_id: userId }
    });

    // Si no existen, crear preferencias por defecto
    if (!preferences) {
      preferences = await UserPreferences.create({
        user_id: userId
      });
    }

    return successResponse(res, preferences, 'Preferencias obtenidas');
  } catch (error) {
    logger.error('Error obteniendo preferencias', error);
    return errorResponse(res, 'Error al obtener preferencias', 500);
  }
};

/**
 * Guardar preferencias completas
 */
const savePreferences = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    if (parseInt(userId) !== req.user.id && !req.user.is_admin) {
      return errorResponse(res, 'No autorizado', 403);
    }

    const {
      theme,
      language,
      avatar,
      musicEnabled,
      effectsEnabled,
      musicVolume,
      effectsVolume
    } = req.body;

    let preferences = await UserPreferences.findOne({
      where: { user_id: userId }
    });

    if (preferences) {
      await preferences.update({
        theme: theme ?? preferences.theme,
        language: language ?? preferences.language,
        avatar: avatar !== undefined ? avatar : preferences.avatar,
        music_enabled: musicEnabled ?? preferences.music_enabled,
        effects_enabled: effectsEnabled ?? preferences.effects_enabled,
        music_volume: musicVolume ?? preferences.music_volume,
        effects_volume: effectsVolume ?? preferences.effects_volume
      });
    } else {
      preferences = await UserPreferences.create({
        user_id: userId,
        theme: theme || 'light',
        language: language || 'es',
        avatar: avatar || null,
        music_enabled: musicEnabled ?? true,
        effects_enabled: effectsEnabled ?? true,
        music_volume: musicVolume ?? 0.7,
        effects_volume: effectsVolume ?? 1.0
      });
    }

    logger.info(`Preferencias guardadas para usuario ${userId}`);
    return successResponse(res, preferences, 'Preferencias guardadas');
  } catch (error) {
    logger.error('Error guardando preferencias', error);
    return errorResponse(res, 'Error al guardar preferencias', 500);
  }
};

/**
 * Actualizar campo específico de preferencias
 */
const updatePreference = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    if (parseInt(userId) !== req.user.id && !req.user.is_admin) {
      return errorResponse(res, 'No autorizado', 403);
    }

    const updates = req.body;
    const allowedFields = [
      'theme', 'language', 'avatar',
      'musicEnabled', 'effectsEnabled',
      'musicVolume', 'effectsVolume'
    ];

    // Mapear camelCase a snake_case
    const fieldMap = {
      musicEnabled: 'music_enabled',
      effectsEnabled: 'effects_enabled',
      musicVolume: 'music_volume',
      effectsVolume: 'effects_volume'
    };

    const dbUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        const dbKey = fieldMap[key] || key;
        dbUpdates[dbKey] = value;
      }
    }

    if (Object.keys(dbUpdates).length === 0) {
      return errorResponse(res, 'No hay campos válidos para actualizar', 400);
    }

    let preferences = await UserPreferences.findOne({
      where: { user_id: userId }
    });

    if (!preferences) {
      preferences = await UserPreferences.create({
        user_id: userId,
        ...dbUpdates
      });
    } else {
      await preferences.update(dbUpdates);
    }

    logger.info(`Preferencia actualizada para usuario ${userId}: ${Object.keys(updates).join(', ')}`);
    return successResponse(res, preferences, 'Preferencia actualizada');
  } catch (error) {
    logger.error('Error actualizando preferencia', error);
    return errorResponse(res, 'Error al actualizar preferencia', 500);
  }
};

module.exports = {
  getPreferences,
  savePreferences,
  updatePreference
};
