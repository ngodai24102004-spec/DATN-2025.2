import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getDevicesApi, addDeviceApi } from '../../services/device.service';
import {
    Building2,
    Plus,
    Fan,
    Waves,
    Snowflake,
    Power,
    MapPin,
    X,
    ArrowRightLeft,
    AlertCircle,
    Activity
} from 'lucide-react';

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');

    // State cho Form Thêm thiết bị
    const [formData, setFormData] = useState({
        code: '', name: '', type: 'CHILLER', location: ''
    });

    // 1. Tải danh sách thiết bị khi vào trang
    const fetchDevices = async () => {
        try {
            setLoading(true);
            const data = await getDevicesApi();
            setDevices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
        // Trong thực tế, bạn có thể dùng setInterval hoặc WebSocket ở đây để data tự chớp nháy
    }, []);

    // 2. Hàm Xử lý thêm thiết bị
    const handleAddDevice = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await addDeviceApi({
                ...formData,
                buildingId: user.building?.id || 1
            });
            setIsModalOpen(false);
            setFormData({ code: '', name: '', type: 'CHILLER', location: '' }); // Reset form
            fetchDevices(); // Tải lại danh sách để hiện lên sơ đồ
            alert("Thêm thiết bị thành công!");
        } catch (err) {
            setError(err.message);
        }
    };

    // 3. Phân loại thiết bị để vẽ sơ đồ
    const towers = devices.filter(d => d.type === 'COOLINGTOWER');
    const coolingPumps = devices.filter(d => d.type === 'COOLINGPUMP');
    const chillers = devices.filter(d => d.type === 'CHILLER');
    const coldPumps = devices.filter(d => d.type === 'COLDPUMP');
    const valves = devices.filter(d => d.type === 'VALVE');

    // Component nhỏ: Thẻ hiển thị 1 thiết bị
    const DeviceCard = ({ device, icon: Icon }) => {
        const state = device.latest_state || {};
        const isRunning = state.power === 1 || state.state === 1; // power cho máy, state cho van
        const hasFault = state.fault === 1;

        return (
            <div className={`p-4 rounded-xl border-2 transition-all shadow-sm ${hasFault ? 'border-red-500 bg-red-50' :
                isRunning ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                }`}>
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${isRunning && !hasFault ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className={`w-6 h-6 ${isRunning && !hasFault && 'animate-pulse'}`} />
                    </div>
                    {/* Chấm trạng thái */}
                    <div className="flex gap-2">
                        {hasFault && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                        {!hasFault && <span className={`h-3 w-3 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>}
                    </div>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{device.code}</h4>
                <p className="text-xs text-slate-500 truncate mb-2" title={device.name}>{device.name}</p>
                {device.location && (
                    <div className="flex items-center text-xs text-slate-400">
                        <MapPin className="w-3 h-3 mr-1" /> <span className="truncate">{device.location}</span>
                    </div>
                )}
            </div>
        );
    };

    // Component nhỏ: Mũi tên luân chuyển nước
    const FlowArrow = () => (
        <div className="flex flex-col items-center justify-center px-2 text-blue-300">
            <ArrowRightLeft className="w-8 h-8 animate-pulse" />
            <Waves className="w-4 h-4 mt-1 opacity-50" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 font-sans p-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-6 border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Trạm Chiller Trung Tâm</h1>
                    <p className="text-slate-500 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {user?.building?.name || 'Quản lý toàn bộ hệ thống'}
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
                >
                    <Plus className="w-5 h-5" /> Thêm thiết bị
                </button>
            </div>

            {/* SƠ ĐỒ ĐƯỜNG NƯỚC (SCADA VIEW) */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                <h2 className="text-lg font-bold text-slate-700 mb-8 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" /> Sơ đồ luân chuyển nước hệ thống
                </h2>

                {loading ? (
                    <div className="text-center py-10 text-slate-400">Đang tải dữ liệu thiết bị...</div>
                ) : (
                    <div className="flex items-stretch justify-between min-w-[1000px] gap-4">

                        {/* Khối 1: Tháp giải nhiệt */}
                        <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed">
                            <h3 className="text-center font-semibold text-slate-600 mb-4">Tháp Giải Nhiệt</h3>
                            <div className="flex flex-col gap-3">
                                {towers.length === 0 ? <p className="text-xs text-center text-slate-400">Chưa có thiết bị</p> :
                                    towers.map(d => <DeviceCard key={d.id} device={d} icon={Fan} />)}
                            </div>
                        </div>

                        <FlowArrow />

                        {/* Khối 2: Bơm giải nhiệt */}
                        <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed">
                            <h3 className="text-center font-semibold text-slate-600 mb-4">Bơm Giải Nhiệt</h3>
                            <div className="flex flex-col gap-3">
                                {coolingPumps.length === 0 ? <p className="text-xs text-center text-slate-400">Chưa có thiết bị</p> :
                                    coolingPumps.map(d => <DeviceCard key={d.id} device={d} icon={Power} />)}
                            </div>
                        </div>

                        <FlowArrow />

                        {/* Khối 3: Chiller (Trung tâm) */}
                        <div className="flex-1 bg-blue-50 p-4 rounded-xl border-2 border-blue-100">
                            <h3 className="text-center font-bold text-blue-800 mb-4">CỤM CHILLER</h3>
                            <div className="flex flex-col gap-3">
                                {chillers.length === 0 ? <p className="text-xs text-center text-slate-400">Chưa có thiết bị</p> :
                                    chillers.map(d => <DeviceCard key={d.id} device={d} icon={Snowflake} />)}
                            </div>
                        </div>

                        <FlowArrow />

                        {/* Khối 4: Bơm nước lạnh */}
                        <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed">
                            <h3 className="text-center font-semibold text-slate-600 mb-4">Bơm Nước Lạnh</h3>
                            <div className="flex flex-col gap-3">
                                {coldPumps.length === 0 ? <p className="text-xs text-center text-slate-400">Chưa có thiết bị</p> :
                                    coldPumps.map(d => <DeviceCard key={d.id} device={d} icon={Power} />)}
                            </div>
                        </div>

                        <FlowArrow />

                        {/* Khối 5: Van / Tải tiêu thụ */}
                        <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed">
                            <h3 className="text-center font-semibold text-slate-600 mb-4">Van & Cảm biến</h3>
                            <div className="flex flex-col gap-3">
                                {valves.length === 0 ? <p className="text-xs text-center text-slate-400">Chưa có thiết bị</p> :
                                    valves.map(d => <DeviceCard key={d.id} device={d} icon={Activity} />)}
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* MODAL THÊM THIẾT BỊ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">Thêm thiết bị mới</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddDevice} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Mã thiết bị (Code MQTT) *</label>
                                <input type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="VD: CH-001" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tên hiển thị</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="VD: Chiller trung tâm 1" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Loại thiết bị *</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    <option value="CHILLER">Máy làm lạnh (CHILLER)</option>
                                    <option value="COOLINGTOWER">Tháp giải nhiệt (COOLINGTOWER)</option>
                                    <option value="COOLINGPUMP">Bơm giải nhiệt (COOLINGPUMP)</option>
                                    <option value="COLDPUMP">Bơm nước lạnh (COLDPUMP)</option>
                                    <option value="VALVE">Van cách ly (VALVE)</option>
                                    <option value="PIPE">Cảm biến ống (PIPE)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Vị trí lắp đặt</label>
                                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="VD: Tầng hầm B1" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Hủy</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-colors">Lưu thiết bị</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}