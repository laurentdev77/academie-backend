const db = require('../models');
const AuditLog = db.AuditLog;

async function createAudit({ userId, actionType, targetType, targetId, payload, ip }) {
  try {
    await AuditLog.create({ userId, actionType, targetType, targetId, payload, ip });
  } catch (err) {
    console.error('Erreur audit:', err);
  }
}
module.exports = { createAudit };
