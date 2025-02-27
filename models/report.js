const { Sequelize, DataTypes } = require('sequelize');
const { sequelize, User } = require('./db');
const { Complaint } = require('./complaint');
const { Comment } = require('./comment');

const Report = sequelize.define('Report', {
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
    type: DataTypes.STRING,
    defaultValue: 'Pendente'
  },
  adminNote: {
    type: DataTypes.TEXT
  },
  resolvedAt: {
    type: DataTypes.DATE
  },
  resolvedBy: {
    type: DataTypes.INTEGER
  }
});

// Associations
Report.belongsTo(User, { as: 'reporter', foreignKey: 'userId' });
Report.belongsTo(User, { as: 'resolver', foreignKey: 'resolvedBy' });

// Associações polimórficas
Report.belongsTo(Complaint, {
  foreignKey: 'targetId',
  constraints: false,
  as: 'complaintTarget'
});
Report.belongsTo(Comment, {
  foreignKey: 'targetId',
  constraints: false,
  as: 'commentTarget'
});

module.exports = { Report };
