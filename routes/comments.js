const express = require('express');
const router = express.Router();
const { Comment, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Criar novo comentário
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { complaintId, content } = req.body;
    const userId = req.user.id;

    const comment = await Comment.create({
      complaintId,
      userId,
      content
    });

    // Retornar o comentário com os dados do usuário
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        attributes: ['id', 'nickname', 'avatarUrl'],
        as: 'user'
      }]
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    res.status(500).json({ error: 'Erro ao criar comentário' });
  }
});

// Listar comentários de uma denúncia
router.get('/complaint/:complaintId', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { complaintId: req.params.complaintId },
      include: [{
        model: User,
        attributes: ['id', 'nickname', 'avatarUrl'],
        as: 'user'
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(comments);
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
});

// Atualizar comentário
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para editar este comentário' });
    }

    const { content } = req.body;
    await comment.update({ content });

    res.json(comment);
  } catch (error) {
    console.error('Erro ao atualizar comentário:', error);
    res.status(500).json({ error: 'Erro ao atualizar comentário' });
  }
});

// Deletar comentário
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para deletar este comentário' });
    }

    await comment.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    res.status(500).json({ error: 'Erro ao deletar comentário' });
  }
});

module.exports = router;
