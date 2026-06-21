# Sử dụng Node.js bản nhẹ
FROM node:22-alpine

# Cài openssl vì Prisma cần cái này để chạy trên Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package.json và cài đặt thư viện
COPY package*.json ./
RUN npm install

# Copy thư mục Prisma và tạo schema
COPY prisma ./prisma/
RUN npx prisma generate

# Copy toàn bộ code còn lại
COPY . .

EXPOSE 3000

# Khởi chạy: Tự động push Database (tạo bảng) rồi mới chạy server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/server.js"]