import React, { useState, useEffect } from 'react';
import { getSystemDashboardApi } from '../../services/building.service';
import {
    Activity, Building2, Users, Cpu,
    Clock, CheckCircle2, ShieldAlert, ArrowRight, Zap, MapPin, Target, LayoutTemplate
} from 'lucide-react';

export default function SuperAdminDashboard() {
    const [data, setData] = useState({ stats: {}, recentLogs: [] });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const result = await getSystemDashboardApi();
            setData(result);
        } catch (error) {
            console.error("Lỗi tải Dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 1. Lấy dữ liệu lần đầu tiên khi mở trang
        fetchData();

        // 2. Tự động làm mới mỗi 10 giây (Để lấy Lịch sử điều khiển Real-time)
        const interval = setInterval(fetchData, 5000);

        // 3. LẮNG NGHE TÍN HIỆU TỪ HEADER (Cập nhật ngay lập tức khi vừa duyệt Admin mới)
        const handleRefresh = () => {
            fetchData();
        };
        window.addEventListener('refresh-admin-list', handleRefresh);

        // Dọn dẹp bộ nhớ
        return () => {
            clearInterval(interval);
            window.removeEventListener('refresh-admin-list', handleRefresh);
        };
    }, []);

    // Hàm định dạng thời gian dạng "Vừa xong", "5 phút trước"...
    const timeAgo = (dateString) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now - past;
        const diffMins = Math.round(diffMs / 60000);
        const diffHrs = Math.round(diffMins / 60);
        const diffDays = Math.round(diffHrs / 24);

        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHrs < 24) return `${diffHrs} giờ trước`;
        return `${diffDays} ngày trước`;
    };

    // HÀM DỊCH GÓI TIN ĐIỀU KHIỂN (THÔNG MINH NHẬN DIỆN THEO LOẠI THIẾT BỊ)
    const translatePayload = (payload, deviceType) => {
        if (!payload) return "Lệnh không xác định";

        let cmd = Array.isArray(payload) ? payload[0] : payload;
        if (typeof cmd === 'string') cmd = JSON.parse(cmd);

        const actions = [];

        // 1. Dịch trạng thái Bật/Tắt theo đúng chuyên ngành
        const hasState = cmd.power !== undefined || cmd.state !== undefined;
        const isOn = cmd.power === 1 || cmd.power === true || cmd.state === 1 || cmd.state === true;

        if (hasState) {
            if (deviceType === 'VALVE') {
                actions.push(isOn ? '🟢 MỞ VAN' : '🔴 ĐÓNG VAN');
            } else if (deviceType?.includes('LIGHT')) {
                actions.push(isOn ? '🟢 BẬT ĐÈN' : '🔴 TẮT ĐÈN');
            } else if (deviceType?.includes('PUMP')) {
                actions.push(isOn ? '🟢 BẬT BƠM' : '🔴 TẮT BƠM');
            } else if (deviceType === 'FAN' || deviceType === 'AHU') {
                actions.push(isOn ? '🟢 BẬT QUẠT' : '🔴 TẮT QUẠT');
            } else if (deviceType === 'CHILLER') {
                actions.push(isOn ? '🟢 BẬT MÁY LÀM LẠNH' : '🔴 TẮT MÁY LÀM LẠNH');
            } else {
                actions.push(isOn ? '🟢 BẬT' : '🔴 TẮT');
            }
        }

        // 2. Dịch các thông số đi kèm
        if (cmd['auto-mode'] !== undefined || cmd.autoMode !== undefined || cmd.auto_mode !== undefined) {
            const isAuto = cmd['auto-mode'] === 1 || cmd.autoMode === 1 || cmd.autoMode === true;
            actions.push(`Chế độ: ${isAuto ? 'AUTO' : 'MANUAL'}`);
        }

        if (cmd.speed !== undefined) actions.push(`Tần số: ${cmd.speed} Hz`);
        if (cmd.fan_speed !== undefined) actions.push(`Tốc độ: ${cmd.fan_speed}%`);
        if (cmd.brightness !== undefined) actions.push(`Độ sáng: ${cmd.brightness}%`);

        // Ráp lại thành câu hoàn chỉnh
        return actions.length > 0 ? actions.join(' | ') : JSON.stringify(cmd);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-blue-500 gap-4">
            <Activity size={48} className="animate-spin" />
            <span className="font-bold tracking-widest uppercase text-sm">Đang tải trung tâm kiểm toán...</span>
        </div>
    );

    return (
        <div className="p-6 text-slate-200 font-sans min-h-[90vh] bg-[#020617] rounded-3xl mt-4 mx-4 border border-slate-800">
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-8 bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-3xl shadow-xl">
                <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
                    <Activity size={28} className="text-blue-400" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-white uppercase tracking-wider">Tổng quan Hệ thống</h1>
                    <p className="text-slate-400 text-[10px] font-bold mt-1 tracking-widest">TRUNG TÂM GIÁM SÁT TOÀN DIỆN (SUPER ADMIN)</p>
                </div>
            </div>

            {/* 3 THẺ THỐNG KÊ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 flex items-center gap-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                    <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20"><Building2 size={32} /></div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cơ sở hạ tầng</p>
                        <p className="text-3xl font-black text-white mt-1">{data.stats.totalBuildings} <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tòa nhà</span></p>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 flex items-center gap-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                    <div className="p-4 bg-green-500/10 text-green-400 rounded-2xl border border-green-500/20"><Users size={32} /></div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Đội ngũ Vận hành</p>
                        <p className="text-3xl font-black text-white mt-1">{data.stats.totalAdmins} <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Admin</span></p>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 flex items-center gap-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                    <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20"><Cpu size={32} /></div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Thiết bị quản lý</p>
                        <p className="text-3xl font-black text-white mt-1">{data.stats.totalDevices} <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Thiết bị</span></p>
                    </div>
                </div>
            </div>

            {/* NHẬT KÝ ĐIỀU KHIỂN (TIMELINE CHUYÊN NGHIỆP) */}
            <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-[2rem] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8 border-b border-slate-800/50 pb-4">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <Clock className="text-blue-500" size={20} /> Lịch sử điều khiển
                    </h2>
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span> Live Audit
                    </span>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                    {data.recentLogs.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm font-mono">Không có dữ liệu lịch sử.</div>
                    ) : (
                        data.recentLogs.map((log, index) => {
                            const isSuccess = log.status === 'SUCCESS';
                            const isFailed = log.status === 'FAILED' || log.status === 'ERROR';

                            return (
                                <div key={log.id} className="relative flex items-stretch gap-6 group py-2">

                                    {/* Line dọc nối các item */}
                                    {index !== data.recentLogs.length - 1 && (
                                        <div className="absolute left-[23px] top-12 bottom-[-10px] w-[2px] bg-slate-800 group-hover:bg-slate-700 transition-colors z-0"></div>
                                    )}

                                    {/* Icon Trạng thái */}
                                    <div className="relative z-10 w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-lg mt-2 transition-colors">
                                        {isSuccess ? (
                                            <CheckCircle2 size={20} className="text-emerald-500 shadow-emerald-500/50" />
                                        ) : isFailed ? (
                                            <ShieldAlert size={20} className="text-red-500" />
                                        ) : (
                                            <Activity size={20} className="text-amber-500" />
                                        )}
                                    </div>

                                    {/* Thẻ Nội dung Log */}
                                    <div className={`flex-1 bg-slate-900/50 hover:bg-slate-800/60 border ${isSuccess ? 'border-emerald-500/20' : 'border-amber-500/20'} p-5 rounded-2xl transition-all shadow-md`}>

                                        {/* Dòng 1: Ai làm gì lúc nào */}
                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-3">
                                            <div className="flex items-center flex-wrap gap-2 text-sm">
                                                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                                                    {log.user?.fullName?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <span className="font-bold text-blue-400">{log.user?.fullName || 'Hệ thống'}</span>
                                                <span className="text-slate-500 text-xs font-mono">(@{log.user?.username})</span>
                                                <span className="text-slate-400 text-xs mx-1">đã gửi lệnh điều khiển</span>

                                                <span className="font-bold text-white text-xs bg-slate-950 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                                                    <Target size={12} className="text-indigo-400" /> {log.device?.name || log.device_code}
                                                </span>
                                            </div>

                                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                                <Clock size={12} /> {timeAgo(log.created_at)} ({new Date(log.created_at).toLocaleTimeString('vi-VN')})
                                            </div>
                                        </div>

                                        {/* Dòng 2: Ở đâu & Lệnh gì */}
                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-[#050c18] p-3 rounded-xl border border-slate-800/60">

                                            {/* Vị trí Tòa nhà & Phân hệ */}
                                            <div className="flex items-center gap-2 text-slate-400 text-xs shrink-0">
                                                <MapPin size={14} className="text-rose-500" />
                                                <span className="font-semibold text-amber-100">{log.device?.building?.name || 'Tòa nhà N/A'}</span>
                                                <span className="text-slate-600">|</span>
                                                <LayoutTemplate size={12} className="text-sky-500" />
                                                <span className="text-sky-300">{log.device?.subsystem?.name || 'Phân hệ N/A'}</span>
                                            </div>

                                            <ArrowRight size={14} className="text-slate-700 hidden md:block shrink-0" />

                                            {/* Chi tiết Lệnh */}
                                            <div className="flex-1 flex items-center gap-2 font-mono text-[11px] text-cyan-300 font-semibold tracking-wide">
                                                <Zap size={14} className="text-cyan-500 shrink-0" />
                                                {translatePayload(log.command_payload)}
                                            </div>

                                            {/* Trạng thái Thành công / Lỗi */}
                                            <div className="shrink-0 flex flex-col items-end">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isSuccess ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' :
                                                    isFailed ? 'text-red-500 bg-red-500/10 border border-red-500/20' :
                                                        'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                                                    }`}>
                                                    {isSuccess ? '✅ ĐÃ THỰC THI (SUCCESS)' : isFailed ? '❌ LỖI (FAILED)' : '⏳ CHỜ THIẾT BỊ (SENT)'}
                                                </span>
                                                {isSuccess && log.completed_at && (
                                                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                                                        Xong lúc: {new Date(log.completed_at).toLocaleTimeString('vi-VN')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

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