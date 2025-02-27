const express = require('express');
const router = express.Router();
const { User } = require('../models/user');
const { ActivityLog } = require('../models/activityLog');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

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
    console.log('Buscando usuários...'); // Debug
    const users = await User.findAll({
      attributes: ['id', 'nickname', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ActivityLog,
          as: 'activities',
          attributes: ['createdAt'],
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    console.log(`Encontrados ${users.length} usuários`); // Debug
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

// Rota para buscar logs de atividade
router.get('/activity-logs', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar logs dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await ActivityLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      include: [{
        model: User,
        attributes: ['id', 'nickname'],
        as: 'user'
      }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.json(logs);
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro ao buscar logs de atividade' });
  }
});

// Alterar papel do usuário
router.patch('/users/:id/role', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Papel inválido' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Impedir que o admin remova seu próprio acesso
    if (user.id === req.user.id) {
      return res.status(400).json({ 
        error: 'Não é possível alterar suas próprias permissões' 
      });
    }

    await user.update({ role });

    res.json({ message: 'Papel atualizado com sucesso', user });
  } catch (error) {
    console.error('Erro ao atualizar papel:', error);
    res.status(500).json({ error: 'Erro ao atualizar papel' });
  }
});

module.exports = router;


