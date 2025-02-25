const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/db');
const router = express.Router();
const nodemailer = require('nodemailer');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  });
};

// Configuração do nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Armazenamento temporário dos códigos e dados de registro
const verificationCodes = new Map();

// Gerar código de 6 dígitos
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Rota para enviar código de verificação
router.post('/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Verificar se email já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Gerar código
    const code = generateVerificationCode();
    
    // Salvar código e status de verificação
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 600000, // 10 minutos
      verified: false,
      registrationData: null
    });

    // Enviar email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Código de Verificação - TerraUrb',
      html: `
        <h2>Bem-vindo ao TerraUrb!</h2>
        <p>Seu código de verificação é: <strong>${code}</strong></p>
        <p>Este código expira em 10 minutos.</p>
      `
    });

    res.json({ message: 'Código de verificação enviado' });
  } catch (error) {
    console.error('Erro ao enviar código:', error);
    res.status(500).json({ error: 'Erro ao enviar código de verificação' });
  }
});

// Verificar código
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code, nickname, password } = req.body;

    const storedData = verificationCodes.get(email);
    if (!storedData) {
      return res.status(400).json({ error: 'Código expirado ou inválido' });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Código expirado' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Código incorreto' });
    }

    // Armazenar dados de registro
    storedData.verified = true;
    storedData.registrationData = {
      nickname,
      password
    };
    verificationCodes.set(email, storedData);

    res.json({ verified: true });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({ error: 'Erro ao verificar código' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar se o email foi verificado
    const storedData = verificationCodes.get(email);
    if (!storedData?.verified || !storedData?.registrationData) {
      return res.status(400).json({ error: 'Email não verificado' });
    }

    const { nickname, password } = storedData.registrationData;

    // Criar usuário
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      nickname,
      email,
      password: hashedPassword
    });

    // Limpar dados de verificação
    verificationCodes.delete(email);

    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (error) {
    console.error('Erro no registro:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email ou nickname já existe' });
    }
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login route com melhor tratamento de erros
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação dos campos
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios',
        details: {
          email: !email ? 'Email é obrigatório' : null,
          password: !password ? 'Senha é obrigatória' : null
        }
      });
    }

    // Busca o usuário com tratamento de erro
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password', 'role', 'nickname']
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        details: 'Email não encontrado'
      });
    }

    // Verifica a senha com tratamento de erro
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        details: 'Senha incorreta'
      });
    }

    // Gera o token com try-catch específico
    try {
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '24h' }
      );

      // Remove a senha antes de enviar a resposta
      const { password: _, ...userWithoutPassword } = user.toJSON();

      res.json({ 
        token, 
        user: userWithoutPassword
      });
    } catch (tokenError) {
      console.error('Erro ao gerar token:', tokenError);
      return res.status(500).json({ 
        error: 'Erro ao gerar token de autenticação',
        details: tokenError.message
      });
    }

  } catch (error) {
    console.error('Erro durante login:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Me route
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id', 
        'nickname', 
        'email', 
        'role',
        'fullName',
        'city',
        'state',
        'age',
        'phone',
        'bio',
        'avatarUrl'
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({ error: 'Error fetching user data' });
  }
});

// Update profile route
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { fullName, city, state, age, phone, bio } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Validação da idade
    if (age !== null && age !== undefined && age !== '') {
      const ageNum = parseInt(age);
      if (isNaN(ageNum)) {
        return res.status(400).json({ 
          error: 'Idade inválida',
          details: 'A idade deve ser um número'
        });
      }
      if (ageNum > 120) {
        return res.status(400).json({ 
          error: 'Idade inválida',
          details: 'A idade máxima é 120 anos'
        });
      }
    }

    // Preparar dados para atualização
    const updateData = {
      fullName: fullName || null,
      city: city || null,
      state: state || null,
      age: age ? parseInt(age) : null,
      phone: phone || null,
      bio: bio || null
    };

    await user.update(updateData);

    // Retornar usuário atualizado sem a senha
    const { password, ...userWithoutPassword } = user.toJSON();
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Erro de validação',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({ 
      error: 'Erro ao atualizar perfil',
      message: 'Ocorreu um erro ao tentar atualizar o perfil'
    });
  }
});

// Check nickname availability
router.get('/check-nickname/:nickname', async (req, res) => {
  try {
    const { nickname } = req.params;
    
    // Verificar se o nickname tem pelo menos 3 caracteres
    if (nickname.length < 3) {
      return res.json({ available: false });
    }

    // Verificar se o nickname já existe
    const existingUser = await User.findOne({ where: { nickname } });
    
    res.json({ available: !existingUser });
  } catch (error) {
    console.error('Erro ao verificar nickname:', error);
    res.status(500).json({ error: 'Erro ao verificar disponibilidade do nickname' });
  }
});

// Delete account
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Deletar todas as denúncias do usuário
    await Complaint.destroy({ where: { userId: user.id } });
    
    // Deletar o usuário
    await user.destroy();

    res.json({ message: 'Conta deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({ error: 'Erro ao deletar conta' });
  }
});

module.exports = { router, authenticateToken };
