import { InfluxDB, Point } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

dotenv.config();

// Lấy thông số từ file .env của bạn
const url = process.env.INFLUX_URL;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;

// 1. Khởi tạo Client chính
const influxClient = new InfluxDB({ url, token });

// 2. Tạo Write API để ghi dữ liệu (Lưu ý: 'ns' là độ chính xác nano giây)
export const writeApi = influxClient.getWriteApi(org, bucket, 'ns');

// 3. Tạo Query API để đọc dữ liệu (Dùng cho việc vẽ biểu đồ sau này)
export const queryApi = influxClient.getQueryApi(org);

// 4. Hàm tiện ích (Helper) để ghi dữ liệu thiết bị dễ dàng hơn
export const InfluxService = {
    /**
     * @param {string} measurement - Tên bảng (vd: chiller_data, pipe_data)
     * @param {object} tags - Các nhãn định danh (vd: { code: 'CH-01', building_code: 'A' })
     * @param {object} fields - Các giá trị số (vd: { temp: 25.5, power: 1 })
     */
    writeTelemetry: (measurement, tags, fields) => {
        try {
            const point = new Point(measurement);

            // Thêm các Tags (Dùng để filter và phân quyền tòa nhà)
            Object.entries(tags).forEach(([key, value]) => {
                point.tag(key, value);
            });

            // Thêm các Fields (Dữ liệu thực tế)
            Object.entries(fields).forEach(([key, value]) => {
                if (typeof value === 'number') point.floatField(key, value);
                else if (typeof value === 'boolean') point.booleanField(key, value);
                else point.stringField(key, value);
            });

            // Đưa điểm dữ liệu vào hàng đợi
            writeApi.writePoint(point);

            // Bạn có thể dùng flush() nếu muốn đẩy dữ liệu đi ngay lập tức
            writeApi.flush();

            console.log(`📊 InfluxDB: Đã ghi nhận dữ liệu cho ${measurement}`);
        } catch (error) {
            console.error('❌ Lỗi khi ghi dữ liệu vào InfluxDB:', error);
        }
    }
};