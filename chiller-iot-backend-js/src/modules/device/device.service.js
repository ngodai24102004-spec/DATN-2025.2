// src/modules/device/device.service.js
import prisma from '../../config/prisma.js';
import { InfluxService } from '../../config/influx.js';
import { getIo } from '../../config/socket.js';

export const DeviceService = {

    // HÀM KIỂM TRA FEEDBACK COMMAND
    checkAndCompleteCommand: async (deviceCode, currentState) => {
        try {
            // 1. Tìm lệnh điều khiển MỚI NHẤT đang ở trạng thái 'SENT' của thiết bị này
            const pendingLog = await prisma.controlLog.findFirst({
                where: {
                    device_code: deviceCode,
                    status: 'SENT'
                },
                orderBy: { created_at: 'desc' }
            });

            if (!pendingLog) return; // Không có lệnh nào đang chờ thì thôi

            // 2. LẤY PAYLOAD AN TOÀN (Tương thích cả Object cũ và Array mới)
            let rawPayload = pendingLog.command_payload;

            // Nếu lưu trong DB là dạng chuỗi JSON thì bóc nó ra
            if (typeof rawPayload === 'string') {
                rawPayload = JSON.parse(rawPayload);
            }

            // Xử lý thông minh: Nếu là Mảng thì lấy [0], nếu là Object thì lấy chính nó
            const cmd = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload;

            if (!cmd) return; // Bảo vệ an toàn 2 lớp

            let isMatched = true;

            // 3. So sánh các trường quan trọng
            const keysToCheck = ['power', 'state', 'speed', 'fan_speed', 'brightness', 'auto-mode', 'auto_mode'];

            for (const key of keysToCheck) {
                if (cmd[key] !== undefined) {
                    // Dùng toán tử != (khác lỏng lẻo) thay vì !== để tránh lỗi kiểu dữ liệu (số 1 vs chuỗi "1")
                    if (currentState[key] != cmd[key]) {
                        isMatched = false;
                        break;
                    }
                }
            }

            // 4. Nếu khớp hoàn toàn -> Cập nhật thành SUCCESS và ghi giờ hoàn thành
            if (isMatched) {
                await prisma.controlLog.update({
                    where: { id: pendingLog.id },
                    data: {
                        status: 'SUCCESS',
                        completed_at: new Date()
                    }
                });
                console.log(`✅ [FEEDBACK] Lệnh điều khiển ${deviceCode} đã được thiết bị thực thi THÀNH CÔNG!`);
                // Lấy thông tin thiết bị để gửi Socket thông báo
                const deviceInfo = await prisma.device.findUnique({ where: { code: deviceCode } });
                if (deviceInfo) {
                    const io = getIo();
                    io.to(`building-${deviceInfo.buildingId}`).emit("command-success", {
                        code: deviceCode,
                        name: deviceInfo.name || deviceCode
                    });
                    io.to("super_admin_room").emit("command-success", {
                        code: deviceCode,
                        name: deviceInfo.name || deviceCode
                    });
                }
            }
        } catch (error) {
            // Ghi chú lỗi gọn gàng hơn
            console.error(`⚠️ Lỗi khi kiểm tra Feedback Command cho ${deviceCode}:`, error.message);
        }
    },

    // 1. THIẾT BỊ CHILLER
    handleChillerData: async (chillerList) => {
        for (const item of chillerList) {
            try {
                // SỬA: Lấy thêm thông tin người quản lý tòa nhà
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: {
                        building: {
                            include: { managers: { include: { user: true } } }
                        }
                    }
                });

                if (!deviceInDb) {
                    console.log(`⚠️ Thiết bị ${item.code} chưa được khai báo trong MySQL. Bỏ qua.`);
                    continue;
                }

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                await DeviceService.checkAndCompleteCommand(item.code, item);

                const tags = { code: item.code, building_code: deviceInDb.building.code };
                const fields = {
                    power: item.power ? 1 : 0,
                    auto_mode: (item['auto-mode'] === 1 || item.auto_mode === 1) ? 1 : 0,
                    fault: item.fault ? 1 : 0
                };
                InfluxService.writeTelemetry("chiller_status", tags, fields);

                // --- SỬA: TẠO GÓI DỮ LIỆU ĐẦY ĐỦ ĐỂ GỬI SOCKET ---
                const managerName = deviceInDb.building.managers[0]?.user?.fullName || "Chưa bổ nhiệm";
                const socketPayload = {
                    code: item.code,
                    type: "CHILLER",
                    latest_state: item,
                    details: {
                        name: deviceInDb.name,
                        location: deviceInDb.location || "N/A",
                        buildingName: deviceInDb.building.name,
                        managerName: managerName
                    }
                };

                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", socketPayload);
                io.to("super_admin_room").emit("device-update", socketPayload); // Bắn cho Super Admin

                console.log(`✅ Real-time: Chiller ${item.code} [Nhà: ${deviceInDb.building.code}]`);

            } catch (err) {
                console.error(`❌ Lỗi xử lý Chiller ${item.code}:`, err.message);
            }
        }
    },

    // 2. THIẾT BỊ ĐƯỜNG ỐNG (PIPE)
    handlePipeData: async (pipeList) => {
        for (const item of pipeList) {
            try {
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: {
                        building: {
                            include: { managers: { include: { user: true } } }
                        }
                    }
                });

                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                const tags = { code: item.code, building_code: deviceInDb.building.code };
                const fields = {
                    flow_status: item.flow_status ? 1 : 0,
                    temperature: parseFloat(item.temperature),
                    flow_rate: parseFloat(item.flow_rate),
                    pressure: parseFloat(item.pressure)
                };
                InfluxService.writeTelemetry("pipe_telemetry", tags, fields);

                // --- SOCKET ---
                const managerName = deviceInDb.building.managers[0]?.user?.fullName || "Chưa bổ nhiệm";
                const socketPayload = {
                    code: item.code,
                    type: "PIPE",
                    latest_state: item,
                    details: {
                        name: deviceInDb.name,
                        location: deviceInDb.location || "N/A",
                        buildingName: deviceInDb.building.name,
                        managerName: managerName
                    }
                };

                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", socketPayload);
                io.to("super_admin_room").emit("device-update", socketPayload);

            } catch (err) {
                console.error(`❌ Lỗi xử lý Pipe ${item?.code}:`, err.message);
            }
        }
    },

    // 3. THIẾT BỊ VAN (VALVE)
    handleValveData: async (valveList) => {
        for (const item of valveList) {
            try {
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: {
                        building: {
                            include: { managers: { include: { user: true } } }
                        }
                    }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                await DeviceService.checkAndCompleteCommand(item.code, item);

                InfluxService.writeTelemetry("valve_data",
                    { code: item.code, building_code: deviceInDb.building.code },
                    { state: item.state ? 1 : 0 }
                );

                // --- SOCKET ---
                const managerName = deviceInDb.building.managers[0]?.user?.fullName || "Chưa bổ nhiệm";
                const socketPayload = {
                    code: item.code,
                    type: "VALVE",
                    latest_state: item,
                    details: {
                        name: deviceInDb.name,
                        location: deviceInDb.location || "N/A",
                        buildingName: deviceInDb.building.name,
                        managerName: managerName
                    }
                };

                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", socketPayload);
                io.to("super_admin_room").emit("device-update", socketPayload);

            } catch (err) {
                console.error(`❌ Lỗi xử lý Valve:`, err.message);
            }
        }
    },

    // 4. BƠM NƯỚC LẠNH (COLDPUMP)
    handleColdPumpData: async (pumpList) => {
        for (const item of pumpList) {
            try {
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: {
                        building: {
                            include: { managers: { include: { user: true } } }
                        }
                    }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                await DeviceService.checkAndCompleteCommand(item.code, item);

                const fields = {
                    power: item.power ? 1 : 0,
                    auto_mode: (item['auto-mode'] === 1 || item.auto_mode === 1) ? 1 : 0,
                    fault: item.fault ? 1 : 0,
                    speed: parseFloat(item.speed) || 0
                };
                InfluxService.writeTelemetry("coldpump_data",
                    { code: item.code, building_code: deviceInDb.building.code },
                    fields
                );

                // --- SOCKET ---
                const managerName = deviceInDb.building.managers[0]?.user?.fullName || "Chưa bổ nhiệm";
                const socketPayload = {
                    code: item.code,
                    type: "COLDPUMP",
                    latest_state: item,
                    details: {
                        name: deviceInDb.name,
                        location: deviceInDb.location || "N/A",
                        buildingName: deviceInDb.building.name,
                        managerName: managerName
                    }
                };

                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", socketPayload);
                io.to("super_admin_room").emit("device-update", socketPayload);

            } catch (err) {
                console.error(`❌ Lỗi xử lý ColdPump:`, err.message);
            }
        }
    },

    // 5. BƠM GIẢI NHIỆT (COOLINGPUMP)
    handleCoolingPumpData: async (pumpList) => {
        for (const item of pumpList) {
            try {
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: {
                        building: {
                            include: { managers: { include: { user: true } } }
                        }
                    }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                await DeviceService.checkAndCompleteCommand(item.code, item);

                const fields = {
                    power: item.power ? 1 : 0,
                    auto_mode: (item['auto-mode'] === 1 || item.auto_mode === 1) ? 1 : 0,
                    fault: item.fault ? 1 : 0,
                    speed: parseFloat(item.speed) || 0
                };
                InfluxService.writeTelemetry("coolingpump_data",
                    { code: item.code, building_code: deviceInDb.building.code },
                    fields
                );

                // --- SOCKET ---
                const managerName = deviceInDb.building.managers[0]?.user?.fullName || "Chưa bổ nhiệm";
                const socketPayload = {
                    code: item.code,
                    type: "COOLINGPUMP",
                    latest_state: item,
                    details: {
                        name: deviceInDb.name,
                        location: deviceInDb.location || "N/A",
                        buildingName: deviceInDb.building.name,
                        managerName: managerName
                    }
                };

                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", socketPayload);
                io.to("super_admin_room").emit("device-update", socketPayload);

            } catch (err) {
                console.error(`❌ Lỗi xử lý CoolingPump:`, err.message);
            }
        }
    },

    // 6. THÁP GIẢI NHIỆT (COOLINGTOWER)
    handleCoolingTowerData: async (towerList) => {
        for (const item of towerList) {
            try {
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: {
                        building: {
                            include: { managers: { include: { user: true } } }
                        }
                    }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                await DeviceService.checkAndCompleteCommand(item.code, item);

                const fields = {
                    power: item.power ? 1 : 0,
                    auto_mode: (item['auto-mode'] === 1 || item.auto_mode === 1) ? 1 : 0,
                    fault: item.fault ? 1 : 0
                };
                InfluxService.writeTelemetry("coolingtower_data",
                    { code: item.code, building_code: deviceInDb.building.code },
                    fields
                );

                // --- SOCKET ---
                const managerName = deviceInDb.building.managers[0]?.user?.fullName || "Chưa bổ nhiệm";
                const socketPayload = {
                    code: item.code,
                    type: "COOLINGTOWER",
                    latest_state: item,
                    details: {
                        name: deviceInDb.name,
                        location: deviceInDb.location || "N/A",
                        buildingName: deviceInDb.building.name,
                        managerName: managerName
                    }
                };

                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", socketPayload);
                io.to("super_admin_room").emit("device-update", socketPayload);

            } catch (err) {
                console.error(`❌ Lỗi xử lý CoolingTower:`, err.message);
            }
        }
    },
    // ==========================================
    // CÁC HÀM XỬ LÝ PHÂN HỆ MỚI ĐÃ ĐƯỢC CẬP NHẬT FULL CHI TIẾT
    // ==========================================

    // 7. XỬ LÝ AHU (Thuộc nhóm Chiller)
    handleAhuData: async (ahuList) => {
        for (const item of ahuList) {
            try {
                // SỬA: Include đầy đủ thông tin Tòa nhà và Người quản lý
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: { building: { include: { managers: { include: { user: true } } } } }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                await DeviceService.checkAndCompleteCommand(item.code, item);

                const fields = {
                    power: item.power ? 1 : 0,
                    auto_mode: item['auto-mode'] ? 1 : 0,
                    fault: item.fault ? 1 : 0,
                    temperature: parseFloat(item.temperature) || 0,
                    frequency: parseFloat(item.frequency) || 0
                };
                InfluxService.writeTelemetry("ahu_data", { code: item.code, building_code: deviceInDb.building.code }, fields);

                // SỬA: Bổ sung Full Payload để Web hiện thông báo đầy đủ
                const managerName = deviceInDb.building.managers[0]?.user?.fullName || "Chưa bổ nhiệm";
                const payload = {
                    code: item.code,
                    type: "AHU",
                    latest_state: item,
                    details: {
                        name: deviceInDb.name,
                        location: deviceInDb.location || "N/A",
                        buildingName: deviceInDb.building.name,
                        managerName: managerName
                    }
                };
                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", payload);
                io.to("super_admin_room").emit("device-update", payload);
            } catch (err) { console.error(`❌ Lỗi xử lý AHU:`, err.message); }
        }
    },

    // 8. XỬ LÝ ĐÈN CHIẾU SÁNG (Light & Dimmer)
    handleLightData: async (lightList) => {
        for (const item of lightList) {
            try {
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: { building: { include: { managers: { include: { user: true } } } } }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                await DeviceService.checkAndCompleteCommand(item.code, item);

                const fields = {
                    state: item.state ? 1 : 0,
                    brightness: parseFloat(item.brightness) || 0
                };
                InfluxService.writeTelemetry("lighting_data", { code: item.code, building_code: deviceInDb.building.code }, fields);

                // SỬA: Bổ sung Full Payload
                const managerName = deviceInDb.building.managers[0]?.user?.fullName || "Chưa bổ nhiệm";
                const payload = {
                    code: item.code,
                    type: deviceInDb.type,
                    latest_state: item,
                    details: {
                        name: deviceInDb.name,
                        location: deviceInDb.location || "N/A",
                        buildingName: deviceInDb.building.name,
                        managerName: managerName
                    }
                };
                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", payload);
                io.to("super_admin_room").emit("device-update", payload);
            } catch (err) { console.error(`❌ Lỗi xử lý Light:`, err.message); }
        }
    },

    // 9. XỬ LÝ BƠM SINH HOẠT
    handleDomesticPumpData: async (pumpList) => {
        for (const item of pumpList) {
            try {
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: { building: { include: { managers: { include: { user: true } } } } }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                await DeviceService.checkAndCompleteCommand(item.code, item);

                const isAuto = (item.mode === "AUTO") ? 1 : 0;
                const fields = {
                    state: item.state ? 1 : 0,
                    auto_mode: isAuto,
                    fault: item.fault ? 1 : 0,
                    speed: parseFloat(item.speed) || 0
                };
                InfluxService.writeTelemetry("domestic_pump_data", { code: item.code, building_code: deviceInDb.building.code }, fields);

                // SỬA: Bổ sung Full Payload
                const managerName = deviceInDb.building.managers[0]?.user?.fullName || "Chưa bổ nhiệm";
                const payload = {
                    code: item.code,
                    type: "DOMESTIC_PUMP",
                    latest_state: item,
                    details: {
                        name: deviceInDb.name,
                        location: deviceInDb.location || "N/A",
                        buildingName: deviceInDb.building.name,
                        managerName: managerName
                    }
                };
                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", payload);
                io.to("super_admin_room").emit("device-update", payload);
            } catch (err) { console.error(`❌ Lỗi xử lý Domestic Pump:`, err.message); }
        }
    },

    // 10. XỬ LÝ QUẠT THÔNG GIÓ
    handleFanData: async (fanList) => {
        for (const item of fanList) {
            try {
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: { building: { include: { managers: { include: { user: true } } } } }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                await DeviceService.checkAndCompleteCommand(item.code, item);

                const isAuto = (item.mode === "AUTO") ? 1 : 0;
                const fields = {
                    state: item.state ? 1 : 0,
                    auto_mode: isAuto,
                    fault: item.fault ? 1 : 0,
                    air_pressure: parseFloat(item.air_pressure) || 0,
                    air_temperature: parseFloat(item.air_temperature) || 0,
                    fan_speed: parseFloat(item.fan_speed) || 0
                };
                InfluxService.writeTelemetry("ventilation_data", { code: item.code, building_code: deviceInDb.building.code }, fields);

                // SỬA: Bổ sung Full Payload
                const managerName = deviceInDb.building.managers[0]?.user?.fullName || "Chưa bổ nhiệm";
                const payload = {
                    code: item.code,
                    type: "FAN",
                    latest_state: item,
                    details: {
                        name: deviceInDb.name,
                        location: deviceInDb.location || "N/A",
                        buildingName: deviceInDb.building.name,
                        managerName: managerName
                    }
                };
                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", payload);
                io.to("super_admin_room").emit("device-update", payload);
            } catch (err) { console.error(`❌ Lỗi xử lý Fan:`, err.message); }
        }
    }
};