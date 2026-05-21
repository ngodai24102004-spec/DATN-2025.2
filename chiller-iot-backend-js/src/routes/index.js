import express from 'express';
import authRoutes from './auth.routes.js';
import deviceRoutes from './device.routes.js';
import buildingRoutes from './building.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/buildings', buildingRoutes);

export default router;