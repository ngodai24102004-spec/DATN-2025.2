import prisma from '../../config/prisma.js';

export const DeviceController = {
    // API: Thêm thiết bị mới vào tòa nhà
    addDevice: async (req, res) => {
        try {
            const { buildingId, code, type, name } = req.body;
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

    // Các hàm getDevices, getHistory... giữ nguyên như đã bàn
};