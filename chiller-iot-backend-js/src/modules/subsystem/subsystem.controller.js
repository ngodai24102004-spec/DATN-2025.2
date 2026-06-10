import prisma from '../../config/prisma.js';

export const SubsystemController = {
    // 1. Lấy danh sách phân hệ của tòa nhà
    getSubsystems: async (req, res) => {
        try {
            const { buildingId, role } = req.user;

            // Nếu là Building Admin, chỉ lấy phân hệ của nhà mình
            const whereClause = role === 'BUILDING_ADMIN' ? { buildingId: buildingId } : {};

            const subsystems = await prisma.subsystem.findMany({
                where: whereClause,
                include: { _count: { select: { devices: true } } } // Đếm số thiết bị
            });
            res.json(subsystems);
        } catch (error) {
            res.status(500).json({ error: "Lỗi lấy danh sách phân hệ" });
        }
    },

    // 2. Thêm phân hệ mới
    addSubsystem: async (req, res) => {
        try {
            const { name, code, buildingId } = req.body;
            const newSubsystem = await prisma.subsystem.create({
                data: { name, code, buildingId: parseInt(buildingId) }
            });
            res.status(201).json(newSubsystem);
        } catch (error) {
            res.status(500).json({ error: "Lỗi thêm phân hệ" });
        }
    },

    // 3. Xóa phân hệ (Xóa luôn các thiết bị bên trong)
    deleteSubsystem: async (req, res) => {
        try {
            const subsystemId = parseInt(req.params.id);
            const user = req.user;

            // Dùng transaction để xóa thiết bị trước, xóa phân hệ sau (tránh lỗi khóa ngoại)
            await prisma.$transaction([
                // Xóa lịch sử điều khiển của các thiết bị thuộc phân hệ này
                prisma.controlLog.deleteMany({
                    where: { device: { subsystemId: subsystemId } }
                }),
                // Xóa thiết bị thuộc phân hệ
                prisma.device.deleteMany({
                    where: { subsystemId: subsystemId }
                }),
                // Cuối cùng xóa phân hệ
                prisma.subsystem.delete({
                    where: { id: subsystemId }
                })
            ]);

            res.status(200).json({ message: "Xóa phân hệ thành công!" });
        } catch (error) {
            console.error("Lỗi xóa phân hệ:", error);
            res.status(500).json({ error: "Lỗi hệ thống khi xóa phân hệ" });
        }
    }
};