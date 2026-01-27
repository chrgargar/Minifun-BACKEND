const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

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
    return values;
  };

  return User;
};
