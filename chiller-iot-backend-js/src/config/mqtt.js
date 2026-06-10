import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

// Đọc thông tin từ file .env
const brokerUrl = process.env.MQTT_BROKER_URL;
const options = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    // Các cấu hình bảo mật cần thiết cho HiveMQ Cloud
    protocolVersion: 4,
    rejectUnauthorized: true
};

// Kết nối với Broker kèm theo tài khoản xác thực
const mqttClient = mqtt.connect(brokerUrl, options);

mqttClient.on('connect', () => {
    console.log('✅ Đã kết nối tới MQTT Broker');

    // Danh sách các Topic cần lắng nghe dữ liệu từ EBO
    const topicsToSubscribe = [
        'yoo/yootek/cooling/chiller/chillers/get/response', // Dữ liệu Chiller
        'yoo/yootek/cooling/chiller/pipes/get/response', // Dữ liệu Cảm biến đường ống
        'yoo/yootek/cooling/chiller/valves/get/response', // Dữ liệu Van điều khiển
        'yoo/yootek/cooling/chiller/coldPump/get/response',// Dữ liệu Bơm nước lạnh
        'yoo/yootek/cooling/chiller/coolingPump/get/response',// Dữ liệu Bơm nước giải nhiệt
        'yoo/yootek/cooling/chiller/coolingTower/get/response', // Dữ liệu Tháp giải nhiệt
        'yoo/yootek/cooling/chiller/ahu/get/response', // AHU
        'yoo/yootek/light/light',                      // Đèn (On/Off và Dimmer)
        'yoo/yootek/pump/pump',                        // Bơm sinh hoạt
        'yoo/yootek/fan'                               // Quạt thông gió
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