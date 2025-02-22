const express = require('express');
const router = express.Router();
const { Complaint, ComplaintLog } = require('../models/complaint');
const { Tag } = require('../models/tag');
const { authenticateToken } = require('./auth');

// Middleware to check if user is authorized to change complaint status
const canChangeStatus = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'city_hall') {
    return res.status(403).json({ error: 'Apenas administradores e funcionários da prefeitura podem alterar o status.' });
  }
  next();
};

// Create a new complaint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { description, location, tagIds } = req.body;

    if (!description || !location) {
      return res.status(400).json({ error: 'Descrição e localização são obrigatórios' });
    }

    if (tagIds && !Array.isArray(tagIds)) {
      return res.status(400).json({ error: 'tagIds deve ser um array' });
    }

    const complaint = await Complaint.create({
      description,
      location,
      userId: req.user.id
    });

    if (tagIds && tagIds.length > 0) {
      await complaint.setTags(tagIds);
    }

    // Create initial log entry
    await ComplaintLog.create({
      ComplaintId: complaint.id,
      newStatus: 'Em Análise',
      changedById: req.user.id
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar denúncia' });
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

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar denúncia' });
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

module.exports = router;
