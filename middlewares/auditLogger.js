// backend/middlewares/auditLogger.js
import db from '../models/index.js';

export const auditLogger = async (req, res, next) => {
  res.on('finish', async () => {
    try {
      const { user } = req;
      const log = {
        userId: user ? user.id : null,
        action: `${req.method} ${req.originalUrl}`,
        targetType: req.body?.targetType || null,
        targetId: req.body?.targetId || null,
        details: {
          body: req.body || {},
          params: req.params || {},
          query: req.query || {}
        },
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
      };
      await db.AuditLog.create(log);
    } catch (err) {
      console.error('Erreur auditLogger:', err.message);
    }
  });
  next();
};
