const { Sequelize, DataTypes } = require('sequelize');
const { sequelize, User } = require('./db');

const Complaint = sequelize.define('Complaint', {
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'Em Análise',
      'Em Andamento',
      'Resolvido',
      'Cancelado',
      'Em Verificação',
      'Reaberto'
    ),
    allowNull: false,
    defaultValue: 'Em Análise'
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

const ComplaintLog = sequelize.define('ComplaintLog', {
  oldStatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  newStatus: {
    type: DataTypes.STRING,
    allowNull: false
  },
  changedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
});

// Associations
Complaint.hasMany(ComplaintLog);
ComplaintLog.belongsTo(Complaint);
ComplaintLog.belongsTo(User, { as: 'changedBy', foreignKey: 'changedById' });
Complaint.belongsTo(User, { as: 'author', foreignKey: 'userId' });

module.exports = { Complaint, ComplaintLog };
