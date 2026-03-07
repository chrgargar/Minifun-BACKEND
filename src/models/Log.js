const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Log = sequelize.define('Log', {
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
    level: {
      type: DataTypes.ENUM('debug', 'info', 'warning', 'error', 'fatal'),
      allowNull: false,
      defaultValue: 'info'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    device_info: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'device_info'
    },
    app_version: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'app_version'
    },
    client_timestamp: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'client_timestamp'
    }
  }, {
    tableName: 'logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['level']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return Log;
};
