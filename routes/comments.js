const express = require('express');
const router = express.Router();
const { Comment } = require('../models/comment');
const { authenticateToken } = require('./auth');

// Create a new comment
router.post('/:complaintId', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const { complaintId } = req.params;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const comment = await Comment.create({
      content,
      userId: req.user.id,
      complaintId
    });

    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [{ association: 'author', attributes: ['nickname'] }]
    });

    res.status(201).json(commentWithAuthor);
  } catch (error) {
    res.status(500).json({ error: 'Error creating comment' });
  }
});

// Get all comments for a complaint
router.get('/:complaintId', authenticateToken, async (req, res) => {
  try {
    const { complaintId } = req.params;

    const comments = await Comment.findAll({
      where: { complaintId },
      include: [{ association: 'author', attributes: ['nickname'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching comments' });
  }
});

module.exports = router;
