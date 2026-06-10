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

    // 3. API Lấy thông tin cá nhân
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
    },

    // 4. API Cập nhật tên hiển thị
    updateProfileName: async (req, res) => {
        try {
            const { fullName } = req.body;
            const userId = req.user.id; // Lấy từ Token

            if (!fullName || fullName.trim() === "") {
                return res.status(400).json({ message: "Tên không được để trống" });
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { fullName: fullName.trim() },
                select: {
                    id: true,
                    fullName: true,
                    username: true,
                    role: true
                }
            });

            res.json({
                message: "Cập nhật tên thành công",
                user: updatedUser
            });
        } catch (error) {
            console.error("❌ Lỗi Update Name:", error);
            res.status(500).json({ error: "Lỗi hệ thống khi cập nhật tên" });
        }
    },

    // 5. Lấy danh sách Building Admin (Dành cho Super Admin)
    getBuildingAdmins: async (req, res) => {
        try {
            // Chỉ Super Admin mới được xem danh sách này
            if (req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: "Bạn không có quyền truy cập!" });
            }

            const admins = await prisma.user.findMany({
                where: {
                    role: 'BUILDING_ADMIN'
                },
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    createdAt: true,
                    // Lấy luôn thông tin tòa nhà mà người này đang quản lý
                    managedBuildings: {
                        include: {
                            building: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            res.status(200).json(admins);
        } catch (error) {
            console.error("Lỗi lấy danh sách Admin:", error);
            res.status(500).json({ error: "Lỗi hệ thống" });
        }
    },

    // 6. Xóa tài khoản Building Admin (Dành cho Super Admin)
    deleteUser: async (req, res) => {
        try {
            // 1. Bảo mật: Chỉ Super Admin mới có quyền xóa
            if (req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: "Không có quyền thực hiện!" });
            }

            const userId = parseInt(req.params.id);

            // 2. Kiểm tra user có tồn tại không
            const targetUser = await prisma.user.findUnique({ where: { id: userId } });
            if (!targetUser) return res.status(404).json({ message: "Người dùng không tồn tại" });

            // 3. Không cho phép Super Admin tự xóa chính mình qua API này
            if (targetUser.id === req.user.id) {
                return res.status(400).json({ message: "Bạn không thể tự xóa chính mình!" });
            }

            // 4. Dùng Transaction để xóa sạch dữ liệu liên quan
            await prisma.$transaction([
                // Xóa liên kết người dùng - tòa nhà
                prisma.userBuilding.deleteMany({ where: { userId: userId } }),
                // Cuối cùng xóa User
                prisma.user.delete({ where: { id: userId } })
            ]);

            res.json({ message: "Đã xóa tài khoản thành công" });
        } catch (error) {
            console.error("Lỗi xóa user:", error);
            res.status(500).json({ error: "Lỗi hệ thống khi xóa người dùng" });
        }
    },

    // 7. Cập nhật thông tin tài khoản (Dành cho Super Admin)
    updateUserByAdmin: async (req, res) => {
        try {
            // 1. Chỉ Super Admin mới có quyền
            if (req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: "Không có quyền thực hiện!" });
            }

            const userId = parseInt(req.params.id);
            const { fullName, username, password } = req.body;

            // 2. Kiểm tra user tồn tại
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

            // 3. Kiểm tra trùng username nếu có thay đổi
            if (username && username !== user.username) {
                const exist = await prisma.user.findUnique({ where: { username } });
                if (exist) return res.status(400).json({ message: "Tên đăng nhập này đã bị người khác sử dụng" });
            }

            // 4. Chuẩn bị dữ liệu cập nhật
            let updateData = { fullName, username };

            // Nếu admin có nhập mật khẩu mới thì mới tiến hành băm và lưu
            if (password && password.trim() !== "") {
                updateData.password = await bcrypt.hash(password, 10);
            }

            const updated = await prisma.user.update({
                where: { id: userId },
                data: updateData
            });

            res.json({ message: "Cập nhật tài khoản thành công", user: { id: updated.id, username: updated.username } });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Lỗi hệ thống" });
        }
    },

    // 8. API Thêm Quản trị viên vào Tòa nhà đã có sẵn (Dành cho Super Admin)
    addManagerToBuilding: async (req, res) => {
        try {
            // 1. Kiểm tra dữ liệu Frontend gửi lên có bị thiếu không
            console.log("📥 [ADD MANAGER] Dữ liệu nhận được:", req.body);

            if (req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: "Chỉ Super Admin mới có quyền thêm người quản lý!" });
            }

            const { buildingId, username, password, fullName } = req.body;

            // Kiểm tra rỗng
            if (!buildingId || !username || !password || !fullName) {
                return res.status(400).json({ message: "Vui lòng điền đầy đủ tất cả các trường thông tin!" });
            }

            // 2. Kiểm tra username đã tồn tại chưa
            const userExist = await prisma.user.findUnique({ where: { username } });
            if (userExist) {
                return res.status(400).json({ message: `Tên đăng nhập hoặc mật khẩu đã có người sử dụng. Vui lòng chọn tên khác!` });
            }

            // 3. Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // 4. Dùng Transaction: Tạo User xong thì map luôn vào bảng UserBuilding
            const result = await prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        username: username,
                        password: hashedPassword,
                        fullName: fullName,
                        role: 'BUILDING_ADMIN'
                    }
                });

                await tx.userBuilding.create({
                    data: {
                        userId: newUser.id,
                        buildingId: parseInt(buildingId)
                    }
                });

                return newUser;
            });

            res.status(201).json({ message: "Thêm quản lý vào cơ sở thành công", user: result });

        } catch (error) {
            console.error("❌ Lỗi thêm quản lý:", error);

            // Bắt lỗi Prisma (Ví dụ lỗi khóa ngoại)
            if (error.code) {
                return res.status(400).json({ message: `Lỗi CSDL Prisma mã: ${error.code}` });
            }

            res.status(500).json({ message: "Lỗi hệ thống khi thêm quản lý" });
        }
    }
};