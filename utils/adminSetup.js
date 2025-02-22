const bcrypt = require('bcrypt');
const { User } = require('../models/db');

const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ where: { email: 'admin@gmail.com' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('senha123', 10);
      await User.create({
        nickname: 'admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Default admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
    throw error;
  }
};

module.exports = { createDefaultAdmin };
