import React, { useState, useEffect, useContext } from 'react';
import { getDevicesApi, controlDeviceApi } from '../../services/device.service';
import { Sliders, Power, Settings2, Activity, AlertTriangle, Send } from 'lucide-react';
import { NotificationContext } from '../../context/NotificationContext';
import toast from 'react-hot-toast';

export default function ControlPanel() {
    const { socket } = useContext(NotificationContext);

    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

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

    // HÀM GỬI LỆNH
    const handleSendCommand = (device, commandConfig) => {
        // Kiểm tra xem máy có đang lỗi không
        const hasFault = device.latest_state?.fault === 1;

        // Dùng toast.custom để vẽ giao diện Popup
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-in fade-in zoom-in' : 'animate-out fade-out zoom-out'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col border border-slate-100 overflow-hidden duration-200`}>

                {/* Header của Popup thay đổi màu theo trạng thái lỗi */}
                <div className={`p-6 flex items-start gap-4 ${hasFault ? 'bg-red-50/50' : ''}`}>
                    <div className={`p-3 rounded-2xl shadow-inner mt-1 ${hasFault ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {hasFault ? <AlertTriangle size={24} /> : <Send size={24} />}
                    </div>
                    <div className="flex-1">
                        <h3 className={`font-black text-lg uppercase tracking-tight ${hasFault ? 'text-red-700' : 'text-slate-800'}`}>
                            {hasFault ? 'CẢNH BÁO NGUY HIỂM' : 'Xác nhận gửi lệnh'}
                        </h3>
                        <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                            {hasFault ? (
                                <>Thiết bị <span className="font-bold text-red-600">{device.code}</span> đang báo <b className="text-red-600">SỰ CỐ</b>. Việc cố tình gửi lệnh có thể gây hỏng hóc thiết bị vật lý.<br /><br />Bạn vẫn muốn tiếp tục?</>
                            ) : (
                                <>Xác nhận truyền lệnh điều khiển MQTT xuống thiết bị <span className="font-bold text-blue-600">{device.code}</span>?</>
                            )}
                        </p>
                    </div>
                </div>

                {/* Khu vực nút bấm */}
                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-5 py-2.5 text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id); // Đóng popup
                            setProcessingId(device.id); // Đổi nút thành "ĐANG GỬI LỆNH..."
                            try {
                                await controlDeviceApi({
                                    deviceId: device.id,
                                    code: device.code,
                                    type: device.type,
                                    command: commandConfig
                                });
                                toast.success(`Đã gửi lệnh xuống ${device.code}!`);
                            } catch (error) {
                                toast.error(error.message || "Gửi lệnh thất bại");
                            } finally {
                                setProcessingId(null);
                            }
                        }}
                        // Màu nút đổi thành Đỏ nếu có lỗi, Xanh nếu bình thường
                        className={`px-5 py-2.5 text-white rounded-xl text-xs font-black shadow-lg transition-all uppercase tracking-wider ${hasFault ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                            }`}
                    >
                        {hasFault ? 'VẪN THỰC THI' : 'THỰC THI'}
                    </button>
                </div>
            </div>
        ), { duration: Infinity }); // Giữ popup trên màn hình cho đến khi user chọn
    };

    // ==========================================
    // COMPONENT THẺ ĐIỀU KHIỂN
    // ==========================================
    const ControlCard = ({ device }) => {
        const state = device.latest_state || {};

        const originalPower = device.type === 'VALVE' ? state.state === 1 : state.power === 1;
        const originalAuto = (state['auto-mode'] === 1) || (state.auto_mode === 1);
        const originalSpeed = state.speed || 0;

        // KIỂM TRA LỖI
        const hasFault = state.fault === 1;

        const [power, setPower] = useState(originalPower);
        const [autoMode, setAutoMode] = useState(originalAuto);
        const [speed, setSpeed] = useState(originalSpeed);

        useEffect(() => {
            setPower(originalPower);
            setAutoMode(originalAuto);
            setSpeed(originalSpeed);
        }, [originalPower, originalAuto, originalSpeed]);

        const isPump = device.type.includes('PUMP');
        const isChiller = device.type === 'CHILLER';
        const isValve = device.type === 'VALVE';

        // GIAO DIỆN LỖI ĐỘNG
        const cardBorder = hasFault ? 'border-red-400 bg-red-50/30 shadow-red-100' : 'border-slate-200 bg-white hover:shadow-md';
        const dotColor = hasFault ? 'bg-red-500' : originalPower ? 'bg-emerald-500' : 'bg-slate-300';
        const pingColor = hasFault ? 'bg-red-400' : originalPower ? 'bg-emerald-400' : 'bg-slate-400';

        return (
            <div className={`p-6 rounded-3xl border shadow-sm transition-all relative overflow-hidden ${cardBorder}`}>

                {/* THANH CẢNH BÁO LỖI NẰM NGANG TRÊN CÙNG */}
                {hasFault && (
                    <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-1 flex justify-center items-center gap-2 animate-pulse">
                        <AlertTriangle size={12} /> ĐANG BÁO SỰ CỐ
                    </div>
                )}

                <div className={`flex justify-between items-center border-b pb-4 mb-4 ${hasFault ? 'mt-4 border-red-200' : 'border-slate-100'}`}>
                    <div>
                        <h3 className={`font-black text-lg ${hasFault ? 'text-red-700' : 'text-slate-800'}`}>{device.code}</h3>
                        <p className={`text-[10px] uppercase font-bold tracking-widest ${hasFault ? 'text-red-400' : 'text-slate-400'}`}>{device.type}</p>
                    </div>
                    {/* Chấm trạng thái */}
                    <span className="flex h-3 w-3 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor}`}></span>
                    </span>
                </div>

                <div className="space-y-6">
                    {/* CÔNG TẮC NGUỒN */}
                    <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold flex items-center gap-2 ${hasFault ? 'text-red-700' : 'text-slate-700'}`}>
                            <Power size={16} className={power ? (hasFault ? 'text-red-500' : 'text-emerald-500') : 'text-slate-400'} />
                            {isValve ? 'Trạng thái Van' : 'Nguồn cấp (Power)'}
                        </span>
                        <button
                            onClick={() => setPower(!power)}
                            className={`w-14 h-7 rounded-full relative transition-colors duration-300 shadow-inner ${power ? (hasFault ? 'bg-red-500' : 'bg-emerald-500') : 'bg-slate-300'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${power ? 'translate-x-8' : 'translate-x-1'}`}></div>
                        </button>
                    </div>

                    {/* CÔNG TẮC AUTO/MANUAL */}
                    {isChiller && (
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold flex items-center gap-2 ${hasFault ? 'text-red-700' : 'text-slate-700'}`}>
                                <Settings2 size={16} className={autoMode ? 'text-blue-500' : 'text-slate-400'} />
                                Chế độ (Auto/Man)
                            </span>
                            <button
                                onClick={() => setAutoMode(!autoMode)}
                                className={`w-14 h-7 rounded-full relative transition-colors duration-300 shadow-inner ${autoMode ? 'bg-blue-500' : 'bg-slate-500'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${autoMode ? 'translate-x-8' : 'translate-x-1'}`}></div>
                            </button>
                        </div>
                    )}

                    {/* THANH TRƯỢT TỐC ĐỘ */}
                    {isPump && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className={`text-sm font-bold flex items-center gap-2 ${hasFault ? 'text-red-700' : 'text-slate-700'}`}>
                                    <Activity size={16} className={hasFault ? 'text-red-500' : 'text-orange-500'} /> Tần số (Speed)
                                </span>
                                <span className={`font-mono font-bold px-2 py-1 rounded ${hasFault ? 'text-red-600 bg-red-100' : 'text-orange-600 bg-orange-50'}`}>{speed} Hz</span>
                            </div>
                            <input
                                type="range" min="0" max="60" step="0.1"
                                value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${hasFault ? 'bg-red-200 accent-red-600' : 'bg-slate-200 accent-orange-500'}`}
                            />
                        </div>
                    )}
                </div>

                <button
                    onClick={() => handleSendCommand(device, { power, autoMode, speed, state: power })}
                    disabled={processingId === device.id}
                    className={`w-full mt-6 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg text-xs tracking-widest uppercase disabled:opacity-50 ${hasFault ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-slate-900 hover:bg-blue-600 shadow-slate-200'
                        }`}
                >
                    {processingId === device.id ? 'ĐANG GỬI LỆNH...' : 'THỰC THI LỆNH'}
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><Sliders size={24} /></div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Bảng Điều Khiển Hệ Thống</h1>
                    <p className="text-xs text-slate-500 font-bold">Gửi lệnh điều khiển trực tiếp tới PLC/EBO qua giao thức MQTT</p>
                </div>
            </div>

            {loading ? (
                <p className="text-center font-bold text-slate-400 animate-pulse mt-20">ĐANG TẢI BẢNG ĐIỀU KHIỂN...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {devices.map(device => (
                        <ControlCard key={device.id} device={device} />
                    ))}
                </div>
            )}
        </div>
    );
}