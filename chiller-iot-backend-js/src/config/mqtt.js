import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);

mqttClient.on('connect', () => {
    console.log('✅ Đã kết nối tới MQTT Broker');

    // Danh sách các Topic cần lắng nghe dữ liệu từ EBO
    const topicsToSubscribe = [
        'yoo/yootek/cooling/chiller/chillers/get/response', // Dữ liệu Chiller
        'yoo/yootek/cooling/chiller/pipes/get/response', // Dữ liệu Cảm biến đường ống
        'yoo/yootek/cooling/chiller/valves/get/response', // Dữ liệu Van điều khiển
        'yoo/yootek/cooling/chiller/coldPump/get/response',// Dữ liệu Bơm nước lạnh
        'yoo/yootek/cooling/chiller/coolingPump/get/response',// Dữ liệu Bơm nước giải nhiệt
        'yoo/yootek/cooling/chiller/coolingTower/get/response' // Dữ liệu Tháp giải nhiệt
    ];

    mqttClient.subscribe(topicsToSubscribe, (err) => {
        if (!err) {
            console.log('📡 Hệ thống đã sẵn sàng nhận dữ liệu từ:');
            topicsToSubscribe.forEach(t => console.log(`   - ${t}`));
        } else {
            console.error('❌ Lỗi khi Subscribe topic:', err);
        }
    });
});

// Thêm log để bắt lỗi kết nối nếu có
mqttClient.on('error', (err) => {
    console.error('❌ Lỗi kết nối MQTT Client:', err);
});

export default mqttClient;