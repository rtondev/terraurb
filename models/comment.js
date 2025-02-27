const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const Comment = sequelize.define('Comment', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

// Definir associações com alias específicos
Comment.associate = (models) => {
  Comment.belongsTo(models.User, { 
    as: 'author',
    foreignKey: 'userId' 
  });
  Comment.belongsTo(models.Complaint, { 
    as: 'parentComplaint',
    foreignKey: 'complaintId' 
  });
};

module.exports = { Comment };
