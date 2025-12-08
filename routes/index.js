// backend/routes/index.js
import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import { authenticateJwt } from '../middlewares/authJwt.js';
import { auditLogger } from '../middlewares/auditLogger.js';

const router = express.Router();

router.use('/auth', auditLogger, authRoutes);
router.use('/users', authenticateJwt, auditLogger, userRoutes);

export default router;
