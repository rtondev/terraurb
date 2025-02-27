const express = require('express');
const router = express.Router();
const { Complaint, ComplaintLog, User, Tag, Comment } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { sequelize } = require('../models/db');

// Middleware to check if user is authorized to change complaint status
const canChangeStatus = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'city_hall') {
    return res.status(403).json({ error: 'Apenas administradores e funcionários da prefeitura podem alterar o status.' });
  }
  next();
};

// Middleware para verificar se o usuário pode alterar a denúncia
const canModifyComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }
    
    if (req.user.role === 'admin' || complaint.userId === req.user.id) {
      req.complaint = complaint;
      next();
    } else {
      res.status(403).json({ error: 'Sem permissão para modificar esta denúncia' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

// Get my complaints (deve vir ANTES das rotas com parâmetros)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    console.log('Usuário autenticado:', req.user.id);
    
    const complaints = await Complaint.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'email']
        },
        {
          model: Tag,
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      total: complaints.length,
      resolved: complaints.filter(c => c.status === 'Resolvido').length,
      inProgress: complaints.filter(c => c.status === 'Em Andamento').length,
      pending: complaints.filter(c => c.status === 'Em Análise').length
    };

    res.json({ complaints, stats });
  } catch (error) {
    console.error('Erro ao buscar minhas denúncias:', error);
    res.status(500).json({ error: 'Erro ao buscar denúncias' });
  }
});

// Get all complaints
router.get('/', async (req, res) => {
  try {
    const complaints = await Complaint.findAll({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname'],
          required: true
        },
        {
          model: Tag,
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Comments
              WHERE Comments.complaintId = Complaint.id
            )`),
            'commentsCount'
          ]
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    // Garantir que os dados estão no formato esperado
    const formattedComplaints = complaints.map(complaint => {
      const plainComplaint = complaint.get({ plain: true });
      return {
        ...plainComplaint,
        commentsCount: parseInt(plainComplaint.commentsCount) || 0,
        tags: plainComplaint.Tags || [],
        user: {
          id: plainComplaint.author.id,
          nickname: plainComplaint.author.nickname
        }
      };
    });

    res.json(formattedComplaints);
  } catch (error) {
    console.error('Erro ao listar denúncias:', error);
    res.status(500).json({ error: 'Erro ao listar denúncias' });
  }
});

// Get complaint by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id, {
      include: [
        { association: 'author', attributes: ['nickname'] },
        { 
          model: ComplaintLog,
          include: [{ association: 'changedBy', attributes: ['nickname'] }]
        },
        { model: Tag }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }

    console.log('Retornando denúncia:', complaint.toJSON());
    res.json(complaint);
  } catch (error) {
    console.error('Erro ao buscar denúncia:', error);
    res.status(500).json({ error: 'Erro ao buscar denúncia' });
  }
});

// Get public user profile with complaints (deve vir DEPOIS de /my)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Buscar usuário
    const user = await User.findByPk(userId, {
      attributes: ['id', 'nickname', 'role', 'city', 'state']
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar denúncias
    const complaints = await Complaint.findAll({
      where: { userId },
      include: [
        { model: Tag },
        { association: 'author', attributes: ['nickname'] },
        { 
          model: ComplaintLog,
          include: [{ association: 'changedBy', attributes: ['nickname'] }],
          order: [['createdAt', 'DESC']]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      total: complaints.length,
      resolved: complaints.filter(c => c.status === 'Resolvido').length,
      inProgress: complaints.filter(c => c.status === 'Em Andamento').length,
      pending: complaints.filter(c => c.status === 'Em Análise').length
    };

    res.json({
      user,
      stats,
      complaints
    });
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

// Update complaint status
router.patch('/:id/status', authenticateToken, canChangeStatus, async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findByPk(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }

    const validStatuses = [
      'Em Análise',
      'Em Andamento',
      'Resolvido',
      'Cancelado',
      'Em Verificação',
      'Reaberto'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const oldStatus = complaint.status;
    await complaint.update({ status });

    // Create log entry for status change
    await ComplaintLog.create({
      ComplaintId: complaint.id,
      oldStatus,
      newStatus: status,
      changedById: req.user.id
    });

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status da denúncia' });
  }
});

// Create complaint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, location, tagIds, polygonCoordinates } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({ error: 'Título, descrição e localização são obrigatórios' });
    }

    // Validar se recebeu as coordenadas do polígono
    if (!polygonCoordinates || !Array.isArray(polygonCoordinates) || polygonCoordinates.length < 3) {
      return res.status(400).json({ error: 'Coordenadas do polígono inválidas' });
    }

    console.log('Recebendo dados da denúncia:', {
      title,
      description,
      location,
      tagIds,
      polygonCoordinates
    });

    const complaint = await Complaint.create({
      ...req.body,
      userId: req.user.id,
      status: 'Em Análise'
    });

    // Registrar a criação no histórico
    await ComplaintLog.create({
      complaintId: complaint.id,
      changedById: req.user.id,
      oldStatus: null, // null indica que é uma criação
      newStatus: 'Em Análise',
      type: 'created' // Novo campo para diferenciar criação de alteração
    });

    console.log('Denúncia criada com polígono:', complaint.polygonCoordinates);

    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await complaint.setTags(tagIds);
    }

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Erro ao criar denúncia:', error);
    res.status(500).json({ error: 'Erro ao criar denúncia' });
  }
});

module.exports = router;



