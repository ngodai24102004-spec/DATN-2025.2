import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);

mqttClient.on('connect', () => {
    console.log('✅ Đã kết nối tới MQTT Broker');
});

export default mqttClient;