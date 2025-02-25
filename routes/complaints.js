const express = require('express');
const router = express.Router();
const { Complaint, ComplaintLog } = require('../models/complaint');
const { Tag } = require('../models/tag');
const { authenticateToken } = require('./auth');
const { User } = require('../models/db');

// Middleware to check if user is authorized to change complaint status
const canChangeStatus = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'city_hall') {
    return res.status(403).json({ error: 'Apenas administradores e funcionários da prefeitura podem alterar o status.' });
  }
  next();
};

// Get my complaints (deve vir ANTES das rotas com parâmetros)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const complaints = await Complaint.findAll({
      where: { userId: req.user.id },
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

    res.json({ complaints, stats });
  } catch (error) {
    console.error('Erro ao buscar minhas denúncias:', error);
    res.status(500).json({ error: 'Erro ao buscar denúncias' });
  }
});

// Get all complaints
router.get('/', authenticateToken, async (req, res) => {
  try {
    const complaints = await Complaint.findAll({
      include: [
        { association: 'author', attributes: ['nickname'] },
        { 
          model: ComplaintLog,
          include: [{ association: 'changedBy', attributes: ['nickname'] }]
        },
        { model: Tag }
      ]
    });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar denúncias' });
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
    const { description, location, tagIds, polygonCoordinates } = req.body;

    if (!description || !location) {
      return res.status(400).json({ error: 'Descrição e localização são obrigatórios' });
    }

    console.log('Recebendo dados da denúncia:', {
      description,
      location,
      tagIds,
      polygonCoordinates
    });

    const complaint = await Complaint.create({
      description,
      location,
      polygonCoordinates,
      userId: req.user.id
    });

    console.log('Denúncia criada:', complaint.toJSON());

    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await complaint.setTags(tagIds);
    }

    // Criar log inicial
    await ComplaintLog.create({
      ComplaintId: complaint.id,
      newStatus: 'Em Análise',
      changedById: req.user.id
    });

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Erro ao criar denúncia:', error);
    res.status(500).json({ error: 'Erro ao criar denúncia' });
  }
});

module.exports = router;



