const express = require('express');
const router = express.Router();
const { Report } = require('../models/report');
const { authenticateToken } = require('../middleware/auth');
const { Comment } = require('../models/comment');
const { Complaint } = require('../models/complaint');
const { User } = require('../models/user');
const { sequelize } = require('../models/db');

// Criar denúncia
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, targetId, reason, references } = req.body;
    const userId = req.user.id;

    // Validação dos campos obrigatórios
    if (!type || !targetId || !reason) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: type, targetId e reason' 
      });
    }

    // Validar tipo
    if (!['comment', 'complaint'].includes(type)) {
      return res.status(400).json({ 
        error: 'Tipo inválido. Use: comment ou complaint' 
      });
    }

    // Verificar se já existe uma denúncia do mesmo usuário
    const existingReport = await Report.findOne({
      where: {
        type,
        targetId,
        userId,
        status: 'pending' // Apenas denúncias pendentes
      }
    });

    if (existingReport) {
      return res.status(400).json({ 
        error: 'Você já denunciou este item' 
      });
    }

    // Criar a denúncia com referências
    const report = await Report.create({
      type,
      targetId,
      reason,
      userId,
      status: 'pending',
      references,
      complaintId: type === 'complaint' ? targetId : references?.complaintId
    });

    res.status(201).json(report);

  } catch (error) {
    console.error('Erro ao criar denúncia:', error);
    res.status(500).json({ 
      error: 'Erro ao processar denúncia',
      details: error.message 
    });
  }
});

// Listar denúncias (admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'nickname', 'email']
        }
      ],
      where: {
        status: 'pending'
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(reports);
  } catch (error) {
    console.error('Erro ao listar denúncias:', error);
    res.status(500).json({ error: 'Erro ao listar denúncias' });
  }
});

// Resolver denúncia (admin)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status inválido. Use: resolved ou rejected' 
      });
    }

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }

    await sequelize.transaction(async (t) => {
      // Atualizar status da denúncia
      await report.update({
        status,
        adminNote,
        resolvedAt: new Date(),
        resolvedBy: req.user.id
      }, { transaction: t });

      // Se aprovada, remover o conteúdo denunciado
      if (status === 'resolved') {
        if (report.type === 'comment') {
          await Comment.destroy({
            where: { id: report.targetId },
            transaction: t
          });
        } else if (report.type === 'complaint') {
          await Complaint.update(
            { status: 'Cancelado' },
            { 
              where: { id: report.targetId },
              transaction: t
            }
          );
        }
      }
    });

    res.json(report);
  } catch (error) {
    console.error('Erro ao resolver denúncia:', error);
    res.status(500).json({ error: 'Erro ao resolver denúncia' });
  }
});

// Verificar se usuário já denunciou
router.get('/check', authenticateToken, async (req, res) => {
  try {
    const { type, targetId } = req.query;
    const userId = req.user.id;

    const existingReport = await Report.findOne({
      where: {
        type,
        targetId,
        userId,
        status: 'pending'
      }
    });

    res.json({ exists: !!existingReport });
  } catch (error) {
    console.error('Erro ao verificar denúncia:', error);
    res.status(500).json({ error: 'Erro ao verificar denúncia' });
  }
});

module.exports = router;
