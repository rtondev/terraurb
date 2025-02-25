const express = require('express');
const router = express.Router();
const { User } = require('../models/db');
const { Complaint } = require('../models/complaint');
const { Comment } = require('../models/comment');

router.get('/', async (req, res) => {
    try {
        const [
            totalUsers,
            totalComplaints,
            resolvedComplaints,
            totalComments
        ] = await Promise.all([
            User.count(),
            Complaint.count(),
            Complaint.count({ where: { status: 'Resolvido' } }),
            Comment.count()
        ]);

        res.json({
            totalUsers,
            totalComplaints,
            resolvedComplaints,
            totalComments
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

module.exports = router; 