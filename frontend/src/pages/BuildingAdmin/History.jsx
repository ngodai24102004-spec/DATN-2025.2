import React, { useState, useEffect } from 'react';
import { getDevicesApi, getDeviceHistoryApi } from '../../services/device.service';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { Search, AreaChart, Clock, Activity, Thermometer, Gauge, Droplets, Zap } from 'lucide-react';

const CustomXAxisTick = ({ x, y, payload }) => {
    if (!payload.value) return null;

    // Tách chuỗi bằng dấu xuống dòng đã tạo ở trên
    const [time, date] = payload.value.split('\n');

    return (
        <g transform={`translate(${x},${y})`}>
            {/* Dòng 1: Giờ Phút */}
            <text x={0} y={10} dy={5} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight="bold">
                {time}
            </text>
            {/* Dòng 2: Ngày Tháng Năm */}
            <text x={0} y={25} dy={5} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                {date}
            </text>
        </g>
    );
};

export default function HistoryPage() {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [range, setRange] = useState('24h');

    const measurementMap = {
        'CHILLER': 'chiller_status',
        'PIPE': 'pipe_telemetry',
        'VALVE': 'valve_data',
        'COLDPUMP': 'coldpump_data',
        'COOLINGPUMP': 'coolingpump_data',
        'COOLINGTOWER': 'coolingtower_data'
    };

    // Bản đồ Icon và Tên hiển thị cho từng Field
    const fieldConfig = {
        temperature: { name: "Nhiệt độ", unit: "°C", icon: Thermometer, color: "#f97316" },
        pressure: { name: "Áp suất", unit: "bar", icon: Gauge, color: "#3b82f6" },
        flow_rate: { name: "Lưu lượng", unit: "m³/h", icon: Droplets, color: "#06b6d4" },
        speed: { name: "Tốc độ chạy", unit: "Hz", icon: Zap, color: "#8b5cf6" },
        power: { name: "Trạng thái Nguồn", unit: "", icon: Activity, color: "#10b981" },
        'auto-mode': { name: "Chế độ Auto", unit: "", icon: Activity, color: "#3b82f6" },
        fault: { name: "Cảnh báo Lỗi", unit: "", icon: Activity, color: "#ef4444" },
        state: { name: "Trạng thái Van", unit: "", icon: Activity, color: "#10b981" }
    };

    useEffect(() => {
        getDevicesApi().then(data => {
            setDevices(data);
            if (data.length > 0) setSelectedDevice(data[0]);
        });
    }, []);

    const fetchHistory = async () => {
        if (!selectedDevice) return;
        setLoading(true);
        try {
            const data = await getDeviceHistoryApi({
                deviceCode: selectedDevice.code,
                measurement: measurementMap[selectedDevice.type],
                range: range
            });

            if (!data || data.length === 0) {
                setHistoryData([]);
                return;
            }

            // SỬA ĐOẠN NÀY: Ép tất cả các mốc đều có Ngày và Giờ
            const formattedData = data.map(item => {
                const d = new Date(item._time);
                const datePart = d.toLocaleDateString('vi-VN'); // Ví dụ: 27/04/2026
                const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                return {
                    ...item,
                    // Luôn luôn kết hợp Giờ và Ngày, ngăn cách bởi dấu xuống dòng \n
                    displayTime: `${timePart}\n${datePart}`
                };
            });

            setHistoryData(formattedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách các field thực tế có trong dữ liệu trả về
    const getFieldsToDraw = () => {
        if (historyData.length === 0) return [];
        const keys = Object.keys(historyData[0]);
        return keys.filter(key =>
            !['_time', '_start', '_stop', '_measurement', 'code', 'building_code', 'displayTime', 'result', 'table'].includes(key)
        );
    };

    return (
        <div className="space-y-6 bg-slate-50 min-h-screen p-1">
            {/* Header Lọc */}
            <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl shadow-slate-200">
                        <AreaChart size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Trung tâm phân tích dữ liệu</h1>
                        <p className="text-xs text-slate-400 font-bold">Lịch sử vận hành thời gian thực từ InfluxDB</p>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <select
                        className="flex-1 md:w-48 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-600 text-sm outline-none focus:border-blue-500 transition-all"
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                    >
                        <option value="1h">1 Giờ qua</option>
                        <option value="6h">6 Giờ qua</option>
                        <option value="24h">24 Giờ qua</option>
                        <option value="7d">7 Ngày qua</option>
                    </select>
                    <button onClick={fetchHistory} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-black text-xs tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
                        <Search size={16} /> TRUY XUẤT
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Cột trái: Chọn thiết bị */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest ml-2">Danh sách thiết bị</h3>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {devices.map(d => (
                            <button
                                key={d.id}
                                onClick={() => setSelectedDevice(d)}
                                className={`w-full text-left p-4 rounded-2xl transition-all border-2 ${selectedDevice?.code === d.code
                                    ? 'bg-blue-50 border-blue-600'
                                    : 'bg-white border-slate-50 hover:border-blue-100'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${selectedDevice?.code === d.code ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>{d.type}</span>
                                    <span className="text-[10px] font-mono text-slate-400">ID: {d.id}</span>
                                </div>
                                <p className={`text-sm font-bold ${selectedDevice?.code === d.code ? 'text-blue-700' : 'text-slate-700'}`}>{d.code}</p>
                                <p className="text-[10px] text-slate-400 truncate font-medium">{d.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cột phải: Danh sách biểu đồ */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center text-slate-400 font-bold animate-pulse border border-slate-100 shadow-sm">
                            <Clock className="w-12 h-12 mb-4 animate-spin text-blue-500" />
                            ĐANG TRUY VẤN CƠ SỞ DỮ LIỆU...
                        </div>
                    ) : historyData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                            {getFieldsToDraw().map((field) => {
                                const config = fieldConfig[field] || { name: field, unit: "", icon: Activity, color: "#334155" };
                                const isStatus = ['power', 'fault', 'auto_mode', 'auto-mode', 'state', 'flow_status'].includes(field);

                                return (
                                    <div key={field} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                        {/* Chart Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-slate-50" style={{ color: config.color }}>
                                                    <config.icon size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">{config.name}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold">Biểu đồ biến thiên {config.unit && `(${config.unit})`}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-mono font-black text-slate-300">TAG: {selectedDevice?.code}</span>
                                            </div>
                                        </div>

                                        {/* Chart Body */}
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={historyData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                                    <XAxis
                                                        dataKey="displayTime"
                                                        height={60}
                                                        tick={<CustomXAxisTick />} // Sử dụng component vẽ 2 dòng đã hướng dẫn ở bước trước
                                                        axisLine={{ stroke: '#e2e8f0' }}
                                                        tickLine={false}
                                                        // interval="preserveStartEnd" giúp dàn đều các mốc thời gian ra 2 đầu đồ thị
                                                        interval="preserveStartEnd"
                                                        // minTickGap={30} đảm bảo các chữ không dính vào nhau
                                                        minTickGap={30}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                                        domain={isStatus ? [0, 1] : ['auto', 'auto']}
                                                        ticks={isStatus ? [0, 1] : undefined}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                                        itemStyle={{ fontWeight: 'bold' }}
                                                    />
                                                    <Line
                                                        type={isStatus ? "stepAfter" : "monotone"}
                                                        dataKey={field}
                                                        connectNulls={false}
                                                        name={config.name}
                                                        stroke={config.color}
                                                        strokeWidth={3}
                                                        dot={false}
                                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                                        animationDuration={1500}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center text-slate-300 border border-slate-100 shadow-sm">
                            <Activity size={100} className="opacity-10 mb-6" />
                            <p className="font-black uppercase tracking-[0.2em] text-xs">Vui lòng chọn thiết bị và nhấn truy xuất</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}