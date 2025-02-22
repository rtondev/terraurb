const express = require('express');
const router = express.Router();
const { Report } = require('../models/report');
const { User } = require('../models/db');
const { Complaint } = require('../models/complaint');
const { Comment } = require('../models/comment');
const { authenticateToken } = require('./auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// Create a new report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, reason, targetId } = req.body;

    if (!type || !reason || !targetId) {
      return res.status(400).json({ error: 'Tipo, razão e ID do alvo são obrigatórios' });
    }

    if (!['complaint', 'comment'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de denúncia inválido' });
    }

    // Verify if target exists
    const Target = type === 'complaint' ? Complaint : Comment;
    const target = await Target.findByPk(targetId);
    if (!target) {
      return res.status(404).json({ error: `${type === 'complaint' ? 'Denúncia' : 'Comentário'} não encontrado` });
    }

    const report = await Report.create({
      type,
      reason,
      targetId,
      reporterId: req.user.id
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar denúncia' });
  }
});

// Get all reports (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        { association: 'reporter', attributes: ['nickname'] },
        { association: 'reviewer', attributes: ['nickname'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar denúncias' });
  }
});

// Review a report (admin only)
router.patch('/:id/review', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    const report = await Report.findByPk(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }

    if (!['inappropriate', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    await report.update({
      status,
      reviewNote,
      reviewedBy: req.user.id
    });

    // If marked as inappropriate, hide the target content
    if (status === 'inappropriate') {
      const Target = report.type === 'complaint' ? Complaint : Comment;
      await Target.destroy({ where: { id: report.targetId } });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao revisar denúncia' });
  }
});

// Admin routes for content management
// Delete user (admin only)
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Não é possível excluir outro administrador' });
    }

    await user.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

// Delete complaint (admin only)
router.delete('/complaints/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }

    await complaint.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir denúncia' });
  }
});

// Delete comment (admin only)
router.delete('/comments/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    await comment.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir comentário' });
  }
});

module.exports = router;
