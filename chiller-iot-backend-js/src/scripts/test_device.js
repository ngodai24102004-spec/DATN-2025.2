import mqtt from 'mqtt';

// Kết nối tới Broker công cộng
const client = mqtt.connect('mqtt://broker.emqx.io:1883');

const CHILLER_TOPIC = 'yoo/yootek/cooling/chiller/chillers/get/response';
const PIPE_TOPIC = 'yoo/yootek/cooling/chiller/pipes/get/response';
const VALVE_TOPIC = 'yoo/yootek/cooling/chiller/valves/get/response';
const COLDPUMP_TOPIC = 'yoo/yootek/cooling/chiller/coldPump/get/response';
const COOLINGPUMP_TOPIC = 'yoo/yootek/cooling/chiller/coolingPump/get/response';
const COOLINGTOWER_TOPIC = 'yoo/yootek/cooling/chiller/coolingTower/get/response';


client.on('connect', () => {
    console.log('🚀 Simulator đã chạy! Đang gửi dữ liệu giả lập cho các thiết bị');

    setInterval(() => {
        const now = new Date().toLocaleTimeString();

        // 1. GIẢ LẬP DỮ LIỆU CHILLER-001
        const chillerData = [
            {
                "code": "chiller-001",
                "power": Math.random() > 0.3 ? 1 : 0, // 70% cơ hội là đang chạy
                "auto-mode": 1,
                "fault": 0
            }
        ];
        client.publish(CHILLER_TOPIC, JSON.stringify(chillerData));
        console.log(`📡 [${now}] -> Topic: Chiller | Status: ${chillerData[0].power ? 'ON' : 'OFF'}`);


        // 2. GIẢ LẬP DỮ LIỆU PIPE-001 (Cảm biến đường ống)
        // Tạo các giá trị ngẫu nhiên quanh ngưỡng thực tế
        const pipeData = [
            {
                "code": "PIPE-001",
                "flow_status": 1,
                "temperature": (12.5 + (Math.random() * 2 - 1)).toFixed(2), // 11.5 - 13.5 độ C
                "flow_rate": (23.4 + (Math.random() * 4 - 2)).toFixed(2),   // 21.4 - 25.4 m3/h
                "pressure": (1.6 + (Math.random() * 0.4 - 0.2)).toFixed(2)  // 1.4 - 1.8 bar
            }
        ];
        client.publish(PIPE_TOPIC, JSON.stringify(pipeData));
        console.log(`📡 [${now}] -> Topic: Pipe    | Temp: ${pipeData[0].temperature}°C | Press: ${pipeData[0].pressure} bar`);

        //3. GIẢ LẬP DỮ LIỆU VALVE-001 (Van điều khiển)
        const valveData = [
            {
                "code": "VALVE-001",
                "state": Math.random() > 0.5 ? 1 : 0 // Giả lập đóng/mở ngẫu nhiên
            }
        ];
        client.publish(VALVE_TOPIC, JSON.stringify(valveData));
        console.log(`📡 [${now}] -> Topic: Valve   | State: ${valveData[0].state === 1 ? 'OPEN' : 'CLOSE'}`);

        // 4. GIẢ LẬP DỮ LIỆU COLDPUMP-001 (Bơm nước lạnh)
        const isPumpRunning = Math.random() > 0.2 ? 1 : 0; // 80% là đang chạy
        const coldPumpData = [
            {
                "code": "COLDPUMP-001",
                "power": isPumpRunning,
                "auto-mode": 1,
                "fault": 0,
                // Nếu bơm chạy thì random tốc độ từ 35 - 50 Hz, nếu tắt thì speed = 0
                "speed": isPumpRunning ? (35 + Math.random() * 15).toFixed(1) : 0
            }
        ];
        client.publish(COLDPUMP_TOPIC, JSON.stringify(coldPumpData));
        console.log(`📡[${now}] -> Topic: ColdPump | Power: ${coldPumpData[0].power} | Speed: ${coldPumpData[0].speed} Hz`);

        // 5. GIẢ LẬP DỮ LIỆU COOLINGPUMP-001 (Bơm giải nhiệt)
        const isCoolingPumpRunning = Math.random() > 0.2 ? 1 : 0;
        const coolingPumpData = [
            {
                "code": "COOLINGPUMP-001",
                "power": isCoolingPumpRunning,
                "auto-mode": 1,
                "fault": 0,
                // Tốc độ bơm giải nhiệt thường dao động từ 40 - 50 Hz
                "speed": isCoolingPumpRunning ? (40 + Math.random() * 10).toFixed(1) : 0
            }
        ];
        client.publish(COOLINGPUMP_TOPIC, JSON.stringify(coolingPumpData));
        console.log(`📡 [${now}] -> Topic: CoolingPump | Power: ${coolingPumpData[0].power} | Speed: ${coolingPumpData[0].speed} Hz`);

        // 6. GIẢ LẬP DỮ LIỆU COOLINGTOWER-001 (Tháp giải nhiệt)
        const towerData = [
            {
                "code": "COOLINGTOWER-001",
                "power": Math.random() > 0.2 ? 1 : 0, // 80% là tháp đang bật quạt
                "auto-mode": 1,
                "fault": 0
            }
        ];
        client.publish(COOLINGTOWER_TOPIC, JSON.stringify(towerData));
        console.log(`📡 [${now}] -> Topic: Tower       | Power: ${towerData[0].power}`);

        console.log('--------------------------------------------------');
    }, 5000); // Gửi mỗi 5 giây
});

client.on('error', (err) => {
    console.error('❌ Lỗi kết nối MQTT:', err);
});