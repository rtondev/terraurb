const { Sequelize, DataTypes } = require('sequelize');
const { sequelize, User } = require('./db');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  token: {
    type: DataTypes.STRING(1000),
    allowNull: false
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accessCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastUsed: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
});

module.exports = { Session }; 