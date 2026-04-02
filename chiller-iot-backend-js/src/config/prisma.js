import { PrismaClient } from '@prisma/client';

// Khởi tạo Prisma Client
const prisma = new PrismaClient({
    // Log các câu lệnh query ra console để bạn dễ dàng debug khi làm đồ án
    log: ['query', 'info', 'warn', 'error'],
});

export default prisma;