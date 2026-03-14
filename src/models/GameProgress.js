const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GameProgress = sequelize.define('GameProgress', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    game_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'game_type'
    },
    current_level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'current_level'
    },
    highest_level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'highest_level'
    },
    total_games_played: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_games_played'
    },
    last_played_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_played_at'
    },
    custom_data: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'custom_data',
      get() {
        const value = this.getDataValue('custom_data');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('custom_data', JSON.stringify(value));
      }
    }
  }, {
    tableName: 'game_progress',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'game_type']
      }
    ]
  });

  // Método para convertir a formato de API
  GameProgress.prototype.toJSON = function() {
    return {
      id: this.id,
      userId: this.user_id,
      gameType: this.game_type,
      currentLevel: this.current_level,
      highestLevel: this.highest_level,
      totalGamesPlayed: this.total_games_played,
      lastPlayedAt: this.last_played_at,
      customData: this.custom_data
    };
  };

  return GameProgress;
};
