// src/pages/BuildingAdmin/ControlPanel.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { getDevicesApi, controlDeviceApi } from '../../services/device.service';
import { getSubsystemsApi } from '../../services/subsystem.service';
import {
    Power, Settings2, Activity, AlertTriangle, Send,
    Play, SlidersHorizontal, Snowflake, Droplets, Fan, Lightbulb, Wind
} from 'lucide-react';
import { NotificationContext } from '../../context/NotificationContext';
import toast from 'react-hot-toast';

// ==========================================
// 1. LINH KIỆN CON: ROW THIẾT BỊ NẰM NGANG ĐA NĂNG
// ==========================================
const DeviceRow = ({ device, onSendCommand, processingId }) => {
    const state = device.latest_state || {};
    const isLightOrFanOrDomPump = ['LIGHT', 'LIGHT_DIMMER', 'FAN', 'DOMESTIC_PUMP', 'VALVE'].includes(device.type);

    const originalPower = isLightOrFanOrDomPump ? (state.state === 1) : (state.power === 1);
    const originalAuto = (state['auto-mode'] === 1) || (state.auto_mode === 1) || (state.mode === 'AUTO');
    const originalSpeed = parseFloat(state.speed) || parseFloat(state.fan_speed) || 0;
    const originalBrightness = parseFloat(state.brightness) || 0;
    const hasFault = state.fault === 1;

    const [power, setPower] = useState(originalPower);
    const [autoMode, setAutoMode] = useState(originalAuto);
    const [speed, setSpeed] = useState(originalSpeed);
    const [brightness, setBrightness] = useState(originalBrightness);

    // Cờ báo người dùng đang chủ động chỉnh sửa trên Web (chờ bấm thực thi)
    const [isLocalPowerChange, setIsLocalPowerChange] = useState(false);
    const [isLocalAutoChange, setIsLocalAutoChange] = useState(false);
    const [isLocalSpeedChange, setIsLocalSpeedChange] = useState(false);
    const [isLocalBrightnessChange, setIsLocalBrightnessChange] = useState(false);

    // Ghi nhớ trạng thái gửi lệnh của render trước đó để nhận diện thời điểm Kết thúc lệnh (Timeout/Thất bại)
    const prevIsProcessing = useRef(false);

    useEffect(() => {
        const isProcessing = processingId === device.id;
        const wasProcessing = prevIsProcessing.current;
        prevIsProcessing.current = isProcessing;

        // KỊCH BẢN 1: LỆNH THẤT BẠI HOẶC TIMEOUT (TỰ ĐỘNG NẢY NÚT LẠI)
        if (wasProcessing && !isProcessing) {
            if (power !== originalPower) {
                setPower(originalPower);
                setIsLocalPowerChange(false);
            }
            if (autoMode !== originalAuto) {
                setAutoMode(originalAuto);
                setIsLocalAutoChange(false);
            }
            if (speed !== originalSpeed) {
                setSpeed(originalSpeed);
                setIsLocalSpeedChange(false);
            }
            if (brightness !== originalBrightness) {
                setBrightness(originalBrightness);
                setIsLocalBrightnessChange(false);
            }
            return;
        }

        // KỊCH BẢN 2: LỆNH THÀNH CÔNG (DATABASE ĐÃ ĐUỔI KỊP NÚT GẠT)
        if (power === originalPower) setIsLocalPowerChange(false);
        if (autoMode === originalAuto) setIsLocalAutoChange(false);
        if (speed === originalSpeed) setIsLocalSpeedChange(false);
        if (brightness === originalBrightness) setIsLocalBrightnessChange(false);

        // KỊCH BẢN 3: GIÁM SÁT THUẬN CHIỀU (PASSIVE MONITORING)
        if (!isLocalPowerChange) setPower(originalPower);
        if (!isLocalAutoChange) setAutoMode(originalAuto);
        if (!isLocalSpeedChange) setSpeed(originalSpeed);
        if (!isLocalBrightnessChange) setBrightness(originalBrightness);

    }, [originalPower, originalAuto, originalSpeed, originalBrightness, processingId]);

    const handleExecute = () => {
        let commandConfig = {};
        if (['CHILLER', 'COLDPUMP', 'COOLINGPUMP', 'COOLINGTOWER', 'AHU'].includes(device.type)) {
            commandConfig = { power, autoMode, speed };
        } else if (device.type === 'VALVE' || device.type === 'LIGHT') {
            commandConfig = { state: power };
        } else if (device.type === 'LIGHT_DIMMER') {
            commandConfig = { state: power, brightness };
        } else if (device.type === 'FAN') {
            commandConfig = { state: power, fan_speed: speed };
        } else if (device.type === 'DOMESTIC_PUMP') {
            commandConfig = { state: power, speed };
        }

        // BỔ SUNG: Truyền thêm hàm Callback dọn dẹp/reset làm tham số thứ 3
        onSendCommand(device, commandConfig, () => {
            setPower(originalPower);
            setAutoMode(originalAuto);
            setSpeed(originalSpeed);
            setBrightness(originalBrightness);
            setIsLocalPowerChange(false);
            setIsLocalAutoChange(false);
            setIsLocalSpeedChange(false);
            setIsLocalBrightnessChange(false);
        });
    };

    const getDeviceImage = () => {
        if (device.type === 'CHILLER') return "/images/chiller.jpg";
        if (device.type.includes('PUMP')) return "/images/pump.webp";
        if (device.type === 'COOLINGTOWER') return "/images/cooling-tower.webp";
        if (device.type.includes('LIGHT')) return "/images/light.jpg";
        if (device.type === 'FAN') return "/images/fan.png";
        if (device.type === 'AHU') return "/images/ahu.jpg";
        return "/images/valve.jpg";
    };

    return (
        <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 rounded-2xl transition-all mb-3 relative overflow-hidden group">
            {device.latest_state?.fault === 1 && <div className="absolute left-0 top-0 w-1 h-full bg-red-500 shadow-[0_0_15px_#ef4444]"></div>}

            <div className="w-full md:w-32 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative flex items-center justify-center">
                <img src={getDeviceImage()} alt="device" className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:scale-110 transition-transform duration-700" />
                {device.latest_state?.fault === 1 && <AlertTriangle className="absolute text-red-500 animate-pulse" size={28} />}
            </div>

            <div className="w-full md:w-48 shrink-0 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-1">
                    <h4 className={`font-black text-sm tracking-wide ${device.latest_state?.fault === 1 ? 'text-red-400' : 'text-slate-200'}`}>{device.name || device.type}</h4>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                        <span className={`text-[8px] font-bold uppercase tracking-wider ${device.latest_state?.fault === 1 ? 'text-red-500' : originalPower ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {device.latest_state?.fault === 1 ? 'FAULT' : originalPower ? 'ON' : 'OFF'}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${device.latest_state?.fault === 1 ? 'bg-red-500 animate-ping' : originalPower ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                    </div>
                </div>
                <p className="text-[10px] text-blue-400 font-mono truncate">{device.code}</p>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 w-full px-4 border-x border-slate-800/50">
                <div className="flex flex-col gap-3 min-w-[180px]">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium"><Power size={12} /> {device.type === 'VALVE' ? 'Trạng thái Van' : 'Nguồn cấp (Power)'}</span>
                        <button
                            onClick={() => { setPower(!power); setIsLocalPowerChange(true); }}
                            className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${power ? 'bg-emerald-500' : 'bg-slate-700'}`}
                        >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform duration-300 ${power ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}></div>
                        </button>
                    </div>
                    {['CHILLER', 'COLDPUMP', 'COOLINGPUMP', 'COOLINGTOWER', 'DOMESTIC_PUMP', 'FAN', 'AHU'].includes(device.type) && (
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium"><Settings2 size={12} /> Chế độ (Auto/Man)</span>
                            <button
                                onClick={() => { setAutoMode(!autoMode); setIsLocalAutoChange(true); }}
                                className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${autoMode ? 'bg-blue-500' : 'bg-slate-700'}`}
                            >
                                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform duration-300 ${autoMode ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}></div>
                            </button>
                        </div>
                    )}
                </div>
                {['COLDPUMP', 'COOLINGPUMP', 'DOMESTIC_PUMP', 'FAN'].includes(device.type) && (
                    <div className="flex-1 w-full pl-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium"><Activity size={12} className="text-orange-500" /> {device.type === 'FAN' ? 'Tốc độ Quạt' : 'Tần số (Hz)'}</span>
                            <span className="text-xs font-black text-orange-400 font-mono">{device.type === 'FAN' ? `${speed.toFixed(0)} %` : `${speed.toFixed(1)} Hz`}</span>
                        </div>
                        <input type="range" min="0" max={device.type === 'FAN' ? "100" : "60"} step={device.type === 'FAN' ? "1" : "0.1"} value={speed} onChange={(e) => { setSpeed(parseFloat(e.target.value)); setIsLocalSpeedChange(true); }} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                    </div>
                )}
                {device.type === 'LIGHT_DIMMER' && (
                    <div className="flex-1 w-full pl-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium"><Lightbulb size={12} className="text-yellow-500" /> Cường độ sáng</span>
                            <span className="text-xs font-black text-yellow-400 font-mono">{brightness} %</span>
                        </div>
                        <input type="range" min="0" max="100" step="1" value={brightness} onChange={(e) => { setBrightness(parseFloat(e.target.value)); setIsLocalBrightnessChange(true); }} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                    </div>
                )}
            </div>
            <div className="w-full md:w-40 shrink-0 flex justify-end">
                <button onClick={handleExecute} disabled={processingId === device.id} className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all shadow-lg ${device.latest_state?.fault === 1 ? 'bg-red-900/50 text-red-500 border border-red-900/50 hover:bg-red-600 hover:text-white' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/50'} disabled:opacity-50`}>
                    {processingId === device.id ? 'ĐANG GỬI...' : (<>THỰC THI LỆNH <Play size={12} fill="currentColor" /></>)}
                </button>
            </div>
        </div>
    );
};

// ==========================================
// 2. LINH KIỆN CHA CHÍNH: CONTROL PANEL
// ==========================================
export default function ControlPanel() {
    const { socket } = useContext(NotificationContext);

    const [devices, setDevices] = useState([]);
    const [subsystems, setSubsystems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [devData, subData] = await Promise.all([
                    getDevicesApi(),
                    getSubsystemsApi()
                ]);
                const controllableDevices = devData.filter(d => d.type !== 'PIPE');
                setDevices(controllableDevices);
                setSubsystems(subData);
                setLoading(false);
            } catch (error) {
                console.error("Lỗi tải dữ liệu", error);
                setLoading(false);
            }
        };
        loadData();
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

        const handleCommandSuccess = (data) => {
            toast.success(`Thiết bị [${data.name}] đã thực thi lệnh thành công!`, { duration: 5000, icon: '✅' });
        };

        const handleCommandFailed = (data) => {
            toast.error(`Lỗi: Thiết bị [${data.name}] không thay đổi trạng thái (Kẹt cơ học)!`, { duration: 5000, icon: '❌' });
        };

        const handleCommandTimeout = (data) => {
            toast.error(`Lỗi: Mất kết nối đến thiết bị [${data.name}] (Timeout)!`, { duration: 5000, icon: '⚠️' });
        };

        socket.on("device-update", handleDeviceUpdate);
        socket.on("command-success", handleCommandSuccess);
        socket.on("command-failed", handleCommandFailed);
        socket.on("command-timeout", handleCommandTimeout);

        return () => {
            socket.off("device-update", handleDeviceUpdate);
            socket.off("command-success", handleCommandSuccess);
            socket.off("command-failed", handleCommandFailed);
            socket.off("command-timeout", handleCommandTimeout);
        };
    }, [socket]);

    const handleSendCommand = (device, commandConfig, onCancel) => {
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
                                <>Thiết bị <span className="font-bold text-red-400">{device.code}</span> đang báo sự cố. Tiếp tục?</>
                            ) : (
                                <>Xác nhận truyền lệnh MQTT xuống thiết bị <span className="font-bold text-blue-400">{device.code}</span>?</>
                            )}
                        </p>
                    </div>
                </div>
                <div className="bg-slate-950 px-6 py-4 flex justify-end gap-3 border-t border-slate-800">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            if (onCancel) onCancel(); // 2. KÍCH HOẠT HÀM HỒI ĐÁP KHÔI PHỤC NÚT GẠT CỦA CON
                        }}
                        className="px-5 py-2.5 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors uppercase tracking-wider"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={async (e) => {
                            e.currentTarget.disabled = true;
                            toast.dismiss(t.id);
                            setProcessingId(device.id);
                            try {
                                await controlDeviceApi({ deviceId: device.id, code: device.code, type: device.type, command: commandConfig });
                                toast.success(`Đã gửi lệnh xuống ${device.code}!`);
                            } catch (error) {
                                toast.error(error.message || "Gửi lệnh thất bại");
                                if (onCancel) onCancel(); // Nếu gửi API lỗi, tự động nảy nút gạt về cũ
                            }
                            finally { setProcessingId(null); }
                        }}
                        className={`px-5 py-2.5 text-white rounded-xl text-xs font-black shadow-lg transition-all uppercase tracking-wider flex items-center gap-2 ${hasFault ? 'bg-red-600 hover:bg-red-700 shadow-red-900/50' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/50'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Play size={14} fill="currentColor" /> {hasFault ? 'VẪN THỰC THI' : 'THỰC THI'}
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    return (
        <div className="min-h-screen bg-[#020617] bg-scada-grid p-6 font-sans text-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-3xl shadow-2xl mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600/20 border border-blue-500/30 p-3 rounded-2xl shadow-lg shadow-blue-500/10">
                        <SlidersHorizontal size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white uppercase tracking-tight">Bảng Điều Khiển Tổng Hợp</h1>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5">TRUNG TÂM RA LỆNH VẬN HÀNH (COMMAND CENTER)</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <p className="text-center font-bold text-slate-500 animate-pulse mt-20">ĐANG TẢI BẢNG ĐIỀU KHIỂN...</p>
            ) : (
                <div className="space-y-6 max-w-[1400px] mx-auto">
                    {subsystems.map(subsystem => {
                        const groupDevices = devices.filter(d => d.subsystemId === subsystem.id);
                        if (groupDevices.length === 0) return null;

                        let Icon = Activity;
                        let colorClass = 'text-blue-400';
                        if (subsystem.code.includes('CHILLER')) { Icon = Snowflake; colorClass = 'text-blue-400'; }
                        else if (subsystem.code.includes('LIGHT')) { Icon = Lightbulb; colorClass = 'text-yellow-400'; }
                        else if (subsystem.code.includes('FAN')) { Icon = Wind; colorClass = 'text-cyan-400'; }
                        else if (subsystem.code.includes('PUMP')) { Icon = Droplets; colorClass = 'text-emerald-400'; }

                        return (
                            <div key={subsystem.id} className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-[2rem] p-6 shadow-xl">
                                <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${colorClass}`}>
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <h2 className={`text-sm font-black uppercase tracking-widest ${colorClass}`}>
                                                {subsystem.name}
                                            </h2>
                                            <p className="text-[10px] text-slate-500 font-bold">{groupDevices.length} thiết bị điều khiển</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {groupDevices.map(device => (
                                        <DeviceRow
                                            key={device.id}
                                            device={device}
                                            onSendCommand={handleSendCommand}
                                            processingId={processingId}
                                        />
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