const { Sequelize, DataTypes } = require('sequelize');
const { sequelize, User } = require('./db');
const { Session } = require('./session');
const { ActivityLog } = require('./activityLog');
const { Complaint, ComplaintLog } = require('./complaint');
const { Comment } = require('./comment');
const { Report } = require('./report');
const { Tag } = require('./tag');
const { VerificationCode } = require('./verificationCode');

// Definir o modelo de junção ComplaintTags corretamente
const ComplaintTags = sequelize.define('ComplaintTags', {
  // Removemos o id auto_increment pois usaremos chave composta
  complaintId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Complaints',
      key: 'id'
    },
    primaryKey: true
  },
  tagId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Tags',
      key: 'id'
    },
    primaryKey: true
  }
}, {
  tableName: 'ComplaintTags',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['complaintId', 'tagId']
    }
  ]
});

// Definir associações
Session.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

User.hasMany(Session, {
  foreignKey: 'userId'
});

ActivityLog.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

User.hasMany(ActivityLog, {
  foreignKey: 'userId'
});

// Associações User-Complaint
User.hasMany(Complaint, {
  foreignKey: 'userId',
  as: 'complaints'
});

Complaint.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author',
  onDelete: 'CASCADE'
});

// Associações ComplaintLog
ComplaintLog.belongsTo(Complaint);
ComplaintLog.belongsTo(User, { as: 'changedBy', foreignKey: 'changedById' });
Complaint.hasMany(ComplaintLog);

// Associações Comment
Comment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE'
});

Comment.belongsTo(Complaint, {
  foreignKey: 'complaintId',
  as: 'complaint',
  onDelete: 'CASCADE'
});

User.hasMany(Comment, {
  foreignKey: 'userId',
  as: 'comments'
});

Complaint.hasMany(Comment, {
  foreignKey: 'complaintId',
  as: 'comments'
});

// Associações Report
Report.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE'
});

Report.belongsTo(Complaint, {
  foreignKey: 'complaintId',
  as: 'complaint',
  onDelete: 'CASCADE'
});

// Associações Tag-Complaint (many-to-many)
Complaint.belongsToMany(Tag, {
  through: ComplaintTags,
  foreignKey: 'complaintId',
  otherKey: 'tagId'
});

Tag.belongsToMany(Complaint, {
  through: ComplaintTags,
  foreignKey: 'tagId',
  otherKey: 'complaintId'
});

// Função para sincronizar o banco de dados
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    
    // Desabilitar temporariamente as chaves estrangeiras
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Dropar tabelas na ordem correta
    await sequelize.query('DROP TABLE IF EXISTS ComplaintTags');
    await sequelize.query('DROP TABLE IF EXISTS VerificationCodes');
    
    // Sincronizar modelos sem alterar tabelas existentes
    await sequelize.sync({ 
      force: false, // Não força recriação das tabelas
      alter: false  // Não altera tabelas existentes
    });
    
    // Reabilitar as chaves estrangeiras
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Modelos sincronizados com o banco de dados.');
  } catch (error) {
    console.error('Erro ao sincronizar banco de dados:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Session,
  ActivityLog,
  Complaint,
  ComplaintLog,
  Comment,
  Report,
  Tag,
  ComplaintTags,
  VerificationCode,
  syncDatabase
}; 