import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import rootRouter from './routes/index.js';
import mqttClient from './config/mqtt.js';
import { handleMqttMessage } from './mqtt/mqtt.handler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// Sử dụng morgan ở chế độ 'dev' (in log có màu sắc dễ nhìn)
app.use(morgan('dev'));

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