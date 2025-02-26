const express = require('express');
const router = express.Router();
const { Tag } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Listar todas as tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.findAll({
      order: [['name', 'ASC']]
    });
    res.json(tags);
  } catch (error) {
    console.error('Erro ao listar tags:', error);
    res.status(500).json({ error: 'Erro ao listar tags' });
  }
});

// Criar nova tag (apenas admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem criar tags' });
    }

    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome da tag é obrigatório' });
    }

    const existingTag = await Tag.findOne({ where: { name } });
    if (existingTag) {
      return res.status(400).json({ error: 'Tag já existe' });
    }

    const tag = await Tag.create({ name });
    res.status(201).json(tag);
  } catch (error) {
    console.error('Erro ao criar tag:', error);
    res.status(500).json({ error: 'Erro ao criar tag' });
  }
});

// Atualizar tag (apenas admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem editar tags' });
    }

    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome da tag é obrigatório' });
    }

    const existingTag = await Tag.findOne({ where: { name } });
    if (existingTag && existingTag.id !== tag.id) {
      return res.status(400).json({ error: 'Já existe uma tag com este nome' });
    }

    await tag.update({ name });
    res.json(tag);
  } catch (error) {
    console.error('Erro ao atualizar tag:', error);
    res.status(500).json({ error: 'Erro ao atualizar tag' });
  }
});

// Deletar tag (apenas admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem deletar tags' });
    }

    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    await tag.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar tag:', error);
    res.status(500).json({ error: 'Erro ao deletar tag' });
  }
});

module.exports = router;
