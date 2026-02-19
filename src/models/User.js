const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50] // Mínimo 3 caracteres como en Flutter
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true, // Email opcional como en Flutter
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    is_guest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_guest'
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_premium'
    },
    last_login: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_login'
    },
    streak_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'streak_days'
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'verification_token'
    },
    verification_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verification_token_expires'
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_reset_token'
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires'
    },
    refresh_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'refresh_token'
    },
    refresh_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'refresh_token_expires'
    },
    avatar_base64: {
      type: DataTypes.TEXT('medium'),
      allowNull: true,
      field: 'avatar_base64'
    },
    pending_email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'pending_email'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No necesitamos updated_at
    underscored: true,

    // Hooks para hash de contraseña
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      }
    }
  });

  // Método de instancia para comparar contraseñas
  User.prototype.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  // Método para excluir password_hash en respuestas JSON
  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.verification_token;
    delete values.verification_token_expires;
    delete values.password_reset_token;
    delete values.password_reset_expires;
    delete values.refresh_token;
    delete values.refresh_token_expires;
    delete values.pending_email;
    return values;
  };

  // Método para generar token de verificación de email
  User.prototype.generateVerificationToken = function() {
    this.verification_token = crypto.randomBytes(32).toString('hex');
    this.verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    return this.verification_token;
  };

  // Método para verificar si el token es válido
  User.prototype.isVerificationTokenValid = function(token) {
    if (!this.verification_token || !this.verification_token_expires) {
      return false;
    }
    return (
      this.verification_token === token &&
      this.verification_token_expires > new Date()
    );
  };

  // Método para generar token de reset de contraseña
  User.prototype.generatePasswordResetToken = function() {
    this.password_reset_token = crypto.randomBytes(32).toString('hex');
    this.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    return this.password_reset_token;
  };

  // Método para verificar si el token de reset es válido
  User.prototype.isPasswordResetTokenValid = function(token) {
    if (!this.password_reset_token || !this.password_reset_expires) {
      return false;
    }
    return (
      this.password_reset_token === token &&
      this.password_reset_expires > new Date()
    );
  };

  // Método para cambiar la contraseña
  User.prototype.setPassword = async function(newPassword) {
    this.password_hash = await bcrypt.hash(newPassword, 10);
    this.password_reset_token = null;
    this.password_reset_expires = null;
  };

  // Método para generar refresh token
  User.prototype.generateRefreshToken = function() {
    this.refresh_token = crypto.randomBytes(64).toString('hex');
    this.refresh_token_expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
    return this.refresh_token;
  };

  // Método para verificar si el refresh token es válido
  User.prototype.isRefreshTokenValid = function(token) {
    if (!this.refresh_token || !this.refresh_token_expires) {
      return false;
    }
    return (
      this.refresh_token === token &&
      this.refresh_token_expires > new Date()
    );
  };

  return User;
};
