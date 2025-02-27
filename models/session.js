const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING(1000),
    allowNull: false
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'Sessions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['token']
    },
    {
      fields: ['isActive']
    }
  ]
});

// Limpar sessões antigas periodicamente
const cleanupSessions = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await Session.destroy({
      where: {
        lastActivity: {
          [sequelize.Op.lt]: thirtyDaysAgo
        }
      }
    });
  } catch (error) {
    console.error('Erro ao limpar sessões antigas:', error);
  }
};

// Executar limpeza diariamente
setInterval(cleanupSessions, 24 * 60 * 60 * 1000);

module.exports = { Session }; 