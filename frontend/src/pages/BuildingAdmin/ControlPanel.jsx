import React, { useState, useEffect, useContext } from 'react';
import { getDevicesApi, controlDeviceApi } from '../../services/device.service';
import {
    Power, Settings2, Activity, AlertTriangle, Send,
    ChevronRight, CheckCircle2, Play, SlidersHorizontal, Snowflake, Droplets, Fan
} from 'lucide-react';
import { NotificationContext } from '../../context/NotificationContext';
import toast from 'react-hot-toast';

export default function ControlPanel() {
    const { socket } = useContext(NotificationContext);

    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    // 1. LẤY DỮ LIỆU VÀ LẮNG NGHE REAL-TIME
    useEffect(() => {
        getDevicesApi().then(data => {
            const controllableDevices = data.filter(d => d.type !== 'PIPE');
            setDevices(controllableDevices);
            setLoading(false);
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

    // 2. HÀM XỬ LÝ LỆNH ĐIỀU KHIỂN (Giữ nguyên logic bảo mật)
    const handleSendCommand = (device, commandConfig) => {
        const hasFault = device.latest_state?.fault === 1;

        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-in fade-in zoom-in' : 'animate-out fade-out zoom-out'} max-w-md w-full bg-slate-900 shadow-2xl rounded-2xl pointer-events-auto flex flex-col border border-slate-700 overflow-hidden duration-200`}>
                <div className={`p-6 flex items-start gap-4 ${hasFault ? 'bg-red-950/50' : 'bg-blue-950/30'}`}>
                    <div className={`p-3 rounded-2xl shadow-inner mt-1 ${hasFault ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-400'}`}>
                        {hasFault ? <AlertTriangle size={24} /> : <Send size={24} />}
                    </div>
                    <div className="flex-1">
                        <h3 className={`font-black text-lg uppercase tracking-tight ${hasFault ? 'text-red-500' : 'text-slate-100'}`}>
                            {hasFault ? 'CẢNH BÁO NGUY HIỂM' : 'Xác nhận gửi lệnh'}
                        </h3>
                        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                            {hasFault ? (
                                <>Thiết bị <span className="font-bold text-red-400">{device.code}</span> đang báo sự cố. Việc cố tình gửi lệnh có thể gây hỏng hóc.<br /><br />Tiếp tục?</>
                            ) : (
                                <>Xác nhận truyền lệnh MQTT xuống thiết bị <span className="font-bold text-blue-400">{device.code}</span>?</>
                            )}
                        </p>
                    </div>
                </div>
                <div className="bg-slate-950 px-6 py-4 flex justify-end gap-3 border-t border-slate-800">
                    <button onClick={() => toast.dismiss(t.id)} className="px-5 py-2.5 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors uppercase tracking-wider">
                        Hủy
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            setProcessingId(device.id);
                            try {
                                await controlDeviceApi({ deviceId: device.id, code: device.code, type: device.type, command: commandConfig });
                                toast.success(`Đã gửi lệnh xuống ${device.code}!`);
                            } catch (error) { toast.error(error.message || "Gửi lệnh thất bại"); }
                            finally { setProcessingId(null); }
                        }}
                        className={`px-5 py-2.5 text-white rounded-xl text-xs font-black shadow-lg transition-all uppercase tracking-wider flex items-center gap-2 ${hasFault ? 'bg-red-600 hover:bg-red-700 shadow-red-900/50' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/50'}`}
                    >
                        <Play size={14} fill="currentColor" /> {hasFault ? 'VẪN THỰC THI' : 'THỰC THI'}
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    // ==========================================
    // 3. ROW THIẾT BỊ NẰM NGANG (Giống ảnh mẫu)
    // ==========================================
    const DeviceRow = ({ device }) => {
        const state = device.latest_state || {};

        const originalPower = device.type === 'VALVE' ? state.state === 1 : state.power === 1;
        const originalAuto = (state['auto-mode'] === 1) || (state.auto_mode === 1);
        const originalSpeed = parseFloat(state.speed) || 0;
        const hasFault = state.fault === 1;

        const [power, setPower] = useState(originalPower);
        const [autoMode, setAutoMode] = useState(originalAuto);
        const [speed, setSpeed] = useState(originalSpeed);

        useEffect(() => {
            setPower(originalPower);
            setAutoMode(originalAuto);
            setSpeed(originalSpeed);
        }, [originalPower, originalAuto, originalSpeed]);

        // Giả lập ảnh đại diện thiết bị (Nếu bạn có ảnh PNG tách nền, hãy thay link vào đây)
        const getDeviceImage = () => {
            if (device.type === 'CHILLER') return "https://vietnamcleanroom.com/vcr-media/22/11/1/chiller.jpg";
            if (device.type.includes('PUMP')) return "https://tank.vn/tank/2024/03/taoanhdep-lam-net-anh-45715.jpg.webp";
            if (device.type === 'COOLINGTOWER') return "https://tse3.mm.bing.net/th/id/OIP.qZal1kvytXbvwpMiN6t1MgHaEK?rs=1&pid=ImgDetMain&o=7&rm=3";
            return "https://www.scy-fan.net/wp-content/uploads/sites/69/2023/12/12-major-valves-for-HVAC-systems3.jpg";
        };

        return (
            <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 rounded-2xl transition-all mb-3 relative overflow-hidden group">

                {/* Viền báo lỗi */}
                {hasFault && <div className="absolute left-0 top-0 w-1 h-full bg-red-500 shadow-[0_0_15px_#ef4444]"></div>}

                {/* CỘT 1: ẢNH THIẾT BỊ */}
                <div className="w-full md:w-32 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative flex items-center justify-center">
                    <img src={getDeviceImage()} alt="device" className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:scale-110 transition-transform duration-700" />
                    {hasFault && <AlertTriangle className="absolute text-red-500 animate-pulse" size={28} />}
                </div>

                {/* CỘT 2: THÔNG TIN CƠ BẢN */}
                <div className="w-full md:w-48 shrink-0 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-1">
                        <h4 className={`font-black text-sm tracking-wide ${hasFault ? 'text-red-400' : 'text-slate-200'}`}>{device.code}</h4>
                        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                            <span className={`text-[8px] font-bold uppercase tracking-wider ${hasFault ? 'text-red-500' : originalPower ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {hasFault ? 'FAULT' : originalPower ? 'ONLINE' : 'OFFLINE'}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ${hasFault ? 'bg-red-500 animate-ping' : originalPower ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{device.name}</p>
                </div>

                {/* CỘT 3: VÙNG ĐIỀU KHIỂN (THAY ĐỔI LINH HOẠT THEO MÁY) */}
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 w-full px-4 border-x border-slate-800/50">

                    {/* Các công tắc bật tắt / Auto */}
                    <div className="flex flex-col gap-3 min-w-[180px]">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium"><Power size={12} /> {device.type === 'VALVE' ? 'Trạng thái Van' : 'Nguồn cấp (Power)'}</span>
                            {/* Nút Toggle Custom */}
                            <button onClick={() => setPower(!power)} className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${power ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform duration-300 ${power ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}></div>
                            </button>
                        </div>

                        {(device.type === 'CHILLER' || device.type.includes('PUMP')) && (
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium"><Settings2 size={12} /> Chế độ (Auto/Man)</span>
                                <button onClick={() => setAutoMode(!autoMode)} className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${autoMode ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform duration-300 ${autoMode ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}></div>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Thanh trượt tốc độ (Chỉ Bơm mới có) */}
                    {device.type.includes('PUMP') && (
                        <div className="flex-1 w-full pl-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium"><Activity size={12} className="text-orange-500" /> Tần số (Speed)</span>
                                <span className="text-xs font-black text-orange-400 font-mono">{speed.toFixed(1)} Hz</span>
                            </div>
                            <input
                                type="range" min="0" max="60" step="0.1"
                                value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>
                    )}
                </div>

                {/* CỘT 4: NÚT THỰC THI */}
                <div className="w-full md:w-40 shrink-0 flex justify-end">
                    <button
                        onClick={() => handleSendCommand(device, { power, autoMode, speed, state: power })}
                        disabled={processingId === device.id}
                        className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all shadow-lg ${hasFault
                            ? 'bg-red-900/50 text-red-500 border border-red-900/50 hover:bg-red-600 hover:text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/50'
                            } disabled:opacity-50`}
                    >
                        {processingId === device.id ? 'ĐANG GỬI...' : (
                            <>THỰC THI LỆNH <Play size={12} fill="currentColor" /></>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    // ==========================================
    // 4. GROUP THIẾT BỊ (Hệ thống)
    // ==========================================
    const systemGroups = [
        { type: 'CHILLER', title: 'CHILLER SYSTEM', color: 'text-blue-400', icon: Snowflake },
        { type: 'COLDPUMP', title: 'COLD PUMP SYSTEM', color: 'text-sky-400', icon: Droplets },
        { type: 'COOLINGPUMP', title: 'COOLING PUMP SYSTEM', color: 'text-teal-400', icon: Droplets },
        { type: 'COOLINGTOWER', title: 'COOLING TOWER SYSTEM', color: 'text-orange-400', icon: Fan },
        { type: 'VALVE', title: 'VALVE SYSTEM', color: 'text-purple-400', icon: Settings2 }
    ];

    return (
        <div className="min-h-screen bg-[#020617] bg-scada-grid p-6 font-sans text-slate-200">
            {/* HEADER TỔNG */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-3xl shadow-2xl mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600/20 border border-blue-500/30 p-3 rounded-2xl shadow-lg shadow-blue-500/10">
                        <SlidersHorizontal size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white uppercase tracking-tight">Bảng Điều Khiển Hệ Thống</h1>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5">GỬI LỆNH ĐIỀU KHIỂN</p>
                    </div>
                </div>
            </div>

            {/* DANH SÁCH THEO NHÓM */}
            {loading ? (
                <p className="text-center font-bold text-slate-500 animate-pulse mt-20">ĐANG TẢI BẢNG ĐIỀU KHIỂN...</p>
            ) : (
                <div className="space-y-6 max-w-[1400px] mx-auto">
                    {systemGroups.map(group => {
                        const groupDevices = devices.filter(d => d.type === group.type);
                        if (groupDevices.length === 0) return null;

                        return (
                            <div key={group.type} className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-[2rem] p-6 shadow-xl">
                                {/* Header Nhóm */}
                                <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${group.color}`}>
                                            <group.icon size={18} />
                                        </div>
                                        <div>
                                            <h2 className={`text-sm font-black uppercase tracking-widest ${group.color}`}>{group.title}</h2>
                                            <p className="text-[10px] text-slate-500 font-bold">{groupDevices.length} thiết bị</p>
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-all">
                                        Xem tất cả <ChevronRight size={12} />
                                    </button>
                                </div>

                                {/* Danh sách Row */}
                                <div className="space-y-1">
                                    {groupDevices.map(device => (
                                        <DeviceRow key={device.id} device={device} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}