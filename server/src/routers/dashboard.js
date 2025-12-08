import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

// Route lấy thống kê dashboard
router.get('/stats', getDashboardStats);

export default router;
