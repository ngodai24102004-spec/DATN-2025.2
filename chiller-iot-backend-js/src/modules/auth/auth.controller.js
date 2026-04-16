import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const AuthController = {
    // 1.API: Đăng ký 
    register: async (req, res) => {
        try {
            const {
                username, password, fullName, role, // Thông tin chung
                buildingName, buildingCode, address   // Thông tin riêng cho BUILDING_ADMIN
            } = req.body;

            // 1. Kiểm tra Role có hợp lệ không
            if (!['SUPER_ADMIN', 'BUILDING_ADMIN'].includes(role)) {
                return res.status(400).json({ message: "Vai trò (role) bắt buộc phải là SUPER_ADMIN hoặc BUILDING_ADMIN" });
            }

            // 2. Kiểm tra xem username đã tồn tại chưa
            const userExist = await prisma.user.findUnique({ where: { username } });
            if (userExist) return res.status(400).json({ message: "Username này đã được sử dụng" });

            // 3. Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // ==========================================
            // KỊCH BẢN 1: NẾU TẠO SUPER_ADMIN
            // ==========================================
            if (role === 'SUPER_ADMIN') {
                const newUser = await prisma.user.create({
                    data: { username, password: hashedPassword, fullName, role: 'SUPER_ADMIN' }
                });
                return res.status(201).json({
                    message: "Tạo tài khoản Quản trị viên Tổng (SUPER_ADMIN) thành công!",
                    data: { username: newUser.username, role: newUser.role, fullName: newUser.fullName }
                });
            }

            // ==========================================
            // KỊCH BẢN 2: NẾU TẠO BUILDING_ADMIN
            // ==========================================
            if (role === 'BUILDING_ADMIN') {
                // Ép buộc phải nhập thông tin tòa nhà
                if (!buildingCode || !buildingName) {
                    return res.status(400).json({ message: "Cần cung cấp buildingName và buildingCode để tạo Admin Tòa nhà" });
                }

                // Kiểm tra mã tòa nhà xem có bị trùng không
                const buildingExist = await prisma.building.findUnique({ where: { code: buildingCode } });
                if (buildingExist) return res.status(400).json({ message: "Mã tòa nhà (Building Code) đã tồn tại" });

                // Dùng Transaction để tạo đồng thời Tòa nhà và User
                const result = await prisma.$transaction(async (tx) => {
                    const newBuilding = await tx.building.create({
                        data: { name: buildingName, code: buildingCode, address: address || "" }
                    });

                    const newUser = await tx.user.create({
                        data: { username, password: hashedPassword, fullName, role: 'BUILDING_ADMIN' }
                    });

                    // Cấp quyền quản lý nhà này cho user
                    await tx.userBuilding.create({
                        data: { userId: newUser.id, buildingId: newBuilding.id }
                    });

                    return { user: newUser, building: newBuilding };
                });

                return res.status(201).json({
                    message: "Khởi tạo Tòa nhà và cấp quyền BUILDING_ADMIN thành công!",
                    data: {
                        username: result.user.username,
                        role: result.user.role,
                        buildingName: result.building.name,
                        buildingId: result.building.id
                    }
                });
            }

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Lỗi hệ thống khi đăng ký" });
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
    },

    // API Lấy thông tin cá nhân
    getProfile: async (req, res) => {
        try {
            // Kiểm tra xem middleware verifyToken đã gán user vào req chưa
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: "Không xác định được người dùng" });
            }

            const userId = req.user.id;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    role: true,
                    createdAt: true,
                    managedBuildings: {
                        include: {
                            building: true
                        }
                    }
                }
            });

            if (!user) {
                return res.status(404).json({ message: "Người dùng không tồn tại trong hệ thống" });
            }

            res.json(user);
        } catch (error) {
            // Dòng này sẽ in lỗi chi tiết ra màn hình đen (Backend Terminal) của bạn
            console.error("❌ Lỗi API Profile:", error);
            res.status(500).json({ error: "Lỗi hệ thống khi lấy thông tin cá nhân" });
        }
    }

};