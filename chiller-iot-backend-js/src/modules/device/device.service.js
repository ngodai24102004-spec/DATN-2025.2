import prisma from '../../config/prisma.js';
import { InfluxService } from '../../config/influx.js';

export const DeviceService = {
    handleIncomingData: async (type, data, buildingId, buildingCode) => {
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
            // 1. Cập nhật MySQL
            await prisma.device.upsert({
                where: { code: item.code },
                update: { latest_state: item, last_updated: new Date() },
                create: {
                    code: item.code,
                    type: type,
                    latest_state: item,
                    buildingId: buildingId, // Bắt buộc có Id tòa nhà
                    name: `${type} ${item.code}`
                }
            });

            // 2. Lưu InfluxDB
            let measurement = `${type.toLowerCase()}_data`;
            const tags = { code: item.code, building_code: buildingCode };

            let fields = {};
            if (type === 'PIPE') {
                fields = { temperature: item.temperature, flow_rate: item.flow_rate, pressure: item.pressure };
            } else {
                fields = { power: item.power ? 1 : 0, fault: item.fault ? 1 : 0, speed: item.speed || 0 };
            }

            InfluxService.writeTelemetry(measurement, tags, fields);
        }
    }
};