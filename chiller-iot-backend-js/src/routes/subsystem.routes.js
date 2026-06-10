import express from 'express';
import { SubsystemController } from '../modules/subsystem/subsystem.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Lấy danh sách phân hệ (Yêu cầu đăng nhập)
router.get('/list', verifyToken, SubsystemController.getSubsystems);

// Thêm phân hệ mới (Yêu cầu đăng nhập)
router.post('/add', verifyToken, SubsystemController.addSubsystem);

router.delete('/:id', verifyToken, SubsystemController.deleteSubsystem);

export default router;