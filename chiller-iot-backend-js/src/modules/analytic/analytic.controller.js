import { queryApi } from '../../config/influx.js';

export const AnalyticController = {
    getDeviceHistory: async (req, res) => {
        try {
            const { deviceCode, measurement, range } = req.query;

            const fluxQuery = `
                from(bucket: "${process.env.INFLUX_BUCKET}")
                |> range(start: -${range || '24h'}, stop: now())
                |> filter(fn: (r) => r["_measurement"] == "${measurement}")
                |> filter(fn: (r) => r["code"] == "${deviceCode}")
                |> aggregateWindow(every: 5m, fn: last, createEmpty: true)
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            `;

            const results = [];
            queryApi.queryRows(fluxQuery, {
                next(row, tableMeta) {
                    const o = tableMeta.toObject(row);
                    // o sẽ có dạng: { _time: ..., power: 1, temperature: 12.5 }
                    results.push(o);
                },
                error(err) {
                    console.error("❌ Influx Query Error:", err);
                    res.status(500).json({ error: err.message });
                },
                complete() {
                    // Nếu không có dữ liệu, InfluxDB có thể trả về mảng rỗng []
                    res.json(results);
                }
            });
        } catch (error) {
            console.error("❌ Server Error:", error);
            res.status(500).json({ error: error.message });
        }
    }
};