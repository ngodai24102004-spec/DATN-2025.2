// src/routes/building.routes.js
import express from 'express';
import { BuildingController } from '../modules/building/building.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();
// Lấy danh sách tất cả tòa nhà (Chỉ Super Admin)
router.get('/list', verifyToken, BuildingController.getAllBuildings);
// Lấy dashboard tổng quan hệ thống (Chỉ Super Admin)
router.get('/system-dashboard', verifyToken, BuildingController.getSystemDashboard);
// Lấy chi tiết 1 tòa nhà kèm thiết bị và người quản lý (Chỉ Super Admin)
router.get('/:id', verifyToken, BuildingController.getBuildingById);
// xóa tòa nhà (Chỉ Super Admin)
router.delete('/:id', verifyToken, BuildingController.deleteBuilding);
// Cập nhật tòa nhà (Chỉ Super Admin)
router.put('/:id', verifyToken, BuildingController.updateBuilding);

export default router;