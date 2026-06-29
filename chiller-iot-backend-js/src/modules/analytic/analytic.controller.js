import { queryApi } from '../../config/influx.js';

export const AnalyticController = {
    getDeviceHistory: async (req, res) => {
        try {
            const { deviceCode, measurement, range } = req.query;

            // ==========================================================
            // TỐI ƯU HÓA ĐỘNG KHOẢNG GOM NHÓM (EVERY) TRÁNH LAG BIỂU ĐỒ
            // ==========================================================
            let windowInterval = '15m'; // Mặc định cho 24h
            if (range === '1h') windowInterval = '1m';         // 1 giờ -> gom nhóm 1 phút (60 điểm)
            else if (range === '6h') windowInterval = '5m';    // 6 giờ -> gom nhóm 5 phút (72 điểm)
            else if (range === '24h') windowInterval = '15m';  // 24 giờ -> gom nhóm 15 phút (96 điểm)
            else if (range === '7d') windowInterval = '2h';    // 7 ngày -> gom nhóm 2 giờ (84 điểm)
            // ==========================================================

            const fluxQuery = `
                from(bucket: "${process.env.INFLUX_BUCKET}")
                |> range(start: -${range || '24h'}, stop: now())
                |> filter(fn: (r) => r["_measurement"] == "${measurement}")
                |> filter(fn: (r) => r["code"] == "${deviceCode}")
                // Truyền biến windowInterval đã tính toán vào đây
                |> aggregateWindow(every: ${windowInterval}, fn: last, createEmpty: true)
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            `;

            const results = [];
            queryApi.queryRows(fluxQuery, {
                next(row, tableMeta) {
                    const o = tableMeta.toObject(row);
                    results.push(o);
                },
                error(err) {
                    console.error("❌ Influx Query Error:", err);
                    res.status(500).json({ error: err.message });
                },
                complete() {
                    res.json(results);
                }
            });
        } catch (error) {
            console.error("❌ Server Error:", error);
            res.status(500).json({ error: error.message });
        }
    }
};