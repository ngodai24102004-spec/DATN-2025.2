// src/modules/device/device.service.js
import prisma from '../../config/prisma.js';
import { InfluxService } from '../../config/influx.js';

export const DeviceService = {

    //thiet bi chiller
    handleChillerData: async (chillerList) => {
        // Vì dữ liệu MQTT là một mảng []
        for (const item of chillerList) {
            try {
                // 1. TÌM KIẾM THÔNG TIN TÒA NHÀ TỪ MYSQL
                // Chúng ta dựa vào 'code' (chiller-001) để biết nó thuộc nhà nào
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: { building: true } // Lấy kèm thông tin tòa nhà (code, name)
                });

                if (!deviceInDb) {
                    console.log(`⚠️ Thiết bị ${item.code} chưa được khai báo trong MySQL. Bỏ qua.`);
                    continue;
                }

                const buildingCode = deviceInDb.building.code; // Ví dụ: 'BUILDING_A'

                // 2. CẬP NHẬT TRẠNG THÁI MỚI NHẤT VÀO MYSQL
                await prisma.device.update({
                    where: { code: item.code },
                    data: {
                        latest_state: item,
                        last_updated: new Date()
                    }
                });

                // 3. GHI LỊCH SỬ VÀO INFLUXDB (Kèm nhãn tòa nhà)
                const measurement = "chiller_status"; // Tên bảng trong InfluxDB

                const tags = {
                    code: item.code,
                    building_code: buildingCode // <-- ĐÂY LÀ CHÌA KHÓA ĐỂ TRUY XUẤT THEO NHÀ
                };

                const fields = {
                    power: item.power ? 1 : 0,
                    auto_mode: item['auto-mode'] ? 1 : 0,
                    fault: item.fault ? 1 : 0
                };

                InfluxService.writeTelemetry(measurement, tags, fields);

                console.log(`✅ Đã lưu data Chiller: ${item.code} thuộc nhà: ${buildingCode}`);

            } catch (err) {
                console.error(`❌ Lỗi xử lý cho máy ${item.code}:`, err.message);
            }
        }
    },

    //thiet bi duong ong(PIPE)
    handlePipeData: async (pipeList) => {
        for (const item of pipeList) {
            try {
                // 1. Tìm thông tin tòa nhà từ MySQL dựa trên mã PIPE-001
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: { building: true }
                });

                if (!deviceInDb) {
                    console.log(`⚠️ Thiết bị ${item.code} chưa được khai báo. Bỏ qua.`);
                    continue;
                }

                const buildingCode = deviceInDb.building.code;

                // 2. Cập nhật trạng thái mới nhất vào MySQL (latest_state)
                await prisma.device.update({
                    where: { code: item.code },
                    data: {
                        latest_state: item,
                        last_updated: new Date()
                    }
                });

                // 3. Ghi lịch sử vào InfluxDB
                const measurement = "pipe_telemetry"; // Tên bảng cho cảm biến đường ống

                const tags = {
                    code: item.code,
                    building_code: buildingCode
                };

                const fields = {
                    flow_status: item.flow_status ? 1 : 0,
                    temperature: parseFloat(item.temperature),
                    flow_rate: parseFloat(item.flow_rate),
                    pressure: parseFloat(item.pressure)
                };

                InfluxService.writeTelemetry(measurement, tags, fields);

                console.log(`✅ Đã lưu data Pipe: ${item.code} [Temp: ${item.temperature}] thuộc nhà: ${buildingCode}`);

            } catch (err) {
                console.error(`❌ Lỗi xử lý cho ống ${item?.code}:`, err.message);
            }
        }
    },

    //thiet bi valve
    handleValveData: async (valveList) => {
        for (const item of valveList) {
            try {
                // 1. Tìm thông tin tòa nhà từ MySQL
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: { building: true }
                });

                if (!deviceInDb) {
                    console.log(`⚠️ Van ${item.code} chưa được khai báo trong MySQL. Bỏ qua.`);
                    continue;
                }

                const buildingCode = deviceInDb.building.code;

                // 2. Cập nhật trạng thái hiện tại (Đóng/Mở) vào MySQL
                await prisma.device.update({
                    where: { code: item.code },
                    data: {
                        latest_state: item,
                        last_updated: new Date()
                    }
                });

                // 3. Ghi lịch sử đóng mở vào InfluxDB
                const measurement = "valve_data"; // Bảng dành riêng cho Van

                const tags = {
                    code: item.code,
                    building_code: buildingCode
                };

                const fields = {
                    // Ép kiểu boolean/int về 1 (Mở) và 0 (Đóng) cho chắc chắn
                    state: item.state ? 1 : 0
                };

                InfluxService.writeTelemetry(measurement, tags, fields);

                console.log(`✅ Đã lưu data Valve: ${item.code}[Trạng thái: ${item.state === 1 ? 'MỞ' : 'ĐÓNG'}] thuộc nhà: ${buildingCode}`);

            } catch (err) {
                console.error(`❌ Lỗi xử lý cho van ${item?.code}:`, err.message);
            }
        }
    },

    // HÀM Xử lý dữ liệu Bơm nước lạnh
    handleColdPumpData: async (pumpList) => {
        for (const item of pumpList) {
            try {
                // 1. Tìm tòa nhà
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: { building: true }
                });

                if (!deviceInDb) {
                    console.log(`⚠️ Bơm ${item.code} chưa khai báo trong MySQL. Bỏ qua.`);
                    continue;
                }

                const buildingCode = deviceInDb.building.code;

                // 2. Cập nhật MySQL
                await prisma.device.update({
                    where: { code: item.code },
                    data: {
                        latest_state: item,
                        last_updated: new Date()
                    }
                });

                // 3. Ghi vào InfluxDB
                const measurement = "coldpump_data";

                const tags = {
                    code: item.code,
                    building_code: buildingCode
                };

                const fields = {
                    power: item.power ? 1 : 0,
                    auto_mode: item['auto-mode'] ? 1 : 0,
                    fault: item.fault ? 1 : 0,
                    // Ép kiểu Float cho tốc độ bơm (ví dụ: 45.5 Hz)
                    speed: parseFloat(item.speed) || 0
                };

                InfluxService.writeTelemetry(measurement, tags, fields);

                console.log(`✅ Đã lưu data ColdPump: ${item.code} [Speed: ${fields.speed} Hz] thuộc nhà: ${buildingCode}`);

            } catch (err) {
                console.error(`❌ Lỗi xử lý cho bơm ${item?.code}:`, err.message);
            }
        }
    },
    // HÀM Xử lý dữ liệu Bơm giải nhiệt (Cooling Pump)
    handleCoolingPumpData: async (pumpList) => {
        for (const item of pumpList) {
            try {
                // 1. Tìm thông tin tòa nhà
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: { building: true }
                });

                if (!deviceInDb) {
                    console.log(`⚠️ Bơm giải nhiệt ${item.code} chưa khai báo trong MySQL. Bỏ qua.`);
                    continue;
                }

                const buildingCode = deviceInDb.building.code;

                // 2. Cập nhật trạng thái hiện tại vào MySQL
                await prisma.device.update({
                    where: { code: item.code },
                    data: {
                        latest_state: item,
                        last_updated: new Date()
                    }
                });

                // 3. Ghi lịch sử vào InfluxDB
                const measurement = "coolingpump_data"; // Tên bảng dành riêng cho bơm giải nhiệt

                const tags = {
                    code: item.code,
                    building_code: buildingCode
                };

                const fields = {
                    power: item.power ? 1 : 0,
                    auto_mode: item['auto-mode'] ? 1 : 0,
                    fault: item.fault ? 1 : 0,
                    speed: parseFloat(item.speed) || 0
                };

                InfluxService.writeTelemetry(measurement, tags, fields);

                console.log(`✅ Đã lưu data CoolingPump: ${item.code} [Speed: ${fields.speed} Hz] thuộc nhà: ${buildingCode}`);

            } catch (err) {
                console.error(`❌ Lỗi xử lý cho bơm giải nhiệt ${item?.code}:`, err.message);
            }
        }
    },
    // HÀM Xử lý dữ liệu Tháp giải nhiệt (Cooling Tower)
    handleCoolingTowerData: async (towerList) => {
        for (const item of towerList) {
            try {
                // 1. Tìm thông tin tòa nhà
                const deviceInDb = await prisma.device.findUnique({
                    where: { code: item.code },
                    include: { building: true }
                });

                if (!deviceInDb) {
                    console.log(`⚠️ Tháp giải nhiệt ${item.code} chưa khai báo trong MySQL. Bỏ qua.`);
                    continue;
                }

                const buildingCode = deviceInDb.building.code;

                // 2. Cập nhật MySQL
                await prisma.device.update({
                    where: { code: item.code },
                    data: {
                        latest_state: item,
                        last_updated: new Date()
                    }
                });

                // 3. Ghi vào InfluxDB
                const measurement = "coolingtower_data";

                const tags = {
                    code: item.code,
                    building_code: buildingCode
                };

                const fields = {
                    power: item.power ? 1 : 0,
                    auto_mode: item['auto-mode'] ? 1 : 0,
                    fault: item.fault ? 1 : 0
                };

                InfluxService.writeTelemetry(measurement, tags, fields);

                console.log(`✅ Đã lưu data CoolingTower: ${item.code} [Power: ${fields.power}] thuộc nhà: ${buildingCode}`);

            } catch (err) {
                console.error(`❌ Lỗi xử lý cho tháp giải nhiệt ${item?.code}:`, err.message);
            }
        }
    }

};