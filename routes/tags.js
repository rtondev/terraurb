const express = require('express');
const router = express.Router();
const { Tag, Complaint } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Listar tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.findAll({
      include: [{
        model: Complaint,
        attributes: ['id'],
      }],
      order: [['name', 'ASC']]
    });

    // Formatar resposta incluindo contagem de denúncias
    const formattedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      complaintCount: tag.Complaints?.length || 0,
      createdAt: tag.createdAt
    }));

    res.json(formattedTags);
  } catch (error) {
    console.error('Erro ao listar tags:', error);
    res.status(500).json({ error: 'Erro ao listar tags' });
  }
});

// Criar tag
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await Tag.create({ name: name.toLowerCase() });
    res.status(201).json(tag);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Esta tag já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar tag' });
  }
});

// Atualizar tag
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await Tag.findByPk(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    await tag.update({ name: name.toLowerCase() });
    res.json(tag);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Esta tag já existe' });
    }
    res.status(500).json({ error: 'Erro ao atualizar tag' });
  }
});

// Deletar tag
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    await tag.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar tag' });
  }
});

module.exports = router;
