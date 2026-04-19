// src/modules/device/device.service.js
import prisma from '../../config/prisma.js';
import { InfluxService } from '../../config/influx.js';
import { getIo } from '../../config/socket.js'; // THÊM DÒNG NÀY

export const DeviceService = {

    // 1. THIẾT BỊ CHILLER
    handleChillerData: async (chillerList) => {
        for (const item of chillerList) {
            try {
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: { building: true }
                });

                if (!deviceInDb) {
                    console.log(`⚠️ Thiết bị ${item.code} chưa được khai báo. Bỏ qua.`);
                    continue;
                }
                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                const tags = { code: item.code, building_code: deviceInDb.building.code };
                const fields = {
                    power: item.power ? 1 : 0,
                    auto_mode: (item['auto-mode'] === 1 || item.auto_mode === 1) ? 1 : 0,
                    fault: item.fault ? 1 : 0
                };
                InfluxService.writeTelemetry("chiller_status", tags, fields);

                // --- PHẦN THÊM MỚI: GỬI SOCKET REAL-TIME ---
                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", {
                    code: item.code,
                    type: "CHILLER",
                    latest_state: item
                });

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
                    include: { building: true }
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

                // --- GỬI SOCKET REAL-TIME ---
                const io = getIo();
                io.to(`building-${deviceInDb.buildingId}`).emit("device-update", {
                    code: item.code,
                    type: "PIPE",
                    latest_state: item
                });

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
                    include: { building: true }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                InfluxService.writeTelemetry("valve_data",
                    { code: item.code, building_code: deviceInDb.building.code },
                    { state: item.state ? 1 : 0 }
                );

                // --- GỬI SOCKET REAL-TIME ---
                getIo().to(`building-${deviceInDb.buildingId}`).emit("device-update", {
                    code: item.code,
                    type: "VALVE",
                    latest_state: item
                });

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
                    include: { building: true }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

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

                // --- GỬI SOCKET REAL-TIME ---
                getIo().to(`building-${deviceInDb.buildingId}`).emit("device-update", {
                    code: item.code,
                    type: "COLDPUMP",
                    latest_state: item
                });

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
                    include: { building: true }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

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

                // --- GỬI SOCKET REAL-TIME ---
                getIo().to(`building-${deviceInDb.buildingId}`).emit("device-update", {
                    code: item.code,
                    type: "COOLINGPUMP",
                    latest_state: item
                });

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
                    include: { building: true }
                });
                if (!deviceInDb) continue;

                await prisma.device.update({
                    where: { code: item.code },
                    data: { latest_state: item, last_updated: new Date() }
                });

                const fields = {
                    power: item.power ? 1 : 0,
                    auto_mode: (item['auto-mode'] === 1 || item.auto_mode === 1) ? 1 : 0,
                    fault: item.fault ? 1 : 0
                };
                InfluxService.writeTelemetry("coolingtower_data",
                    { code: item.code, building_code: deviceInDb.building.code },
                    fields
                );

                // --- GỬI SOCKET REAL-TIME ---
                getIo().to(`building-${deviceInDb.buildingId}`).emit("device-update", {
                    code: item.code,
                    type: "COOLINGTOWER",
                    latest_state: item
                });

            } catch (err) {
                console.error(`❌ Lỗi xử lý CoolingTower:`, err.message);
            }
        }
    }
};