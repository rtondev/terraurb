const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Session, ActivityLog, Complaint } = require('../models');
const router = express.Router();
const nodemailer = require('nodemailer');
const { verificationEmailTemplate } = require('../utils/emailTemplates');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const streamifier = require('streamifier');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error('Erro ao verificar token:', err);
        return res.status(403).json({ 
          error: 'Token inválido ou expirado',
          details: err.message 
        });
      }

      try {
        const user = await User.findByPk(decoded.id);
        if (!user) {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        req.user = user;
        next();
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Configurar o transporter do Nodemailer para Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Testar conexão ao iniciar
transporter.verify(function(error, success) {
  if (error) {
    console.error('Erro na configuração do email:', error);
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
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log('Tentando enviar email para:', email);
    console.log('Usando credenciais:', {
      user: process.env.SMTP_USER,
      // Não logar a senha real
      passLength: process.env.SMTP_PASS?.length
    });

    // Verificar se email já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Enviar email com tratamento de erro mais detalhado
    try {
      const info = await transporter.sendMail({
        from: `"TerraUrb" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Código de Verificação - TerraUrb',
        html: verificationEmailTemplate(verificationCode)
      });

      console.log('Email enviado:', info);

      // Salvar o código
      verificationCodes.set(email, {
        code: verificationCode,
        timestamp: Date.now(),
        attempts: 0
      });

      res.json({ success: true, message: 'Código enviado com sucesso' });
    } catch (emailError) {
      console.error('Erro detalhado ao enviar email:', emailError);
      return res.status(500).json({ 
        error: 'Erro ao enviar email de verificação',
        details: emailError.message
      });
    }
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    res.status(500).json({ 
      error: 'Erro ao processar solicitação',
      details: error.message
    });
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

// Função para gerar deviceId único baseado nas informações do dispositivo
const generateDeviceId = (deviceInfo) => {
  const { browser, os, platform, ip } = deviceInfo;
  return `${browser}-${os}-${platform}-${ip}`.replace(/\s+/g, '-').toLowerCase();
};

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password', 'role', 'nickname']
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET
    );

    // Informações do dispositivo
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'] || 'Desconhecido',
      mobile: req.headers['sec-ch-ua-mobile'] === '?1' ? 'Sim' : 'Não',
      browser: getBrowserInfo(req.headers['user-agent']),
      os: getOperatingSystem(req.headers['user-agent']),
      ip: req.ip,
      location: {
        city: 'Desconhecido',
        state: 'Desconhecido',
        country: 'Desconhecido',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    // Gerar deviceId
    const deviceId = generateDeviceId(deviceInfo);

    // Buscar sessão existente do dispositivo
    let session = await Session.findOne({
      where: { 
        userId: user.id,
        deviceId,
        isActive: true
      }
    });

    if (session) {
      // Atualizar sessão existente
      await session.update({
        token,
        lastUsed: new Date(),
        accessCount: session.accessCount + 1
      });
    } else {
      // Criar nova sessão
      session = await Session.create({
        token,
        deviceInfo,
        deviceId,
        userId: user.id
      });
    }

    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.json({ token, user: userWithoutPassword });

  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Funções auxiliares para extrair informações do user-agent
function getBrowserInfo(userAgent) {
  const browsers = {
    'Chrome': /Chrome\/(\d+)/,
    'Firefox': /Firefox\/(\d+)/,
    'Safari': /Safari\/(\d+)/,
    'Edge': /Edg\/(\d+)/,
    'Opera': /OPR\/(\d+)/,
    'IE': /MSIE (\d+)/
  };

  for (const [name, regex] of Object.entries(browsers)) {
    const match = userAgent.match(regex);
    if (match) {
      return `${name} ${match[1]}`;
    }
  }
  return 'Navegador desconhecido';
}

function getOperatingSystem(userAgent) {
  const systems = {
    'Windows': /Windows NT (\d+\.\d+)/,
    'Mac': /Mac OS X (\d+[._]\d+)/,
    'iOS': /iOS (\d+\.\d+)/,
    'Android': /Android (\d+\.\d+)/,
    'Linux': /Linux/
  };

  for (const [name, regex] of Object.entries(systems)) {
    const match = userAgent.match(regex);
    if (match) {
      return `${name} ${match[1] || ''}`.trim();
    }
  }
  return 'Sistema operacional desconhecido';
}

// Me route
router.get('/me', authenticateToken, async (req, res) => {
  try {
    console.log('Usuário autenticado:', req.user.id);
    res.json(req.user);
  } catch (error) {
    console.error('Erro na rota /me:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
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
    
    // Registrar a atualização
    await logActivity(
      req.user.id,
      'profile',
      'Perfil atualizado',
      req.session?.deviceInfo // Se disponível
    );

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
router.get('/check-nickname/:nickname', authenticateToken, async (req, res) => {
  try {
    const { nickname } = req.params;
    if (nickname === req.user.nickname) {
      return res.json({ available: true });
    }
    
    const existingUser = await User.findOne({ where: { nickname } });
    res.json({ available: !existingUser });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar nickname' });
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

// Verificar se a sessão está ativa
router.get('/check-session', authenticateToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.json({ isActive: false });
    }
    
    const session = await Session.findOne({
      where: {
        token,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!session) {
      return res.json({ isActive: false });
    }

    // Atualizar lastUsed e incrementar accessCount
    await session.update({
      lastUsed: new Date(),
      accessCount: session.accessCount + 1
    });

    res.json({ isActive: true });
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    res.status(500).json({ error: 'Erro ao verificar sessão' });
  }
});

// Rota para listar dispositivos
router.get('/devices', authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.findAll({
      where: { 
        userId: req.user.id,
        isActive: true
      },
      order: [['lastUsed', 'DESC']]
    });

    // Agrupar por deviceId
    const uniqueDevices = sessions.reduce((acc, session) => {
      if (!acc[session.deviceId] || 
          new Date(session.lastUsed) > new Date(acc[session.deviceId].lastUsed)) {
        acc[session.deviceId] = session;
      }
      return acc;
    }, {});

    const formattedSessions = Object.values(uniqueDevices).map(session => ({
      id: session.id,
      deviceId: session.deviceId,
      deviceInfo: session.deviceInfo,
      lastUsed: session.lastUsed,
      accessCount: session.accessCount
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Erro ao buscar dispositivos:', error);
    res.status(500).json({ error: 'Erro ao buscar dispositivos' });
  }
});

// Na rota de revogação, adicionar verificação do token atual
router.post('/devices/revoke', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const currentToken = req.headers.authorization?.split(' ')[1];
    
    const session = await Session.findOne({
      where: { 
        id: sessionId,
        userId: req.user.id
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    await session.update({ isActive: false });
    
    // Registrar a revogação
    await logActivity(
      req.user.id, 
      'security', 
      `Dispositivo desconectado: ${session.deviceInfo.browser} em ${session.deviceInfo.os}`,
      session.deviceInfo
    );

    // Se o token revogado for o atual, retornar flag especial
    if (session.token === currentToken) {
      return res.json({ 
        message: 'Acesso revogado com sucesso',
        currentSession: true
      });
    }

    res.json({ 
      message: 'Acesso revogado com sucesso',
      currentSession: false
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao revogar acesso' });
  }
});

// Rota para buscar histórico de atividades
router.get('/activity-logs', authenticateToken, async (req, res) => {
  try {
    // Buscar logs do usuário ordenados por data
    const logs = await ActivityLog.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50 // Limitar aos 50 registros mais recentes
    });

    res.json(logs);
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de atividades' });
  }
});

// Função helper para registrar atividades
const logActivity = async (userId, type, description, deviceInfo = null) => {
  try {
    await ActivityLog.create({
      userId,
      type,
      description,
      deviceInfo
    });
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
  }
};

// Rota para upload de avatar
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Upload para o Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'avatars' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    // Atualizar URL do avatar no usuário
    await User.update(
      { avatarUrl: result.secure_url },
      { where: { id: req.user.id } }
    );

    res.json({ avatarUrl: result.secure_url });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// Rota para buscar perfil público por nickname
router.get('/profile/:nickname', async (req, res) => {
  try {
    const { nickname } = req.params;
    
    // Primeiro, buscar o usuário
    const user = await User.findOne({
      where: { nickname },
      attributes: [
        'id', 
        'nickname', 
        'fullName',
        'city',
        'state',
        'bio',
        'avatarUrl',
        'createdAt'
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    try {
      // Buscar denúncias separadamente
      const complaints = await Complaint.findAll({
        where: { userId: user.id },
        attributes: ['id', 'title', 'status', 'createdAt'],
        limit: 5,
        order: [['createdAt', 'DESC']]
      });

      // Contar estatísticas
      const [totalComplaints, resolvedComplaints] = await Promise.all([
        Complaint.count({ where: { userId: user.id } }),
        Complaint.count({ where: { userId: user.id, status: 'resolved' } })
      ]);

      // Formatar os dados para exibição pública
      const publicProfile = {
        nickname: user.nickname,
        fullName: user.fullName || 'Nome não informado',
        location: user.city && user.state ? `${user.city}, ${user.state}` : 'Localização não informada',
        bio: user.bio || 'Bio não informada',
        avatarUrl: user.avatarUrl,
        memberSince: user.createdAt,
        recentComplaints: complaints.map(complaint => ({
          id: complaint.id,
          title: complaint.title,
          status: complaint.status,
          date: complaint.createdAt
        })),
        stats: {
          totalComplaints,
          resolvedComplaints
        }
      };

      res.json(publicProfile);
    } catch (error) {
      console.error('Erro ao buscar dados complementares:', error);
      // Se falhar ao buscar denúncias, retorna perfil básico
      res.json({
        nickname: user.nickname,
        fullName: user.fullName || 'Nome não informado',
        location: user.city && user.state ? `${user.city}, ${user.state}` : 'Localização não informada',
        bio: user.bio || 'Bio não informada',
        avatarUrl: user.avatarUrl,
        memberSince: user.createdAt,
        recentComplaints: [],
        stats: { totalComplaints: 0, resolvedComplaints: 0 }
      });
    }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

module.exports = { router, authenticateToken };
