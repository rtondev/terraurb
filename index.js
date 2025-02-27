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
    // Criar uma cópia do body para logging
    const sanitizedBody = { ...req.body };
    
    // Remover dados sensíveis
    if (sanitizedBody.password) {
      sanitizedBody.password = '[REDACTED]';
    }
    if (sanitizedBody.newPassword) {
      sanitizedBody.newPassword = '[REDACTED]';
    }
    if (sanitizedBody.oldPassword) {
      sanitizedBody.oldPassword = '[REDACTED]';
    }
    if (sanitizedBody.token) {
      sanitizedBody.token = '[REDACTED]';
    }
    if (sanitizedBody.refreshToken) {
      sanitizedBody.refreshToken = '[REDACTED]';
    }

    console.log('Headers:', {
      ...req.headers,
      authorization: req.headers.authorization ? '[REDACTED]' : undefined
    });
    console.log('Body:', sanitizedBody);
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

// Configurar associações antes de usar os modelos
const setupAssociations = () => {
  // User associations
  User.hasMany(Report, {
    foreignKey: 'userId',
    as: 'reports'
  });

  User.hasMany(Report, {
    foreignKey: 'resolvedBy',
    as: 'resolvedReports'
  });

  // Não repetir as associações do Report aqui, pois já estão definidas no modelo
};

// Chamar setupAssociations antes de usar os modelos
setupAssociations();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Função para executar migrações
const runMigrations = async () => {
  try {
    // 1. Verificar e atualizar tabela Users
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nickname VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin', 'city_hall') DEFAULT 'user',
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        INDEX idx_email (email),
        INDEX idx_nickname (nickname)
      )
    `);

    // Verificar e atualizar estrutura da tabela Users
    const userColumns = await sequelize.getQueryInterface().describeTable('Users');
    
    // Verificar e adicionar role se não existir
    if (!userColumns.role) {
      await sequelize.query(`
        ALTER TABLE Users 
        ADD COLUMN role ENUM('user', 'admin', 'city_hall') DEFAULT 'user'
      `);
      console.log('Coluna role adicionada à tabela Users');
    }

    // Verificar índices da tabela Users
    const [userIndexes] = await sequelize.query(
      'SHOW INDEX FROM Users'
    );

    const existingUserIndexes = userIndexes.map(index => index.Key_name);

    if (!existingUserIndexes.includes('idx_email')) {
      await sequelize.query(
        'CREATE INDEX idx_email ON Users (email)'
      );
    }

    if (!existingUserIndexes.includes('idx_nickname')) {
      await sequelize.query(
        'CREATE INDEX idx_nickname ON Users (nickname)'
      );
    }

    // 2. Criar ou atualizar tabela Reports
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(255) NOT NULL,
        targetId INT NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pending', 'resolved', 'rejected') DEFAULT 'pending',
        adminNote TEXT,
        resolvedAt DATETIME,
        resolvedBy INT,
        userId INT NOT NULL,
        complaintId INT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (resolvedBy) REFERENCES Users(id) ON DELETE SET NULL,
        FOREIGN KEY (userId) REFERENCES Users(id),
        FOREIGN KEY (complaintId) REFERENCES Complaints(id) ON DELETE SET NULL
      )
    `);

    // Verificar e adicionar colunas se necessário
    const reportsColumns = await sequelize.getQueryInterface().describeTable('Reports');
    
    if (!reportsColumns.adminNote) {
      await sequelize.query(`
        ALTER TABLE Reports 
        ADD COLUMN adminNote TEXT NULL
      `);
      console.log('Coluna adminNote adicionada à tabela Reports');
    }

    if (!reportsColumns.resolvedAt) {
      await sequelize.query(`
        ALTER TABLE Reports 
        ADD COLUMN resolvedAt DATETIME NULL
      `);
      console.log('Coluna resolvedAt adicionada à tabela Reports');
    }

    if (!reportsColumns.resolvedBy) {
      await sequelize.query(`
        ALTER TABLE Reports 
        ADD COLUMN resolvedBy INT NULL,
        ADD CONSTRAINT fk_reports_resolvedby 
        FOREIGN KEY (resolvedBy) REFERENCES Users(id) 
        ON DELETE SET NULL
      `);
      console.log('Coluna resolvedBy e foreign key adicionadas à tabela Reports');
    }

    // Verificar e atualizar tabela Sessions
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


