import prisma from '../../config/prisma.js';

export const DeviceController = {
    // 1. API: Thêm thiết bị mới vào tòa nhà
    addDevice: async (req, res) => {
        try {
            const { buildingId, subsystemId, code, type, name, location } = req.body;
            const user = req.user;

            // 1. Kiểm tra quyền hạn
            if (user.role === 'BUILDING_ADMIN') {
                if (parseInt(buildingId) !== user.buildingId) {
                    return res.status(403).json({
                        message: "Bạn không có quyền thêm thiết bị vào tòa nhà này!"
                    });
                }
            }

            // 2. RÀNG BUỘC MỚI: Bắt buộc phải có Phân hệ
            if (!subsystemId) {
                return res.status(400).json({ message: "Thiết bị bắt buộc phải được gán vào một Phân hệ (subsystemId)!" });
            }

            // 3. Kiểm tra loại thiết bị hợp lệ 
            const validTypes = ['CHILLER', 'PIPE', 'VALVE', 'COLDPUMP', 'COOLINGPUMP', 'COOLINGTOWER', 'LIGHT', 'LIGHT_DIMMER', 'FAN', 'DOMESTIC_PUMP', 'AHU'];
            if (!validTypes.includes(type.toUpperCase())) {
                return res.status(400).json({ message: "Loại thiết bị không hợp lệ!" });
            }

            // 4. Kiểm tra mã thiết bị (code) đã tồn tại chưa
            const existingDevice = await prisma.device.findUnique({ where: { code } });
            if (existingDevice) {
                return res.status(400).json({ message: "Mã thiết bị (code) đã tồn tại trong hệ thống!" });
            }

            // 5. TẠO THIẾT BỊ TRONG DATABASE (ĐÃ THÊM subsystemId)
            const newDevice = await prisma.device.create({
                data: {
                    code: code,
                    type: type.toUpperCase(),
                    name: name || `${type} ${code}`,
                    location: location || null,
                    buildingId: parseInt(buildingId),
                    subsystemId: parseInt(subsystemId), // DÒNG QUAN TRỌNG NHẤT ĐỂ SỬA LỖI
                    latest_state: {}
                }
            });

            res.status(201).json({
                message: "Thêm thiết bị vào phân hệ thành công!",
                device: newDevice
            });

        } catch (error) {
            console.error("Lỗi thêm thiết bị:", error);
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

            // 2. Khởi tạo Payload và Topic
            let topicSuffix = "";
            let payload = []; // Dạng MẢNG

            switch (type) {
                // --- NHÓM CHILLER TRUNG TÂM ---
                case 'CHILLER':
                    topicSuffix = "cooling/chiller/chillers/set";
                    payload = [{ code: code, power: command.power ? 1 : 0, "auto-mode": command.autoMode ? 1 : 0 }];
                    break;
                case 'AHU':
                    topicSuffix = "cooling/chiller/ahu/set";
                    payload = [{ code: code, power: command.power ? 1 : 0, "auto-mode": command.autoMode ? 1 : 0 }];
                    break;
                case 'VALVE':
                    topicSuffix = "cooling/chiller/valves/set";
                    payload = [{ code: code, state: command.state ? 1 : 0 }];
                    break;
                case 'COLDPUMP':
                    topicSuffix = "cooling/chiller/coldPump/set";
                    payload = [{ code: code, power: command.power ? 1 : 0, speed: parseFloat(command.speed) || 0 }];
                    break;
                case 'COOLINGPUMP':
                    topicSuffix = "cooling/chiller/coolingPump/set";
                    payload = [{ code: code, power: command.power ? 1 : 0, speed: parseFloat(command.speed) || 0 }];
                    break;
                case 'COOLINGTOWER':
                    topicSuffix = "cooling/chiller/coolingTower/set";
                    payload = [{ code: code, power: command.power ? 1 : 0 }];
                    break;

                // --- CÁC PHÂN HỆ MỚI ---
                case 'LIGHT':
                    topicSuffix = "light/light/set";
                    payload = [{ code: code, state: command.state ? 1 : 0 }];
                    break;
                case 'LIGHT_DIMMER':
                    topicSuffix = "light/dimmer_light/set";
                    payload = [{ code: code, state: command.state ? 1 : 0, brightness: parseFloat(command.brightness) || 0 }];
                    break;
                case 'DOMESTIC_PUMP':
                    topicSuffix = "pump/set";
                    payload = [{ code: code, state: command.state ? 1 : 0, speed: parseFloat(command.speed) || 0 }];
                    break;
                case 'FAN':
                    topicSuffix = "fan/set";
                    payload = [{ code: code, state: command.state ? 1 : 0, fan_speed: parseFloat(command.fan_speed) || 0 }];
                    break;

                default:
                    return res.status(400).json({ message: `Loại thiết bị [${type}] chưa được cấu hình lệnh điều khiển.` });
            }

            const topic = `yoo/yootek/${topicSuffix}`;

            // 3. Publish lệnh xuống MQTT Broker
            import('../../config/mqtt.js').then(({ default: mqttClient }) => {
                mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
                    if (err) console.error("Lỗi gửi MQTT:", err);
                });
            });

            // ===============================================
            // 4. CHỐNG SPAM CLICK: DỌN SẠCH CÁC LỆNH ĐANG CHỜ CŨ
            // ===============================================
            await prisma.controlLog.updateMany({
                where: {
                    device_code: code,
                    status: 'SENT'
                },
                data: {
                    status: 'OVERRIDDEN',
                    completed_at: new Date()
                }
            });

            // 5. TẠO BẢN GHI MỚI DUY NHẤT
            const savedLog = await prisma.controlLog.create({
                data: {
                    device_code: code,
                    user_id: user.id,
                    command_payload: payload,
                    status: 'SENT'
                }
            });

            // ===============================================
            // 6. BỘ ĐẾM NGƯỢC 1 GIÂY (TIMEOUT CHECKER)
            // ===============================================
            setTimeout(async () => {
                try {
                    const checkLog = await prisma.controlLog.findUnique({ where: { id: savedLog.id } });

                    // Nếu sau 1s mà lệnh này VẪN LÀ 'SENT'
                    if (checkLog && checkLog.status === 'SENT') {
                        // Cập nhật ĐÍCH DANH ID đó thành TIMEOUT
                        await prisma.controlLog.update({
                            where: { id: savedLog.id },
                            data: { status: 'TIMEOUT' }
                        });

                        console.log(`⏰ [TIMEOUT] Thiết bị ${code} không phản hồi sau 1 giây!`);

                        import('../../config/socket.js').then(m => {
                            const io = m.getIo();
                            io.to(`building-${device.buildingId}`).emit("command-timeout", { name: device.name || code });
                            io.to("super_admin_room").emit("command-timeout", { name: device.name || code });
                        });
                    }
                } catch (err) {
                    console.error("Lỗi trong quá trình kiểm tra Timeout:", err.message);
                }
            }, 1000);
            // ===============================================

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