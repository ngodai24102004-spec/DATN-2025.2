import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http'; // Thêm dòng này
import { initSocket } from './config/socket.js';
import rootRouter from './routes/index.js';
import mqttClient from './config/mqtt.js';
import { handleMqttMessage } from './mqtt/mqtt.handler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app); // Tạo HTTP Server
const io = initSocket(httpServer); // Khởi tạo Socket.io

app.use(cors({
    origin: "http://localhost:5173", // Địa chỉ cổng chính xác của Frontend (Vite)
    credentials: true // Cho phép truyền nhận cookie qua lại giữa 2 cổng
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Gắn toàn bộ API vào tiền tố /api
app.use('/api', rootRouter);

// MQTT Listener
mqttClient.on('message', (topic, message) => {
    handleMqttMessage(topic, message);
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Server & Socket đang chạy tại http://localhost:${PORT}`);
});