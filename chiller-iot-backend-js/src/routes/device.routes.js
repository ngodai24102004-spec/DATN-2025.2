import express from 'express';
import { DeviceController } from '../modules/device/device.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// API thêm thiết bị (Yêu cầu đăng nhập)
router.post('/add', verifyToken, DeviceController.addDevice);

// API lấy danh sách thiết bị (Yêu cầu đăng nhập)
router.get('/list', verifyToken, DeviceController.getDevices);

export default router;