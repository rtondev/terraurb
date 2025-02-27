const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'ActivityLogs',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Associações
ActivityLog.associate = (models) => {
  ActivityLog.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = { ActivityLog }; 