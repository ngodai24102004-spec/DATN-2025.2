import express from 'express';
import { DeviceController } from '../modules/device/device.controller.js';
import { AnalyticController } from '../modules/analytic/analytic.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// API thêm thiết bị (Yêu cầu đăng nhập)
router.post('/add', verifyToken, DeviceController.addDevice);

// API xóa thiết bị (Yêu cầu đăng nhập)
router.delete('/:id', verifyToken, DeviceController.deleteDevice);

// API lấy danh sách thiết bị (Yêu cầu đăng nhập)
router.get('/list', verifyToken, DeviceController.getDevices);

//API lấy lịch sử thiết bị (Yêu cầu đăng nhập)
router.get('/history', verifyToken, AnalyticController.getDeviceHistory);

// API điều khiển thiết bị (Yêu cầu đăng nhập)
router.post('/control', verifyToken, DeviceController.executeControl);

// API cập nhật thông tin thiết bị (Yêu cầu đăng nhập)
router.put('/:id', verifyToken, DeviceController.updateDevice);


export default router;