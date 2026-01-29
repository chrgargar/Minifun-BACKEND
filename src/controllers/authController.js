const { User } = require('../models');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const logger = require('../config/logger');
const emailService = require('../services/emailService');
const { getVerificationSuccessPage, getVerificationErrorPage } = require('../templates/verificationPage');

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
        // Si el email existe pero NO está verificado, eliminar ese usuario
        // para permitir que otro se registre con el mismo email
        if (!existingEmail.email_verified) {
          logger.auth('Eliminando usuario con email no verificado para permitir nuevo registro', {
            oldUserId: existingEmail.id,
            oldUsername: existingEmail.username,
            email: email
          });
          await existingEmail.destroy();
        } else {
          // El email está verificado, no se puede usar
          return errorResponse(res, 'El email ya está en uso', 409);
        }
      }
    }

    // Crear usuario (el hook beforeCreate hashea automáticamente la contraseña)
    const user = await User.create({
      username,
      email: email || null,
      password_hash: password,
      is_guest: false,
      last_login: new Date(),
      email_verified: false
    });

    // Si se proporcionó email, generar token de verificación y enviar correo
    if (email) {
      const verificationToken = user.generateVerificationToken();
      await user.save();

      const emailSent = await emailService.sendVerificationEmail(user, verificationToken);

      if (emailSent) {
        logger.auth('Email de verificación enviado', {
          userId: user.id,
          email: user.email
        });
      } else {
        logger.warn('No se pudo enviar email de verificación', {
          userId: user.id,
          email: user.email
        });
      }
    }

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
        email_verified: user.email_verified,
        is_premium: user.is_premium,
        created_at: user.created_at,
        last_login: user.last_login,
        streak_days: user.streak_days
      }
    }, email ? 'Usuario registrado. Verifica tu email para activar tu cuenta.' : 'Usuario registrado exitosamente', 201);

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
        email_verified: user.email_verified,
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
        email_verified: user.email_verified,
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

/**
 * GET /auth/verify-email/:token
 * Verificar email del usuario con el token recibido por correo
 * Devuelve una página HTML bonita en lugar de JSON
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send(getVerificationErrorPage('Token de verificación requerido'));
    }

    logger.auth('Intento de verificación de email', { token: token.substring(0, 10) + '...', ip: req.ip });

    // Buscar usuario por token de verificación
    const user = await User.findOne({
      where: { verification_token: token }
    });

    if (!user) {
      logger.security('Token de verificación inválido', { token: token.substring(0, 10) + '...', ip: req.ip });
      return res.status(400).send(getVerificationErrorPage('Token de verificación inválido o expirado'));
    }

    // Verificar si el token es válido y no ha expirado
    if (!user.isVerificationTokenValid(token)) {
      logger.security('Token de verificación expirado', {
        userId: user.id,
        username: user.username,
        ip: req.ip
      });
      return res.status(400).send(getVerificationErrorPage('El token de verificación ha expirado. Solicita un nuevo correo de verificación desde la app.'));
    }

    // Verificar el email del usuario
    user.email_verified = true;
    user.verification_token = null;
    user.verification_token_expires = null;
    await user.save();

    logger.auth('Email verificado exitosamente', {
      userId: user.id,
      username: user.username,
      email: user.email,
      ip: req.ip
    });

    // Devolver página HTML de éxito
    return res.status(200).send(getVerificationSuccessPage(user.username));

  } catch (error) {
    logger.error('Error en verificación de email', { error: error.message });
    return res.status(500).send(getVerificationErrorPage('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.'));
  }
};

/**
 * POST /auth/resend-verification
 * Reenviar email de verificación
 * Requiere autenticación JWT
 */
exports.resendVerification = async (req, res, next) => {
  try {
    // req.userId viene del middleware de autenticación
    const user = await User.findByPk(req.userId);

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    // Verificar si el usuario ya tiene email verificado
    if (user.email_verified) {
      return errorResponse(res, 'Tu email ya está verificado', 400);
    }

    // Verificar si el usuario tiene email registrado
    if (!user.email) {
      return errorResponse(res, 'No tienes un email registrado. Actualiza tu perfil primero.', 400);
    }

    logger.auth('Solicitud de reenvío de verificación', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    // Generar nuevo token de verificación
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Enviar email de verificación
    const emailSent = await emailService.sendVerificationEmail(user, verificationToken);

    if (!emailSent) {
      logger.error('Error al enviar email de verificación', {
        userId: user.id,
        email: user.email
      });
      return errorResponse(res, 'No se pudo enviar el email de verificación. Inténtalo más tarde.', 500);
    }

    logger.auth('Email de verificación reenviado', {
      userId: user.id,
      email: user.email
    });

    return successResponse(res, null, 'Email de verificación enviado. Revisa tu bandeja de entrada.');

  } catch (error) {
    logger.error('Error al reenviar verificación', { error: error.message });
    next(error);
  }
};
