const { ActivityLog } = require('../models/activityLog');

async function logActivity(userId, action, details = null) {
  try {
    await ActivityLog.create({
      userId,
      action,
      details
    });
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
  }
}

module.exports = { logActivity }; 