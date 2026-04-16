import prisma from '../../config/prisma.js';

export const DeviceController = {
    // 1. API: Thêm thiết bị mới vào tòa nhà
    addDevice: async (req, res) => {
        try {
            const { buildingId, code, type, name, location } = req.body;
            const user = req.user; // Lấy từ authMiddleware (id, role, buildingId)

            // 1. Kiểm tra quyền hạn
            // Nếu là BUILDING_ADMIN, chỉ được thêm thiết bị vào buildingId đã gán cho họ
            if (user.role === 'BUILDING_ADMIN') {
                if (parseInt(buildingId) !== user.buildingId) {
                    return res.status(403).json({
                        message: "Bạn không có quyền thêm thiết bị vào tòa nhà này!"
                    });
                }
            }

            // 2. Kiểm tra loại thiết bị hợp lệ (Theo topic của bạn)
            const validTypes = ['CHILLER', 'PIPE', 'VALVE', 'COLDPUMP', 'COOLINGPUMP', 'COOLINGTOWER'];
            if (!validTypes.includes(type.toUpperCase())) {
                return res.status(400).json({ message: "Loại thiết bị không hợp lệ!" });
            }

            // 3. Kiểm tra mã thiết bị (code) đã tồn tại chưa
            const existingDevice = await prisma.device.findUnique({ where: { code } });
            if (existingDevice) {
                return res.status(400).json({ message: "Mã thiết bị (code) đã tồn tại trong hệ thống!" });
            }

            // 4. Tạo thiết bị trong MySQL
            const newDevice = await prisma.device.create({
                data: {
                    code: code,
                    type: type.toUpperCase(),
                    name: name || `${type} ${code}`,
                    location: location || null,
                    buildingId: parseInt(buildingId),
                    latest_state: {} // Khởi tạo trạng thái rỗng
                }
            });

            res.status(201).json({
                message: "Thêm thiết bị vào tòa nhà thành công!",
                device: newDevice
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. API: Lấy danh sách thiết bị có phân quyền
    getDevices: async (req, res) => {
        try {
            // Thông tin user lấy từ Token sau khi qua Middleware verifyToken
            const { role, buildingId, id: userId } = req.user;
            let devices = [];

            // TRƯỜNG HỢP 1: Nếu là Admin Tổng -> Lấy toàn bộ thiết bị
            if (role === 'SUPER_ADMIN') {
                devices = await prisma.device.findMany({
                    include: {
                        building: true // Lấy kèm thông tin tòa nhà để hiển thị tên nhà
                    },
                    orderBy: {
                        type: 'asc' // Sắp xếp theo loại thiết bị cho dễ nhìn
                    }
                });
            }

            // TRƯỜNG HỢP 2: Nếu là Admin Tòa nhà -> Chỉ lấy thiết bị của nhà mình
            else if (role === 'BUILDING_ADMIN') {
                // Chúng ta query dựa trên buildingId đã được gán cho User này
                devices = await prisma.device.findMany({
                    where: {
                        buildingId: buildingId
                    },
                    include: {
                        building: true
                    },
                    orderBy: {
                        type: 'asc'
                    }
                });
            }

            res.status(200).json(devices);

        } catch (error) {
            console.error("❌ Lỗi lấy danh sách thiết bị:", error.message);
            res.status(500).json({ error: "Lỗi hệ thống khi lấy dữ liệu" });
        }
    }

};