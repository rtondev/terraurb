const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved', 'rejected'),
    defaultValue: 'pending'
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
  }
});

// Definir associações
Report.associate = (models) => {
  Report.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'reporter'
  });
  Report.belongsTo(models.User, {
    foreignKey: 'resolvedBy',
    as: 'resolver'
  });
  Report.belongsTo(models.Complaint, {
    foreignKey: 'complaintId',
    as: 'complaint'
  });
};

module.exports = { Report };
