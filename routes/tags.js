const express = require('express');
const router = express.Router();
const { Tag } = require('../models/tag');
const { authenticateToken } = require('./auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Create a new tag (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = await Tag.create({ name });
    res.status(201).json(tag);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Tag name already exists' });
    }
    res.status(500).json({ error: 'Error creating tag' });
  }
});

// Get all tags
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tags = await Tag.findAll();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tags' });
  }
});

// Delete a tag (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await tag.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting tag' });
  }
});

module.exports = router;
