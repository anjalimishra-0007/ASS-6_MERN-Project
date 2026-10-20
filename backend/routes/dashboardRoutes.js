import express from 'express';
import { getAdminDashboardStats } from '../controllers/dashboardController.js';
import { protect, allowRoles } from '../middleware/authHandler.js';

const router = express.Router();

router.get('/stats', protect, allowRoles('admin'), getAdminDashboardStats);

export default router;
