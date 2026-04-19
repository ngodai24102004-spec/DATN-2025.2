import { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import { getDevicesApi, addDeviceApi } from '../../services/device.service';
import {
    Building2, Plus, Fan, Waves, Snowflake, Power, MapPin,
    X, ArrowRightLeft, AlertCircle, Activity, Thermometer, Gauge, Droplets, RefreshCw
} from 'lucide-react';

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdate, setLastUpdate] = useState(null);

    const [formData, setFormData] = useState({
        code: '', name: '', type: 'CHILLER', location: ''
    });

    // 1. GỌI API LẤY DANH SÁCH THIẾT BỊ LÚC MỚI VÀO TRANG
    const fetchDevices = async () => {
        try {
            setLoading(true);
            const data = await getDevicesApi();
            setDevices(data);
            setLastUpdate(new Date());
        } catch (err) {
            console.error("Lỗi tải thiết bị:", err);
            setError("Không thể kết nối đến máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    // 2. THIẾT LẬP KẾT NỐI WEBSOCKET ĐỂ NHẬN DỮ LIỆU REAL-TIME
    useEffect(() => {
        fetchDevices();

        const socket = io("http://localhost:3000");

        socket.on("connect", () => {
            console.log("✅ Socket connected!");
            if (user?.building?.id) {
                socket.emit("join-building", user.building.id);
            }
        });

        socket.on("device-update", (payload) => {
            // Cập nhật lại mảng thiết bị khi có tin nhắn MQTT đẩy xuống
            setDevices(prevDevices => prevDevices.map(device =>
                device.code === payload.code
                    ? { ...device, latest_state: payload.latest_state, last_updated: new Date() }
                    : device
            ));
            setLastUpdate(new Date());
        });

        return () => socket.disconnect();
    }, [user]);

    // 3. HÀM XỬ LÝ THÊM THIẾT BỊ MỚI
    const handleAddDevice = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await addDeviceApi({
                ...formData,
                buildingId: user.building?.id || 1
            });
            setIsModalOpen(false);
            setFormData({ code: '', name: '', type: 'CHILLER', location: '' });
            fetchDevices();
        } catch (err) {
            setError(err.message);
        }
    };

    // 4. PHÂN LOẠI THIẾT BỊ ĐỂ VẼ VÀO SƠ ĐỒ SCADA
    const towers = devices.filter(d => d.type === 'COOLINGTOWER');
    const coolingPumps = devices.filter(d => d.type === 'COOLINGPUMP');
    const chillers = devices.filter(d => d.type === 'CHILLER');
    const coldPumps = devices.filter(d => d.type === 'COLDPUMP');
    const pipes = devices.filter(d => d.type === 'PIPE');
    const valves = devices.filter(d => d.type === 'VALVE');

    // ==========================================
    // COMPONENT NHỎ: THẺ HIỂN THỊ 1 THIẾT BỊ
    // ==========================================
    const DeviceCard = ({ device, icon: Icon }) => {
        const state = device.latest_state || {};

        // Logic xác định trạng thái: Lỗi, Đang chạy, Chế độ
        const hasFault = state.fault === 1;
        const isRunning =
            device.type === 'VALVE' ? state.state === 1 :
                device.type === 'PIPE' ? state.flow_status === 1 :
                    state.power === 1;

        // Phím auto-mode có dấu gạch ngang nên phải dùng ngoặc vuông
        const isAuto = (state['auto-mode'] === 1) || (state.auto_mode === 1);

        // Logic màu sắc
        let cardStyle = "border-slate-200 bg-white"; // Mặc định (Tắt/Xám)
        let iconBg = "bg-slate-100 text-slate-500";
        let statusDot = "bg-slate-300";

        if (hasFault) {
            cardStyle = "border-red-500 bg-red-50 shadow-red-100"; // Lỗi (Đỏ)
            iconBg = "bg-red-500 text-white";
            statusDot = "bg-red-600";
        } else if (isRunning) {
            cardStyle = "border-emerald-500 bg-emerald-50 shadow-emerald-100"; // Chạy (Xanh)
            iconBg = "bg-emerald-500 text-white";
            statusDot = "bg-emerald-500";
        }

        return (
            <div className={`p-4 rounded-xl border-2 transition-colors duration-300 shadow-sm ${cardStyle}`}>

                {/* Phần Header Card: Icon, Chấm trạng thái và Badge Auto/Manual */}
                <div className="flex justify-between items-start mb-2">
                    <div className={`p-2 rounded-lg ${iconBg} transition-colors duration-300`}>
                        <Icon className={`w-5 h-5 ${isRunning && !hasFault && device.type !== 'PIPE' ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                        <div className="flex gap-2">
                            {hasFault ? (
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                                </span>
                            ) : (
                                <span className={`h-2.5 w-2.5 rounded-full ${statusDot} transition-colors duration-300`}></span>
                            )}
                        </div>

                        {device.type !== 'PIPE' && device.type !== 'VALVE' && (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm ${isAuto ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'
                                }`}>
                                {isAuto ? 'Auto' : 'Manual'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Phần Tên thiết bị */}
                <div className="flex flex-col mt-1">
                    <h4 className="font-bold text-slate-800 text-xs tracking-tight">{device.code}</h4>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{device.type}</span>
                </div>

                {/* Phần Thông số kỹ thuật (Tùy theo loại thiết bị) */}
                <div className="mt-2 space-y-1.5 border-t border-slate-200/60 pt-2.5">

                    {/* Bơm: Hiện Tốc độ (Hz) */}
                    {device.type.includes('PUMP') && (
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-medium">Tốc độ chạy:</span>
                            <span className="font-mono font-bold text-slate-700 bg-white/50 px-1 rounded">{state.speed || 0} Hz</span>
                        </div>
                    )}

                    {/* Pipe (Ống): Hiện Nhiệt độ, Áp suất, Lưu lượng */}
                    {device.type === 'PIPE' && (
                        <>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1 text-slate-500 font-medium"><Thermometer className="w-3 h-3 text-orange-500" /> Nhiệt độ:</span>
                                <span className="font-mono font-bold text-slate-900">{state.temperature || '--'}°C</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1 text-slate-500 font-medium"><Gauge className="w-3 h-3 text-blue-500" /> Áp suất:</span>
                                <span className="font-mono font-bold text-slate-900">{state.pressure || '--'} bar</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1 text-slate-500 font-medium"><Droplets className="w-3 h-3 text-cyan-500" /> Lưu lượng:</span>
                                <span className="font-mono font-bold text-slate-900">{state.flow_rate || '--'} m³</span>
                            </div>
                        </>
                    )}

                    {/* Valve (Van): Hiện Trạng thái Đóng/Mở */}
                    {device.type === 'VALVE' && (
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-medium">Trạng thái:</span>
                            <span className={`font-bold ${state.state === 1 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {state.state === 1 ? 'MỞ HOÀN TOÀN' : 'ĐANG ĐÓNG'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Vị trí lắp đặt */}
                <p className="text-[9px] text-slate-400 truncate mt-2 italic border-t border-slate-200/60 pt-1.5 flex items-center">
                    <MapPin className="w-2.5 h-2.5 inline mr-1" /> {device.location || 'N/A'}
                </p>
            </div>
        );
    };

    // Mũi tên luân chuyển nước
    const FlowArrow = () => (
        <div className="flex flex-col items-center justify-center px-1 text-blue-200">
            <ArrowRightLeft className="w-5 h-5 animate-pulse" />
        </div>
    );

    // ==========================================
    // RENDER GIAO DIỆN CHÍNH
    // ==========================================
    return (
        <div className="min-h-screen bg-slate-100 font-sans p-6">

            {/* --- THANH ĐIỀU HƯỚNG TRÊN CÙNG (HEADER) --- */}
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm mb-6 border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hệ Thống Chiller Trung Tâm</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {user?.building?.name || 'Local Station'}
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> LIVE
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right mr-2 hidden md:block">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Cập nhật cuối</p>
                        <p className="text-xs font-mono font-bold text-slate-600">{lastUpdate?.toLocaleTimeString()}</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all text-xs tracking-widest shadow-xl"
                    >
                        <Plus className="w-4 h-4" /> THÊM THIẾT BỊ
                    </button>
                </div>
            </div>

            {/* --- BẢN ĐỒ SCADA (SƠ ĐỒ ĐƯỜNG NƯỚC) --- */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 overflow-x-auto relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-50 -translate-y-1/2 z-0"></div>

                {loading ? (
                    <div className="text-center py-20 text-slate-400 font-bold tracking-widest animate-pulse flex flex-col items-center gap-4">
                        <RefreshCw className="w-10 h-10 animate-spin text-blue-500" />
                        ĐANG ĐỒNG BỘ DỮ LIỆU...
                    </div>
                ) : (
                    <div className="flex items-start justify-between min-w-[1300px] gap-2 relative z-10">

                        {/* Cột 1: THÁP GIẢI NHIỆT */}
                        <div className="flex-1">
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 border-dashed min-h-[300px]">
                                <h3 className="text-[9px] font-black text-center text-slate-400 uppercase mb-4 tracking-tighter">Heat Rejection / Tower</h3>
                                <div className="space-y-3">
                                    {towers.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : towers.map(d => <DeviceCard key={d.id} device={d} icon={Fan} />)}
                                </div>
                            </div>
                        </div>

                        <FlowArrow />

                        {/* Cột 2: BƠM GIẢI NHIỆT */}
                        <div className="flex-1">
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 border-dashed min-h-[300px]">
                                <h3 className="text-[9px] font-black text-center text-slate-400 uppercase mb-4 tracking-tighter">Condenser Pumps</h3>
                                <div className="space-y-3">
                                    {coolingPumps.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : coolingPumps.map(d => <DeviceCard key={d.id} device={d} icon={Power} />)}
                                </div>
                            </div>
                        </div>

                        <FlowArrow />

                        {/* Cột 3: CỤM CHILLER */}
                        <div className="flex-1">
                            <div className="bg-blue-50/50 p-3 rounded-2xl border-2 border-blue-100 min-h-[300px] shadow-inner">
                                <h3 className="text-[9px] font-black text-center text-blue-400 uppercase mb-4 tracking-tighter">Chiller Plant</h3>
                                <div className="space-y-3">
                                    {chillers.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : chillers.map(d => <DeviceCard key={d.id} device={d} icon={Snowflake} />)}
                                </div>
                            </div>
                        </div>

                        <FlowArrow />

                        {/* Cột 4: BƠM NƯỚC LẠNH */}
                        <div className="flex-1">
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 border-dashed min-h-[300px]">
                                <h3 className="text-[9px] font-black text-center text-slate-400 uppercase mb-4 tracking-tighter">Chilled Water Pumps</h3>
                                <div className="space-y-3">
                                    {coldPumps.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : coldPumps.map(d => <DeviceCard key={d.id} device={d} icon={Power} />)}
                                </div>
                            </div>
                        </div>

                        <FlowArrow />

                        {/* Cột 5: CẢM BIẾN ỐNG NƯỚC */}
                        <div className="flex-1">
                            <div className="bg-orange-50/20 p-3 rounded-2xl border border-orange-100 border-dashed min-h-[300px]">
                                <h3 className="text-[9px] font-black text-center text-orange-400 uppercase mb-4 tracking-tighter">Telemetry / Pipes</h3>
                                <div className="space-y-3">
                                    {pipes.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : pipes.map(d => <DeviceCard key={d.id} device={d} icon={Droplets} />)}
                                </div>
                            </div>
                        </div>

                        <FlowArrow />

                        {/* Cột 6: VAN */}
                        <div className="flex-1">
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 border-dashed min-h-[300px]">
                                <h3 className="text-[9px] font-black text-center text-slate-400 uppercase mb-4 tracking-tighter">Isolation Valves</h3>
                                <div className="space-y-3">
                                    {valves.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : valves.map(d => <DeviceCard key={d.id} device={d} icon={Activity} />)}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* --- MODAL THÊM THIẾT BỊ --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-50 bg-slate-50/50">
                            <h2 className="text-lg font-black text-slate-800 uppercase">Khai báo thiết bị</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleAddDevice} className="p-8 space-y-5">
                            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100"><AlertCircle className="w-4 h-4" />{error}</div>}

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mã định danh (Code MQTT)</label>
                                <input type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="Ví dụ: PIPE-001" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tên thiết bị</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ví dụ: Cảm biến hồi tổng" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Phân loại hệ thống</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 appearance-none">
                                    <option value="CHILLER">Máy làm lạnh (CHILLER)</option>
                                    <option value="COOLINGTOWER">Tháp giải nhiệt (COOLINGTOWER)</option>
                                    <option value="COOLINGPUMP">Bơm giải nhiệt (COOLINGPUMP)</option>
                                    <option value="COLDPUMP">Bơm nước lạnh (COLDPUMP)</option>
                                    <option value="VALVE">Van cách ly (VALVE)</option>
                                    <option value="PIPE">Cảm biến đường ống (PIPE)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Vị trí lắp đặt vật lý</label>
                                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Ví dụ: Tầng hầm B2" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700" />
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl text-xs uppercase tracking-widest">Hủy</button>
                                <button type="submit" className="flex-2 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 text-xs uppercase tracking-widest px-8">Lưu thiết bị</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}