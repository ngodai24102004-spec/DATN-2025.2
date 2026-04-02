import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rootRouter from './routes/index.js';
import mqttClient from './config/mqtt.js';
import { handleMqttMessage } from './mqtt/mqtt.handler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Gắn toàn bộ API vào tiền tố /api
app.use('/api', rootRouter);

// MQTT Listener
mqttClient.on('message', (topic, message) => {
    handleMqttMessage(topic, message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});