const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { sequelize } = require('./models/db');
const { router: authRoutes } = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const complaintRoutes = require('./routes/complaints');
const commentRoutes = require('./routes/comments');
const docsRoutes = require('./routes/docs');
const tagRoutes = require('./routes/tags');
const reportRoutes = require('./routes/reports');
const { createDefaultAdmin } = require('./utils/adminSetup');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/reports', reportRoutes);

// Database sync and server start
const PORT = process.env.PORT || 3000;

sequelize.sync().then(async () => {
  console.log('Database synchronized');
  try {
    await createDefaultAdmin();
    console.log('Default admin user setup completed');
  } catch (error) {
    console.error('Error setting up default admin:', error);
  }
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Error syncing database:', err);
});


