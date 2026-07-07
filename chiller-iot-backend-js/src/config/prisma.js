import { PrismaClient } from '@prisma/client';

// Khởi tạo Prisma Client
const prisma = new PrismaClient({
    log: ['warn', 'error'],
});

export default prisma;