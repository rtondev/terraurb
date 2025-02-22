const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('./db');
const { Complaint } = require('./complaint');

const Tag = sequelize.define('Tag', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

// Setting up many-to-many relationship with proper naming
Complaint.belongsToMany(Tag, { through: 'ComplaintTags' });
Tag.belongsToMany(Complaint, { through: 'ComplaintTags' });

module.exports = { Tag };

