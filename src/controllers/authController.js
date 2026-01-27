const { User } = require('../models');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const logger = require('../config/logger');

/**
 * POST /auth/register
 * Registro de nuevo usuario
 *
 * Crea una nueva cuenta de usuario, hashea la contraseña y genera un JWT.
 * El hash de la contraseña es manejado automáticamente por el hook de Sequelize.
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    logger.auth('Intento de registro', { username, email: email || 'sin email', ip: req.ip });

    // Validaciones (ya hechas por middleware pero doble verificación)
    if (!username || !password) {
      return errorResponse(res, 'Username y password son requeridos', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'La contraseña debe tener al menos 6 caracteres', 400);
    }

    if (username.length < 3) {
      return errorResponse(res, 'El username debe tener al menos 3 caracteres', 400);
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      where: { username }
    });

    if (existingUser) {
      return errorResponse(res, 'El nombre de usuario ya está en uso', 409);
    }

    // Verificar email si se proporcionó
    if (email) {
      const existingEmail = await User.findOne({
        where: { email }
      });

      if (existingEmail) {
        return errorResponse(res, 'El email ya está en uso', 409);
      }
    }

    // Crear usuario (el hook beforeCreate hashea automáticamente la contraseña)
    const user = await User.create({
      username,
      email: email || null,
      password_hash: password,
      is_guest: false,
      last_login: new Date()
    });

    logger.auth('Usuario registrado exitosamente', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });

    // Generar JWT para autenticación inmediata post-registro
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return successResponse(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_premium: user.is_premium,
        created_at: user.created_at,
        last_login: user.last_login,
        streak_days: user.streak_days
      }
    }, 'Usuario registrado exitosamente', 201);

  } catch (error) {
    logger.error('Error en registro', { username, error: error.message });
    next(error);
  }
};

/**
 * POST /auth/login
 * Inicio de sesión
 *
 * Autentica al usuario verificando las credenciales y genera un JWT.
 * Por seguridad, no revela si el error fue por username o contraseña incorrecta.
 */
exports.login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;

    logger.auth('Intento de login', { usernameOrEmail, ip: req.ip });

    if (!usernameOrEmail || !password) {
      return errorResponse(res, 'Username/Email y password son requeridos', 400);
    }

    // Buscar usuario por username o email
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      logger.security('Login fallido - usuario no encontrado', { usernameOrEmail, ip: req.ip });
      // No revelar si el usuario existe o no por seguridad
      return errorResponse(res, 'Credenciales incorrectas', 401);
    }

    // Verificar contraseña usando bcrypt
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      logger.security('Login fallido - contraseña incorrecta', {
        userId: user.id,
        username: user.username,
        ip: req.ip
      });
      return errorResponse(res, 'Credenciales incorrectas', 401);
    }

    // Actualizar último login para tracking de actividad
    user.last_login = new Date();
    await user.save();

    // Generar JWT para mantener la sesión del usuario
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    logger.auth('Login exitoso', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });

    return successResponse(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_premium: user.is_premium,
        created_at: user.created_at,
        last_login: user.last_login,
        streak_days: user.streak_days
      }
    }, 'Login exitoso');

  } catch (error) {
    logger.error('Error en login', { usernameOrEmail, error: error.message });
    next(error);
  }
};

/**
 * GET /auth/me
 * Obtener información del usuario autenticado
 */
exports.getMe = async (req, res, next) => {
  try {
    // req.userId viene del middleware de autenticación
    const user = await User.findByPk(req.userId);

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    return successResponse(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_premium: user.is_premium,
        created_at: user.created_at,
        last_login: user.last_login,
        streak_days: user.streak_days
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 * Cerrar sesión (opcional con JWT)
 * En JWT stateless, el logout es manejado por el cliente eliminando el token
 * Este endpoint es simbólico o puede usarse para blacklist de tokens
 */
exports.logout = async (req, res, next) => {
  try {
    // Actualización opcional del último login
    if (req.userId) {
      await User.update(
        { last_login: new Date() },
        { where: { id: req.userId } }
      );
    }

    return successResponse(res, null, 'Logout exitoso');
  } catch (error) {
    next(error);
  }
};
