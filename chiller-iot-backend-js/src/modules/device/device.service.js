// src/modules/device/device.service.js
import prisma from '../../config/prisma.js';
import { InfluxService } from '../../config/influx.js';
import { getIo } from '../../config/socket.js';

export const DeviceService = {

    // HÀM KIỂM TRA FEEDBACK COMMAND
    checkAndCompleteCommand: async (deviceCode, currentState) => {
        try {
            // 1. TẠO BỘ LỌC THỜI GIAN (Chỉ quan tâm lệnh gửi trong 2 giây qua)
            const twoSecondsAgo = new Date(Date.now() - 2000);

            // 2. Tìm tất cả các lệnh đang chờ (SENT) của thiết bị này
            const pendingLogs = await prisma.controlLog.findMany({
                where: {
                    device_code: deviceCode,
                    status: 'SENT',
                    created_at: { gte: twoSecondsAgo } // Loại bỏ các lệnh bị kẹt từ lâu
                },
                orderBy: { created_at: 'desc' } // Sắp xếp mới nhất lên đầu
            });

            // Nếu không có lệnh nào đang chờ -> Bỏ qua
            if (pendingLogs.length === 0) return;

            // 3. BÓC TÁCH: Lệnh mới nhất và Các lệnh cũ bị spam (Nhấp đúp chuột)
            const latestLog = pendingLogs[0]; // Lệnh số 1 (Mới nhất)
            const olderLogs = pendingLogs.slice(1); // Các lệnh số 2, 3... (Bị spam)

            // 4. XỬ LÝ LỆNH SPAM: Cập nhật thành OVERRIDDEN (Bị ghi đè)
            if (olderLogs.length > 0) {
                const olderIds = olderLogs.map(log => log.id);
                await prisma.controlLog.updateMany({
                    where: { id: { in: olderIds } }, // Chỉ cập nhật các ID bị spam
                    data: { status: 'OVERRIDDEN', completed_at: new Date() }
                });
                console.log(`🗑️ [AUDIT] Đã hủy ${olderLogs.length} lệnh cũ của ${deviceCode} do bị ghi đè.`);
            }

            // 5. LẤY PAYLOAD CỦA LỆNH MỚI NHẤT ĐỂ KIỂM TRA
            let rawPayload = latestLog.command_payload;
            if (typeof rawPayload === 'string') rawPayload = JSON.parse(rawPayload);
            const cmd = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload;
            if (!cmd) return;

            let isMatched = true;
            const keysToCheck = ['power', 'state', 'speed', 'fan_speed', 'brightness', 'auto-mode', 'auto_mode'];

            for (const key of keysToCheck) {
                if (cmd[key] !== undefined) {
                    if (currentState[key] != cmd[key]) {
                        isMatched = false;
                        break;
                    }
                }
            }

            const newStatus = isMatched ? 'SUCCESS' : 'FAILED';

            // 6. CẬP NHẬT TRẠNG THÁI (Chỉ bắn đích danh vào ID của lệnh mới nhất)
            const updatedLog = await prisma.controlLog.update({
                where: {
                    id: latestLog.id // ĐÂY LÀ CHÌA KHÓA: Chỉ cập nhật duy nhất bản ghi này
                },
                data: { status: newStatus, completed_at: new Date() }
            });

            if (!updatedLog) return;

            // 7. BẮN SOCKET THÔNG BÁO LÊN GIAO DIỆN
            const deviceInfo = await prisma.device.findUnique({ where: { code: deviceCode } });
            if (!deviceInfo) return;

            const io = await import('../../config/socket.js').then(m => m.getIo());

            if (isMatched) {
                console.log(`✅ [FEEDBACK] Lệnh điều khiển ${deviceCode} THÀNH CÔNG!`);
                io.to(`building-${deviceInfo.buildingId}`).emit("command-success", { name: deviceInfo.name || deviceCode });
                io.to("super_admin_room").emit("command-success", { name: deviceInfo.name || deviceCode });
            } else {
                console.log(`❌ [FEEDBACK] Dữ liệu phản hồi của ${deviceCode} BỊ SAI LỆCH!`);
                io.to(`building-${deviceInfo.buildingId}`).emit("command-failed", { name: deviceInfo.name || deviceCode });
                io.to("super_admin_room").emit("command-failed", { name: deviceInfo.name || deviceCode });
            }

        } catch (error) {
            console.error(`⚠️ Lỗi kiểm tra Feedback Command cho ${deviceCode}:`, error.message);
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