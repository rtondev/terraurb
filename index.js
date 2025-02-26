const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('dotenv').config();
const { sequelize } = require('./models/db');  // Add this import
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const complaintRoutes = require('./routes/complaints');
const commentRoutes = require('./routes/comments');
const docsRoutes = require('./routes/docs');
const tagRoutes = require('./routes/tags');
const reportRoutes = require('./routes/reports');
const { createDefaultAdmin } = require('./utils/adminSetup');
const statsRoutes = require('./routes/stats');

const app = express();

// Configurar CORS e parse do JSON
app.use(cors());
app.use(express.json()); // Importante! Deve vir antes das rotas

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
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Database sync and server start
const PORT = process.env.PORT || 3000;

// Função assíncrona para inicializar o servidor
const initializeServer = async () => {
  try {
    // Replace syncDatabase() with direct sequelize sync
    await sequelize.sync({ alter: true });
    console.log('Database tables updated automatically');
    
    await createDefaultAdmin();
    console.log('Default admin user setup completed');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Iniciar o servidor
initializeServer();

module.exports = app;


