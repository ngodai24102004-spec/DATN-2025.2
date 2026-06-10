import React, { useState, useEffect, useContext } from 'react';
import { getDevicesApi, getDeviceHistoryApi } from '../../services/device.service';
import { NotificationContext } from '../../context/NotificationContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { Search, AreaChart, Clock, Activity, Thermometer, Gauge, Droplets, Zap, Power, Wind, Settings, AlertTriangle, Download } from 'lucide-react';
import toast from 'react-hot-toast';


const CustomXAxisTick = ({ x, y, payload }) => {
    if (!payload.value) return null;
    const [time, date] = payload.value.split('\n');
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={10} dy={5} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight="bold">{time}</text>
            {date && <text x={0} y={25} dy={5} textAnchor="middle" fill="#475569" fontSize={9}>{date}</text>}
        </g>
    );
};

export default function HistoryPage() {
    const { socket } = useContext(NotificationContext);

    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [range, setRange] = useState('24h');
    const [searchTerm, setSearchTerm] = useState('');
    const [noData, setNoData] = useState(false);

    // --- STATE MỚI: Lưu trữ Tab (thông số) đang được chọn ---
    const [selectedField, setSelectedField] = useState(null);

    const measurementMap = {
        'CHILLER': 'chiller_status',
        'PIPE': 'pipe_telemetry',
        'VALVE': 'valve_data',
        'COLDPUMP': 'coldpump_data',
        'COOLINGPUMP': 'coolingpump_data',
        'COOLINGTOWER': 'coolingtower_data',
        'AHU': 'ahu_data',
        'LIGHT': 'lighting_data',
        'LIGHT_DIMMER': 'lighting_data',
        'DOMESTIC_PUMP': 'domestic_pump_data',
        'FAN': 'ventilation_data'
    };

    const fieldConfig = {
        temperature: { name: "Nhiệt độ nước", unit: "°C", icon: Thermometer, color: "#38bdf8" },
        pressure: { name: "Áp suất nước", unit: "bar", icon: Gauge, color: "#3b82f6" },
        flow_rate: { name: "Lưu lượng", unit: "m³/h", icon: Droplets, color: "#06b6d4" },
        speed: { name: "Tốc độ chạy", unit: "Hz", icon: Zap, color: "#8b5cf6" },
        frequency: { name: "Tần số quạt", unit: "Hz", icon: Wind, color: "#8b5cf6" },
        power: { name: "Trạng thái Nguồn", unit: "", icon: Power, color: "#10b981" },
        'auto-mode': { name: "Chế độ Auto/Man", unit: "", icon: Settings, color: "#3b82f6" },
        auto_mode: { name: "Chế độ Auto/Man", unit: "", icon: Settings, color: "#3b82f6" },
        fault: { name: "Cảnh báo Lỗi", unit: "", icon: AlertTriangle, color: "#ef4444" },
        state: { name: "Trạng thái Hoạt động", unit: "", icon: Activity, color: "#10b981" },
        flow_status: { name: "Trạng thái Dòng chảy", unit: "", icon: Activity, color: "#10b981" },
        brightness: { name: "Cường độ sáng", unit: "%", icon: Activity, color: "#eab308" }, // Vàng
        air_temperature: { name: "Nhiệt độ luồng gió", unit: "°C", icon: Thermometer, color: "#f97316" }, // Cam
        air_pressure: { name: "Áp suất gió", unit: "Pa", icon: Gauge, color: "#0ea5e9" }, // Xanh lơ
        fan_speed: { name: "Tốc độ Quạt gió", unit: "%", icon: Wind, color: "#8b5cf6" } // Tím
    };

    useEffect(() => {
        getDevicesApi().then(data => {
            setDevices(data);
            if (data.length > 0) setSelectedDevice(data[0]);
        });
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleDeviceUpdate = (payload) => {
            setDevices(prevDevices => prevDevices.map(device => {
                if (device.code.toLowerCase() === payload.code.toLowerCase()) {
                    return { ...device, latest_state: payload.latest_state };
                }
                return device;
            }));
        };

        socket.on("device-update", handleDeviceUpdate);
        return () => socket.off("device-update", handleDeviceUpdate);
    }, [socket]);

    const fetchHistory = async () => {
        if (!selectedDevice) return;
        setLoading(true);
        setNoData(false);
        try {
            const data = await getDeviceHistoryApi({
                deviceCode: selectedDevice.code,
                measurement: measurementMap[selectedDevice.type],
                range: range
            });

            if (!data || data.length === 0) {
                setHistoryData([]);
                setSelectedField(null);
                setNoData(true);
                toast.error("Không có dữ liệu trong khoảng thời gian này!");
                return;
            }

            const formattedData = data.map(item => {
                const d = new Date(item._time);
                const datePart = d.toLocaleDateString('vi-VN');
                const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                return { ...item, displayTime: `${timePart}\n${datePart}` };
            });

            setHistoryData(formattedData);

            // TỰ ĐỘNG CHỌN TAB ĐẦU TIÊN KHI CÓ DỮ LIỆU MỚI
            const keys = Object.keys(formattedData[0]).filter(key =>
                !['_time', '_start', '_stop', '_measurement', 'code', 'building_code', 'displayTime', 'result', 'table'].includes(key)
            );
            if (keys.length > 0) setSelectedField(keys[0]);

        } catch (error) {
            console.error(error);
            setNoData(true);
            toast.error("Lỗi khi truy xuất dữ liệu!");
        } finally {
            setLoading(false);
        }
    };

    // Hàm lấy danh sách các nút Tab
    const availableFields = historyData.length > 0
        ? Object.keys(historyData[0]).filter(key => !['_time', '_start', '_stop', '_measurement', 'code', 'building_code', 'displayTime', 'result', 'table'].includes(key))
        : [];

    const filteredDevices = devices.filter(d =>
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Cấu hình hiển thị cho Tab đang được chọn
    const activeConfig = selectedField ? (fieldConfig[selectedField] || { name: selectedField, unit: "", icon: Activity, color: "#3b82f6" }) : null;
    const isStatusField = selectedField ? ['power', 'fault', 'auto_mode', 'auto-mode', 'state', 'flow_status'].includes(selectedField) : false;

    // HÀM XUẤT DỮ LIỆU RA FILE CSV (ĐỌC ĐƯỢC BẰNG EXCEL)
    const handleExportCSV = () => {
        if (!historyData || historyData.length === 0) {
            toast.error("Không có dữ liệu để xuất file!");
            return;
        }

        try {
            // 1. Chọn các cột cần xuất (Loại bỏ các thông số hệ thống thừa thãi)
            const excludeKeys = ['_start', '_stop', '_measurement', 'building_code', 'result', 'table'];
            const headers = Object.keys(historyData[0]).filter(key => !excludeKeys.includes(key));

            // 2. Tạo nội dung file CSV
            const csvRows = [];

            // Ghi dòng Tiêu đề (Header)
            csvRows.push(headers.join(','));

            // Ghi từng dòng dữ liệu (Data)
            historyData.forEach(row => {
                const values = headers.map(header => {
                    let val = row[header];
                    if (val === null || val === undefined) val = '';
                    // Xử lý chuỗi có dấu phẩy hoặc xuống dòng (vd: cột displayTime)
                    else if (typeof val === 'string') {
                        val = `"${val.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
                    }
                    return val;
                });
                csvRows.push(values.join(','));
            });

            const csvString = csvRows.join('\n');

            // 3. TẠO FILE VÀ ÉP TRÌNH DUYỆT TẢI XUỐNG
            // Mẹo chuyên nghiệp: \uFEFF (Byte Order Mark) giúp MS Excel đọc tiếng Việt không bị lỗi font
            const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);

            link.setAttribute("href", url);
            // Đặt tên file thông minh theo tên thiết bị và thời gian
            link.setAttribute("download", `Lich_su_${selectedDevice?.code || 'Thiet_bi'}_${range}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Đã xuất file thành công!");
        } catch (error) {
            console.error("Lỗi xuất file:", error);
            toast.error("Có lỗi xảy ra khi xuất file.");
        }
    };

    return (
        <div className="space-y-6 bg-[#030712] min-h-screen p-6 text-slate-200 font-sans">
            {/* TOP BAR / HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 border-b border-slate-800/60">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600/10 border border-blue-500/30 p-3 rounded-xl text-blue-400 shadow-lg shadow-blue-500/5">
                        <AreaChart size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-wider text-white uppercase">Trung tâm phân tích dữ liệu</h1>
                        <p className="text-xs text-slate-400 font-medium">Lịch sử vận hành thời gian thực</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto bg-[#0d1527] p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 px-2 text-slate-400">
                        <Clock size={16} />
                        <select
                            className="bg-transparent font-medium text-slate-300 text-sm outline-none cursor-pointer pr-4"
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                        >
                            <option value="1h" className="bg-[#0d1527]">1 Giờ qua</option>
                            <option value="6h" className="bg-[#0d1527]">6 Giờ qua</option>
                            <option value="24h" className="bg-[#0d1527]">24 Giờ qua</option>
                            <option value="7d" className="bg-[#0d1527]">7 Ngày qua</option>
                        </select>
                    </div>
                    <button onClick={fetchHistory} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-xs tracking-wider hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md shadow-blue-600/20">
                        <Search size={14} /> TRUY XUẤT
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* CỘT TRÁI: DANH SÁCH THIẾT BỊ */}
                <div className="bg-[#090f1c] p-4 rounded-2xl border border-slate-800/80 shadow-xl">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest pl-1">
                        Danh sách thiết bị
                    </h3>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm mã hoặc tên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0d1527] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>

                    <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredDevices.length === 0 ? (
                            <p className="text-center text-xs text-slate-500 py-4">Không tìm thấy thiết bị</p>
                        ) : (
                            filteredDevices.map(d => {
                                const isSelected = selectedDevice?.code === d.code;
                                const state = d.latest_state || {};
                                const isFault = state.fault === 1;
                                const isOnline = d.type === 'VALVE' ? state.state === 1 : d.type === 'PIPE' ? state.flow_status === 1 : state.power === 1;

                                return (
                                    <button
                                        key={d.id}
                                        onClick={() => setSelectedDevice(d)}
                                        className={`w-full text-left p-3.5 rounded-xl transition-all border ${isSelected
                                            ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/5'
                                            : 'bg-[#0d1527]/60 border-slate-800/50 hover:bg-[#0d1527] hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                {d.type}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-500">ID: {d.id}</span>
                                        </div>
                                        <p className={`text-sm font-bold tracking-tight ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>
                                            {d.code?.toLowerCase()}
                                        </p>

                                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-800/50">
                                            <p className="text-[10px] text-slate-500 truncate max-w-[65%]">{d.name || 'Thiết bị hệ thống'}</p>
                                            <span className="flex items-center gap-1 text-[9px] font-bold">
                                                {isFault ? (
                                                    <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span><span className="text-red-500">FAULT</span></>
                                                ) : isOnline ? (
                                                    <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span className="text-emerald-500">ONLINE</span></>
                                                ) : (
                                                    <><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span><span className="text-slate-500">OFFLINE</span></>
                                                )}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* CỘT PHẢI: KHUNG VẼ BIỂU ĐỒ & TAB MENU */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="bg-[#090f1c] rounded-2xl p-24 flex flex-col items-center justify-center text-slate-500 font-bold border border-slate-800/60 animate-pulse">
                            <Clock className="w-10 h-10 mb-4 animate-spin text-blue-500" />
                            ĐANG TRUY VẤN CƠ SỞ DỮ LIỆU INFLUXDB...
                        </div>
                    ) : historyData.length > 0 && selectedField ? (
                        <div className="bg-[#090f1c] p-6 rounded-2xl border border-slate-800/80 shadow-xl">

                            {/* --- TAB MENU CHUYỂN ĐỔI THÔNG SỐ (GIỐNG ẢNH MẪU) --- */}
                            <div className="flex items-center gap-4 border-b border-slate-800 pb-4 mb-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden md:block">
                                    BIỂU ĐỒ DỮ LIỆU: <span className="text-white">{selectedDevice?.code}</span>
                                </h4>

                                {/* Danh sách các nút Tab */}
                                <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-800/80 overflow-x-auto w-full custom-scrollbar">
                                    {availableFields.map(field => {
                                        const isActive = selectedField === field;
                                        const btnConfig = fieldConfig[field] || { name: field, icon: Activity };
                                        const Icon = btnConfig.icon;

                                        return (
                                            <button
                                                key={field}
                                                onClick={() => setSelectedField(field)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${isActive
                                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-inner'
                                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
                                                    }`}
                                            >
                                                {/* Chấm tròn phát sáng cho Tab đang chọn */}
                                                {isActive ? (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
                                                ) : (
                                                    <Icon size={12} className="opacity-50" />
                                                )}
                                                {btnConfig.name}
                                            </button>

                                        );
                                    })}
                                </div>
                                {/* BÊN PHẢI: Nút Xuất File CSV */}
                                <button
                                    onClick={handleExportCSV}
                                    disabled={historyData.length === 0}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-black transition-all whitespace-nowrap shadow-lg shadow-emerald-500/10 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wide"
                                >
                                    <Download size={14} strokeWidth={2.5} />
                                    XUẤT EXCEL (CSV)
                                </button>
                            </div>

                            {/* --- KHUNG VẼ BIỂU ĐỒ DUY NHẤT --- */}
                            <div className="h-[400px] w-full pl-0 text-xs">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historyData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#1e293b" opacity={0.4} />
                                        <XAxis
                                            dataKey="displayTime"
                                            height={50}
                                            tick={<CustomXAxisTick />}
                                            axisLine={{ stroke: '#1e293b' }}
                                            tickLine={false}
                                            interval="preserveStartEnd"
                                            minTickGap={40}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                            domain={isStatusField ? [0, 1] : ['auto', 'auto']}
                                            ticks={isStatusField ? [0, 1] : undefined}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0d1527', borderRadius: '12px', border: '1px solid #1e293b', color: '#f8fafc', fontSize: '12px' }}
                                            itemStyle={{ fontWeight: 'bold', color: activeConfig.color }}
                                        />
                                        <Line
                                            type={isStatusField ? "stepAfter" : "monotone"}
                                            dataKey={selectedField}
                                            connectNulls={false}
                                            name={activeConfig.name}
                                            stroke={activeConfig.color}
                                            strokeWidth={3}
                                            dot={{ r: 3, fill: activeConfig.color, strokeWidth: 0 }}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#ffffff', stroke: activeConfig.color }}
                                            animationDuration={800}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        // ĐOẠN NÀY ĐÃ ĐƯỢC SỬA LẠI ĐỂ HIỂN THỊ ĐÚNG TÌNH TRẠNG
                        <div className="bg-[#090f1c] rounded-2xl p-28 flex flex-col items-center justify-center border border-slate-800/60 shadow-xl text-center">
                            {noData ? (
                                <>
                                    {/* Màn hình: Đã tìm nhưng không có dữ liệu */}
                                    <AlertTriangle size={60} className="mb-4 text-amber-500 opacity-80" />
                                    <p className="font-bold uppercase tracking-widest text-xs text-amber-400">
                                        Không có dữ liệu cho thiết bị này trong {
                                            range === '1h' ? '1 giờ' : range === '6h' ? '6 giờ' : range === '24h' ? '24 giờ' : '7 ngày'
                                        } qua
                                    </p>
                                </>
                            ) : (
                                <>
                                    {/* Màn hình: Lúc mới vào trang, chưa bấm gì */}
                                    <Activity size={80} className="opacity-10 mb-4 text-blue-500" />
                                    <p className="font-bold uppercase tracking-widest text-xs text-slate-500">
                                        Vui lòng chọn thiết bị ở danh sách và nhấn nút "TRUY XUẤT"
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}