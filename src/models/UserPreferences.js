const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserPreferences = sequelize.define('UserPreferences', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    theme: {
      type: DataTypes.ENUM('light', 'dark'),
      defaultValue: 'light'
    },
    language: {
      type: DataTypes.STRING(5),
      defaultValue: 'es'
    },
    avatar: {
      type: DataTypes.TEXT('medium'),
      allowNull: true
    },
    music_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'music_enabled'
    },
    effects_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'effects_enabled'
    },
    music_volume: {
      type: DataTypes.FLOAT,
      defaultValue: 0.7,
      field: 'music_volume'
    },
    effects_volume: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
      field: 'effects_volume'
    }
  }, {
    tableName: 'user_preferences',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at',
    underscored: true
  });

  // Método para convertir a formato de API
  UserPreferences.prototype.toJSON = function() {
    return {
      userId: this.user_id,
      theme: this.theme,
      language: this.language,
      avatar: this.avatar,
      musicEnabled: this.music_enabled,
      effectsEnabled: this.effects_enabled,
      musicVolume: this.music_volume,
      effectsVolume: this.effects_volume
    };
  };

  return UserPreferences;
};
