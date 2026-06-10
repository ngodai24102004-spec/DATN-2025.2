Giám sát và điều khiển thiết bị cho tòa nhà thông minh 
Để chạy được dự án sau khi git clone, bạn (hoặc người khác) cần thực hiện đúng "Quy trình 5 bước" dưới đây:
Bước 1: Clone dự án và Cài đặt thư viện
Mở Terminal và di chuyển vào từng thư mục để cài đặt.
Tải code về:
code
Bash
git clone https://github.com/ngodai24102004-spec/DATN-2025.2.git
cd DATN-2025.2
Cài đặt Backend:
code
Bash
cd chiller-iot-backend-js
npm install
Cài đặt Frontend:
code
Bash
cd ../frontend
npm install
Bước 2: Thiết lập file môi trường (.env) - QUAN TRỌNG NHẤT
Vì file này không có trên Git, bạn phải tự tạo tay.
Tại thư mục chiller-iot-backend-js, tạo file .env và dán cấu hình:
code
Env
PORT=3000
DATABASE_URL="mysql://root:MẬT_KHẨU_MYSQL_CỦA_MÁY_NÀY@localhost:3306/chiller_iot"

INFLUX_URL="http://localhost:8086"
INFLUX_TOKEN="TOKEN_INFLUX_CỦA_MÁY_NÀY"
INFLUX_ORG="Yootek_DATN"
INFLUX_BUCKET="Chiller_Data"

JWT_SECRET="YooTek_DATN_Secret_Key_2024_@#!"
MQTT_BROKER_URL="mqtt://broker.emqx.io:1883"
Tại thư mục frontend, tạo file .env và dán:
code
Env
VITE_API_URL=http://localhost:3000/api
Bước 3: Khởi tạo Cơ sở dữ liệu
1. Với MySQL:
Đảm bảo máy tính đó đã cài MySQL và đã tạo database tên là chiller_iot. Sau đó chạy lệnh để Prisma tự tạo bảng:
code
Bash
cd chiller-iot-backend-js
npx prisma generate
npx prisma db push
2. Với InfluxDB:
Máy tính đó phải đang chạy influxd.exe. Bạn phải vào giao diện web localhost:8086 để tạo tài khoản, tạo Organization và Bucket đúng với tên trong file .env ở Bước 2.
Bước 4: Tạo dữ liệu mẫu (Tùy chọn)
Nếu bạn đã viết file seed.js như tôi hướng dẫn trước đó, hãy chạy nó để có ngay tài khoản Admin và Tòa nhà để đăng nhập:
code
Bash
node prisma/seed.js
Bước 5: Chạy ứng dụng
Bạn cần mở 3 cửa sổ Terminal để chạy song song:
Terminal 1 (Backend):
code
Bash
cd chiller-iot-backend-js
npm run dev
Terminal 2 (Frontend):
code
Bash
cd frontend
npm run dev
Terminal 3 (Simulator - Để có dữ liệu nhảy):
code
Bash
cd chiller-iot-backend-js
node src/scripts/test_chiller.js