import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import { getDevicesApi, addDeviceApi, deleteDeviceApi, updateDeviceApi } from '../../services/device.service';
import { getSubsystemsApi, addSubsystemApi, deleteSubsystemApi } from '../../services/subsystem.service';
import Building3D from './Building3D';
import {
    Building2, Plus, Fan, Snowflake, Power, MapPin,
    X, ArrowRightLeft, AlertCircle, Activity, Thermometer, Gauge,
    Droplets, RefreshCw, AlertTriangle, Layers, Box, Trash2, Edit,
    Lightbulb, Wind
} from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================
// INJECT GLOBAL STYLES FOR DARK CYBER THEME
// =============================================
const styleSheet = `
:root {
  --cyber-bg: #050c18; --cyber-surface: #070f1f; --cyber-card: #0a1628; --cyber-card-hover: #0d1d35;
  --cyber-border: #1a3a5c; --cyber-border-glow: #1e5f99; --cyber-blue: #00aaff; --cyber-blue-dim: #0066aa;
  --cyber-green: #00e5a0; --cyber-green-dim: #007a54; --cyber-red: #ff3c5a; --cyber-red-dim: #7a1c2a;
  --cyber-amber: #ffb800; --cyber-text: #c8dff5; --cyber-text-dim: #4a6a8a; --cyber-text-muted: #2a4a6a;
}
.cyber-dashboard { background-color: var(--cyber-bg); background-image: linear-gradient(rgba(0,170,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,170,255,0.03) 1px, transparent 1px); background-size: 40px 40px; min-height: 100vh; }
.cyber-header { background: linear-gradient(135deg, #070f1f 0%, #0a1628 100%); border: 1px solid var(--cyber-border); border-radius: 12px; box-shadow: 0 0 30px rgba(0,100,200,0.1), inset 0 1px 0 rgba(255,255,255,0.05); position: relative; overflow: hidden; }
.cyber-header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--cyber-blue), transparent); }
.cyber-title { font-weight: 700; letter-spacing: 0.04em; color: #ffffff; text-transform: uppercase; }
.cyber-badge-live { background: rgba(0,229,160,0.1); border: 1px solid rgba(0,229,160,0.4); color: var(--cyber-green); border-radius: 20px; padding: 2px 10px; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; display: inline-flex; align-items: center; gap: 5px; }
.cyber-btn-toggle { background: rgba(0,170,255,0.05); border: 1px solid var(--cyber-border); border-radius: 8px; padding: 4px; display: flex; gap: 4px; }
.cyber-btn-view { padding: 7px 18px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; cursor: pointer; border: none; transition: all 0.2s; color: var(--cyber-text-dim); background: transparent; display: flex; align-items: center; gap: 6px; text-transform: uppercase; }
.cyber-btn-view:hover { color: var(--cyber-blue); }
.cyber-btn-view.active { background: rgba(0,170,255,0.15); border: 1px solid var(--cyber-border-glow); color: var(--cyber-blue); box-shadow: 0 0 12px rgba(0,170,255,0.2); }
.cyber-btn-add { background: linear-gradient(135deg, #0055aa, #0033cc); border: 1px solid var(--cyber-blue); color: white; border-radius: 8px; padding: 9px 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; cursor: pointer; display: flex; align-items: center; gap: 6px; text-transform: uppercase; box-shadow: 0 0 20px rgba(0,80,200,0.3); transition: all 0.2s; }
.cyber-btn-add:hover { background: linear-gradient(135deg, #0066cc, #0044dd); box-shadow: 0 0 30px rgba(0,100,255,0.4); }
.cyber-scada-wrap { background: var(--cyber-surface); border: 1px solid var(--cyber-border); border-radius: 12px; position: relative; overflow: hidden; }
.cyber-scada-wrap::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--cyber-blue), transparent); opacity: 0.5; }
.cyber-flow-line { position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent 0%, var(--cyber-blue-dim) 20%, var(--cyber-blue) 50%, var(--cyber-blue-dim) 80%, transparent 100%); opacity: 0.3; z-index: 0; }
.cyber-zone { flex: 1; border-radius: 10px; padding: 12px; min-height: 280px; border: 1px dashed var(--cyber-border); background: rgba(0,170,255,0.02); position: relative; z-index: 1; }
.cyber-zone-chiller { border-color: var(--cyber-blue-dim); background: rgba(0,100,255,0.05); box-shadow: inset 0 0 30px rgba(0,100,255,0.05); }
.cyber-zone-pipe { border-color: rgba(255,184,0,0.3); background: rgba(255,184,0,0.02); }
.cyber-zone-label { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--cyber-text-dim); text-align: center; margin-bottom: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; }
.cyber-zone-label::before, .cyber-zone-label::after { content: ''; flex: 1; height: 1px; background: var(--cyber-border); max-width: 24px; }
.cyber-zone-chiller .cyber-zone-label { color: #5599cc; }
.cyber-zone-pipe .cyber-zone-label { color: rgba(255,184,0,0.5); }
.cyber-card { border-radius: 8px; padding: 12px; border: 1px solid var(--cyber-border); background: var(--cyber-card); transition: all 0.25s; position: relative; overflow: hidden; }
.cyber-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--cyber-border); transition: all 0.25s; }
.cyber-card:hover { background: var(--cyber-card-hover); border-color: var(--cyber-border-glow); }
.cyber-card.running { border-color: var(--cyber-green-dim); background: linear-gradient(145deg, #07120e, #0a1a14); box-shadow: 0 0 15px rgba(0,229,160,0.07); }
.cyber-card.running::before { background: var(--cyber-green); opacity: 0.7; }
.cyber-card.fault { border-color: var(--cyber-red-dim); background: linear-gradient(145deg, #120707, #1a0a0a); box-shadow: 0 0 15px rgba(255,60,90,0.1); }
.cyber-card.fault::before { background: var(--cyber-red); }
.cyber-icon-wrap { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(0,170,255,0.1); border: 1px solid rgba(0,170,255,0.2); color: var(--cyber-blue-dim); transition: all 0.25s; }
.cyber-card.running .cyber-icon-wrap { background: rgba(0,229,160,0.12); border-color: rgba(0,229,160,0.3); color: var(--cyber-green); box-shadow: 0 0 12px rgba(0,229,160,0.2); }
.cyber-card.fault .cyber-icon-wrap { background: rgba(255,60,90,0.12); border-color: rgba(255,60,90,0.3); color: var(--cyber-red); }
.cyber-device-code { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; color: #c8dff5; font-weight: 700; letter-spacing: 0.03em; }
.cyber-device-type { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 9px; color: var(--cyber-text-dim); letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; }
.cyber-badge-auto { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 9px; letter-spacing: 0.06em; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
.cyber-badge-auto.auto { background: rgba(0,170,255,0.15); border: 1px solid rgba(0,170,255,0.3); color: var(--cyber-blue); }
.cyber-badge-auto.manual { background: rgba(100,120,140,0.15); border: 1px solid rgba(100,120,140,0.3); color: #6a8aa0; }
.cyber-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--cyber-text-muted); flex-shrink: 0; }
.cyber-dot.running { background: var(--cyber-green); box-shadow: 0 0 6px var(--cyber-green); }
.cyber-dot.fault { background: var(--cyber-red); box-shadow: 0 0 6px var(--cyber-red); animation: faultPulse 0.8s ease-in-out infinite alternate; }
@keyframes faultPulse { from { box-shadow: 0 0 4px var(--cyber-red); } to { box-shadow: 0 0 12px var(--cyber-red), 0 0 20px var(--cyber-red); } }
.cyber-divider { border: none; height: 1px; background: var(--cyber-border); margin: 10px 0; }
.cyber-metric { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--cyber-text-dim); font-weight: 500; }
.cyber-metric-val { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; color: var(--cyber-text); letter-spacing: 0.02em; font-weight: 700; }
.cyber-card.running .cyber-metric-val { color: #aaffdd; }
.cyber-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--cyber-border); }
.cyber-location { font-size: 10px; color: var(--cyber-text-muted); font-family: ui-monospace, SFMono-Regular, monospace; display: flex; align-items: center; gap: 3px; letter-spacing: 0.03em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.cyber-action-btn { background: transparent; border: none; cursor: pointer; padding: 4px; border-radius: 4px; color: var(--cyber-text-muted); transition: all 0.2s; display: flex; align-items: center; }
.cyber-action-btn:hover.edit { color: var(--cyber-blue); background: rgba(0,170,255,0.1); }
.cyber-action-btn:hover.del { color: var(--cyber-red); background: rgba(255,60,90,0.1); }
.cyber-flow-arrow { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 6px; color: rgba(0,170,255,0.25); z-index: 1; flex-shrink: 0; }
.cyber-modal-overlay { position: fixed; inset: 0; background: rgba(2,6,15,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 16px; }
.cyber-modal { background: #070f1f; border: 1px solid var(--cyber-border-glow); border-radius: 16px; width: 100%; max-width: 460px; box-shadow: 0 0 60px rgba(0,100,200,0.2), inset 0 1px 0 rgba(255,255,255,0.04); overflow: hidden; animation: modalIn 0.2s ease; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.cyber-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid var(--cyber-border); background: rgba(0,170,255,0.04); }
.cyber-modal-title { font-size: 16px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.04em; }
.cyber-modal-close { background: none; border: none; cursor: pointer; color: var(--cyber-text-dim); padding: 4px; border-radius: 6px; transition: all 0.2s; }
.cyber-modal-close:hover { color: var(--cyber-red); background: rgba(255,60,90,0.1); }
.cyber-form { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.cyber-form-group { display: flex; flex-direction: column; gap: 6px; }
.cyber-form-label { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; letter-spacing: 0.1em; color: var(--cyber-text-dim); text-transform: uppercase; font-weight: 700; }
.cyber-input, .cyber-select { width: 100%; padding: 12px 14px; background: rgba(0,0,0,0.3); border: 1px solid var(--cyber-border); border-radius: 8px; color: var(--cyber-text); font-size: 14px; font-weight: 600; outline: none; transition: all 0.2s; box-sizing: border-box; }
.cyber-input:focus, .cyber-select:focus { border-color: var(--cyber-blue); background: rgba(0,170,255,0.05); box-shadow: 0 0 0 3px rgba(0,170,255,0.1); }
.cyber-select { appearance: none; cursor: pointer; }
.cyber-select option { background: #070f1f; }
.cyber-error { display: flex; align-items: center; gap: 8px; background: rgba(255,60,90,0.08); border: 1px solid rgba(255,60,90,0.3); border-radius: 8px; padding: 12px 14px; color: var(--cyber-red); font-size: 12px; font-weight: 600; }
.cyber-warning-text { font-size: 10px; color: var(--cyber-amber); margin-top: 4px; font-family: ui-monospace, SFMono-Regular, monospace; letter-spacing: 0.03em; }
.cyber-form-actions { display: flex; gap: 12px; padding-top: 8px; }
.cyber-btn-cancel { flex: 1; padding: 12px; background: rgba(255,255,255,0.04); border: 1px solid var(--cyber-border); border-radius: 8px; color: var(--cyber-text-dim); font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
.cyber-btn-cancel:hover { color: var(--cyber-text); border-color: var(--cyber-border-glow); }
.cyber-btn-submit { flex: 2; padding: 12px 20px; background: linear-gradient(135deg, rgba(0,85,180,0.8), rgba(0,50,150,0.9)); border: 1px solid var(--cyber-blue); border-radius: 8px; color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; box-shadow: 0 0 20px rgba(0,100,255,0.2); transition: all 0.2s; }
.cyber-btn-submit:hover { background: linear-gradient(135deg, rgba(0,100,220,0.9), rgba(0,70,180,1)); box-shadow: 0 0 30px rgba(0,120,255,0.35); }
.cyber-stats-bar { display: flex; align-items: stretch; background: linear-gradient(135deg, #070f1f 0%, #0a1628 100%); border: 1px solid var(--cyber-border); border-radius: 12px; overflow: hidden; position: relative; margin-bottom: 16px; }
.cyber-stats-bar::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,170,255,0.4), transparent); }
.cyber-stat-item { flex: 1; display: flex; align-items: center; gap: 14px; padding: 16px 20px; position: relative; transition: background 0.2s; }
.cyber-stat-item:hover { background: rgba(0,170,255,0.03); }
.cyber-stat-item + .cyber-stat-item::before { content: ''; position: absolute; left: 0; top: 20%; bottom: 20%; width: 1px; background: var(--cyber-border); }
.cyber-stat-icon { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; }
.cyber-stat-icon::after { content: ''; position: absolute; inset: -3px; border-radius: 50%; border: 1px solid currentColor; opacity: 0.2; }
.stat-blue   { background: rgba(0,150,255,0.12); color: #00aaff; box-shadow: 0 0 16px rgba(0,150,255,0.25); }
.stat-green  { background: rgba(0,229,160,0.12); color: #00e5a0; box-shadow: 0 0 16px rgba(0,229,160,0.25); }
.stat-red    { background: rgba(255,60,90,0.12);  color: #ff3c5a; box-shadow: 0 0 16px rgba(255,60,90,0.25); }
.stat-purple { background: rgba(160,80,255,0.12); color: #a050ff; box-shadow: 0 0 16px rgba(160,80,255,0.25); }
.stat-cyan   { background: rgba(0,210,255,0.12);  color: #00d2ff; box-shadow: 0 0 16px rgba(0,210,255,0.25); }
.stat-amber  { background: rgba(255,184,0,0.12);  color: #ffb800; box-shadow: 0 0 16px rgba(255,184,0,0.25); }
.cyber-stat-label { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; letter-spacing: 0.1em; color: var(--cyber-text-dim); text-transform: uppercase; margin-bottom: 4px; font-weight: 700; }
.cyber-stat-value { font-size: 24px; font-weight: 700; color: #ffffff; line-height: 1; letter-spacing: 0.02em; }
.cyber-stat-value span { font-size: 13px; font-weight: 600; color: var(--cyber-text-dim); margin-left: 2px; }
.cyber-stat-sub { font-size: 11px; color: var(--cyber-text-muted); margin-top: 3px; letter-spacing: 0.01em; }
.cyber-stat-progress { height: 3px; background: var(--cyber-border); border-radius: 2px; margin-top: 6px; overflow: hidden; }
.cyber-stat-progress-fill { height: 100%; border-radius: 2px; background: var(--cyber-green); box-shadow: 0 0 6px var(--cyber-green); transition: width 0.6s ease; }
.cyber-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; gap: 16px; color: var(--cyber-text-dim); font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 700; }
.cyber-empty { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; text-align: center; color: var(--cyber-text-muted); letter-spacing: 0.08em; padding: 20px 0; font-weight: 700; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.spin { animation: spin 3s linear infinite; }
.spin-fast { animation: spin 1.2s linear infinite; }
.cyber-section-title {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px; font-weight: 700; color: var(--cyber-blue);
  text-transform: uppercase; letter-spacing: 0.1em;
  margin-bottom: 16px; padding-left: 10px;
  border-left: 3px solid var(--cyber-blue);
  display: flex; align-items: center; gap: 8px;
}
.cyber-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  align-items: start;
}
`;

if (typeof document !== 'undefined' && !document.getElementById('cyber-scada-styles')) {
    const el = document.createElement('style');
    el.id = 'cyber-scada-styles';
    el.textContent = styleSheet;
    document.head.appendChild(el);
}

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const { socket } = useContext(NotificationContext);

    const [devices, setDevices] = useState([]);
    const [subsystems, setSubsystems] = useState([]);
    const [selectedSubsystemId, setSelectedSubsystemId] = useState(null);
    const [isAddSubsystemModalOpen, setIsAddSubsystemModalOpen] = useState(false);
    const [subsystemFormData, setSubsystemFormData] = useState({ name: '', code: '' });

    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('2D');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        code: '', name: '', type: 'CHILLER', location: '', subsystemId: ''
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: null, code: '', name: '', location: '' });

    // HÀM TẢI DỮ LIỆU
    const loadData = async () => {
        setLoading(true);
        try {
            const [devData, subData] = await Promise.all([
                getDevicesApi(),
                getSubsystemsApi()
            ]);
            setDevices(devData);
            setSubsystems(subData);

            if (subData.length > 0) {
                const chillerSys = subData.find(s => s.code.includes('CHILLER') || s.name.toLowerCase().includes('chiller'));
                if (chillerSys) {
                    setSelectedSubsystemId(chillerSys.id);
                } else {
                    setSelectedSubsystemId(subData[0].id);
                }
            }
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            setError("Không thể kết nối đến máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (!socket) return;
        const handleDeviceUpdate = (payload) => {
            setDevices(prevDevices => prevDevices.map(device => {
                if (device.code.toLowerCase() === payload.code.toLowerCase()) {
                    return { ...device, latest_state: payload.latest_state, last_updated: new Date() };
                }
                return device;
            }));
        };
        socket.on("device-update", handleDeviceUpdate);
        return () => { socket.off("device-update", handleDeviceUpdate); };
    }, [socket]);

    // HÀM XÓA PHÂN HỆ
    const handleDeleteSubsystem = (id, name) => {
        toast.custom((t) => (
            <div style={{
                background: '#070f1f', border: '1px solid rgba(255,60,90,0.4)', borderRadius: '14px',
                boxShadow: '0 0 40px rgba(255,60,90,0.15)', maxWidth: '420px', width: '100%',
                padding: '20px', fontFamily: "'IBM Plex Sans', sans-serif", opacity: t.visible ? 1 : 0, transition: 'opacity 0.2s'
            }}>
                <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ color: '#ff3c5a' }}><AlertTriangle size={24} /></div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 700 }}>Xóa phân hệ {name}?</div>
                        <div style={{ color: '#4a6a8a', fontSize: '12px', marginTop: '4px' }}>
                            Tất cả thiết bị bên trong phân hệ này sẽ bị xóa vĩnh viễn!
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{ color: '#4a6a8a', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Hủy</button>
                    <button onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            await deleteSubsystemApi(id);
                            const remainSub = subsystems.filter(s => s.id !== id);
                            if (remainSub.length > 0) setSelectedSubsystemId(remainSub[0].id);
                            else setSelectedSubsystemId(null);
                            loadData();
                            toast.success(`Đã xóa phân hệ ${name}`);
                        } catch (err) { toast.error("Lỗi khi xóa phân hệ"); }
                    }} style={{ background: 'rgba(255,60,90,0.2)', color: '#ff3c5a', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ff3c5a', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                        Xóa ngay
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const handleAddSubsystem = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await addSubsystemApi({ ...subsystemFormData, buildingId: user.building?.id || 1 });
            setIsAddSubsystemModalOpen(false);
            toast.success(`Đã thêm phân hệ ${subsystemFormData.name}!`);
            setSubsystemFormData({ name: '', code: '' });
            loadData();
        } catch (err) {
            setError(err.message);
            toast.error("Thêm phân hệ thất bại!");
        }
    };

    const handleOpenAddDeviceModal = () => {
        const activeSubsystem = subsystems.find(s => s.id === selectedSubsystemId);
        const subCode = activeSubsystem?.code || '';

        let defaultType = 'CHILLER';
        if (subCode.includes('LIGHT')) defaultType = 'LIGHT';
        else if (subCode.includes('FAN')) defaultType = 'FAN';
        else if (subCode.includes('PUMP') && !subCode.includes('CHILLER')) defaultType = 'DOMESTIC_PUMP';

        setFormData({
            code: '', name: '', location: '', type: defaultType,
            subsystemId: selectedSubsystemId
        });
        setIsModalOpen(true);
    };

    const handleAddDevice = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.subsystemId) {
            setError("Vui lòng chọn phân hệ cho thiết bị này!");
            return;
        }
        try {
            await addDeviceApi({
                ...formData,
                buildingId: user.building?.id || 1,
                subsystemId: parseInt(formData.subsystemId)
            });
            setIsModalOpen(false);
            toast.success(`Đã thêm thiết bị ${formData.code}!`);
            getDevicesApi().then(setDevices);
        } catch (err) {
            setError(err.message);
            toast.error("Thêm thiết bị thất bại!");
        }
    };

    const handleOpenEdit = (device) => {
        setEditFormData({ id: device.id, code: device.code, name: device.name || '', location: device.location || '' });
        setIsEditModalOpen(true);
    };

    const handleUpdateDevice = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await updateDeviceApi(editFormData.id, { code: editFormData.code, name: editFormData.name, location: editFormData.location });
            setIsEditModalOpen(false);
            getDevicesApi().then(setDevices);
            toast.success(`Đã cập nhật thiết bị ${editFormData.code}!`);
        } catch (err) {
            setError(err.message);
            toast.error("Cập nhật thất bại!");
        }
    };

    const handleDeleteDevice = (id, code) => {
        toast.custom((t) => (
            <div style={{ background: '#070f1f', border: '1px solid rgba(255,60,90,0.4)', borderRadius: '14px', boxShadow: '0 0 40px rgba(255,60,90,0.15)', maxWidth: '420px', width: '100%', overflow: 'hidden', fontFamily: "'IBM Plex Sans', sans-serif", opacity: t.visible ? 1 : 0, transition: 'opacity 0.2s' }}>
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '14px', background: 'rgba(255,60,90,0.05)' }}>
                    <div style={{ background: 'rgba(255,60,90,0.15)', border: '1px solid rgba(255,60,90,0.3)', borderRadius: '10px', padding: '10px', color: '#ff3c5a', flexShrink: 0 }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Xác nhận xóa thiết bị</div>
                        <div style={{ color: '#4a6a8a', fontSize: '12px', marginTop: '8px', lineHeight: 1.6 }}>
                            Xóa vĩnh viễn <span style={{ color: '#c8dff5', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{code}</span>? Toàn bộ nhật ký liên quan sẽ bị xóa.
                        </div>
                    </div>
                </div>
                <div style={{ background: '#050c18', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #1a3a5c' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{ padding: '8px 18px', borderRadius: '7px', border: '1px solid #1a3a5c', background: 'transparent', color: '#4a6a8a', fontWeight: 600, fontSize: '12px', cursor: 'pointer', textTransform: 'uppercase' }}>Hủy bỏ</button>
                    <button onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            await deleteDeviceApi(id);
                            getDevicesApi().then(setDevices);
                            toast.success(`Đã xóa thiết bị ${code}!`);
                        } catch (err) { toast.error(err.message || "Lỗi khi xóa thiết bị"); }
                    }} style={{ padding: '8px 18px', borderRadius: '7px', border: '1px solid #ff3c5a', background: 'rgba(255,60,90,0.15)', color: '#ff3c5a', fontWeight: 700, fontSize: '12px', cursor: 'pointer', textTransform: 'uppercase' }}>Xóa ngay</button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    // LỌC THIẾT BỊ
    const currentDevices = devices.filter(d => d.subsystemId === selectedSubsystemId);
    const selectedSub = subsystems.find(s => s.id === selectedSubsystemId);
    const isChillerPlant = selectedSub?.code?.includes('CHILLER') || selectedSub?.name?.toLowerCase().includes('chiller');

    // MẢNG CHO SCADA 2D CHILLER
    const towers = currentDevices.filter(d => d.type === 'COOLINGTOWER');
    const coolingPumps = currentDevices.filter(d => d.type === 'COOLINGPUMP');
    const chillers = currentDevices.filter(d => d.type === 'CHILLER');
    const coldPumps = currentDevices.filter(d => d.type === 'COLDPUMP');
    const pipes = currentDevices.filter(d => d.type === 'PIPE');
    const valves = currentDevices.filter(d => d.type === 'VALVE');
    const ahus = currentDevices.filter(d => d.type === 'AHU');

    // MẢNG CHO CÁC PHÂN HỆ KHÁC
    const lights = currentDevices.filter(d => d.type === 'LIGHT');
    const dimmers = currentDevices.filter(d => d.type === 'LIGHT_DIMMER');
    const fans = currentDevices.filter(d => d.type === 'FAN');
    const domPumps = currentDevices.filter(d => d.type === 'DOMESTIC_PUMP');

    // ==========================================
    // THẺ THIẾT BỊ DÀNH CHO SCADA
    // ==========================================
    const DeviceCard = ({ device, icon: Icon }) => {
        const state = device.latest_state || {};
        const hasFault = state.fault === 1;
        const isRunning = device.type === 'VALVE' ? state.state === 1 : device.type === 'PIPE' ? state.flow_status === 1 : state.power === 1;
        const isAuto = (state['auto-mode'] === 1) || (state.auto_mode === 1);
        const cardClass = `cyber-card ${hasFault ? 'fault' : isRunning ? 'running' : ''}`;

        return (
            <div className={cardClass}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div className="cyber-icon-wrap"><Icon size={16} className={isRunning && !hasFault && device.type !== 'PIPE' ? 'spin' : ''} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                        <div className={`cyber-dot ${hasFault ? 'fault' : isRunning ? 'running' : ''}`} />
                        {device.type !== 'PIPE' && device.type !== 'VALVE' && (<span className={`cyber-badge-auto ${isAuto ? 'auto' : 'manual'}`}>{isAuto ? 'AUTO' : 'MAN'}</span>)}
                    </div>
                </div>
                <div style={{ marginBottom: '6px' }}>
                    <div className="cyber-device-code" style={{ fontSize: '13px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={device.name || device.type}>
                        {device.name || device.type}
                    </div>
                    <div className="cyber-device-type" style={{ color: 'var(--cyber-blue)', marginTop: '4px' }}>
                        Mã: {device.code}
                    </div>
                </div>
                <div className="cyber-divider" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {device.type.includes('PUMP') && (<div className="cyber-metric"><span>Tốc độ chạy</span><span className="cyber-metric-val">{state.speed || 0} Hz</span></div>)}
                    {device.type === 'PIPE' && (
                        <>
                            <div className="cyber-metric"><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Thermometer size={10} style={{ color: '#ff9955' }} /> Nhiệt độ</span><span className="cyber-metric-val">{state.temperature || '--'}°C</span></div>
                            <div className="cyber-metric"><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Gauge size={10} style={{ color: '#55aaff' }} /> Áp suất</span><span className="cyber-metric-val">{state.pressure || '--'} bar</span></div>
                            <div className="cyber-metric"><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Droplets size={10} style={{ color: '#55ddff' }} /> Lưu lượng</span><span className="cyber-metric-val">{state.flow_rate || '--'} m³</span></div>
                        </>
                    )}
                    {device.type === 'VALVE' && (<div className="cyber-metric"><span>Trạng thái</span><span className="cyber-metric-val" style={{ color: state.state === 1 ? 'var(--cyber-green)' : 'var(--cyber-text-dim)', fontSize: 10 }}>{state.state === 1 ? 'MỞ HOÀN TOÀN' : 'ĐANG ĐÓNG'}</span></div>)}

                    {/* --- HIỂN THỊ THÔNG SỐ CHO AHU --- */}
                    {device.type === 'AHU' && (
                        <>
                            <div className="cyber-metric"><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Thermometer size={10} style={{ color: '#ff9955' }} /> Nhiệt độ phòng</span><span className="cyber-metric-val">{state.temperature || '--'}°C</span></div>
                            <div className="cyber-metric"><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={10} style={{ color: '#55aaff' }} /> Tần số quạt</span><span className="cyber-metric-val">{state.frequency || '--'} Hz</span></div>
                        </>
                    )}
                </div>
                <div className="cyber-card-footer">
                    <div className="cyber-location"><MapPin size={9} /> {device.location || 'N/A'}</div>
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                        <button className="cyber-action-btn edit" onClick={() => handleOpenEdit(device)} title="Chỉnh sửa"><Edit size={11} /></button>
                        <button className="cyber-action-btn del" onClick={() => handleDeleteDevice(device.id, device.code)} title="Xóa"><Trash2 size={11} /></button>
                    </div>
                </div>
            </div>
        );
    };

    // ==========================================
    // THẺ THIẾT BỊ ĐỘNG (LIGHT, PUMP, FAN...)
    // ==========================================
    const GenericDeviceCard = ({ device }) => {
        const state = device.latest_state || {};
        let Icon = Activity;
        if (device.type === 'LIGHT' || device.type === 'LIGHT_DIMMER') Icon = Lightbulb;
        else if (device.type === 'FAN') Icon = Wind;
        else if (device.type === 'DOMESTIC_PUMP') Icon = Droplets;

        const isRunning = state.power === 1 || state.state === 1;
        const hasFault = state.fault === 1;

        return (
            <div className={`cyber-card ${hasFault ? 'fault' : isRunning ? 'running' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div className="cyber-icon-wrap"><Icon size={16} className={isRunning && !hasFault && device.type === 'FAN' ? 'spin' : ''} /></div>
                    <div className={`cyber-dot ${hasFault ? 'fault' : isRunning ? 'running' : ''}`} />
                </div>
                <div style={{ marginBottom: '6px' }}>
                    <div className="cyber-device-code" style={{ fontSize: '13px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={device.name || device.type}>
                        {device.name || device.type}
                    </div>
                    <div className="cyber-device-type" style={{ color: 'var(--cyber-blue)', marginTop: '4px' }}>
                        Mã: {device.code}
                    </div>
                </div>
                <div className="cyber-divider" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(state).map(([key, value]) => {
                        // Ẩn bớt các key thừa không cần hiển thị
                        if (['code', 'fault'].includes(key)) return null;

                        // ==========================================
                        // LOGIC FORMAT DỮ LIỆU ĐẸP MẮT (DỊCH JSON)
                        // ==========================================
                        let displayValue = value;
                        let valueColor = 'var(--cyber-text)'; // Màu chữ mặc định

                        // 1. Dịch trạng thái On/Off
                        if (key === 'state' || key === 'power') {
                            displayValue = value === 1 ? 'ON' : 'OFF';
                            valueColor = value === 1 ? 'var(--cyber-green)' : 'var(--cyber-text-dim)';
                        }
                        // 2. Dịch chế độ Auto/Man
                        else if (key === 'mode' || key === 'auto-mode' || key === 'auto_mode') {
                            displayValue = (value === 1 || value === 'AUTO') ? 'AUTO' : 'MANUAL';
                            valueColor = (value === 1 || value === 'AUTO') ? 'var(--cyber-blue)' : 'var(--cyber-text-dim)';
                        }
                        // 3. Gắn đơn vị cho thông số
                        else if (key === 'brightness' || key === 'fan_speed') {
                            displayValue = `${value} %`;
                        } else if (key === 'speed') {
                            displayValue = `${value} Hz`;
                            valueColor = '#ffb800'; // Màu cam cho tốc độ
                        } else if (key === 'temperature' || key === 'air_temperature') {
                            displayValue = `${value} °C`;
                            valueColor = '#ff9955';
                        } else if (key === 'air_pressure') {
                            displayValue = `${value} Pa`;
                            valueColor = '#55aaff';
                        }

                        // Đổi tên key cho thân thiện
                        const displayKey = key.replace(/_/g, ' ');

                        return (
                            <div key={key} className="cyber-metric">
                                <span style={{ textTransform: 'capitalize' }}>{displayKey}</span>
                                <span className="cyber-metric-val" style={{ color: valueColor }}>
                                    {displayValue}
                                </span>
                            </div>
                        );
                    })}

                    {Object.keys(state).length <= 2 && (<div className="cyber-metric"><span style={{ opacity: 0.5 }}>No data</span></div>)}
                </div>
                <div className="cyber-card-footer">
                    <div className="cyber-location"><MapPin size={9} /> {device.location || 'N/A'}</div>
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                        <button className="cyber-action-btn edit" onClick={() => handleOpenEdit(device)} title="Chỉnh sửa"><Edit size={11} /></button>
                        <button className="cyber-action-btn del" onClick={() => handleDeleteDevice(device.id, device.code)} title="Xóa"><Trash2 size={11} /></button>
                    </div>
                </div>
            </div>
        );
    };

    // ==========================================
    // STATS BAR
    // ==========================================
    const StatsBar = () => {
        const onlineDevices = currentDevices.filter(d => {
            const s = d.latest_state || {};
            if (d.type === 'VALVE') return s.state === 1;
            if (d.type === 'PIPE') return s.flow_status === 1;
            return s.power === 1 || s.state === 1;
        });
        const faultDevices = currentDevices.filter(d => (d.latest_state || {}).fault === 1);
        const pipeDevicesData = currentDevices.filter(d => d.type === 'PIPE' && d.latest_state);

        const avgTemp = pipeDevicesData.length ? (pipeDevicesData.reduce((sum, d) => sum + (parseFloat(d.latest_state?.temperature) || 0), 0) / pipeDevicesData.length).toFixed(2) : null;
        const totalFlow = pipeDevicesData.length ? pipeDevicesData.reduce((sum, d) => sum + (parseFloat(d.latest_state?.flow_rate) || 0), 0).toFixed(2) : null;
        const avgPressure = pipeDevicesData.length ? (pipeDevicesData.reduce((sum, d) => sum + (parseFloat(d.latest_state?.pressure) || 0), 0) / pipeDevicesData.length).toFixed(2) : null;
        const onlinePct = currentDevices.length > 0 ? Math.round((onlineDevices.length / currentDevices.length) * 100) : 0;

        return (
            <div className="cyber-stats-bar">
                <div className="cyber-stat-item"><div className="cyber-stat-icon stat-blue"><Activity size={20} /></div><div><div className="cyber-stat-label">Tổng thiết bị</div><div className="cyber-stat-value">{currentDevices.length}</div><div className="cyber-stat-sub">Trong phân hệ này</div></div></div>
                <div className="cyber-stat-item"><div className="cyber-stat-icon stat-green"><Power size={20} /></div><div style={{ flex: 1 }}><div className="cyber-stat-label">Đang hoạt động</div><div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}><div className="cyber-stat-value">{onlineDevices.length}</div><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: 'var(--cyber-green)' }}>{onlinePct}%</span></div><div className="cyber-stat-progress"><div className="cyber-stat-progress-fill" style={{ width: `${onlinePct}%` }} /></div></div></div>
                <div className="cyber-stat-item"><div className={`cyber-stat-icon ${faultDevices.length > 0 ? 'stat-red' : 'stat-blue'}`}><AlertCircle size={20} /></div><div><div className="cyber-stat-label">Cảnh báo</div><div className="cyber-stat-value" style={{ color: faultDevices.length > 0 ? 'var(--cyber-red)' : '#fff' }}>{faultDevices.length}</div><div className="cyber-stat-sub">{faultDevices.length === 0 ? 'Hoạt động ổn định' : `${faultDevices.length} thiết bị lỗi`}</div></div></div>
                {isChillerPlant && (
                    <>
                        <div className="cyber-stat-item"><div className="cyber-stat-icon stat-purple"><Thermometer size={20} /></div><div><div className="cyber-stat-label">Nhiệt độ TB</div><div className="cyber-stat-value">{avgTemp !== null ? avgTemp : '--'}<span>°C</span></div></div></div>
                        <div className="cyber-stat-item"><div className="cyber-stat-icon stat-cyan"><Droplets size={20} /></div><div><div className="cyber-stat-label">Lưu lượng TB</div><div className="cyber-stat-value">{totalFlow !== null ? totalFlow : '--'}<span>m³/h</span></div></div></div>
                        <div className="cyber-stat-item"><div className="cyber-stat-icon stat-amber"><Gauge size={20} /></div><div><div className="cyber-stat-label">Áp suất TB</div><div className="cyber-stat-value">{avgPressure !== null ? avgPressure : '--'}<span>bar</span></div></div></div>
                    </>
                )}
            </div>
        );
    };

    const FlowArrow = () => (<div className="cyber-flow-arrow"><ArrowRightLeft size={18} style={{ animation: 'faultPulse 2s ease-in-out infinite alternate' }} /></div>);

    // ==========================================
    // RENDER MAIN
    // ==========================================
    return (
        <div className="cyber-dashboard" style={{ padding: '20px' }}>

            {/* HEADER */}
            <div className="cyber-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0055cc, #003388)', border: '1px solid rgba(0,170,255,0.4)', borderRadius: '10px', padding: '10px', boxShadow: '0 0 20px rgba(0,100,255,0.3)' }}>
                        <Building2 size={22} style={{ color: '#55aaff' }} />
                    </div>
                    <div>
                        <h1 className="cyber-title" style={{ fontSize: '18px', margin: 0, textTransform: 'uppercase' }}>
                            {user?.building?.name || 'HỆ THỐNG BMS TRUNG TÂM'}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--cyber-text-dim)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'IBM Plex Mono', monospace" }}>
                                <MapPin size={10} /> {user?.building?.address || 'Chưa cập nhật địa chỉ'}
                            </span>
                            <span className="cyber-badge-live"><RefreshCw size={9} className="spin-fast" /> LIVE</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="cyber-btn-toggle">
                        <button className={`cyber-btn-view ${viewMode === '2D' ? 'active' : ''}`} onClick={() => setViewMode('2D')}><Layers size={13} strokeWidth={2.5} /> SCADA 2D</button>
                        <button className={`cyber-btn-view ${viewMode === '3D' ? 'active' : ''}`} onClick={() => setViewMode('3D')}><Box size={13} strokeWidth={2.5} /> 3D TWIN</button>
                    </div>

                    <button className="cyber-btn-add" onClick={() => setIsAddSubsystemModalOpen(true)}>
                        <Plus size={14} /> THÊM PHÂN HỆ
                    </button>
                </div>
            </div>

            {/* THANH TABS CHỌN PHÂN HỆ VÀ XÓA PHÂN HỆ */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                {subsystems.map(sys => {
                    const isSelected = selectedSubsystemId === sys.id;
                    return (
                        <div key={sys.id} style={{ position: 'relative', display: 'flex' }}>
                            <button
                                onClick={() => { setSelectedSubsystemId(sys.id); setViewMode('2D'); }}
                                style={{
                                    padding: '10px 16px', paddingRight: '36px',
                                    background: isSelected ? 'rgba(0,170,255,0.15)' : 'rgba(10,22,40,0.8)',
                                    border: `1px solid ${isSelected ? 'var(--cyber-blue)' : 'var(--cyber-border)'}`,
                                    borderRadius: '10px',
                                    color: isSelected ? '#fff' : 'var(--cyber-text-dim)',
                                    fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    cursor: 'pointer', transition: 'all 0.3s',
                                    boxShadow: isSelected ? '0 0 15px rgba(0,170,255,0.2)' : 'none'
                                }}
                            >
                                {sys.code.includes('CHILLER') ? <Snowflake size={14} /> :
                                    sys.code.includes('LIGHT') ? <Lightbulb size={14} /> :
                                        sys.code.includes('FAN') ? <Wind size={14} /> : <Droplets size={14} />}
                                {sys.name}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSubsystem(sys.id, sys.name); }}
                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(255,60,90,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#ff3c5a'}
                                onMouseLeave={(e) => e.currentTarget.style.color = isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(255,60,90,0.5)'}
                                title="Xóa phân hệ này"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <StatsBar />

            {/* VÙNG SCADA BÊN DƯỚI */}
            <div className="cyber-scada-wrap" style={{ padding: '20px' }}>

                {/* NÚT THÊM THIẾT BỊ NẰM TRONG PHÂN HỆ */}
                {subsystems.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                        <h3 className="cyber-title" style={{ fontSize: '15px', color: 'var(--cyber-blue)' }}>PHÂN LOẠI THIẾT BỊ TRONG PHÂN HỆ</h3>
                        <button className="cyber-btn-view" onClick={handleOpenAddDeviceModal} style={{ color: '#00e5a0', borderColor: 'rgba(0,229,160,0.3)', background: 'rgba(0,229,160,0.05)' }}>
                            <Plus size={14} /> THÊM THIẾT BỊ VÀO ĐÂY
                        </button>
                    </div>
                )}

                {/* LOGIC HIỂN THỊ ĐÃ ĐƯỢC CHỈNH SỬA TOÀN DIỆN */}
                {loading ? (
                    <div className="cyber-loading"><RefreshCw size={36} style={{ color: 'var(--cyber-blue)', animation: 'spin 1.2s linear infinite' }} />ĐANG ĐỒNG BỘ DỮ LIỆU...</div>
                ) : viewMode === '3D' ? (
                    /* LUÔN TRUYỀN TOÀN BỘ DEVICES VÀO 3D TWIN ĐỂ XEM TỔNG THỂ */
                    <div style={{ width: '100%' }}><Building3D devices={devices} /></div>
                ) : isChillerPlant ? (
                    /* GIAO DIỆN SCADA 2D DÀNH RIÊNG CHO CHILLER */
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: '1500px', gap: '4px', position: 'relative', zIndex: 1, paddingBottom: '10px' }}>
                            <div className="cyber-zone" style={{ flex: 1 }}><div className="cyber-zone-label">COOLINGTOWER</div><div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{towers.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : towers.map(d => <DeviceCard key={d.id} device={d} icon={Fan} />)}</div></div>
                            <FlowArrow />
                            <div className="cyber-zone" style={{ flex: 1 }}><div className="cyber-zone-label">COOLING PUMPS</div><div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{coolingPumps.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : coolingPumps.map(d => <DeviceCard key={d.id} device={d} icon={Power} />)}</div></div>
                            <FlowArrow />
                            <div className="cyber-zone cyber-zone-chiller" style={{ flex: 1 }}><div className="cyber-zone-label">CHILLER</div><div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{chillers.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : chillers.map(d => <DeviceCard key={d.id} device={d} icon={Snowflake} />)}</div></div>
                            <FlowArrow />
                            <div className="cyber-zone" style={{ flex: 1 }}><div className="cyber-zone-label">COLDPUMP</div><div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{coldPumps.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : coldPumps.map(d => <DeviceCard key={d.id} device={d} icon={Power} />)}</div></div>
                            <FlowArrow />
                            <div className="cyber-zone cyber-zone-pipe" style={{ flex: 1 }}><div className="cyber-zone-label">PIPE</div><div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{pipes.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : pipes.map(d => <DeviceCard key={d.id} device={d} icon={Droplets} />)}</div></div>
                            <FlowArrow />
                            <div className="cyber-zone" style={{ flex: 1 }}><div className="cyber-zone-label">VALVE</div><div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{valves.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : valves.map(d => <DeviceCard key={d.id} device={d} icon={Activity} />)}</div></div>
                            <FlowArrow />
                            <div className="cyber-zone" style={{ flex: 1.2 }}><div className="cyber-zone-label">Air Handling Units (AHU)</div><div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{ahus.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : ahus.map(d => <DeviceCard key={d.id} device={d} icon={Wind} />)}</div></div>
                        </div>
                    </div>
                ) : selectedSub?.code === 'LIGHTING_SYSTEM' ? (
                    /* GIAO DIỆN SCADA: HỆ THỐNG CHIẾU SÁNG (NẰM NGANG, FIX WIDTH) */
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '30px', position: 'relative', zIndex: 1, paddingBottom: '10px' }}>
                            {/* Cột 1: Đèn On/Off - Rộng 380px không dãn */}
                            <div className="cyber-zone" style={{ width: '380px', flex: 'none' }}>
                                <div className="cyber-zone-label">Đèn On/Off (Standard)</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{lights.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : lights.map(d => <GenericDeviceCard key={d.id} device={d} />)}</div>
                            </div>

                            {/* Cột 2: Đèn Dimmer - Rộng 380px không dãn */}
                            <div className="cyber-zone" style={{ width: '380px', flex: 'none' }}>
                                <div className="cyber-zone-label">Đèn Dimmer (Dimmable)</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{dimmers.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : dimmers.map(d => <GenericDeviceCard key={d.id} device={d} />)}</div>
                            </div>
                        </div>
                    </div>
                ) : selectedSub?.code === 'FAN_SYSTEM' ? (
                    /* GIAO DIỆN SCADA: HỆ THỐNG THÔNG GIÓ (NẰM NGANG, FIX WIDTH) */
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '30px', position: 'relative', zIndex: 1, paddingBottom: '10px' }}>
                            <div className="cyber-zone" style={{ width: '380px', flex: 'none' }}>
                                <div className="cyber-zone-label">Quạt thông gió (Ventilation Fans)</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{fans.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : fans.map(d => <GenericDeviceCard key={d.id} device={d} />)}</div>
                            </div>
                        </div>
                    </div>
                ) : selectedSub?.code === 'DOMESTIC_PUMP_SYSTEM' ? (
                    /* GIAO DIỆN SCADA: BƠM SINH HOẠT (NẰM NGANG, FIX WIDTH) */
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '30px', position: 'relative', zIndex: 1, paddingBottom: '10px' }}>
                            <div className="cyber-zone" style={{ width: '380px', flex: 'none' }}>
                                <div className="cyber-zone-label">Bơm sinh hoạt (Domestic Pumps)</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{domPumps.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : domPumps.map(d => <GenericDeviceCard key={d.id} device={d} />)}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* BACKUP AN TOÀN */
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
                        {currentDevices.length === 0 ? <p className="cyber-empty" style={{ width: '100%' }}>— CHƯA KHAI BÁO THIẾT BỊ TRONG PHÂN HỆ NÀY —</p> : currentDevices.map(d => <div style={{ width: '350px' }}><GenericDeviceCard key={d.id} device={d} /></div>)}
                    </div>
                )}
            </div>

            {/* MODAL THÊM PHÂN HỆ CHUẨN */}
            {isAddSubsystemModalOpen && (
                <div className="cyber-modal-overlay">
                    <div className="cyber-modal">
                        <div className="cyber-modal-header">
                            <span className="cyber-modal-title">Khởi tạo Phân hệ mới</span>
                            <button className="cyber-modal-close" onClick={() => setIsAddSubsystemModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddSubsystem} className="cyber-form">
                            {error && <div className="cyber-error"><AlertCircle size={14} />{error}</div>}

                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Chọn hệ thống quản lý <span style={{ color: 'var(--cyber-red)' }}>*</span></label>
                                <select
                                    className="cyber-select"
                                    required
                                    value={subsystemFormData.code}
                                    onChange={(e) => {
                                        const selectedCode = e.target.value;
                                        const selectedName = e.target.options[e.target.selectedIndex].getAttribute('data-name');
                                        setSubsystemFormData({ code: selectedCode, name: selectedName });
                                    }}
                                >
                                    <option value="" disabled>-- Bấm để chọn phân hệ --</option>
                                    <option value="CHILLER_PLANT" data-name="Hệ thống Chiller" disabled={subsystems.some(s => s.code === 'CHILLER_PLANT')}>❄️ Hệ thống Chiller {subsystems.some(s => s.code === 'CHILLER_PLANT') ? '(Đã thêm)' : ''}</option>
                                    <option value="LIGHTING_SYSTEM" data-name="Hệ thống Chiếu sáng" disabled={subsystems.some(s => s.code === 'LIGHTING_SYSTEM')}>💡 Hệ thống Chiếu sáng {subsystems.some(s => s.code === 'LIGHTING_SYSTEM') ? '(Đã thêm)' : ''}</option>
                                    <option value="FAN_SYSTEM" data-name="Hệ thống Thông gió" disabled={subsystems.some(s => s.code === 'FAN_SYSTEM')}>💨 Hệ thống Thông gió {subsystems.some(s => s.code === 'FAN_SYSTEM') ? '(Đã thêm)' : ''}</option>
                                    <option value="DOMESTIC_PUMP_SYSTEM" data-name="Hệ thống Bơm sinh hoạt" disabled={subsystems.some(s => s.code === 'DOMESTIC_PUMP_SYSTEM')}>💧 Hệ thống Bơm sinh hoạt {subsystems.some(s => s.code === 'DOMESTIC_PUMP_SYSTEM') ? '(Đã thêm)' : ''}</option>
                                </select>
                            </div>
                            <div className="cyber-warning-text" style={{ marginTop: '-5px', marginBottom: '10px' }}>Hệ thống sẽ tự động gán mã định danh chuẩn để đồng bộ với thiết bị.</div>
                            <div className="cyber-form-actions">
                                <button type="button" className="cyber-btn-cancel" onClick={() => setIsAddSubsystemModalOpen(false)}>Hủy</button>
                                <button type="submit" className="cyber-btn-submit">Lưu Phân hệ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL THÊM THIẾT BỊ CHUẨN */}
            {isModalOpen && (
                <div className="cyber-modal-overlay">
                    <div className="cyber-modal">
                        <div className="cyber-modal-header">
                            <span className="cyber-modal-title">Khai báo thiết bị</span>
                            <button className="cyber-modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddDevice} className="cyber-form">
                            {error && <div className="cyber-error"><AlertCircle size={14} />{error}</div>}

                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Thuộc phân hệ</label>
                                <input className="cyber-input" type="text" disabled value={subsystems.find(s => s.id === formData.subsystemId)?.name || ''} style={{ opacity: 0.6, cursor: 'not-allowed', borderStyle: 'dashed' }} />
                            </div>

                            <div className="cyber-form-group"><label className="cyber-form-label">Mã định danh (Code MQTT)</label><input className="cyber-input" type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="Ví dụ: LIGHT_01" /></div>
                            <div className="cyber-form-group"><label className="cyber-form-label">Tên thiết bị</label><input className="cyber-input" type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ví dụ: Đèn hành lang T1" /></div>

                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Loại thiết bị</label>
                                <select className="cyber-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    {isChillerPlant && (
                                        <optgroup label="Hệ Thống Chiller">
                                            <option value="CHILLER">Máy làm lạnh (CHILLER)</option>
                                            <option value="COOLINGTOWER">Tháp giải nhiệt (COOLINGTOWER)</option>
                                            <option value="COOLINGPUMP">Bơm giải nhiệt (COOLINGPUMP)</option>
                                            <option value="COLDPUMP">Bơm nước lạnh (COLDPUMP)</option>
                                            <option value="VALVE">Van cách ly (VALVE)</option>
                                            <option value="PIPE">Cảm biến đường ống (PIPE)</option>
                                            <option value="AHU">Bộ xử lý không khí (AHU)</option>
                                        </optgroup>
                                    )}
                                    {subsystems.find(s => s.id === formData.subsystemId)?.code.includes('LIGHT') && (
                                        <optgroup label="Hệ Thống Chiếu Sáng"><option value="LIGHT">Đèn On/Off (LIGHT)</option><option value="LIGHT_DIMMER">Đèn Dimmer (LIGHT_DIMMER)</option></optgroup>
                                    )}
                                    {subsystems.find(s => s.id === formData.subsystemId)?.code.includes('FAN') && (
                                        <optgroup label="Hệ Thống Thông Gió"><option value="FAN">Quạt thông gió (FAN)</option></optgroup>
                                    )}
                                    {subsystems.find(s => s.id === formData.subsystemId)?.code.includes('PUMP') && !isChillerPlant && (
                                        <optgroup label="Hệ Thống Cấp Nước"><option value="DOMESTIC_PUMP">Bơm sinh hoạt (DOMESTIC_PUMP)</option></optgroup>
                                    )}
                                </select>
                            </div>

                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Vị trí tầng lắp đặt (Location)</label>
                                <select
                                    className="cyber-select"
                                    required
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                >
                                    <option value="" disabled>-- Chọn tầng trong không gian 3D --</option>
                                    <option value="Tầng hầm">Tầng hầm (B1)</option>
                                    <option value="Tầng 1">Tầng 1</option>
                                    <option value="Tầng 2">Tầng 2</option>
                                    <option value="Tầng 3">Tầng 3</option>
                                    <option value="Tầng 4">Tầng 4</option>
                                    <option value="Tầng thượng">Tầng thượng / Mái</option>
                                </select>
                            </div>
                            <div className="cyber-form-actions"><button type="button" className="cyber-btn-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button><button type="submit" className="cyber-btn-submit">Lưu thiết bị</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL SỬA */}
            {isEditModalOpen && (
                <div className="cyber-modal-overlay">
                    <div className="cyber-modal">
                        <div className="cyber-modal-header"><span className="cyber-modal-title">Chỉnh sửa thiết bị</span><button className="cyber-modal-close" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button></div>
                        <form onSubmit={handleUpdateDevice} className="cyber-form">
                            {error && <div className="cyber-error"><AlertCircle size={14} />{error}</div>}
                            <div className="cyber-form-group"><label className="cyber-form-label">Mã thiết bị <span style={{ color: 'var(--cyber-red)' }}>*</span></label><input className="cyber-input" type="text" required value={editFormData.code} onChange={e => setEditFormData({ ...editFormData, code: e.target.value })} /><div className="cyber-warning-text">⚠ Đổi mã này yêu cầu cập nhật lại MQTT tại trạm phát.</div></div>
                            <div className="cyber-form-group"><label className="cyber-form-label">Tên hiển thị</label><input className="cyber-input" type="text" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} /></div>
                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Vị trí lắp đặt vật lý (Location)</label>
                                <select
                                    className="cyber-select"
                                    required
                                    value={editFormData.location}
                                    onChange={e => setEditFormData({ ...editFormData, location: e.target.value })}
                                >
                                    <option value="" disabled>-- Chọn tầng trong không gian 3D --</option>
                                    <option value="Tầng hầm">Tầng hầm (B1)</option>
                                    <option value="Tầng 1">Tầng 1</option>
                                    <option value="Tầng 2">Tầng 2</option>
                                    <option value="Tầng 3">Tầng 3</option>
                                    <option value="Tầng 4">Tầng 4</option>
                                    <option value="Tầng thượng">Tầng thượng / Mái</option>
                                </select>
                            </div>
                            <div className="cyber-form-actions"><button type="button" className="cyber-btn-cancel" onClick={() => setIsEditModalOpen(false)}>Hủy</button><button type="submit" className="cyber-btn-submit">Cập nhật</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}