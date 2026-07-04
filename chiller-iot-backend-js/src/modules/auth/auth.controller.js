import prisma from '../../config/prisma.js';
import { getIo } from '../../config/socket.js';
import { sendApprovalEmail } from '../../config/mail.service.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);
const otpCache = new Map(); // Bộ nhớ tạm lưu trữ email -> { otp, expiresAt }

const verifyEmailDomain = async (email) => {
    const domain = email.split('@')[1];
    if (!domain) return false;
    try {
        const addresses = await resolveMx(domain);
        return addresses && addresses.length > 0;
    } catch (err) {
        return false; // Tên miền không tồn tại hoặc không cấu hình nhận mail
    }
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Sinh 6 số ngẫu nhiên từ 100000 đến 999000
};


const generateAccessToken = (user, buildingId) => {
    return jwt.sign(
        { id: user.id, role: user.role, buildingId },
        process.env.JWT_SECRET || 'SECRET_KEY',
        { expiresIn: '15m' } // Access Token sống 15 phút
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || 'REFRESH_SECRET_KEY',
        { expiresIn: '7d' } // Refresh Token sống 7 ngày
    );
};

export const AuthController = {

    // API Gửi OTP về Email (Có kiểm tra DNS tồn tại thực tế)
    sendOtp: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ message: "Vui lòng nhập Email!" });

            // 1. Chạy xác thực chéo DNS xem email có thật không trước khi gửi
            const isEmailValid = await verifyEmailDomain(email);
            if (!isEmailValid) {
                return res.status(400).json({ message: "Địa chỉ Email không tồn tại thực tế hoặc tên miền không hợp lệ!" });
            }

            // 2. Kiểm tra xem email này đã đăng ký tài khoản nào chưa
            const emailExist = await prisma.user.findUnique({ where: { email } });
            if (emailExist) return res.status(400).json({ message: "Email này đã được đăng ký tài khoản khác!" });

            // 3. Khởi tạo mã OTP
            const otp = generateOTP();
            const expiresAt = Date.now() + 60000; // Hết hạn sau đúng 60 giây (60000ms)

            // Lưu vào bộ nhớ tạm
            otpCache.set(email, { otp, expiresAt });

            // 4. Gửi email chứa mã OTP
            await import('../../config/mail.service.js').then(m => m.sendOtpEmail(email, otp));

            res.status(200).json({ message: "Mã OTP đã được gửi về hòm thư của bạn!" });
        } catch (error) {
            console.error("Lỗi gửi OTP:", error);
            res.status(500).json({ message: "Gửi mã OTP thất bại!" });
        }
    },

    // 1. API Gửi yêu cầu đăng ký (Dành cho trang Login)
    requestRegistration: async (req, res) => {
        try {
            const { username, password, fullName, email, buildingCode, otp } = req.body;

            // XÁC THỰC MÃ OTP
            if (!otp) return res.status(400).json({ message: "Vui lòng nhập mã xác thực OTP!" });

            const cached = otpCache.get(email);
            if (!cached || cached.otp !== otp || Date.now() > cached.expiresAt) {
                return res.status(400).json({ message: "Mã xác thực OTP không chính xác hoặc đã hết hạn (60 giây)!" });
            }

            // OTP hợp lệ -> Xóa khỏi RAM để chống dùng lại
            otpCache.delete(email);

            const exist = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
            if (exist) return res.status(400).json({ message: "Username hoặc Email đã được sử dụng!" });

            // Dò tìm tòa nhà bằng mã code
            const targetBuilding = await prisma.building.findUnique({ where: { code: buildingCode } });
            if (!targetBuilding) return res.status(400).json({ message: "Mã tòa nhà không tồn tại! Vui lòng kiểm tra lại." });

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await prisma.user.create({
                data: {
                    username, password: hashedPassword, fullName, email,
                    role: 'BUILDING_ADMIN', status: 'PENDING', requestedBuildingId: targetBuilding.id
                }
            });

            const io = await import('../../config/socket.js').then(m => m.getIo());
            io.to("super_admin_room").emit("new-registration", {
                id: newUser.id, username, fullName, email,
                requestedBuilding: { name: targetBuilding.name, code: targetBuilding.code }
            });

            res.status(201).json({ message: "Gửi yêu cầu thành công! Vui lòng chờ phê duyệt." });
        } catch (error) {
            console.error("Lỗi gửi yêu cầu đăng ký:", error);
            res.status(500).json({ message: "Gửi yêu cầu thất bại!" });
        }
    },


    // 2. API Duyệt hoặc Từ chối (Dành cho Super Admin)
    handleApproval: async (req, res) => {
        try {
            if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ message: "Không có quyền" });

            const { userId, action } = req.body;

            // Tìm user trước để lấy email gửi thông báo
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ message: "User không tồn tại" });

            if (action === 'APPROVE' && user.status === 'APPROVED') {
                return res.status(400).json({ message: "Tài khoản này đã được phê duyệt từ trước!" });
            }

            if (action === 'APPROVE') {
                // NẾU ĐỒNG Ý: Cập nhật status và cấp quyền vào tòa nhà
                await prisma.$transaction(async (tx) => {
                    await tx.user.update({
                        where: { id: userId },
                        data: { status: 'APPROVED', requestedBuildingId: null }
                    });

                    await tx.userBuilding.create({
                        data: { userId: userId, buildingId: user.requestedBuildingId }
                    });
                });
                // Gửi email báo thành công
                await import('../../config/mail.service.js').then(m => m.sendApprovalEmail(user.email, true, user.username));

                res.json({ message: "Đã phê duyệt tài khoản!" });

            } else {
                // ===============================================
                // NẾU TỪ CHỐI: Xóa Vĩnh Viễn Khỏi Database
                // ===============================================

                // 1. Vẫn gửi email báo từ chối trước khi xóa
                await import('../../config/mail.service.js').then(m => m.sendApprovalEmail(user.email, false, user.username));

                // 2. XÓA HARD-DELETE USER KHỎI MYSQL
                await prisma.user.deleteMany({
                    where: { id: userId }
                });

                res.json({ message: "Đã từ chối và xóa tài khoản!" });
            }
        } catch (error) {
            console.error("Lỗi duyệt tài khoản:", error);
            res.status(500).json({ message: "Lỗi xử lý hệ thống" });
        }
    },

    //3. API Lấy danh sách tài khoản đang chờ duyệt (Dành cho Super Admin)
    getPendingUsers: async (req, res) => {
        try {
            if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ message: "Không có quyền" });

            const pendingUsers = await prisma.user.findMany({
                where: { status: 'PENDING' },
                select: { id: true, username: true, fullName: true, email: true, requestedBuildingId: true, createdAt: true }
            });

            const usersWithBuildingInfo = await Promise.all(pendingUsers.map(async (u) => {
                let bInfo = null;
                if (u.requestedBuildingId) {
                    bInfo = await prisma.building.findUnique({
                        where: { id: u.requestedBuildingId },
                        select: { name: true, code: true }
                    });
                }
                return { ...u, requestedBuilding: bInfo };
            }));

            res.json(usersWithBuildingInfo);
        } catch (error) {
            res.status(500).json({ message: "Lỗi hệ thống" });
        }
    },


    // 1.API: Đăng ký 
    register: async (req, res) => {
        try {
            const {
                username, password, fullName, role, // Thông tin chung
                buildingName, buildingCode, address,  // Thông tin riêng cho tòa nhà
                email // SỬA: Nhận thêm email gửi lên từ body
            } = req.body;

            // 1. Kiểm tra Role có hợp lệ không
            if (!['SUPER_ADMIN', 'BUILDING_ADMIN'].includes(role)) {
                return res.status(400).json({ message: "Vai trò (role) bắt buộc phải là SUPER_ADMIN hoặc BUILDING_ADMIN" });
            }

            // 2. Kiểm tra xem username đã tồn tại chưa
            const userExist = await prisma.user.findUnique({ where: { username } });
            if (userExist) return res.status(400).json({ message: "Username này đã được sử dụng" });

            // ==========================================
            // KỊCH BẢN 1: NẾU TẠO SUPER_ADMIN (Giữ nguyên)
            // ==========================================
            if (role === 'SUPER_ADMIN') {
                const hashedPassword = await bcrypt.hash(password, 10);
                const newUser = await prisma.user.create({
                    data: { username, password: hashedPassword, fullName, role: 'SUPER_ADMIN' }
                });
                return res.status(201).json({
                    message: "Tạo tài khoản Quản trị viên Tổng thành công!",
                    data: { username: newUser.username, role: newUser.role, fullName: newUser.fullName }
                });
            }

            // ==========================================
            // KỊCH BẢN 2: NẾU TẠO BUILDING_ADMIN
            // ==========================================
            if (role === 'BUILDING_ADMIN') {
                if (!buildingCode || !buildingName || !email) {
                    return res.status(400).json({ message: "Cần cung cấp đầy đủ thông tin tòa nhà và email liên hệ!" });
                }

                // Kiểm tra email độc nhất
                const emailExist = await prisma.user.findUnique({ where: { email } });
                if (emailExist) return res.status(400).json({ message: "Email liên hệ này đã được sử dụng!" });

                // SỬA CHUẨN XÁC: Kiểm tra tồn tại thực tế của tên miền email bằng DNS MX Lookup
                const isEmailDomainValid = await verifyEmailDomain(email);
                if (!isEmailDomainValid) {
                    return res.status(400).json({ message: "Địa chỉ Email không tồn tại thực tế hoặc tên miền không hợp lệ! Vui lòng kiểm tra lại." });
                }

                // Kiểm tra trùng tòa nhà
                const buildingExist = await prisma.building.findUnique({ where: { code: buildingCode } });
                if (buildingExist) return res.status(400).json({ message: "Mã tòa nhà (Building Code) đã tồn tại" });

                const hashedPassword = await bcrypt.hash(password, 10);

                // Dùng Transaction để tạo đồng thời Tòa nhà và User
                const result = await prisma.$transaction(async (tx) => {
                    const newBuilding = await tx.building.create({
                        data: { name: buildingName, code: buildingCode, address: address || "" }
                    });

                    const newUser = await tx.user.create({
                        // Lưu email của Admin vào DB
                        data: { username, password: hashedPassword, fullName, email, role: 'BUILDING_ADMIN' }
                    });

                    // Cấp quyền quản lý nhà này cho user
                    await tx.userBuilding.create({
                        data: { userId: newUser.id, buildingId: newBuilding.id }
                    });

                    return { user: newUser, building: newBuilding };
                });

                // ==========================================================
                // GỬI EMAIL CHỨA TÀI KHOẢN VÀ MẬT KHẨU GỐC CHO NGƯỜI QUẢN LÝ VỪA TẠO
                // (Truyền password dạng gốc chưa băm để người dùng biết mật khẩu đăng nhập)
                // ==========================================================
                await import('../../config/mail.service.js').then(m =>
                    m.sendCredentialsEmail(result.user.email, result.user.username, password, result.user.fullName, result.building.name)
                );
                // ==========================================================

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
            if (user.status === 'PENDING') return res.status(403).json({ message: "Tài khoản đang chờ duyệt!" });
            if (user.status === 'LOCKED') return res.status(403).json({ message: "Tài khoản đã bị khóa!" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu" });

            let buildingInfo = null;
            if (user.role === 'BUILDING_ADMIN' && user.managedBuildings.length > 0) {
                const b = user.managedBuildings[0].building;
                buildingInfo = { id: b.id, code: b.code, name: b.name, address: b.address };
            }

            const accessToken = generateAccessToken(user, buildingInfo?.id || null);
            const refreshToken = generateRefreshToken(user);

            // GỬI REFRESH TOKEN QUA HTTPONLY COOKIE
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: false, // Để false khi chạy thử nghiệm localhost (không có HTTPS)
                sameSite: 'lax', // Cấu hình cho phép truyền cookie chéo cổng (localhost:3000 -> localhost:5173)
                maxAge: 7 * 24 * 60 * 60 * 1000 // Hạn dùng 7 ngày (tính bằng mili-giây)
            });

            // Chỉ trả về Access Token và thông tin User trong JSON phản hồi
            res.json({
                accessToken,
                user: { fullName: user.fullName, role: user.role, building: buildingInfo }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    refreshToken: async (req, res) => {
        try {
            // Đọc Refresh Token trực tiếp từ Cookie tự động gửi lên
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) return res.status(401).json({ message: "Không tìm thấy Refresh Token trong Cookie" });

            // Xác thực và giải mã chữ ký JWT mà không cần truy vấn Database
            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'REFRESH_SECRET_KEY', async (err, decoded) => {
                if (err) return res.status(403).json({ message: "Refresh Token đã hết hạn hoặc không hợp lệ" });

                // Truy vấn nhanh DB để lấy thông tin phân quyền mới nhất của User
                const user = await prisma.user.findUnique({
                    where: { id: decoded.id },
                    include: { managedBuildings: { include: { building: true } } }
                });

                if (!user || user.status === 'LOCKED') {
                    return res.status(403).json({ message: "Tài khoản không hợp lệ hoặc đã bị khóa" });
                }

                let buildingId = null;
                if (user.role === 'BUILDING_ADMIN' && user.managedBuildings.length > 0) {
                    buildingId = user.managedBuildings[0].building.id;
                }

                // Cấp Access Token mới
                const newAccessToken = generateAccessToken(user, buildingId);

                res.json({ accessToken: newAccessToken });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    logout: async (req, res) => {
        try {
            // Trình duyệt tự xóa cookie khi nhận lệnh clearCookie
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: false,
                sameSite: 'lax'
            });
            res.json({ message: "Đăng xuất thành công" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },



    // API Khóa / Mở khóa tài khoản (Dành cho Super Admin)
    toggleLockStatus: async (req, res) => {
        try {
            if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ message: "Không có quyền thực hiện" });

            const userId = parseInt(req.params.id);
            const user = await prisma.user.findUnique({ where: { id: userId } });

            if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
            if (user.role === 'SUPER_ADMIN') return res.status(400).json({ message: "Không thể khóa tài khoản Super Admin!" });

            // Đảo ngược trạng thái (Đang Khóa -> Mở, Đang Mở -> Khóa)
            const newStatus = user.status === 'LOCKED' ? 'APPROVED' : 'LOCKED';

            await prisma.user.update({
                where: { id: userId },
                data: { status: newStatus }
            });

            res.json({
                message: newStatus === 'LOCKED' ? "Đã khóa tài khoản!" : "Đã mở khóa tài khoản!",
                status: newStatus
            });
        } catch (error) {
            console.error("Lỗi khóa tài khoản:", error);
            res.status(500).json({ message: "Lỗi hệ thống" });
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

    // API Đổi mật khẩu cá nhân (Dùng chung cho cả Super Admin và Building Admin)
    changePassword: async (req, res) => {
        try {
            const userId = req.user.id; // Lấy ID từ Token của người đang đăng nhập
            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
            }

            // 1. Tìm user trong Database
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

            // 2. Kiểm tra mật khẩu cũ xem có khớp không
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác!" });

            // 3. Mã hóa mật khẩu mới và lưu vào DB
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword }
            });

            res.json({ message: "Đổi mật khẩu thành công!" });
        } catch (error) {
            console.error("Lỗi đổi mật khẩu:", error);
            res.status(500).json({ message: "Lỗi hệ thống khi đổi mật khẩu" });
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
                    role: 'BUILDING_ADMIN',
                    status: { not: 'PENDING' }
                },
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    createdAt: true,
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

            // 3. Không cho phép Super Admin tự xóa chính mình
            if (targetUser.id === req.user.id) {
                return res.status(400).json({ message: "Bạn không thể tự xóa chính mình!" });
            }

            // 4. Dùng Transaction để xóa sạch dữ liệu liên quan THEO ĐÚNG THỨ TỰ
            await prisma.$transaction([
                // BƯỚC 1 CỰC KỲ QUAN TRỌNG: Xóa toàn bộ lịch sử điều khiển của người này
                prisma.controlLog.deleteMany({ where: { user_id: userId } }),

                // BƯỚC 2: Xóa liên kết người dùng - tòa nhà
                prisma.userBuilding.deleteMany({ where: { userId: userId } }),

                // BƯỚC 3: Cuối cùng mới xóa User an toàn
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