const { Sequelize, DataTypes } = require('sequelize');
const { sequelize, User } = require('./db');
const { Session } = require('./session');
const { ActivityLog } = require('./activityLog');
const { Complaint, ComplaintLog } = require('./complaint');
const { Comment } = require('./comment');
const { Report } = require('./report');
const { Tag } = require('./tag');

// Definir o modelo de junção ComplaintTags
const ComplaintTags = sequelize.define('ComplaintTags', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  complaintId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Complaints',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  tagId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Tags',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'ComplaintTags',
  timestamps: true
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
  as: 'user',
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
  through: {
    model: ComplaintTags,
    unique: false
  },
  foreignKey: 'complaintId',
  constraints: false
});

Tag.belongsToMany(Complaint, {
  through: {
    model: ComplaintTags,
    unique: false
  },
  foreignKey: 'tagId',
  constraints: false
});

// Função para sincronizar o banco de dados
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    
    // Dropar a tabela ComplaintTags se existir
    await sequelize.query('DROP TABLE IF EXISTS ComplaintTags');
    
    // Sincronizar modelos
    await sequelize.sync({ alter: true });
    
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
  syncDatabase
}; 