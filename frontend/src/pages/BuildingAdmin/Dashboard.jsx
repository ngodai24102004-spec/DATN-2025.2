import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import { getDevicesApi, addDeviceApi, deleteDeviceApi, updateDeviceApi } from '../../services/device.service';
import Building3D from './Building3D';
import {
    Building2, Plus, Fan, Waves, Snowflake, Power, MapPin,
    X, ArrowRightLeft, AlertCircle, Activity, Thermometer, Gauge, Droplets, RefreshCw, AlertTriangle
} from 'lucide-react';
import { Layers, Box, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const { user } = useContext(AuthContext);

    // 1. LẤY BIẾN socket TỪ CONTEXT XUỐNG DÙNG (Không lấy hàm addNotification nữa vì Context đã tự động làm rồi)
    const { socket } = useContext(NotificationContext);

    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('2D');
    const [error, setError] = useState('');
    const [lastUpdate, setLastUpdate] = useState(null);

    const [formData, setFormData] = useState({
        code: '', name: '', type: 'CHILLER', location: ''
    });

    // 2. GỌI API LẤY DANH SÁCH THIẾT BỊ LÚC MỚI VÀO TRANG
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

    // Chạy 1 lần khi mới mở trang
    useEffect(() => {
        fetchDevices();
    }, []);

    // 3. LẮNG NGHE SOCKET ĐỂ CẬP NHẬT GIAO DIỆN (CHỈ VẼ LẠI UI)
    useEffect(() => {
        if (!socket) return; // Nếu Context chưa kết nối xong mạng thì chờ

        const handleDeviceUpdate = (payload) => {
            console.log("⚡ Dashboard nhận update:", payload.code);

            setDevices(prevDevices => prevDevices.map(device => {
                // Ép về chữ thường để chống lỗi sai chữ hoa/thường
                if (device.code.toLowerCase() === payload.code.toLowerCase()) {
                    return {
                        ...device,
                        latest_state: payload.latest_state,
                        last_updated: new Date()
                    };
                }
                return device;
            }));

            setLastUpdate(new Date());
        };

        // Bật lắng nghe
        socket.on("device-update", handleDeviceUpdate);

        // Tắt lắng nghe khi chuyển sang trang khác (để tránh lỗi tràn bộ nhớ)
        return () => {
            socket.off("device-update", handleDeviceUpdate);
        };
    }, [socket]); // Hook này chạy lại nếu biến socket thay đổi

    // 4. HÀM XỬ LÝ THÊM THIẾT BỊ MỚI
    const handleAddDevice = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await addDeviceApi({
                ...formData,
                buildingId: user.building?.id || 1
            });
            setIsModalOpen(false);
            toast.success(`Đã thêm thiết bị ${formData.code}!`);
            setFormData({ code: '', name: '', type: 'CHILLER', location: '' });
            fetchDevices();
        } catch (err) {
            setError(err.message);
            toast.error("Thêm thiết bị thất bại!");
        }
    };

    // 5. --- STATE CHO MODAL CHỈNH SỬA ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: null, code: '', name: '', location: '' });

    // Mở modal và điền sẵn dữ liệu cũ
    const handleOpenEdit = (device) => {
        setEditFormData({
            id: device.id,
            code: device.code,
            name: device.name || '',
            location: device.location || ''
        });
        setIsEditModalOpen(true);
    };

    // Gửi API cập nhật
    const handleUpdateDevice = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await updateDeviceApi(editFormData.id, {
                code: editFormData.code,
                name: editFormData.name,
                location: editFormData.location
            });
            setIsEditModalOpen(false);
            fetchDevices(); // Tải lại danh sách thiết bị
            toast.success(`Đã cập nhật thiết bị ${editFormData.code}!`);
        } catch (err) {
            setError(err.message);
            toast.error("Cập nhật thất bại!");
        }
    };

    // 6. HÀM XỬ LÝ XÓA THIẾT BỊ
    const handleDeleteDevice = (id, code) => {
        // Sử dụng toast.custom để tạo giao diện xác nhận tuyệt đẹp
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-in fade-in zoom-in slide-in-from-top-5' : 'animate-out fade-out zoom-out'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col border border-slate-100 overflow-hidden duration-200`}>
                <div className="p-6 flex items-start gap-4 bg-slate-50/50">
                    <div className="bg-red-100 text-red-600 p-3 rounded-2xl shadow-inner mt-1">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-slate-800 font-black text-lg uppercase tracking-tight">Xác nhận xóa thiết bị</h3>
                        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                            Bạn có chắc chắn muốn xóa vĩnh viễn thiết bị <span className="font-bold text-slate-800">{code}</span>?<br />Hành động này sẽ xóa toàn bộ nhật ký liên quan.
                        </p>
                    </div>
                </div>
                <div className="bg-white px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors uppercase tracking-wider"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id); // Đóng popup
                            try {
                                await deleteDeviceApi(id); // Gọi API xóa
                                fetchDevices(); // Load lại data
                                toast.success(`Đã xóa thiết bị ${code}!`);
                            } catch (err) {
                                toast.error(err.message || "Lỗi khi xóa thiết bị");
                            }
                        }}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-lg shadow-red-200 transition-colors uppercase tracking-wider"
                    >
                        Xóa ngay
                    </button>
                </div>
            </div>
        ), { duration: Infinity }); // duration: Infinity giúp popup không tự biến mất cho đến khi chọn Yes/No
    };

    // PHÂN LOẠI THIẾT BỊ ĐỂ VẼ VÀO SƠ ĐỒ SCADA
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

        // Logic xác định trạng thái: Lỗi, Đang chạy
        const hasFault = state.fault === 1;
        const isRunning =
            device.type === 'VALVE' ? state.state === 1 :
                device.type === 'PIPE' ? state.flow_status === 1 :
                    state.power === 1;

        // Phím auto-mode có dấu gạch ngang nên phải dùng ngoặc vuông
        const isAuto = (state['auto-mode'] === 1) || (state.auto_mode === 1);

        // Logic màu sắc
        let cardStyle = "border-slate-200 bg-white";
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
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm ${isAuto ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'}`}>
                                {isAuto ? 'Auto' : 'Manual'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col mt-1">
                    <h4 className="font-bold text-slate-800 text-xs tracking-tight">{device.code}</h4>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{device.type}</span>
                </div>

                <div className="mt-2 space-y-1.5 border-t border-slate-200/60 pt-2.5">
                    {device.type.includes('PUMP') && (
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-medium">Tốc độ chạy:</span>
                            <span className="font-mono font-bold text-slate-700 bg-white/50 px-1 rounded">{state.speed || 0} Hz</span>
                        </div>
                    )}

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

                    {device.type === 'VALVE' && (
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-medium">Trạng thái:</span>
                            <span className={`font-bold ${state.state === 1 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {state.state === 1 ? 'MỞ HOÀN TOÀN' : 'ĐANG ĐÓNG'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-2 pt-1.5 flex items-center justify-between border-t border-slate-200/60">
                    <p className="text-[9px] text-slate-400 truncate italic flex items-center">
                        <MapPin className="w-2.5 h-2.5 inline mr-1" /> {device.location || 'N/A'}
                    </p>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleOpenEdit(device)}
                            className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"
                            title="Chỉnh sửa thiết bị"
                        >
                            <Edit className="w-3 h-3" />
                        </button>

                        <button
                            onClick={() => handleDeleteDevice(device.id, device.code)}
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Xóa thiết bị này"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

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

                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('2D')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${viewMode === '2D'
                                ? 'bg-white shadow text-slate-800'
                                : 'text-slate-400'
                                }`}
                        >
                            2D
                        </button>

                        <button
                            onClick={() => setViewMode('3D')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${viewMode === '3D'
                                ? 'bg-white shadow text-slate-800'
                                : 'text-slate-400'
                                }`}
                        >
                            3D
                        </button>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all text-xs tracking-widest shadow-xl"
                    >
                        <Plus className="w-4 h-4" /> THÊM THIẾT BỊ
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-50 -translate-y-1/2 z-0"></div>

                {loading ? (
                    <div className="text-center py-20 text-slate-400 font-bold tracking-widest animate-pulse flex flex-col items-center gap-4">
                        <RefreshCw className="w-10 h-10 animate-spin text-blue-500" />
                        ĐANG ĐỒNG BỘ DỮ LIỆU...
                    </div>
                ) : viewMode === '2D' ? (
                    <div className="overflow-x-auto">
                        <div className="flex items-start justify-between min-w-[1300px] gap-2 relative z-10">
                            <div className="flex items-start justify-between min-w-[1300px] gap-2 relative z-10">
                                <div className="flex-1">
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 border-dashed min-h-[300px]">
                                        <h3 className="text-[9px] font-black text-center text-slate-400 uppercase mb-4 tracking-tighter">Heat Rejection / Tower</h3>
                                        <div className="space-y-3">
                                            {towers.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : towers.map(d => <DeviceCard key={d.id} device={d} icon={Fan} />)}
                                        </div>
                                    </div>
                                </div>

                                <FlowArrow />

                                <div className="flex-1">
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 border-dashed min-h-[300px]">
                                        <h3 className="text-[9px] font-black text-center text-slate-400 uppercase mb-4 tracking-tighter">Condenser Pumps</h3>
                                        <div className="space-y-3">
                                            {coolingPumps.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : coolingPumps.map(d => <DeviceCard key={d.id} device={d} icon={Power} />)}
                                        </div>
                                    </div>
                                </div>

                                <FlowArrow />

                                <div className="flex-1">
                                    <div className="bg-blue-50/50 p-3 rounded-2xl border-2 border-blue-100 min-h-[300px] shadow-inner">
                                        <h3 className="text-[9px] font-black text-center text-blue-400 uppercase mb-4 tracking-tighter">Chiller Plant</h3>
                                        <div className="space-y-3">
                                            {chillers.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : chillers.map(d => <DeviceCard key={d.id} device={d} icon={Snowflake} />)}
                                        </div>
                                    </div>
                                </div>

                                <FlowArrow />

                                <div className="flex-1">
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 border-dashed min-h-[300px]">
                                        <h3 className="text-[9px] font-black text-center text-slate-400 uppercase mb-4 tracking-tighter">Chilled Water Pumps</h3>
                                        <div className="space-y-3">
                                            {coldPumps.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : coldPumps.map(d => <DeviceCard key={d.id} device={d} icon={Power} />)}
                                        </div>
                                    </div>
                                </div>

                                <FlowArrow />

                                <div className="flex-1">
                                    <div className="bg-orange-50/20 p-3 rounded-2xl border border-orange-100 border-dashed min-h-[300px]">
                                        <h3 className="text-[9px] font-black text-center text-orange-400 uppercase mb-4 tracking-tighter">Telemetry / Pipes</h3>
                                        <div className="space-y-3">
                                            {pipes.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : pipes.map(d => <DeviceCard key={d.id} device={d} icon={Droplets} />)}
                                        </div>
                                    </div>
                                </div>

                                <FlowArrow />

                                <div className="flex-1">
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 border-dashed min-h-[300px]">
                                        <h3 className="text-[9px] font-black text-center text-slate-400 uppercase mb-4 tracking-tighter">Isolation Valves</h3>
                                        <div className="space-y-3">
                                            {valves.length === 0 ? <p className="text-xs text-center text-slate-300">Trống</p> : valves.map(d => <DeviceCard key={d.id} device={d} icon={Activity} />)}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                ) : (

                    // =======================
                    // 3D DIGITAL TWIN VIEW
                    // =======================
                    <div className="w-full">
                        <Building3D devices={devices} />
                    </div>
                )}
            </div>

            {/* MODAL THÊM THIẾT BỊ */}
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

            {/* MODAL CHỈNH SỬA THIẾT BỊ */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b bg-slate-50/50">
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Chỉnh sửa thiết bị</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleUpdateDevice} className="p-8 space-y-5">
                            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100"><AlertCircle className="w-4 h-4" />{error}</div>}

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mã thiết bị: <span className="text-red-500">*</span></label>
                                <input type="text" required value={editFormData.code} onChange={e => setEditFormData({ ...editFormData, code: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700" />
                                <p className="text-[8px] text-orange-500 ml-1 mt-1 font-bold">⚠️ Lưu ý: Nếu đổi mã này, thiết bị ở trạm phải gửi đúng mã mới thì hệ thống mới nhận được dữ liệu MQTT.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tên hiển thị</label>
                                <input type="text" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Vị trí lắp đặt vật lý</label>
                                <input type="text" value={editFormData.location} onChange={e => setEditFormData({ ...editFormData, location: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700" />
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl text-xs uppercase tracking-widest">Hủy</button>
                                <button type="submit" className="flex-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-200 text-xs uppercase tracking-widest transition-colors">Cập nhật</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}