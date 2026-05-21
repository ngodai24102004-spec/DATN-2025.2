// src/modules/building/building.controller.js
import prisma from '../../config/prisma.js';

export const BuildingController = {
    // Lấy danh sách tất cả tòa nhà (Chỉ Super Admin)
    getAllBuildings: async (req, res) => {
        try {
            // Kiểm tra quyền bảo mật cấp cao nhất
            if (req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: "Chỉ Super Admin mới có quyền truy cập!" });
            }

            // Truy vấn lấy Tòa nhà kèm theo thông tin User quản lý nhà đó
            const buildings = await prisma.building.findMany({
                include: {
                    managers: {
                        include: {
                            user: {
                                select: { id: true, fullName: true, username: true } // Chỉ lấy thông tin cơ bản
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            res.status(200).json(buildings);
        } catch (error) {
            console.error("Lỗi lấy danh sách tòa nhà:", error);
            res.status(500).json({ error: "Lỗi hệ thống" });
        }
    },
    //  Lấy chi tiết 1 tòa nhà kèm thiết bị và người quản lý (Chỉ Super Admin)
    getBuildingById: async (req, res) => {
        try {
            if (req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: "Chỉ Super Admin mới có quyền truy cập!" });
            }

            const buildingId = parseInt(req.params.id);

            const building = await prisma.building.findUnique({
                where: { id: buildingId },
                include: {
                    // Lấy người quản lý
                    managers: {
                        include: {
                            user: { select: { id: true, fullName: true, username: true, createdAt: true } }
                        }
                    },
                    // Lấy toàn bộ thiết bị của nhà này
                    devices: {
                        orderBy: { type: 'asc' }
                    }
                }
            });

            if (!building) return res.status(404).json({ message: "Không tìm thấy tòa nhà" });

            res.status(200).json(building);
        } catch (error) {
            console.error("Lỗi lấy chi tiết tòa nhà:", error);
            res.status(500).json({ error: "Lỗi hệ thống" });
        }
    }
};