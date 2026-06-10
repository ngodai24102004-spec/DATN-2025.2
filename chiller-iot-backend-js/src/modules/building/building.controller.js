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
    },

    // Hàm xóa tòa nhà (Chỉ dành cho Super Admin)
    deleteBuilding: async (req, res) => {
        try {
            if (req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: "Chỉ Super Admin mới có quyền xóa cơ sở!" });
            }

            const buildingId = parseInt(req.params.id);

            // 1. Kiểm tra tòa nhà tồn tại
            const building = await prisma.building.findUnique({
                where: { id: buildingId },
                include: { devices: true }
            });
            if (!building) return res.status(404).json({ message: "Tòa nhà không tồn tại" });

            // 2. Dùng Transaction để xóa sạch các dữ liệu liên quan THEO ĐÚNG THỨ TỰ
            await prisma.$transaction([
                // Bước 1: Xóa liên kết người quản lý - tòa nhà
                prisma.userBuilding.deleteMany({ where: { buildingId } }),

                // Bước 2: Xóa nhật ký điều khiển của các thiết bị trong nhà này
                prisma.controlLog.deleteMany({
                    where: { device_code: { in: building.devices.map(d => d.code) } }
                }),

                // Bước 3: Xóa toàn bộ thiết bị thuộc tòa nhà
                prisma.device.deleteMany({ where: { buildingId } }),

                // Bước 4 (BỔ SUNG CỰC KỲ QUAN TRỌNG): Xóa toàn bộ Phân hệ (Subsystem)
                prisma.subsystem.deleteMany({ where: { buildingId } }),

                // Bước 5: Cuối cùng mới xóa Tòa nhà
                prisma.building.delete({ where: { id: buildingId } })
            ]);

            res.status(200).json({ message: "Đã xóa toàn bộ cơ sở và dữ liệu liên quan thành công" });
        } catch (error) {
            console.error("Lỗi xóa tòa nhà:", error);
            res.status(500).json({ error: "Lỗi hệ thống khi xóa tòa nhà" });
        }
    },

    // Hàm cập nhật thông tin tòa nhà
    updateBuilding: async (req, res) => {
        try {
            if (req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: "Không có quyền thực hiện!" });
            }

            const buildingId = parseInt(req.params.id);
            const { name, code, address } = req.body;

            // 1. Kiểm tra tồn tại
            const building = await prisma.building.findUnique({ where: { id: buildingId } });
            if (!building) return res.status(404).json({ message: "Tòa nhà không tồn tại" });

            // 2. Kiểm tra trùng mã code nếu có thay đổi
            if (code !== building.code) {
                const codeExist = await prisma.building.findUnique({ where: { code } });
                if (codeExist) return res.status(400).json({ message: "Mã tòa nhà này đã tồn tại!" });
            }

            // 3. Cập nhật
            const updated = await prisma.building.update({
                where: { id: buildingId },
                data: {
                    name: name.trim(),
                    code: code.trim(),
                    address: address?.trim()
                }
            });

            res.json({ message: "Cập nhật cơ sở thành công", data: updated });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Lỗi hệ thống" });
        }
    },

    // Lấy thống kê tổng quan và Lịch sử hoạt động (Dành cho Super Admin Dashboard)
    getSystemDashboard: async (req, res) => {
        try {
            if (req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: "Chỉ Super Admin mới có quyền truy cập!" });
            }

            // 1. Lấy thống kê đếm số lượng
            const totalBuildings = await prisma.building.count();
            const totalAdmins = await prisma.user.count({ where: { role: 'BUILDING_ADMIN' } });
            const totalDevices = await prisma.device.count();

            // 2. Lấy 50 lịch sử điều khiển mới nhất kèm thông tin người dùng và tòa nhà
            const recentLogs = await prisma.controlLog.findMany({
                take: 50,
                orderBy: { created_at: 'desc' },
                include: {
                    user: {
                        select: { fullName: true, username: true }
                    },
                    device: {
                        include: {
                            building: { select: { name: true, code: true } },
                            subsystem: { select: { name: true } } // Lấy thêm tên phân hệ
                        }
                    }
                }
            });

            res.status(200).json({
                stats: { totalBuildings, totalAdmins, totalDevices },
                recentLogs
            });
        } catch (error) {
            console.error("Lỗi lấy dữ liệu Dashboard:", error);
            res.status(500).json({ error: "Lỗi hệ thống" });
        }
    }
};