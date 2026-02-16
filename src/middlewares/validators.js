const { errorResponse } = require('../utils/responseUtils');

/**
 * Validación de registro
 */
exports.validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;

  // Username requerido
  if (!username || username.trim().length === 0) {
    return errorResponse(res, 'El username es requerido', 400);
  }

  if (username.length < 3) {
    return errorResponse(res, 'El username debe tener al menos 3 caracteres', 400);
  }

  if (username.length > 50) {
    return errorResponse(res, 'El username no puede exceder 50 caracteres', 400);
  }

  // Password requerido
  if (!password || password.length === 0) {
    return errorResponse(res, 'La contraseña es requerida', 400);
  }

  if (password.length < 6) {
    return errorResponse(res, 'La contraseña debe tener al menos 6 caracteres', 400);
  }

  // Email opcional pero debe ser válido si se proporciona
  if (email && email.trim().length > 0) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'El formato del email es inválido', 400);
    }
  }

  next();
};

/**
 * Validación de actualización de perfil
 */
exports.validateProfileUpdate = (req, res, next) => {
  const { username, email } = req.body;

  if (!username && email === undefined) {
    return errorResponse(res, 'Debes proporcionar al menos un campo para actualizar', 400);
  }

  if (username !== undefined) {
    if (!username || username.trim().length === 0) {
      return errorResponse(res, 'El username no puede estar vacío', 400);
    }
    if (username.length < 3) {
      return errorResponse(res, 'El username debe tener al menos 3 caracteres', 400);
    }
    if (username.length > 50) {
      return errorResponse(res, 'El username no puede exceder 50 caracteres', 400);
    }
  }

  if (email && email.trim().length > 0) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'El formato del email es inválido', 400);
    }
  }

  next();
};

/**
 * Validación de login
 */
exports.validateLogin = (req, res, next) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || usernameOrEmail.trim().length === 0) {
    return errorResponse(res, 'El username o email es requerido', 400);
  }

  if (!password || password.length === 0) {
    return errorResponse(res, 'La contraseña es requerida', 400);
  }

  next();
};
