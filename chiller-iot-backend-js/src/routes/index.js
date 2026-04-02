import express from 'express';
import authRoutes from './auth.routes.js';
import deviceRoutes from './device.routes.js'; // Sau này bạn sẽ dùng đến

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);

export default router;