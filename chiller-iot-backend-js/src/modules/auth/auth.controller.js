import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const AuthController = {
    // 1.API: Đăng ký Quản lý kèm theo Khởi tạo Tòa nhà mới
    registerWithBuilding: async (req, res) => {
        try {
            const {
                username, password, fullName,
                buildingName, buildingCode, address
            } = req.body;

            // 1. Kiểm tra username đã tồn tại chưa
            const userExist = await prisma.user.findUnique({ where: { username } });
            if (userExist) return res.status(400).json({ message: "Username này đã được sử dụng" });

            // 2. Kiểm tra Building Code đã tồn tại chưa (tránh trùng mã tòa nhà)
            const buildingExist = await prisma.building.findUnique({ where: { code: buildingCode } });
            if (buildingExist) return res.status(400).json({ message: "Mã tòa nhà (Building Code) đã tồn tại" });

            // 3. Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // 4. Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu
            const result = await prisma.$transaction(async (tx) => {

                // Bước A: Khởi tạo Tòa nhà mới
                const newBuilding = await tx.building.create({
                    data: {
                        name: buildingName,
                        code: buildingCode,
                        address: address || ""
                    }
                });

                // Bước B: Tạo User với quyền BUILDING_ADMIN
                const newUser = await tx.user.create({
                    data: {
                        username,
                        password: hashedPassword,
                        fullName,
                        role: 'BUILDING_ADMIN'
                    }
                });

                // Bước C: Gán User vừa tạo làm Quản lý cho Tòa nhà vừa tạo
                await tx.userBuilding.create({
                    data: {
                        userId: newUser.id,
                        buildingId: newBuilding.id
                    }
                });

                return { user: newUser, building: newBuilding };
            });

            res.status(201).json({
                message: "Khởi tạo Tòa nhà và cấp quyền Quản lý thành công!",
                data: {
                    username: result.user.username,
                    buildingName: result.building.name,
                    buildingId: result.building.id // Sau này dùng ID này để thêm Chiller
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Lỗi hệ thống khi khởi tạo" });
        }
    },


    // 2. Đăng nhập (Login)
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            const user = await prisma.user.findUnique({
                where: { username },
                include: { managedBuildings: { include: { building: true } } }
            });

            if (!user) return res.status(404).json({ message: "Sai tài khoản hoặc mật khẩu" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu" });

            // Lấy thông tin tòa nhà nếu là BUILDING_ADMIN
            let buildingInfo = null;
            if (user.role === 'BUILDING_ADMIN' && user.managedBuildings.length > 0) {
                const b = user.managedBuildings[0].building;
                buildingInfo = { id: b.id, code: b.code, name: b.name };
            }

            const token = jwt.sign(
                { id: user.id, role: user.role, buildingId: buildingInfo?.id || null },
                process.env.JWT_SECRET || 'SECRET_KEY',
                { expiresIn: '1d' }
            );

            res.json({
                token,
                user: { fullName: user.fullName, role: user.role, building: buildingInfo }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};