const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');
const { User } = require('./user');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('comment', 'complaint', 'report'),
    allowNull: false,
    validate: {
      isIn: [['comment', 'complaint', 'report']]
    }
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved', 'rejected'),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'resolved', 'rejected']]
    }
  },
  adminNote: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  complaintId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Complaints',
      key: 'id'
    }
  },
  references: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Referências ao conteúdo original denunciado'
  }
});

// Associações
Report.belongsTo(User, { as: 'reporter', foreignKey: 'userId' });
Report.belongsTo(User, { as: 'resolver', foreignKey: 'resolvedBy' });

module.exports = { Report };
