const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('dotenv').config();
const { sequelize } = require('./models/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const complaintRoutes = require('./routes/complaints');
const commentRoutes = require('./routes/comments');
const docsRoutes = require('./routes/docs');
const tagRoutes = require('./routes/tags');
const reportsRoutes = require('./routes/reports');
const { createDefaultAdmin } = require('./utils/adminSetup');
const statsRouter = require('./routes/stats');
const { Session } = require('./models/session');
const path = require('path');
const { Report } = require('./models/report');
const { Comment } = require('./models/comment');
const { User } = require('./models/user');
const { Complaint } = require('./models/complaint');
const { ActivityLog } = require('./models/activityLog');

const app = express();

// Configurar CORS e parse do JSON
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('Headers:', req.headers);
    console.log('Body raw:', req.body);
  }
  next();
});

app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/stats', statsRouter);

// Configurar associações
Comment.associate({ User, Complaint });
ActivityLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});
User.hasMany(ActivityLog, {
  foreignKey: 'userId',
  as: 'activities'
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Função para executar migrações
const runMigrations = async () => {
  try {
    // Primeiro criar tabela Users se não existir
    const usersExists = await sequelize.getQueryInterface()
      .showAllTables()
      .then(tables => tables.includes('Users'));

    if (!usersExists) {
      console.log('Criando tabela Users...');
      // Criar tabela Users
    }

    // Depois executar outras migrações
    // Verificar se a tabela Sessions existe
    const tableExists = await sequelize.getQueryInterface()
      .showAllTables()
      .then(tables => tables.includes('Sessions'));

    if (!tableExists) {
      // Criar tabela Sessions com índices
      await Session.sync({ force: true });
      console.log('Tabela Sessions criada com sucesso');
    } else {
      // Verificar e adicionar colunas necessárias
      const columns = await sequelize.getQueryInterface().describeTable('Sessions');
      
      if (!columns.deviceInfo) {
        await sequelize.getQueryInterface().addColumn('Sessions', 'deviceInfo', {
          type: sequelize.Sequelize.JSON,
          allowNull: true
        });
        console.log('Coluna deviceInfo adicionada');
      }

      // Adicionar lastActivity com valor padrão atual
      if (!columns.lastActivity) {
        await sequelize.query('SET SQL_MODE = "";'); // Desabilitar modo estrito
        await sequelize.query(`
          ALTER TABLE Sessions 
          ADD COLUMN lastActivity DATETIME NOT NULL 
          DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('Coluna lastActivity adicionada');
      }

      // Remover colunas antigas se existirem
      if (columns.deviceId) {
        await sequelize.getQueryInterface().removeColumn('Sessions', 'deviceId');
        console.log('Coluna deviceId removida');
      }
      if (columns.accessCount) {
        await sequelize.getQueryInterface().removeColumn('Sessions', 'accessCount');
        console.log('Coluna accessCount removida');
      }
      if (columns.lastUsed) {
        await sequelize.getQueryInterface().removeColumn('Sessions', 'lastUsed');
        console.log('Coluna lastUsed removida');
      }

      // Verificar índices existentes
      const [indexes] = await sequelize.query(
        'SHOW INDEX FROM Sessions'
      );

      const existingIndexes = indexes.map(index => index.Key_name);

      // Adicionar índices apenas se não existirem
      if (!existingIndexes.includes('sessions_user_id')) {
        await sequelize.query(
          'CREATE INDEX sessions_user_id ON Sessions (userId)'
        );
        console.log('Índice userId adicionado');
      }

      if (!existingIndexes.includes('sessions_token')) {
        await sequelize.query(
          'CREATE INDEX sessions_token ON Sessions (token)'
        );
        console.log('Índice token adicionado');
      }

      if (!existingIndexes.includes('sessions_is_active')) {
        await sequelize.query(
          'CREATE INDEX sessions_is_active ON Sessions (isActive)'
        );
        console.log('Índice isActive adicionado');
      }
    }
    
    // Verificar e atualizar tabela Reports
    const reportsExists = await sequelize.getQueryInterface()
      .showAllTables()
      .then(tables => tables.includes('Reports'));

    if (!reportsExists) {
      await Report.sync({ force: true });
      console.log('Tabela Reports criada com sucesso');
    } else {
      const columns = await sequelize.getQueryInterface().describeTable('Reports');
      
      if (!columns.adminNote) {
        await sequelize.query('SET SQL_MODE = "";'); // Desabilitar modo estrito
        await sequelize.query(`
          ALTER TABLE Reports 
          ADD COLUMN adminNote TEXT NULL
        `);
        console.log('Coluna adminNote adicionada à tabela Reports');
      }

      // Verificar e atualizar outros campos necessários
      if (!columns.resolvedAt) {
        await sequelize.query(`
          ALTER TABLE Reports 
          ADD COLUMN resolvedAt DATETIME NULL
        `);
      }

      if (!columns.resolvedBy) {
        await sequelize.query(`
          ALTER TABLE Reports 
          ADD COLUMN resolvedBy INT NULL,
          ADD FOREIGN KEY (resolvedBy) REFERENCES Users(id)
        `);
      }

      // Atualizar enum de status se necessário
      await sequelize.query(`
        ALTER TABLE Reports 
        MODIFY COLUMN status ENUM('pending', 'resolved', 'rejected') 
        DEFAULT 'pending'
      `);
    }

    // Verificar e criar tabela ActivityLogs
    const activityLogsExists = await sequelize.getQueryInterface()
      .showAllTables()
      .then(tables => tables.includes('ActivityLogs'));

    if (!activityLogsExists) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS ActivityLogs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT,
          action VARCHAR(255) NOT NULL,
          details JSON,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL,
          INDEX idx_user_id (userId),
          INDEX idx_created_at (createdAt)
        )
      `);
      console.log('Tabela ActivityLogs criada com sucesso');
    } else {
      // Verificar e adicionar colunas/índices necessários
      const columns = await sequelize.getQueryInterface().describeTable('ActivityLogs');
      
      if (!columns.details) {
        await sequelize.query(`
          ALTER TABLE ActivityLogs 
          ADD COLUMN details JSON NULL
        `);
        console.log('Coluna details adicionada à tabela ActivityLogs');
      }

      // Verificar índices existentes
      const [indexes] = await sequelize.query(
        'SHOW INDEX FROM ActivityLogs'
      );

      const existingIndexes = indexes.map(index => index.Key_name);

      if (!existingIndexes.includes('idx_user_id')) {
        await sequelize.query(
          'CREATE INDEX idx_user_id ON ActivityLogs (userId)'
        );
      }

      if (!existingIndexes.includes('idx_created_at')) {
        await sequelize.query(
          'CREATE INDEX idx_created_at ON ActivityLogs (createdAt)'
        );
      }
    }

    console.log('Migrações concluídas com sucesso');
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    throw error;
  }
};

// Inicializar banco de dados e executar migrações
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com banco de dados estabelecida.');
    
    await runMigrations();
    
    // Iniciar servidor após migrações
    const PORT = process.env.PORT || 3000;
    await createDefaultAdmin();
    console.log('Default admin user setup completed');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
};

// Inicializar
initializeDatabase();

module.exports = app;


