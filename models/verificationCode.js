const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');
const { Op } = require('sequelize');

const VerificationCode = sequelize.define('VerificationCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'VerificationCodes',
  timestamps: true,
  indexes: [
    {
      fields: ['email', 'code']
    }
  ]
});

// Limpar códigos expirados periodicamente
setInterval(async () => {
  try {
    await VerificationCode.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Erro ao limpar códigos expirados:', error);
  }
}, 15 * 60 * 1000); // A cada 15 minutos

module.exports = { VerificationCode }; 