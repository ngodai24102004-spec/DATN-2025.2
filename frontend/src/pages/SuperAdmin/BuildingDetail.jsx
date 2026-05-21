import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBuildingByIdApi } from '../../services/building.service';
// 1. THÊM IMPORT CONTEXT ĐỂ LẤY SOCKET
import { NotificationContext } from '../../context/NotificationContext';
import {
    ArrowLeft, Building2, MapPin, UserCircle, Activity,
    Snowflake, Fan, Power, Droplets, AlertTriangle, ShieldCheck, Server
} from 'lucide-react';

export default function BuildingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // 2. LẤY BIẾN SOCKET
    const { socket } = useContext(NotificationContext);

    const [building, setBuilding] = useState(null);
    const [loading, setLoading] = useState(true);

    // FETCH DỮ LIỆU LẦN ĐẦU TỪ API
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await getBuildingByIdApi(id);
                setBuilding(data);
            } catch (error) {
                alert("Không thể tải thông tin tòa nhà");
                navigate('/admin');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    // ==========================================
    // 3. THÊM LOGIC LẮNG NGHE SOCKET REAL-TIME
    // ==========================================
    useEffect(() => {
        if (!socket || !building) return;

        const handleDeviceUpdate = (payload) => {
            // Cập nhật lại state 'building' khi có MQTT gửi về
            setBuilding(prevBuilding => {
                if (!prevBuilding) return prevBuilding;

                // Tìm và cập nhật trạng thái của thiết bị bị thay đổi
                const updatedDevices = prevBuilding.devices.map(device => {
                    if (device.code.toLowerCase() === payload.code.toLowerCase()) {
                        return {
                            ...device,
                            latest_state: payload.latest_state,
                            last_updated: new Date()
                        };
                    }
                    return device;
                });

                return {
                    ...prevBuilding,
                    devices: updatedDevices
                };
            });
        };

        socket.on("device-update", handleDeviceUpdate);

        return () => {
            socket.off("device-update", handleDeviceUpdate);
        };
    }, [socket, building?.id]); // Chạy lại nếu socket hoặc id nhà thay đổi

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 animate-pulse uppercase tracking-widest">Đang tải dữ liệu cơ sở...</div>;
    }

    const manager = building?.managers[0]?.user;
    const devices = building?.devices || [];

    // Đếm thống kê nhanh (Đã fix lỗi logic âm)
    const totalDevices = devices.length;
    const totalFaults = devices.filter(d => d.latest_state?.fault === 1).length;
    const activeDevices = devices.filter(d => {
        const state = d.latest_state || {};
        if (state.fault === 1) return false;
        return state.power === 1 || state.state === 1 || state.flow_status === 1;
    }).length;
    const stoppedDevices = totalDevices - activeDevices - totalFaults;

    const getDeviceIcon = (type) => {
        switch (type) {
            case 'CHILLER': return Snowflake;
            case 'COOLINGTOWER': return Fan;
            case 'COLDPUMP':
            case 'COOLINGPUMP': return Power;
            case 'PIPE': return Droplets;
            case 'VALVE': return Activity;
            default: return Server;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans space-y-6">

            <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit"
            >
                <ArrowLeft size={16} /> Quay lại danh sách
            </button>

            <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between gap-6 items-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-10 w-40 h-40 bg-emerald-500/10 blur-2xl rounded-full"></div>

                <div className="relative z-10 flex items-center gap-6">
                    <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/30">
                        <Building2 size={40} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                                {building.code}
                            </span>
                            {totalFaults > 0 && (
                                <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                                    <AlertTriangle size={10} /> CÓ SỰ CỐ
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">{building.name}</h1>
                        <p className="text-slate-400 flex items-center gap-1.5 mt-2 text-sm font-medium">
                            <MapPin size={14} className="text-blue-400" /> {building.address || 'Chưa cập nhật địa chỉ'}
                        </p>
                    </div>
                </div>

                <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 min-w-[300px]">
                    <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-400">
                        <UserCircle size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Người Quản Lý Chiller</p>
                        {manager ? (
                            <>
                                <p className="text-white font-bold text-lg leading-tight">{manager.fullName}</p>
                            </>
                        ) : (
                            <p className="text-red-400 font-bold text-sm">Chưa phân công</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl text-slate-600"><Server size={20} /></div>
                    <div><p className="text-2xl font-black text-slate-800">{totalDevices}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Tổng thiết bị</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><Activity size={20} /></div>
                    <div><p className="text-2xl font-black text-emerald-600">{activeDevices}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Đang vận hành</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl text-slate-400"><Power size={20} /></div>
                    <div><p className="text-2xl font-black text-slate-500">{stoppedDevices}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Đang dừng</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
                    <div className="bg-red-50 p-3 rounded-xl text-red-600"><AlertTriangle size={20} /></div>
                    <div><p className="text-2xl font-black text-red-600">{totalFaults}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Đang báo lỗi</p></div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <Server size={18} className="text-blue-600" /> Hệ thống thiết bị tòa nhà
                    </h2>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Đồng bộ Real-time
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {devices.length === 0 ? (
                        <p className="col-span-full text-center text-slate-400 py-10 font-medium">Tòa nhà này chưa được khai báo thiết bị nào.</p>
                    ) : (
                        devices.map(device => {
                            const Icon = getDeviceIcon(device.type);
                            const state = device.latest_state || {};
                            const hasFault = state.fault === 1;
                            const isRunning = device.type === 'VALVE' ? state.state === 1 : device.type === 'PIPE' ? state.flow_status === 1 : state.power === 1;

                            return (
                                <div key={device.id} className={`p-4 rounded-2xl border-2 transition-all duration-300 ${hasFault ? 'border-red-400 bg-red-50' : isRunning ? 'border-emerald-200 bg-white' : 'border-slate-100 bg-slate-50'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2 rounded-xl transition-colors ${hasFault ? 'bg-red-100 text-red-600' : isRunning ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                            <Icon size={18} className={isRunning && !hasFault && device.type !== 'PIPE' ? 'animate-spin' : ''} />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${hasFault ? 'bg-red-500 animate-ping' : isRunning ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                            <span className={`text-[9px] font-black uppercase ${hasFault ? 'text-red-600' : isRunning ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {hasFault ? 'LỖI' : isRunning ? 'ON' : 'OFF'}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm truncate" title={device.code}>{device.code}</h4>
                                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1 mb-3">{device.type}</p>

                                    <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between text-xs text-slate-500">
                                        <span className="flex items-center gap-1 truncate"><MapPin size={12} /> {device.location || 'N/A'}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}