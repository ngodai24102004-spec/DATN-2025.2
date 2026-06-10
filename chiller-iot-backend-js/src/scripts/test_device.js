import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình tài khoản đăng nhập HiveMQ
const options = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    protocolVersion: 4,
    rejectUnauthorized: true
};

// Kết nối tới HiveMQ Cloud
const client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

// ==========================================
// 1. ĐỊNH NGHĨA TOPIC PHẢN HỒI (RESPONSE/GET)
// ==========================================
const CHILLER_TOPIC = 'yoo/yootek/cooling/chiller/chillers/get/response';
const PIPE_TOPIC = 'yoo/yootek/cooling/chiller/pipes/get/response';
const VALVE_TOPIC = 'yoo/yootek/cooling/chiller/valves/get/response';
const COLDPUMP_TOPIC = 'yoo/yootek/cooling/chiller/coldPump/get/response';
const COOLINGPUMP_TOPIC = 'yoo/yootek/cooling/chiller/coolingPump/get/response';
const COOLINGTOWER_TOPIC = 'yoo/yootek/cooling/chiller/coolingTower/get/response';
const AHU_TOPIC = 'yoo/yootek/cooling/chiller/ahu/get/response';
const LIGHT_TOPIC = 'yoo/yootek/light/light';
const DOMESTIC_PUMP_TOPIC = 'yoo/yootek/pump/pump';
const FAN_TOPIC = 'yoo/yootek/fan';

// ==========================================
// 2. MAP TOPIC ĐIỀU KHIỂN (SET) VỚI TOPIC PHẢN HỒI
// ==========================================
const TOPIC_MAP = {
    'yoo/yootek/cooling/chiller/chillers/set': CHILLER_TOPIC,
    'yoo/yootek/cooling/chiller/ahu/set': AHU_TOPIC,
    'yoo/yootek/cooling/chiller/valves/set': VALVE_TOPIC,
    'yoo/yootek/cooling/chiller/coldPump/set': COLDPUMP_TOPIC,
    'yoo/yootek/cooling/chiller/coolingPump/set': COOLINGPUMP_TOPIC,
    'yoo/yootek/cooling/chiller/coolingTower/set': COOLINGTOWER_TOPIC,
    'yoo/yootek/light/light/set': LIGHT_TOPIC,
    'yoo/yootek/light/dimmer_light/set': LIGHT_TOPIC,
    'yoo/yootek/pump/set': DOMESTIC_PUMP_TOPIC,
    'yoo/yootek/fan/set': FAN_TOPIC
};

// ==========================================
// 3. BỘ NHỚ TRẠNG THÁI THIẾT BỊ (Mặc định khi bật)
// ==========================================
let deviceMemory = {
    "chiller-001": { code: "chiller-001", power: 1, "auto-mode": 1, fault: 0 },
    "PIPE-001": { code: "PIPE-001", flow_status: 1, temperature: 12.5, flow_rate: 23.4, pressure: 1.6 },
    "VALVE-001": { code: "VALVE-001", state: 1 },
    "COLDPUMP-001": { code: "COLDPUMP-001", power: 1, "auto-mode": 1, fault: 0, speed: 42.5 },
    "COOLINGPUMP-001": { code: "COOLINGPUMP-001", power: 1, "auto-mode": 1, fault: 0, speed: 45.0 },
    "COOLINGTOWER-001": { code: "COOLINGTOWER-001", power: 1, "auto-mode": 1, fault: 0 },
    "AHU-ROOM-A": { code: "AHU-ROOM-A", power: 1, "auto-mode": 1, fault: 0, temperature: 22.5, frequency: 45.0 },
    "LIGHT_01": { code: "LIGHT_01", state: 1 },
    "LIGHT_DIMMER_01": { code: "LIGHT_DIMMER_01", state: 1, brightness: 80 },
    "PUMP_01": { code: "PUMP_01", state: 1, mode: "AUTO", fault: 0, speed: 40.0 },
    "FAN_01": { code: "FAN_01", state: 1, mode: "AUTO", fault: 0, air_pressure: 120.0, air_temperature: 28.0, fan_speed: 80 }
};

client.on('connect', () => {
    console.log('🚀 Simulator V2 đã chạy! Đang gửi dữ liệu và lắng nghe lệnh điều khiển...');

    // Đăng ký nhận toàn bộ các lệnh điều khiển (SET) từ Backend
    client.subscribe(Object.keys(TOPIC_MAP));

    // ==========================================
    // VÒNG LẶP GỬI DỮ LIỆU ĐỊNH KỲ (Lấy từ bộ nhớ)
    // ==========================================
    setInterval(() => {
        const now = new Date().toLocaleTimeString();

        // Thêm nhiễu vật lý ngẫu nhiên cho các cảm biến (Giữ nguyên tính chân thực)
        if (deviceMemory["PIPE-001"].flow_status) {
            deviceMemory["PIPE-001"].temperature = (12.5 + (Math.random() * 2 - 1)).toFixed(2);
            deviceMemory["PIPE-001"].flow_rate = (23.4 + (Math.random() * 4 - 2)).toFixed(2);
            deviceMemory["PIPE-001"].pressure = (1.6 + (Math.random() * 0.4 - 0.2)).toFixed(2);
        }
        if (deviceMemory["AHU-ROOM-A"].power) {
            deviceMemory["AHU-ROOM-A"].temperature = (22.5 + (Math.random() * 1.5 - 0.5)).toFixed(1);
        }
        if (deviceMemory["FAN_01"].state) {
            deviceMemory["FAN_01"].air_pressure = (120 + Math.random() * 10).toFixed(1);
            deviceMemory["FAN_01"].air_temperature = (28 + Math.random() * 2).toFixed(1);
        }

        // Publish dữ liệu định kỳ từ bộ nhớ
        client.publish(CHILLER_TOPIC, JSON.stringify([deviceMemory["chiller-001"]]));
        client.publish(PIPE_TOPIC, JSON.stringify([deviceMemory["PIPE-001"]]));
        client.publish(VALVE_TOPIC, JSON.stringify([deviceMemory["VALVE-001"]]));
        client.publish(COLDPUMP_TOPIC, JSON.stringify([deviceMemory["COLDPUMP-001"]]));
        client.publish(COOLINGPUMP_TOPIC, JSON.stringify([deviceMemory["COOLINGPUMP-001"]]));
        client.publish(COOLINGTOWER_TOPIC, JSON.stringify([deviceMemory["COOLINGTOWER-001"]]));
        client.publish(AHU_TOPIC, JSON.stringify([deviceMemory["AHU-ROOM-A"]]));
        console.log(`❄️ [${now}] CHILLER PLANT | Gửi 7 topics (Chiller, Bơm, Tháp, Van, Ống, AHU)`);

        client.publish(LIGHT_TOPIC, JSON.stringify([deviceMemory["LIGHT_01"], deviceMemory["LIGHT_DIMMER_01"]]));
        console.log(`💡 [${now}] LIGHTING      | LIGHT_01: ${deviceMemory["LIGHT_01"].state ? 'ON' : 'OFF'} | DIMMER: ${deviceMemory["LIGHT_DIMMER_01"].brightness}%`);

        client.publish(DOMESTIC_PUMP_TOPIC, JSON.stringify([deviceMemory["PUMP_01"]]));
        console.log(`💧 [${now}] DOM. PUMP     | PUMP_01: ${deviceMemory["PUMP_01"].state ? 'ON' : 'OFF'} | Speed: ${deviceMemory["PUMP_01"].speed} Hz`);

        client.publish(FAN_TOPIC, JSON.stringify([deviceMemory["FAN_01"]]));
        console.log(`💨 [${now}] VENTILATION   | FAN_01: ${deviceMemory["FAN_01"].state ? 'ON' : 'OFF'} | Speed: ${deviceMemory["FAN_01"].fan_speed}%`);

        console.log('--------------------------------------------------');
    }, 20000);
});

// ==========================================
// BẮT LỆNH ĐIỀU KHIỂN & TRẢ VỀ PHẢN HỒI CHÍNH XÁC
// ==========================================
client.on('message', (topic, message) => {
    try {
        const commandArray = JSON.parse(message.toString());
        const command = commandArray[0]; // Lấy object đầu tiên trong mảng
        const code = command.code;

        console.log(`\n⚡ [BẮT ĐƯỢC LỆNH] Từ topic: ${topic}`);
        console.log(`📥 Lệnh yêu cầu cho [${code}]:`, command);

        // Kiểm tra xem thiết bị có trong bộ nhớ không
        if (deviceMemory[code]) {
            // Cập nhật bộ nhớ với dữ liệu lệnh mới (Ghi đè)
            deviceMemory[code] = { ...deviceMemory[code], ...command };

            // Tìm đúng topic phản hồi (GET/RESPONSE) tương ứng
            const responseTopic = TOPIC_MAP[topic];

            if (responseTopic) {
                // Tạo gói tin phản hồi mang đúng dữ liệu vừa thay đổi
                const responsePayload = [deviceMemory[code]];

                // Publish phản hồi NGAY LẬP TỨC để Backend kiểm tra
                client.publish(responseTopic, JSON.stringify(responsePayload));
                console.log(`📤 [PHẢN HỒI] Trả trạng thái thực tế về topic: ${responseTopic}\n`);
            }
        } else {
            console.log(`⚠️ Không tìm thấy thiết bị [${code}] trong bộ nhớ giả lập.\n`);
        }

    } catch (err) {
        console.error("❌ Lỗi parse lệnh MQTT:", err.message);
    }
});

client.on('error', (err) => {
    console.error('❌ Lỗi kết nối MQTT:', err);
});