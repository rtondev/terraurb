const express = require('express');
const router = express.Router();
const { User, ActivityLog } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Middleware para verificar se o usuário é admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

// Todas as rotas admin requerem autenticação e permissão de admin
router.use(authenticateToken);
router.use(isAdmin);

// Listar todos os usuários
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'nickname', 'email', 'role', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete another admin user' });
    }

    await user.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Dentro da rota de logs
router.get('/activity-logs', async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      include: [{
        model: User,
        attributes: ['id', 'nickname', 'avatarUrl'],
        as: 'user'
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(logs);
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro ao buscar logs de atividade' });
  }
});

module.exports = router;


