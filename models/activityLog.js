const { Sequelize, DataTypes } = require('sequelize');
const { sequelize, User } = require('./db');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  // Configurações adicionais
  tableName: 'activity_logs', // Nome da tabela em snake_case
  timestamps: true
});

// Definir a associação corretamente
ActivityLog.belongsTo(User, {
  foreignKey: {
    name: 'userId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

User.hasMany(ActivityLog, {
  foreignKey: 'userId'
});

module.exports = { ActivityLog }; 