const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Session, ActivityLog, Complaint, VerificationCode } = require('../models');
const router = express.Router();
const nodemailer = require('nodemailer');
const { verificationEmailTemplate } = require('../utils/emailTemplates');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const streamifier = require('streamifier');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const deviceInfoMiddleware = require('../middleware/deviceInfo');

// Configurar o transporter do Nodemailer para Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Comentar ou remover esta verificação
/*
transporter.verify(function(error, success) {
  if (error) {
    console.error('Erro na configuração do email:', error);
  }
});
*/

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
    
    console.log('Enviando código:', { email, verificationCode });

    // Criar ou atualizar código de verificação
    await VerificationCode.create({
      email,
      code: verificationCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
    });

    // Enviar email
    await transporter.sendMail({
      from: `"TerraUrb" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Código de Verificação - TerraUrb',
      html: verificationEmailTemplate(verificationCode)
    });

    console.log('Código salvo e email enviado');
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar código:', error);
    res.status(500).json({ error: 'Erro ao enviar código de verificação' });
  }
});

// Rota para verificar código
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code, nickname } = req.body;
    console.log('Verificando código:', { email, code, nickname });

    if (!email || !code) {
      return res.status(400).json({ 
        error: 'Email e código são obrigatórios' 
      });
    }

    // Buscar código de verificação
    const verificationData = await VerificationCode.findOne({
      where: {
        email,
        code,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });
    console.log('Verificação encontrada:', verificationData);

    if (!verificationData) {
      return res.status(400).json({ 
        error: 'Código inválido ou expirado' 
      });
    }

    // Verificar se email ou nickname já existem
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { nickname }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email ou nickname já cadastrado' 
      });
    }

    res.json({ 
      verified: true,
      message: 'Código verificado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar código' 
    });
  }
});

// Rota de registro
router.post('/register', async (req, res) => {
  try {
    const { nickname, email, password, verificationCode } = req.body;

    // Validar dados obrigatórios
    if (!nickname || !email || !password || !verificationCode) {
      return res.status(400).json({ 
        error: 'Todos os campos são obrigatórios' 
      });
    }

    // Verificar se o código é válido
    const verification = await VerificationCode.findOne({
      where: {
        email,
        code: verificationCode,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!verification) {
      return res.status(400).json({ 
        error: 'Código de verificação inválido ou expirado' 
      });
    }

    // Verificar se usuário já existe
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { nickname }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email ou nickname já cadastrado' 
      });
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await User.create({
      nickname,
      email,
      password: hashedPassword,
      role: 'user'
    });

    // Remover código de verificação usado
    await verification.destroy();

    res.status(201).json({ 
      success: true,
      message: 'Usuário criado com sucesso'
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      error: 'Erro interno ao criar usuário' 
    });
  }
});

// Função para gerar deviceId único baseado nas informações do dispositivo
const generateDeviceId = (deviceInfo) => {
  const { browser, os, platform, ip } = deviceInfo;
  return `${browser}-${os}-${platform}-${ip}`.replace(/\s+/g, '-').toLowerCase();
};

// Aplicar middleware
router.use(deviceInfoMiddleware);

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

    // Criar sessão com informações do dispositivo
    const session = await Session.create({
      userId: user.id,
      token,
      deviceInfo: req.deviceInfo,
      lastActivity: new Date()
    });

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

// Rota para obter dados do usuário atual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

// Rota para atualizar perfil
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { nickname, fullName, city, state, phone, bio } = req.body;
    const userId = req.user.id;

    // Validar nickname
    if (nickname && nickname !== req.user.nickname) {
      // Verificar se o nickname já existe
      const existingUser = await User.findOne({ 
        where: { 
          nickname,
          id: { [Op.ne]: userId } // Excluir o usuário atual da busca
        } 
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'Nome de usuário já está em uso' 
        });
      }
    }

    // Atualizar usuário
    await User.update({
      nickname: nickname || req.user.nickname,
      fullName: fullName || req.user.fullName,
      city: city || req.user.city,
      state: state || req.user.state,
      phone: phone || req.user.phone,
      bio: bio || req.user.bio
    }, {
      where: { id: userId }
    });

    res.json({ 
      success: true,
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar perfil' 
    });
  }
});

// Check nickname availability
router.get('/check-nickname/:nickname', async (req, res) => {
  try {
    const { nickname } = req.params;
    const user = await User.findOne({ where: { nickname } });
    res.json({ available: !user });
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
      where: { userId: req.user.id },
      order: [['lastActivity', 'DESC']]
    });

    const devices = sessions.map(session => ({
      id: session.id,
      browser: session.deviceInfo.browser,
      os: session.deviceInfo.os,
      device: session.deviceInfo.device,
      location: session.deviceInfo.location,
      lastActivity: session.lastActivity,
      current: session.token === req.token
    }));

    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar dispositivos' });
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

// Rota pública para listar todos os usuários
router.get('/users/public', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['nickname', 'email'],
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

module.exports = router;
