const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { syncDatabase } = require('./models');
const { router: authRouter } = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const complaintRoutes = require('./routes/complaints');
const commentRoutes = require('./routes/comments');
const docsRoutes = require('./routes/docs');
const tagRoutes = require('./routes/tags');
const reportRoutes = require('./routes/reports');
const { createDefaultAdmin } = require('./utils/adminSetup');
const statsRoutes = require('./routes/stats');

const app = express();

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configuração mais permissiva do CORS
app.use(cors({
  origin: '*', // Permite todas as origens em desenvolvimento
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}));

app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRouter);
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
    await syncDatabase();
    console.log('Database synchronized');
    
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


