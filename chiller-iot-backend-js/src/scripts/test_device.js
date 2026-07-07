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
// 3. BỘ NHỚ TRẠNG THÁI THIẾT BỊ ĐA TẦNG
// ==========================================
let deviceMemory = {
    // NHÓM CHILLER 
    "chiller-001": { code: "chiller-001", power: 1, "auto-mode": 1, fault: 0 },
    "PIPE-001": { code: "PIPE-001", flow_status: 1, temperature: 12.5, flow_rate: 23.4, pressure: 1.6 },
    "VALVE-001": { code: "VALVE-001", state: 1 },
    "COLDPUMP-001": { code: "COLDPUMP-001", power: 1, "auto-mode": 1, fault: 0, speed: 42.5 },
    "COOLINGPUMP-001": { code: "COOLINGPUMP-001", power: 1, "auto-mode": 1, fault: 0, speed: 45.0 },
    "COOLINGTOWER-001": { code: "COOLINGTOWER-001", power: 1, "auto-mode": 1, fault: 0 },

    // NHÓM AHU (RẢI Ở CÁC TẦNG NỔI)
    "AHU-T1": { code: "AHU-T1", power: 0, "auto-mode": 1, fault: 0, temperature: 22.5, frequency: 45.0 },
    "AHU-T2": { code: "AHU-T2", power: 1, "auto-mode": 1, fault: 0, temperature: 23.1, frequency: 46.5 },
    "AHU-T3": { code: "AHU-T3", power: 0, "auto-mode": 1, fault: 1, temperature: 25.0, frequency: 0 },
    "AHU-T4": { code: "AHU-T4", power: 1, "auto-mode": 1, fault: 0, temperature: 22.0, frequency: 48.0 },

    // NHÓM CHIẾU SÁNG
    "LIGHT_T1": { code: "LIGHT_T1", state: 1 },
    "LIGHT_T2": { code: "LIGHT_T2", state: 1 },
    "LIGHT_T3": { code: "LIGHT_T3", state: 0 },
    "LIGHT_T4": { code: "LIGHT_T4", state: 1 },
    "DIMMER_SANH": { code: "DIMMER_SANH", state: 1, brightness: 80 },
    "DIMMER_HOP": { code: "DIMMER_HOP", state: 1, brightness: 60 },

    // NHÓM BƠM SINH HOẠT VÀ QUẠT
    "PUMP_01": { code: "PUMP_01", state: 1, mode: "AUTO", fault: 0, speed: 40.0 },
    "PUMP_02": { code: "PUMP_02", state: 0, mode: "MANUAL", fault: 0, speed: 0 },
    "FAN_T1": { code: "FAN_T1", state: 1, mode: "AUTO", fault: 0, air_pressure: 120.0, air_temperature: 28.0, fan_speed: 80 },
    "FAN_T2": { code: "FAN_T2", state: 1, mode: "AUTO", fault: 0, air_pressure: 118.0, air_temperature: 27.5, fan_speed: 75 }
};

client.on('connect', () => {
    console.log('🚀 Simulator V3 (Đa Tầng) đã chạy! Đang gửi dữ liệu và lắng nghe lệnh điều khiển...');

    // Đăng ký nhận toàn bộ các lệnh điều khiển (SET) từ Backend
    client.subscribe(Object.keys(TOPIC_MAP));

    // ==========================================
    // VÒNG LẶP GỬI DỮ LIỆU ĐỊNH KỲ (Lấy từ bộ nhớ)
    // ==========================================
    setInterval(() => {
        const now = new Date().toLocaleTimeString();

        // 1. Thêm nhiễu ngẫu nhiên cho Cảm biến Ống
        if (deviceMemory["PIPE-001"].flow_status) {
            deviceMemory["PIPE-001"].temperature = (12.5 + (Math.random() * 2 - 1)).toFixed(2);
            deviceMemory["PIPE-001"].flow_rate = (23.4 + (Math.random() * 4 - 2)).toFixed(2);
            deviceMemory["PIPE-001"].pressure = (1.6 + (Math.random() * 0.4 - 0.2)).toFixed(2);
        }

        // 2. Thêm nhiễu ngẫu nhiên cho toàn bộ AHU đang chạy
        ['AHU-T1', 'AHU-T2', 'AHU-T3', 'AHU-T4'].forEach(id => {
            if (deviceMemory[id].power) {
                deviceMemory[id].temperature = (22.5 + (Math.random() * 1.5 - 0.5)).toFixed(1);
            }
        });

        // 3. Thêm nhiễu ngẫu nhiên cho toàn bộ QUẠT đang chạy
        ['FAN_T1', 'FAN_T2'].forEach(id => {
            if (deviceMemory[id].state) {
                deviceMemory[id].air_pressure = (120 + Math.random() * 10).toFixed(1);
                deviceMemory[id].air_temperature = (28 + Math.random() * 2).toFixed(1);
            }
        });


        // ==========================================
        // ĐÓNG GÓI VÀ GỬI (PUBLISH) THEO TỪNG TOPIC
        // ==========================================
        client.publish(CHILLER_TOPIC, JSON.stringify([deviceMemory["chiller-001"]]));
        client.publish(PIPE_TOPIC, JSON.stringify([deviceMemory["PIPE-001"]]));
        client.publish(VALVE_TOPIC, JSON.stringify([deviceMemory["VALVE-001"]]));
        client.publish(COLDPUMP_TOPIC, JSON.stringify([deviceMemory["COLDPUMP-001"]]));
        client.publish(COOLINGPUMP_TOPIC, JSON.stringify([deviceMemory["COOLINGPUMP-001"]]));
        client.publish(COOLINGTOWER_TOPIC, JSON.stringify([deviceMemory["COOLINGTOWER-001"]]));
        console.log(`❄️ [${now}] CHILLER PLANT | Gửi dữ liệu cụm Chiller trung tâm`);

        // Gom toàn bộ AHU thành 1 mảng gửi đi
        const ahuPayload = [deviceMemory["AHU-T1"], deviceMemory["AHU-T2"], deviceMemory["AHU-T3"], deviceMemory["AHU-T4"]];
        client.publish(AHU_TOPIC, JSON.stringify(ahuPayload));
        console.log(`🌀 [${now}] AHU SYSTEMS   | Gửi thông số 4 máy AHU`);

        // Gom toàn bộ Đèn thành 1 mảng
        const lightPayload = [
            deviceMemory["LIGHT_T1"], deviceMemory["LIGHT_T2"], deviceMemory["LIGHT_T3"], deviceMemory["LIGHT_T4"],
            deviceMemory["DIMMER_SANH"], deviceMemory["DIMMER_HOP"]
        ];
        client.publish(LIGHT_TOPIC, JSON.stringify(lightPayload));
        console.log(`💡 [${now}] LIGHTING      | Gửi trạng thái 6 thiết bị chiếu sáng`);

        // Bơm và Quạt
        client.publish(DOMESTIC_PUMP_TOPIC, JSON.stringify([deviceMemory["PUMP_01"], deviceMemory["PUMP_02"]]));
        client.publish(FAN_TOPIC, JSON.stringify([deviceMemory["FAN_T1"], deviceMemory["FAN_T2"]]));
        console.log(`💧 [${now}] PUMP & FAN    | Gửi 2 Bơm sinh hoạt & 2 Quạt thông gió\n`);

    }, 5000);
});

// ==========================================
// BẮT LỆNH ĐIỀU KHIỂN & TRẢ VỀ PHẢN HỒI CHÍNH XÁC
// ==========================================
client.on('message', (topic, message) => {
    try {
        const commandArray = JSON.parse(message.toString());
        const command = commandArray[0];
        const code = command.code;

        console.log(`\n⚡ [BẮT ĐƯỢC LỆNH] Từ topic: ${topic}`);
        console.log(`📥 Lệnh yêu cầu cho [${code}]:`, command);

        if (deviceMemory[code]) {
            const responseTopic = TOPIC_MAP[topic];

            // TẠO SỐ NGẪU NHIÊN TỪ 0 ĐẾN 1 ĐỂ QUYẾT ĐỊNH KỊCH BẢN
            const randomChance = Math.random();

            if (randomChance < 0.10) {
                // ====================================================
                // KỊCH BẢN 1 (70%): THÀNH CÔNG (Phản hồi nhanh + Khớp)
                // ====================================================
                console.log(`✅ [KỊCH BẢN 1] Thực thi thành công. Cập nhật phần cứng...`);
                deviceMemory[code] = { ...deviceMemory[code], ...command }; // Ghi đè bộ nhớ

                if (responseTopic) {
                    setTimeout(() => {
                        client.publish(responseTopic, JSON.stringify([deviceMemory[code]]));
                        console.log(`   📤 Phản hồi trạng thái MỚI: ${responseTopic}\n`);
                    }, 300); // Phản hồi siêu tốc sau 0.3 giây
                }

            } else if (randomChance < 0.85) {
                // ====================================================
                // KỊCH BẢN 2 (15%): LỖI CƠ HỌC (Phản hồi nhanh + Không khớp)
                // ====================================================
                console.log(`❌ [KỊCH BẢN 2] Lỗi kẹt cơ học! Thiết bị từ chối đổi trạng thái.`);
                // KHÔNG CẬP NHẬT BỘ NHỚ -> Dữ liệu trả về sẽ bị sai lệch so với lệnh

                if (responseTopic) {
                    setTimeout(() => {
                        client.publish(responseTopic, JSON.stringify([deviceMemory[code]]));
                        console.log(`   📤 Phản hồi trạng thái CŨ: ${responseTopic}\n`);
                    }, 300);
                }

            } else {
                // ====================================================
                // KỊCH BẢN 3 (15%): MẤT KẾT NỐI (Timeout - Im lặng)
                // ====================================================
                console.log(`⚠️ [KỊCH BẢN 3] Đứt mạng hiện trường! Thiết bị im lặng hoàn toàn.\n`);
                // KHÔNG LÀM GÌ CẢ. Để Backend tự chờ và báo Timeout.
            }

        } else {
            console.log(`⚠️ Không tìm thấy thiết bị [${code}].\n`);
        }
    } catch (err) {
        console.error("❌ Lỗi parse lệnh MQTT:", err.message);
    }
});

client.on('error', (err) => {
    console.error('❌ Lỗi kết nối MQTT:', err);
});