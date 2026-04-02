// src/mqtt/mqtt.handler.js
import { DeviceService } from '../modules/device/device.service.js';

// PHẢI CÓ TỪ KHÓA export Ở ĐÂY
export const handleMqttMessage = async (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        const topicParts = topic.split('/');
        const buildingCode = topicParts[2]; // Lấy mã tòa nhà từ topic

        console.log(`📩 Nhận data từ Topic: ${topic}`);

        // Logic phân loại thiết bị (Ví dụ cho Chiller)
        if (topic.includes('chillers/get/response')) {
            // Lưu ý: Bạn cần lấy buildingId từ MySQL hoặc truyền từ simulator
            // Ở đây giả sử tạm thời truyền buildingId = 1 để test
            await DeviceService.handleIncomingData('CHILLER', payload, 1, buildingCode);
        }

        // ... Thêm các loại thiết bị khác (PIPE, PUMP...) tương tự ở đây

    } catch (e) {
        console.error("❌ Lỗi xử lý MQTT message:", e.message);
    }
};