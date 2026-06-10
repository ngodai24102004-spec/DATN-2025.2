import express from 'express';
import authRoutes from './auth.routes.js';
import deviceRoutes from './device.routes.js';
import buildingRoutes from './building.routes.js';
import subsystemRoutes from './subsystem.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/buildings', buildingRoutes);
router.use('/subsystems', subsystemRoutes);

export default router;