const express = require('express');
const router = express.Router();
const { Report, User, Complaint } = require('../models');
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
          model: Complaint,
          attributes: ['id', 'title']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(reports);
  } catch (error) {
    console.error('Erro ao listar reports:', error);
    res.status(500).json({ error: 'Erro ao listar reports' });
  }
});

// Criar novo report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { complaintId, reason, description } = req.body;

    if (!complaintId || !reason) {
      return res.status(400).json({ error: 'ComplaintId e reason são obrigatórios' });
    }

    // Verificar se a denúncia existe
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }

    // Verificar se o usuário já reportou esta denúncia
    const existingReport = await Report.findOne({
      where: {
        complaintId,
        userId: req.user.id
      }
    });

    if (existingReport) {
      return res.status(400).json({ error: 'Você já reportou esta denúncia' });
    }

    const report = await Report.create({
      complaintId,
      userId: req.user.id,
      reason,
      description,
      status: 'pending'
    });

    const reportWithDetails = await Report.findByPk(report.id, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'nickname']
        },
        {
          model: Complaint,
          attributes: ['id', 'title']
        }
      ]
    });

    res.status(201).json(reportWithDetails);
  } catch (error) {
    console.error('Erro ao criar report:', error);
    res.status(500).json({ error: 'Erro ao criar report' });
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
