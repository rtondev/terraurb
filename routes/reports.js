const express = require('express');
const router = express.Router();
const { Report, User, Complaint, Comment } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Listar todos os reports (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem ver todos os reports' });
    }

    const reports = await Report.findAll({
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'nickname']
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['id', 'nickname']
        },
        {
          model: Complaint,
          as: 'complaintTarget',
          attributes: ['id', 'title'],
          required: false
        },
        {
          model: Comment,
          as: 'commentTarget',
          attributes: ['id', 'content'],
          required: false,
          include: [{
            model: User,
            attributes: ['id', 'nickname']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Formatar os dados para a resposta
    const formattedReports = reports.map(report => {
      const reportData = report.toJSON();
      
      // Adicionar informações do alvo baseado no tipo
      if (report.type === 'complaint' && report.complaintTarget) {
        reportData.target = {
          id: report.complaintTarget.id,
          title: report.complaintTarget.title,
          type: 'Denúncia'
        };
      } else if (report.type === 'comment' && report.commentTarget) {
        reportData.target = {
          id: report.commentTarget.id,
          content: report.commentTarget.content,
          author: report.commentTarget.User?.nickname,
          type: 'Comentário'
        };
      }

      // Limpar as associações brutas
      delete reportData.complaintTarget;
      delete reportData.commentTarget;

      return reportData;
    });

    res.json(formattedReports);
  } catch (error) {
    console.error('Erro ao listar reports:', error);
    res.status(500).json({ error: 'Erro ao listar reports' });
  }
});

// Criar novo report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, targetId, reason } = req.body;
    const userId = req.user.id;

    // Validar tipo
    if (!['complaint', 'comment'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de denúncia inválido' });
    }

    // Verificar se o alvo existe
    let target;
    if (type === 'complaint') {
      target = await Complaint.findByPk(targetId);
    } else {
      target = await Comment.findByPk(targetId);
    }

    if (!target) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    // Verificar se já existe uma denúncia deste usuário para este alvo
    const existingReport = await Report.findOne({
      where: {
        type,
        targetId,
        userId
      }
    });

    if (existingReport) {
      return res.status(400).json({ error: 'Você já denunciou este conteúdo' });
    }

    const report = await Report.create({
      type,
      targetId,
      reason,
      userId,
      status: 'Pendente'
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Erro ao criar denúncia:', error);
    res.status(500).json({ error: 'Erro ao criar denúncia' });
  }
});

// Atualizar status do report (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem atualizar reports' });
    }

    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report não encontrado' });
    }

    const { status, adminNote } = req.body;
    await report.update({
      status,
      adminNote,
      resolvedAt: status === 'resolved' ? new Date() : null,
      resolvedBy: status === 'resolved' ? req.user.id : null
    });

    res.json(report);
  } catch (error) {
    console.error('Erro ao atualizar report:', error);
    res.status(500).json({ error: 'Erro ao atualizar report' });
  }
});

// Deletar report (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem deletar reports' });
    }

    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report não encontrado' });
    }

    await report.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar report:', error);
    res.status(500).json({ error: 'Erro ao deletar report' });
  }
});

module.exports = router;
