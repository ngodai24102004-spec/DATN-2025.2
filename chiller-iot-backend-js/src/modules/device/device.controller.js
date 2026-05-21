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
    },

    // 3. Xóa thiết bị 
    deleteDevice: async (req, res) => {
        try {
            const deviceId = parseInt(req.params.id);
            const user = req.user;

            // 1. Tìm thiết bị trong DB
            const device = await prisma.device.findUnique({ where: { id: deviceId } });
            if (!device) return res.status(404).json({ message: "Không tìm thấy thiết bị" });

            // 2. Kiểm tra phân quyền: Admin nhà nào chỉ được xóa thiết bị nhà đó
            if (user.role === 'BUILDING_ADMIN' && device.buildingId !== user.buildingId) {
                return res.status(403).json({ message: "Bạn không có quyền xóa thiết bị này!" });
            }

            // 3. Xóa các bản ghi liên quan trong ControlLog trước (để tránh lỗi Khóa ngoại - Foreign Key)
            await prisma.controlLog.deleteMany({
                where: { device_code: device.code }
            });

            // 4. Xóa thiết bị
            await prisma.device.delete({
                where: { id: deviceId }
            });

            res.status(200).json({ message: "Xóa thiết bị thành công" });
        } catch (error) {
            console.error("Lỗi xóa thiết bị:", error);
            res.status(500).json({ error: "Lỗi hệ thống khi xóa thiết bị" });
        }
    },

    // 4. XỬ LÝ LỆNH ĐIỀU KHIỂN
    executeControl: async (req, res) => {
        try {
            const { deviceId, code, type, command } = req.body;
            const user = req.user;

            // 1. Kiểm tra thiết bị có tồn tại và thuộc quyền quản lý không
            const device = await prisma.device.findUnique({
                where: { id: deviceId },
                include: { building: true }
            });

            if (!device) return res.status(404).json({ message: "Không tìm thấy thiết bị" });
            if (user.role === 'BUILDING_ADMIN' && device.buildingId !== user.buildingId) {
                return res.status(403).json({ message: "Không có quyền điều khiển thiết bị này" });
            }

            // 2. Khởi tạo Payload và Topic theo bảng tài liệu của bạn
            let topicSuffix = "";
            let payload = { code: code };

            switch (type) {
                case 'CHILLER':
                    topicSuffix = "chillers/set";
                    payload.power = command.power ? 1 : 0;
                    payload["auto-mode"] = command.autoMode ? 1 : 0;
                    break;
                case 'VALVE':
                    topicSuffix = "valves/set";
                    payload.state = command.state ? 1 : 0;
                    break;
                case 'COLDPUMP':
                    topicSuffix = "coldPump/set";
                    payload.power = command.power ? 1 : 0;
                    payload.speed = parseFloat(command.speed) || 0;
                    break;
                case 'COOLINGPUMP':
                    topicSuffix = "coolingPump/set";
                    payload.power = command.power ? 1 : 0;
                    payload.speed = parseFloat(command.speed) || 0;
                    break;
                case 'COOLINGTOWER':
                    topicSuffix = "coolingTower/set";
                    payload.power = command.power ? 1 : 0;
                    break;
                default:
                    return res.status(400).json({ message: "Loại thiết bị không hỗ trợ điều khiển" });
            }

            // Tạo chuỗi Topic hoàn chỉnh (Theo đúng chuẩn hình ảnh của bạn)
            const topic = `yoo/yootek/cooling/chiller/${topicSuffix}`;

            // 3. Publish lệnh xuống MQTT Broker
            import('../../config/mqtt.js').then(({ default: mqttClient }) => {
                mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
                    if (err) console.error("Lỗi gửi MQTT:", err);
                });
            });

            // 4. Lưu lại lịch sử ai đã điều khiển vào MySQL
            await prisma.controlLog.create({
                data: {
                    device_code: code,
                    user_id: user.id,
                    command_payload: payload,
                    status: 'SENT'
                }
            });

            console.log(`🕹️ [CONTROL] User ${user.id} gửi lệnh tới ${code}:`, payload);

            res.status(200).json({
                message: "Đã gửi lệnh điều khiển thành công!",
                payloadSent: payload
            });

        } catch (error) {
            console.error("❌ Lỗi API Control:", error);
            res.status(500).json({ error: "Lỗi hệ thống khi gửi lệnh" });
        }
    },

    // 5. Cập nhật thông tin thiết bị
    updateDevice: async (req, res) => {
        try {
            const deviceId = parseInt(req.params.id);
            const { code, name, location } = req.body;
            const user = req.user;

            // 1. Kiểm tra thiết bị và quyền hạn
            const device = await prisma.device.findUnique({ where: { id: deviceId } });
            if (!device) return res.status(404).json({ message: "Không tìm thấy thiết bị" });

            if (user.role === 'BUILDING_ADMIN' && device.buildingId !== user.buildingId) {
                return res.status(403).json({ message: "Bạn không có quyền sửa thiết bị này!" });
            }

            // 2. Nếu đổi mã Code, phải kiểm tra xem mã mới đã bị máy khác dùng chưa
            if (code !== device.code) {
                const codeExist = await prisma.device.findUnique({ where: { code } });
                if (codeExist) return res.status(400).json({ message: "Mã thiết bị (Code MQTT) đã tồn tại!" });
            }

            // 3. Tiến hành cập nhật
            const updatedDevice = await prisma.device.update({
                where: { id: deviceId },
                data: {
                    code: code,
                    name: name,
                    location: location
                }
            });

            res.status(200).json({
                message: "Cập nhật thiết bị thành công",
                device: updatedDevice
            });
        } catch (error) {
            console.error("Lỗi cập nhật thiết bị:", error);
            res.status(500).json({ error: "Lỗi hệ thống khi cập nhật thiết bị" });
        }
    }

};