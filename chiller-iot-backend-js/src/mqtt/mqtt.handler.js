// src/mqtt/mqtt.handler.js
import { DeviceService } from '../modules/device/device.service.js';

export const handleMqttMessage = async (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        console.log(`📩 [MQTT] Nhận dữ liệu từ Topic: ${topic}`);

        // Khớp đúng topic bạn cung cấp
        if (topic === 'yoo/yootek/cooling/chiller/chillers/get/response') {
            // Chuyển mảng Chiller sang Service xử lý
            await DeviceService.handleChillerData(payload);
        }
        else if (topic === 'yoo/yootek/cooling/chiller/pipes/get/response') {
            await DeviceService.handlePipeData(payload);
        }
        else if (topic === 'yoo/yootek/cooling/chiller/valves/get/response') {
            await DeviceService.handleValveData(payload);
        }
        else if (topic === 'yoo/yootek/cooling/chiller/coldPump/get/response') {
            await DeviceService.handleColdPumpData(payload);
        }
        else if (topic === 'yoo/yootek/cooling/chiller/coolingPump/get/response') {
            await DeviceService.handleCoolingPumpData(payload);
        }
        else if (topic === 'yoo/yootek/cooling/chiller/coolingTower/get/response') {
            await DeviceService.handleCoolingTowerData(payload);
        }

    } catch (error) {
        console.error("❌ Lỗi parse JSON MQTT:", error.message);
    }
};