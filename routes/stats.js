const express = require('express');
const router = express.Router();
const { User, Complaint } = require('../models');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [totalComplaints, totalUsers, resolvedComplaints, inProgressComplaints] = await Promise.all([
      Complaint.count(),
      User.count(),
      Complaint.count({ where: { status: 'Resolvido' } }),
      Complaint.count({ where: { status: 'Em Andamento' } })
    ]);

    res.json({
      total: totalComplaints,
      users: totalUsers,
      resolved: resolvedComplaints,
      inProgress: inProgressComplaints,
      pending: totalComplaints - resolvedComplaints - inProgressComplaints
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router; 