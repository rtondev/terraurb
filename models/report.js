const { Sequelize, DataTypes } = require('sequelize');
const { sequelize, User } = require('./db');
const { Complaint } = require('./complaint');
const { Comment } = require('./comment');

const Report = sequelize.define('Report', {
  type: {
    type: DataTypes.ENUM('complaint', 'comment'),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'inappropriate', 'dismissed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  reviewNote: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// Associations
Report.belongsTo(User, { as: 'reporter', foreignKey: 'reporterId' });
Report.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedBy' });

module.exports = { Report };
