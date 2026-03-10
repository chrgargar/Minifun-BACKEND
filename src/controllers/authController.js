const { User } = require('../models');
const { successResponse, errorResponse } = require('../responses/apiResponse');
const logger = require('../config/logger');
const emailService = require('../services/emailService');
const authService = require('../services/authService');

// Helpers para redirección a páginas estáticas
const redirectToVerifyError = (res, message) =>
  res.redirect(`/pages/verify-error.html?error=${encodeURIComponent(message)}`);
const redirectToVerifySuccess = (res, username) =>
  res.redirect(`/pages/verify-success.html?username=${encodeURIComponent(username)}`);
const redirectToVerifyConfirm = (res, token) =>
  res.redirect(`/pages/verify-confirm.html?token=${encodeURIComponent(token)}`);
const redirectToResetForm = (res, token, error = null) =>
  res.redirect(`/pages/reset-password.html?token=${encodeURIComponent(token)}${error ? '&error=' + encodeURIComponent(error) : ''}`);
const redirectToResetSuccess = (res, username) =>
  res.redirect(`/pages/reset-success.html?username=${encodeURIComponent(username)}`);
const redirectToResetError = (res, message) =>
  res.redirect(`/pages/reset-error.html?error=${encodeURIComponent(message)}`);

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

    // Verificar si el usuario ya existe
    if (await authService.isUsernameTaken(username)) {
      return errorResponse(res, 'El nombre de usuario ya está en uso', 409);
    }

    // Verificar email si se proporcionó
    if (email) {
      const existingEmail = await authService.findByEmail(email);

      if (existingEmail) {
        if (existingEmail.email_verified) {
          // El email está verificado, no se puede usar
          return errorResponse(res, 'El email ya está en uso', 409);
        }

        // El email existe pero no está verificado.
        // Solo permitir re-registro si el token de verificación ha expirado
        // (es decir, el usuario original ya tuvo su oportunidad de verificar).
        const tokenExpired = !existingEmail.verification_token_expires ||
          new Date() > new Date(existingEmail.verification_token_expires);

        if (!tokenExpired) {
          // El token sigue vigente: el usuario original puede verificarse todavía
          return errorResponse(res, 'El email ya está en uso', 409);
        }

        // Token expirado: el registro anterior quedó abandonado, se puede reclamar el email
        logger.auth('Eliminando usuario con token de verificación expirado para permitir nuevo registro', {
          oldUserId: existingEmail.id,
          oldUsername: existingEmail.username,
          email: email
        });
        await existingEmail.destroy();
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

    // Generar JWT (access token) para autenticación inmediata post-registro
    const token = authService.generateAccessToken(user);

    // Generar refresh token para renovación sin re-login
    const refreshToken = user.generateRefreshToken();
    await user.save();

    return successResponse(res, {
      token,
      refreshToken,
      user: authService.formatUserResponse(user)
    }, email ? 'Usuario registrado. Verifica tu email para activar tu cuenta.' : 'Usuario registrado exitosamente', 201);

  } catch (error) {
    logger.error('Error en registro', { error: error.message });
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
    const user = await authService.findByUsernameOrEmail(usernameOrEmail);

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

    // Calcular racha de días consecutivos
    authService.calculateStreak(user);

    // Actualizar último login y generar refresh token
    user.last_login = new Date();
    const refreshToken = user.generateRefreshToken();
    await user.save();

    // Generar JWT (access token)
    const token = authService.generateAccessToken(user);

    logger.auth('Login exitoso', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });

    return successResponse(res, {
      token,
      refreshToken,
      user: authService.formatUserResponse(user)
    }, 'Login exitoso');

  } catch (error) {
    logger.error('Error en login', { error: error.message });
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
    const user = await authService.findById(req.userId);

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    return successResponse(res, {
      user: authService.formatUserResponse(user)
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 * Cerrar sesión - invalida el refresh token del usuario
 */
exports.logout = async (req, res, next) => {
  try {
    if (req.userId) {
      await authService.invalidateRefreshToken(req.userId);
    }

    return successResponse(res, null, 'Logout exitoso');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/verify-email/:token
 * Muestra página de confirmación de verificación
 *
 * NO verifica el email directamente. Esto previene que bots de email
 * (link preview, escaneo de seguridad) consuman el token antes de que
 * el usuario haga clic. La verificación real ocurre en el POST.
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return redirectToVerifyError(res, 'Token de verificación requerido');
    }

    logger.auth('Página de confirmación de verificación', {
      tokenPrefix: token.substring(0, 10) + '...',
      ip: req.ip,
    });

    // Verificar que el token existe (sin consumirlo)
    const user = await authService.findByVerificationToken(token);

    if (!user) {
      return redirectToVerifyError(res, 'Token de verificación inválido o expirado');
    }

    if (!user.isVerificationTokenValid(token)) {
      return redirectToVerifyError(res, 'El token de verificación ha expirado. Solicita un nuevo correo de verificación desde la app.');
    }

    // Mostrar página de confirmación con botón que hace POST
    return redirectToVerifyConfirm(res, token);

  } catch (error) {
    logger.error('Error mostrando página de verificación', { error: error.message });
    return redirectToVerifyError(res, 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
  }
};

/**
 * POST /auth/verify-email
 * Confirma la verificación del email (acción real)
 *
 * Se ejecuta cuando el usuario hace clic en "Confirmar verificación"
 * en la página mostrada por el GET. Esto asegura que es una acción humana.
 */
exports.confirmVerifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return redirectToVerifyError(res, 'Token de verificación requerido');
    }

    logger.auth('Confirmación de verificación de email', {
      tokenPrefix: token.substring(0, 10) + '...',
      ip: req.ip,
    });

    // Buscar usuario por token de verificación
    const user = await authService.findByVerificationToken(token);

    if (!user) {
      logger.security('Token de verificación no encontrado', {
        tokenPrefix: token.substring(0, 10) + '...',
        ip: req.ip,
      });
      return redirectToVerifyError(res, 'Token de verificación inválido o expirado');
    }

    // Verificar si el token es válido y no ha expirado
    if (!user.isVerificationTokenValid(token)) {
      logger.security('Token de verificación expirado', {
        userId: user.id,
        username: user.username,
        ip: req.ip,
      });
      return redirectToVerifyError(res, 'El token de verificación ha expirado. Solicita un nuevo correo de verificación desde la app.');
    }

    // Si hay un pending_email, aplicar el cambio de email
    if (user.pending_email) {
      user.email = user.pending_email;
      user.pending_email = null;
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
      ip: req.ip,
    });

    // Devolver página HTML de éxito
    return redirectToVerifySuccess(res, user.username);

  } catch (error) {
    logger.error('Error en verificación de email', { error: error.message });
    return redirectToVerifyError(res, 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
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
    const user = await authService.findById(req.userId);

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

/**
 * POST /auth/forgot-password
 * Solicitar restablecimiento de contraseña
 * Envía un email con el enlace de reset
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'El email es requerido', 400);
    }

    logger.auth('Solicitud de reset de contraseña', { email, ip: req.ip });

    // Buscar usuario por email
    const user = await authService.findByEmail(email);

    // Por seguridad, siempre devolvemos el mismo mensaje
    // aunque el email no exista (evita enumeración de usuarios)
    if (!user) {
      logger.security('Reset solicitado para email inexistente', { email, ip: req.ip });
      return successResponse(res, null, 'Si el email existe, recibirás un enlace de recuperación');
    }

    // Generar token de reset
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Enviar email
    const emailSent = await emailService.sendPasswordResetEmail(user, resetToken);

    if (!emailSent) {
      logger.error('Error al enviar email de reset', { userId: user.id, email: user.email });
      return errorResponse(res, 'No se pudo enviar el email. Inténtalo más tarde.', 500);
    }

    logger.auth('Email de reset enviado', { userId: user.id, email: user.email });

    return successResponse(res, null, 'Si el email existe, recibirás un enlace de recuperación');

  } catch (error) {
    logger.error('Error en forgot-password', { error: error.message });
    next(error);
  }
};

/**
 * GET /auth/reset-password/:token
 * Mostrar formulario para nueva contraseña
 */
exports.showResetPasswordForm = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return redirectToResetError(res, 'Token de reset requerido');
    }

    // Verificar que el token existe y es válido
    const user = await authService.findByPasswordResetToken(token);

    if (!user) {
      return redirectToResetError(res, 'El enlace de recuperación es inválido o ha expirado');
    }

    if (!user.isPasswordResetTokenValid(token)) {
      return redirectToResetError(res, 'El enlace de recuperación ha expirado. Solicita uno nuevo.');
    }

    // Mostrar formulario
    return redirectToResetForm(res, token);

  } catch (error) {
    logger.error('Error mostrando formulario de reset', { error: error.message });
    return redirectToResetError(res, 'Ocurrió un error inesperado');
  }
};

/**
 * POST /auth/reset-password
 * Procesar el cambio de contraseña
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validaciones
    if (!token) {
      return redirectToResetError(res, 'Token de reset requerido');
    }

    if (!password || !confirmPassword) {
      return redirectToResetForm(res, token, 'Todos los campos son requeridos');
    }

    if (password !== confirmPassword) {
      return redirectToResetForm(res, token, 'Las contraseñas no coinciden');
    }

    if (password.length < 6) {
      return redirectToResetForm(res, token, 'La contraseña debe tener al menos 6 caracteres');
    }

    logger.auth('Intento de reset de contraseña', { token: token.substring(0, 10) + '...', ip: req.ip });

    // Buscar usuario por token
    const user = await authService.findByPasswordResetToken(token);

    if (!user) {
      logger.security('Token de reset inválido', { token: token.substring(0, 10) + '...', ip: req.ip });
      return redirectToResetError(res, 'El enlace de recuperación es inválido o ha expirado');
    }

    if (!user.isPasswordResetTokenValid(token)) {
      logger.security('Token de reset expirado', { userId: user.id, ip: req.ip });
      return redirectToResetError(res, 'El enlace de recuperación ha expirado. Solicita uno nuevo.');
    }

    // Cambiar contraseña
    await user.setPassword(password);
    await user.save();

    logger.auth('Contraseña cambiada exitosamente', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });

    // Mostrar página de éxito
    return redirectToResetSuccess(res, user.username);

  } catch (error) {
    logger.error('Error en reset de contraseña', { error: error.message });
    return redirectToResetError(res, 'Ocurrió un error inesperado');
  }
};

/**
 * POST /auth/refresh-token
 * Renovar access token usando el refresh token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token es requerido', 400);
    }

    // Buscar usuario por refresh token
    const user = await authService.findByRefreshToken(refreshToken);

    if (!user) {
      return errorResponse(res, 'Refresh token inválido', 401);
    }

    if (!user.isRefreshTokenValid(refreshToken)) {
      // Limpiar refresh token expirado
      user.refresh_token = null;
      user.refresh_token_expires = null;
      await user.save();
      return errorResponse(res, 'Refresh token expirado. Inicia sesión nuevamente.', 401);
    }

    // Generar nuevo access token
    const token = authService.generateAccessToken(user);

    // Generar nuevo refresh token (rotación para mayor seguridad)
    const newRefreshToken = user.generateRefreshToken();
    await user.save();

    logger.auth('Token renovado', { userId: user.id });

    return successResponse(res, {
      token,
      refreshToken: newRefreshToken,
      user: authService.formatUserResponse(user)
    }, 'Token renovado exitosamente');

  } catch (error) {
    logger.error('Error en refresh token', { error: error.message });
    next(error);
  }
};

/**
 * PATCH /auth/profile
 * Actualizar perfil del usuario (username, email)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await authService.findById(req.userId);

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    const { username, email } = req.body;

    // Actualizar username si se proporcionó
    if (username && username !== user.username) {
      if (await authService.isUsernameTaken(username, user.id)) {
        return errorResponse(res, 'El nombre de usuario ya está en uso', 409);
      }
      user.username = username;
    }

    // Actualizar email si se proporcionó
    // El email NO se cambia directamente: se guarda en pending_email
    // y solo se aplica cuando el usuario verifica el nuevo email
    let emailChangeRequested = false;
    if (email !== undefined && email !== user.email) {
      if (email) {
        const existingEmail = await authService.findByEmail(email);
        if (existingEmail && existingEmail.id !== user.id) {
          return errorResponse(res, 'El email ya está en uso', 409);
        }
        user.pending_email = email;
        emailChangeRequested = true;
      } else {
        // Si quiere borrar el email
        user.email = null;
        user.email_verified = false;
        user.pending_email = null;
      }
    }

    // Si solicitó cambio de email, generar token y enviar verificación al NUEVO email
    if (emailChangeRequested) {
      const verificationToken = user.generateVerificationToken();
      await user.save();

      // Enviar email de verificación al NUEVO email (pending_email)
      const emailSent = await emailService.sendEmailChangeVerification(
        { ...user.get(), email: user.pending_email },
        verificationToken
      );
      if (emailSent) {
        logger.auth('Email de verificación de cambio enviado', {
          userId: user.id,
          pendingEmail: user.pending_email,
        });
      } else {
        logger.warn('No se pudo enviar email de verificación al nuevo correo', {
          userId: user.id,
          pendingEmail: user.pending_email,
        });
      }
    } else {
      await user.save();
    }

    logger.auth('Perfil actualizado', { userId: user.id, username: user.username });

    const message = emailChangeRequested
      ? 'Perfil actualizado. Verifica tu nuevo email para completar el cambio.'
      : 'Perfil actualizado exitosamente';

    return successResponse(res, {
      user: authService.formatUserResponse(user)
    }, message);

  } catch (error) {
    logger.error('Error actualizando perfil', { error: error.message });
    next(error);
  }
};

/**
 * PUT /auth/avatar
 * Actualizar avatar del usuario (Base64)
 */
exports.updateAvatar = async (req, res, next) => {
  try {
    const user = await authService.findById(req.userId);

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    const { avatar } = req.body;

    if (!avatar) {
      return errorResponse(res, 'El avatar es requerido', 400);
    }

    // Validar formato Base64 con prefijo data URI
    const dataUriRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/;
    if (!dataUriRegex.test(avatar)) {
      return errorResponse(res, 'Formato de imagen inválido. Usa JPEG, PNG o WebP.', 400);
    }

    // Validar tamaño (~5MB máximo en Base64, que es ~3.75MB de imagen real)
    const base64Data = avatar.split(',')[1];
    const sizeInBytes = Buffer.from(base64Data, 'base64').length;
    if (sizeInBytes > 5 * 1024 * 1024) {
      return errorResponse(res, 'La imagen es demasiado grande. Máximo 5MB.', 400);
    }

    user.avatar_base64 = avatar;
    await user.save();

    logger.auth('Avatar actualizado', { userId: user.id });

    return successResponse(res, {
      user: authService.formatUserResponse(user)
    }, 'Avatar actualizado exitosamente');

  } catch (error) {
    logger.error('Error actualizando avatar', { error: error.message });
    next(error);
  }
};

/**
 * DELETE /auth/avatar
 * Eliminar avatar del usuario
 */
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await authService.findById(req.userId);

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    user.avatar_base64 = null;
    await user.save();

    logger.auth('Avatar eliminado', { userId: user.id });

    return successResponse(res, {
      user: authService.formatUserResponse(user)
    }, 'Avatar eliminado exitosamente');

  } catch (error) {
    logger.error('Error actualizando avatar', { error: error.message });
    next(error);
  }
};
