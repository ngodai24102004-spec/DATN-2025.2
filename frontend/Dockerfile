# GIAI ĐOẠN 1: Build code React
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Chạy lệnh build của Vite
RUN npm run build

# GIAI ĐOẠN 2: Dùng Nginx để chạy Web
FROM nginx:alpine
# Copy file đã build từ Giai đoạn 1 sang Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Thay thế cấu hình Nginx mặc định bằng cấu hình của ta
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]