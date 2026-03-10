/**
 * AuthService - Lógica de negocio de autenticación
 *
 * Centraliza la lógica repetida de authController:
 * - Proyección de usuario para respuestas
 * - Cálculo de streak de días consecutivos
 * - Generación de JWT
 * - Queries de búsqueda de usuario
 */

const { User } = require('../models');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { Op } = require('sequelize');

/**
 * Formatea un usuario para respuesta pública (sin datos sensibles)
 * Reemplaza las 7 proyecciones duplicadas en authController
 */
const formatUserResponse = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  email_verified: user.email_verified,
  is_premium: user.is_premium,
  is_admin: user.is_admin,
  created_at: user.created_at,
  last_login: user.last_login,
  streak_days: user.streak_days
});

/**
 * Calcula y actualiza el streak de días consecutivos
 * Extrae la lógica de las líneas 182-197 de authController.login()
 *
 * @param {User} user - Instancia del modelo User
 * @returns {number} - El nuevo valor de streak_days
 */
const calculateStreak = (user) => {
  const now = new Date();
  const lastLogin = user.last_login ? new Date(user.last_login) : null;

  if (lastLogin) {
    const lastDay = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.streak_days = (user.streak_days || 0) + 1;
    } else if (diffDays > 1) {
      user.streak_days = 1;
    }
    // Si diffDays === 0 (mismo día), no cambiar streak
  } else {
    user.streak_days = 1;
  }

  return user.streak_days;
};

/**
 * Genera un JWT access token para el usuario
 * Reemplaza las 3 generaciones duplicadas en authController
 *
 * @param {User} user - Instancia del modelo User
 * @returns {string} - JWT token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

/**
 * Busca un usuario por username
 * @param {string} username
 * @returns {Promise<User|null>}
 */
const findByUsername = async (username) => {
  return User.findOne({ where: { username } });
};

/**
 * Busca un usuario por email
 * @param {string} email
 * @returns {Promise<User|null>}
 */
const findByEmail = async (email) => {
  return User.findOne({ where: { email } });
};

/**
 * Busca un usuario por username O email
 * @param {string} identifier - username o email
 * @returns {Promise<User|null>}
 */
const findByUsernameOrEmail = async (identifier) => {
  return User.findOne({
    where: {
      [Op.or]: [
        { username: identifier },
        { email: identifier }
      ]
    }
  });
};

/**
 * Verifica si un username ya está en uso
 * @param {string} username
 * @param {number} [excludeUserId] - ID de usuario a excluir (para updates)
 * @returns {Promise<boolean>}
 */
const isUsernameTaken = async (username, excludeUserId = null) => {
  const whereClause = { username };
  if (excludeUserId) {
    whereClause.id = { [Op.ne]: excludeUserId };
  }
  const existing = await User.findOne({ where: whereClause });
  return !!existing;
};

/**
 * Verifica si un email ya está en uso
 * @param {string} email
 * @param {number} [excludeUserId] - ID de usuario a excluir (para updates)
 * @returns {Promise<boolean>}
 */
const isEmailTaken = async (email, excludeUserId = null) => {
  const whereClause = { email };
  if (excludeUserId) {
    whereClause.id = { [Op.ne]: excludeUserId };
  }
  const existing = await User.findOne({ where: whereClause });
  return !!existing;
};

/**
 * Busca un usuario por ID
 * @param {number} userId
 * @returns {Promise<User|null>}
 */
const findById = async (userId) => {
  return User.findByPk(userId);
};

/**
 * Busca un usuario por token de verificación
 * @param {string} token
 * @returns {Promise<User|null>}
 */
const findByVerificationToken = async (token) => {
  return User.findOne({ where: { verification_token: token } });
};

/**
 * Busca un usuario por token de reset de contraseña
 * @param {string} token
 * @returns {Promise<User|null>}
 */
const findByPasswordResetToken = async (token) => {
  return User.findOne({ where: { password_reset_token: token } });
};

/**
 * Busca un usuario por refresh token
 * @param {string} refreshToken
 * @returns {Promise<User|null>}
 */
const findByRefreshToken = async (refreshToken) => {
  return User.findOne({ where: { refresh_token: refreshToken } });
};

/**
 * Invalida el refresh token de un usuario
 * @param {number} userId
 * @returns {Promise<void>}
 */
const invalidateRefreshToken = async (userId) => {
  await User.update(
    { refresh_token: null, refresh_token_expires: null },
    { where: { id: userId } }
  );
};

module.exports = {
  formatUserResponse,
  calculateStreak,
  generateAccessToken,
  findByUsername,
  findByEmail,
  findByUsernameOrEmail,
  isUsernameTaken,
  isEmailTaken,
  findById,
  findByVerificationToken,
  findByPasswordResetToken,
  findByRefreshToken,
  invalidateRefreshToken
};
