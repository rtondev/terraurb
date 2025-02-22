const { Sequelize, DataTypes } = require('sequelize');
const { sequelize, User } = require('./db');
const { Complaint } = require('./complaint');

const Comment = sequelize.define('Comment', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  complaintId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Complaint,
      key: 'id'
    }
  }
});

// Associations
Comment.belongsTo(User, { as: 'author', foreignKey: 'userId' });
Comment.belongsTo(Complaint, { foreignKey: 'complaintId' });
Complaint.hasMany(Comment, { foreignKey: 'complaintId' });

module.exports = { Comment };
