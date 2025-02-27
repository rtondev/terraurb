const { Sequelize, DataTypes } = require('sequelize');
const { sequelize, User } = require('./db');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Em Análise', 'Em Andamento', 'Resolvido', 'Cancelado', 'Em Verificação', 'Reaberto'),
    allowNull: false,
    defaultValue: 'Em Análise',
    validate: {
      isIn: [['Em Análise', 'Em Andamento', 'Resolvido', 'Cancelado', 'Em Verificação', 'Reaberto']]
    }
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  polygonCoordinates: {
    type: DataTypes.JSON,
    allowNull: true,
    validate: {
      isValidPolygon(value) {
        if (value && (!Array.isArray(value) || value.length < 3)) {
          throw new Error('Polígono deve ter pelo menos 3 pontos');
        }
      }
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
      model: 'User',
      key: 'id'
    }
  }
});

// Definir associações
Complaint.associate = (models) => {
  Complaint.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'author'
  });
  
  Complaint.hasMany(models.Comment, {
    foreignKey: 'complaintId'
  });
  
  Complaint.belongsToMany(models.Tag, {
    through: 'ComplaintTags'
  });
};

module.exports = { Complaint, ComplaintLog };
