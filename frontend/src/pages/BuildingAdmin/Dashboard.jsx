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

// =============================================
// INJECT GLOBAL STYLES FOR DARK CYBER THEME (Đã đồng bộ Font chữ)
// =============================================
const styleSheet = `
:root {
  --cyber-bg: #050c18;
  --cyber-surface: #070f1f;
  --cyber-card: #0a1628;
  --cyber-card-hover: #0d1d35;
  --cyber-border: #1a3a5c;
  --cyber-border-glow: #1e5f99;
  --cyber-blue: #00aaff;
  --cyber-blue-dim: #0066aa;
  --cyber-blue-glow: rgba(0,170,255,0.15);
  --cyber-green: #00e5a0;
  --cyber-green-dim: #007a54;
  --cyber-green-glow: rgba(0,229,160,0.15);
  --cyber-red: #ff3c5a;
  --cyber-red-dim: #7a1c2a;
  --cyber-red-glow: rgba(255,60,90,0.15);
  --cyber-amber: #ffb800;
  --cyber-text: #c8dff5;
  --cyber-text-dim: #4a6a8a;
  --cyber-text-muted: #2a4a6a;
}

.cyber-dashboard {
  background-color: var(--cyber-bg);
  background-image:
    linear-gradient(rgba(0,170,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,170,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  min-height: 100vh;
}

.cyber-header {
  background: linear-gradient(135deg, #070f1f 0%, #0a1628 100%);
  border: 1px solid var(--cyber-border);
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(0,100,200,0.1), inset 0 1px 0 rgba(255,255,255,0.05);
  position: relative;
  overflow: hidden;
}
.cyber-header::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cyber-blue), transparent);
}

.cyber-title {
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #ffffff;
  text-transform: uppercase;
}

.cyber-badge-live {
  background: rgba(0,229,160,0.1);
  border: 1px solid rgba(0,229,160,0.4);
  color: var(--cyber-green);
  border-radius: 20px;
  padding: 2px 10px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.cyber-btn-toggle {
  background: rgba(0,170,255,0.05);
  border: 1px solid var(--cyber-border);
  border-radius: 8px;
  padding: 4px;
  display: flex;
  gap: 4px;
}

.cyber-btn-view {
  padding: 7px 18px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  color: var(--cyber-text-dim);
  background: transparent;
  display: flex; align-items: center; gap: 6px;
  text-transform: uppercase;
}
.cyber-btn-view:hover { color: var(--cyber-blue); }
.cyber-btn-view.active {
  background: rgba(0,170,255,0.15);
  border: 1px solid var(--cyber-border-glow);
  color: var(--cyber-blue);
  box-shadow: 0 0 12px rgba(0,170,255,0.2);
}

.cyber-btn-add {
  background: linear-gradient(135deg, #0055aa, #0033cc);
  border: 1px solid var(--cyber-blue);
  color: white;
  border-radius: 8px;
  padding: 9px 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  text-transform: uppercase;
  box-shadow: 0 0 20px rgba(0,80,200,0.3);
  transition: all 0.2s;
}
.cyber-btn-add:hover {
  background: linear-gradient(135deg, #0066cc, #0044dd);
  box-shadow: 0 0 30px rgba(0,100,255,0.4);
}

.cyber-scada-wrap {
  background: var(--cyber-surface);
  border: 1px solid var(--cyber-border);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}
.cyber-scada-wrap::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyber-blue), transparent);
  opacity: 0.5;
}

.cyber-flow-line {
  position: absolute;
  top: 50%; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--cyber-blue-dim) 20%, var(--cyber-blue) 50%, var(--cyber-blue-dim) 80%, transparent 100%);
  opacity: 0.3;
  z-index: 0;
}

.cyber-zone {
  flex: 1;
  border-radius: 10px;
  padding: 12px;
  min-height: 280px;
  border: 1px dashed var(--cyber-border);
  background: rgba(0,170,255,0.02);
  position: relative;
  z-index: 1;
}
.cyber-zone-chiller {
  border-color: var(--cyber-blue-dim);
  background: rgba(0,100,255,0.05);
  box-shadow: inset 0 0 30px rgba(0,100,255,0.05);
}
.cyber-zone-pipe {
  border-color: rgba(255,184,0,0.3);
  background: rgba(255,184,0,0.02);
}

.cyber-zone-label {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--cyber-text-dim);
  text-align: center;
  margin-bottom: 14px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.cyber-zone-label::before,
.cyber-zone-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--cyber-border);
  max-width: 24px;
}
.cyber-zone-chiller .cyber-zone-label { color: #5599cc; }
.cyber-zone-pipe .cyber-zone-label { color: rgba(255,184,0,0.5); }

/* DEVICE CARD */
.cyber-card {
  border-radius: 8px;
  padding: 12px;
  border: 1px solid var(--cyber-border);
  background: var(--cyber-card);
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}
.cyber-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--cyber-border);
  transition: all 0.25s;
}
.cyber-card:hover {
  background: var(--cyber-card-hover);
  border-color: var(--cyber-border-glow);
}

.cyber-card.running {
  border-color: var(--cyber-green-dim);
  background: linear-gradient(145deg, #07120e, #0a1a14);
  box-shadow: 0 0 15px rgba(0,229,160,0.07);
}
.cyber-card.running::before { background: var(--cyber-green); opacity: 0.7; }

.cyber-card.fault {
  border-color: var(--cyber-red-dim);
  background: linear-gradient(145deg, #120707, #1a0a0a);
  box-shadow: 0 0 15px rgba(255,60,90,0.1);
}
.cyber-card.fault::before { background: var(--cyber-red); }

.cyber-icon-wrap {
  width: 34px; height: 34px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,170,255,0.1);
  border: 1px solid rgba(0,170,255,0.2);
  color: var(--cyber-blue-dim);
  transition: all 0.25s;
}
.cyber-card.running .cyber-icon-wrap {
  background: rgba(0,229,160,0.12);
  border-color: rgba(0,229,160,0.3);
  color: var(--cyber-green);
  box-shadow: 0 0 12px rgba(0,229,160,0.2);
}
.cyber-card.fault .cyber-icon-wrap {
  background: rgba(255,60,90,0.12);
  border-color: rgba(255,60,90,0.3);
  color: var(--cyber-red);
}

.cyber-device-code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
  color: #c8dff5;
  font-weight: 700;
  letter-spacing: 0.03em;
}
.cyber-device-type {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 9px;
  color: var(--cyber-text-dim);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 600;
}

.cyber-badge-auto {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 9px;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
}
.cyber-badge-auto.auto {
  background: rgba(0,170,255,0.15);
  border: 1px solid rgba(0,170,255,0.3);
  color: var(--cyber-blue);
}
.cyber-badge-auto.manual {
  background: rgba(100,120,140,0.15);
  border: 1px solid rgba(100,120,140,0.3);
  color: #6a8aa0;
}

.cyber-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--cyber-text-muted);
  flex-shrink: 0;
}
.cyber-dot.running {
  background: var(--cyber-green);
  box-shadow: 0 0 6px var(--cyber-green);
}
.cyber-dot.fault {
  background: var(--cyber-red);
  box-shadow: 0 0 6px var(--cyber-red);
  animation: faultPulse 0.8s ease-in-out infinite alternate;
}
@keyframes faultPulse {
  from { box-shadow: 0 0 4px var(--cyber-red); }
  to { box-shadow: 0 0 12px var(--cyber-red), 0 0 20px var(--cyber-red); }
}

.cyber-divider {
  border: none;
  height: 1px;
  background: var(--cyber-border);
  margin: 10px 0;
}

.cyber-metric {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11px;
  color: var(--cyber-text-dim);
  font-weight: 500;
}
.cyber-metric-val {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
  color: var(--cyber-text);
  letter-spacing: 0.02em;
  font-weight: 700;
}
.cyber-card.running .cyber-metric-val { color: #aaffdd; }

.cyber-card-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--cyber-border);
}
.cyber-location {
  font-size: 10px;
  color: var(--cyber-text-muted);
  font-family: ui-monospace, SFMono-Regular, monospace;
  display: flex; align-items: center; gap: 3px;
  letter-spacing: 0.03em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.cyber-action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: var(--cyber-text-muted);
  transition: all 0.2s;
  display: flex; align-items: center;
}
.cyber-action-btn:hover.edit { color: var(--cyber-blue); background: rgba(0,170,255,0.1); }
.cyber-action-btn:hover.del { color: var(--cyber-red); background: rgba(255,60,90,0.1); }

.cyber-flow-arrow {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 0 6px;
  color: rgba(0,170,255,0.25);
  z-index: 1;
  flex-shrink: 0;
}

/* MODAL */
.cyber-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(2,6,15,0.85);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 16px;
}
.cyber-modal {
  background: #070f1f;
  border: 1px solid var(--cyber-border-glow);
  border-radius: 16px;
  width: 100%; max-width: 460px;
  box-shadow: 0 0 60px rgba(0,100,200,0.2), inset 0 1px 0 rgba(255,255,255,0.04);
  overflow: hidden;
  animation: modalIn 0.2s ease;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.cyber-modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid var(--cyber-border);
  background: rgba(0,170,255,0.04);
}
.cyber-modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cyber-modal-close {
  background: none; border: none; cursor: pointer;
  color: var(--cyber-text-dim);
  padding: 4px; border-radius: 6px;
  transition: all 0.2s;
}
.cyber-modal-close:hover { color: var(--cyber-red); background: rgba(255,60,90,0.1); }

.cyber-form { padding: 24px; display: flex; flex-direction: column; gap: 16px; }

.cyber-form-group { display: flex; flex-direction: column; gap: 6px; }
.cyber-form-label {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--cyber-text-dim);
  text-transform: uppercase;
  font-weight: 700;
}
.cyber-input, .cyber-select {
  width: 100%; padding: 12px 14px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--cyber-border);
  border-radius: 8px;
  color: var(--cyber-text);
  font-size: 14px;
  font-weight: 600;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}
.cyber-input:focus, .cyber-select:focus {
  border-color: var(--cyber-blue);
  background: rgba(0,170,255,0.05);
  box-shadow: 0 0 0 3px rgba(0,170,255,0.1);
}
.cyber-select { appearance: none; cursor: pointer; }
.cyber-select option { background: #070f1f; }

.cyber-error {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,60,90,0.08);
  border: 1px solid rgba(255,60,90,0.3);
  border-radius: 8px;
  padding: 12px 14px;
  color: var(--cyber-red);
  font-size: 12px;
  font-weight: 600;
}

.cyber-warning-text {
  font-size: 10px;
  color: var(--cyber-amber);
  margin-top: 4px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  letter-spacing: 0.03em;
}

.cyber-form-actions { display: flex; gap: 12px; padding-top: 8px; }
.cyber-btn-cancel {
  flex: 1; padding: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--cyber-border);
  border-radius: 8px;
  color: var(--cyber-text-dim);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.cyber-btn-cancel:hover { color: var(--cyber-text); border-color: var(--cyber-border-glow); }
.cyber-btn-submit {
  flex: 2; padding: 12px 20px;
  background: linear-gradient(135deg, rgba(0,85,180,0.8), rgba(0,50,150,0.9));
  border: 1px solid var(--cyber-blue);
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(0,100,255,0.2);
  transition: all 0.2s;
}
.cyber-btn-submit:hover {
  background: linear-gradient(135deg, rgba(0,100,220,0.9), rgba(0,70,180,1));
  box-shadow: 0 0 30px rgba(0,120,255,0.35);
}

/* STATS BAR */
.cyber-stats-bar {
  display: flex;
  align-items: stretch;
  background: linear-gradient(135deg, #070f1f 0%, #0a1628 100%);
  border: 1px solid var(--cyber-border);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-bottom: 16px;
}
.cyber-stats-bar::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,170,255,0.4), transparent);
}
.cyber-stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  position: relative;
  transition: background 0.2s;
}
.cyber-stat-item:hover { background: rgba(0,170,255,0.03); }
.cyber-stat-item + .cyber-stat-item::before {
  content: '';
  position: absolute;
  left: 0; top: 20%; bottom: 20%;
  width: 1px;
  background: var(--cyber-border);
}
.cyber-stat-icon {
  width: 46px; height: 46px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  position: relative;
}
.cyber-stat-icon::after {
  content: '';
  position: absolute; inset: -3px;
  border-radius: 50%;
  border: 1px solid currentColor;
  opacity: 0.2;
}
.stat-blue   { background: rgba(0,150,255,0.12); color: #00aaff; box-shadow: 0 0 16px rgba(0,150,255,0.25); }
.stat-green  { background: rgba(0,229,160,0.12); color: #00e5a0; box-shadow: 0 0 16px rgba(0,229,160,0.25); }
.stat-red    { background: rgba(255,60,90,0.12);  color: #ff3c5a; box-shadow: 0 0 16px rgba(255,60,90,0.25); }
.stat-purple { background: rgba(160,80,255,0.12); color: #a050ff; box-shadow: 0 0 16px rgba(160,80,255,0.25); }
.stat-cyan   { background: rgba(0,210,255,0.12);  color: #00d2ff; box-shadow: 0 0 16px rgba(0,210,255,0.25); }
.stat-amber  { background: rgba(255,184,0,0.12);  color: #ffb800; box-shadow: 0 0 16px rgba(255,184,0,0.25); }
.cyber-stat-label {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--cyber-text-dim);
  text-transform: uppercase;
  margin-bottom: 4px;
  font-weight: 700;
}
.cyber-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
  letter-spacing: 0.02em;
}
.cyber-stat-value span {
  font-size: 13px;
  font-weight: 600;
  color: var(--cyber-text-dim);
  margin-left: 2px;
}
.cyber-stat-sub {
  font-size: 11px;
  color: var(--cyber-text-muted);
  margin-top: 3px;
  letter-spacing: 0.01em;
}
.cyber-stat-progress {
  height: 3px;
  background: var(--cyber-border);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}
.cyber-stat-progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--cyber-green);
  box-shadow: 0 0 6px var(--cyber-green);
  transition: width 0.6s ease;
}

/* LOADING */
.cyber-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 0;
  gap: 16px;
  color: var(--cyber-text-dim);
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-weight: 700;
}

.cyber-empty {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 10px;
  text-align: center;
  color: var(--cyber-text-muted);
  letter-spacing: 0.08em;
  padding: 20px 0;
  font-weight: 700;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin { animation: spin 3s linear infinite; }
.spin-fast { animation: spin 1.2s linear infinite; }
`;

// Inject styles once
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
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('2D');
    const [error, setError] = useState('');
    const [lastUpdate, setLastUpdate] = useState(null);

    const [formData, setFormData] = useState({
        code: '', name: '', type: 'CHILLER', location: ''
    });

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

    useEffect(() => { fetchDevices(); }, []);

    useEffect(() => {
        if (!socket) return;
        const handleDeviceUpdate = (payload) => {
            console.log("⚡ Dashboard nhận update:", payload.code);
            setDevices(prevDevices => prevDevices.map(device => {
                if (device.code.toLowerCase() === payload.code.toLowerCase()) {
                    return { ...device, latest_state: payload.latest_state, last_updated: new Date() };
                }
                return device;
            }));
            setLastUpdate(new Date());
        };
        socket.on("device-update", handleDeviceUpdate);
        return () => { socket.off("device-update", handleDeviceUpdate); };
    }, [socket]);

    const handleAddDevice = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await addDeviceApi({ ...formData, buildingId: user.building?.id || 1 });
            setIsModalOpen(false);
            toast.success(`Đã thêm thiết bị ${formData.code}!`);
            setFormData({ code: '', name: '', type: 'CHILLER', location: '' });
            fetchDevices();
        } catch (err) {
            setError(err.message);
            toast.error("Thêm thiết bị thất bại!");
        }
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: null, code: '', name: '', location: '' });

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
            fetchDevices();
            toast.success(`Đã cập nhật thiết bị ${editFormData.code}!`);
        } catch (err) {
            setError(err.message);
            toast.error("Cập nhật thất bại!");
        }
    };

    const handleDeleteDevice = (id, code) => {
        toast.custom((t) => (
            <div style={{
                background: '#070f1f',
                border: '1px solid rgba(255,60,90,0.4)',
                borderRadius: '14px',
                boxShadow: '0 0 40px rgba(255,60,90,0.15)',
                maxWidth: '420px',
                width: '100%',
                overflow: 'hidden',
                fontFamily: "'IBM Plex Sans', sans-serif",
                opacity: t.visible ? 1 : 0,
                transition: 'opacity 0.2s'
            }}>
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '14px', background: 'rgba(255,60,90,0.05)' }}>
                    <div style={{ background: 'rgba(255,60,90,0.15)', border: '1px solid rgba(255,60,90,0.3)', borderRadius: '10px', padding: '10px', color: '#ff3c5a', flexShrink: 0 }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'IBM Plex Sans', sans-serif" }}>Xác nhận xóa thiết bị</div>
                        <div style={{ color: '#4a6a8a', fontSize: '12px', marginTop: '8px', lineHeight: 1.6 }}>
                            Xóa vĩnh viễn <span style={{ color: '#c8dff5', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{code}</span>? Toàn bộ nhật ký liên quan sẽ bị xóa.
                        </div>
                    </div>
                </div>
                <div style={{ background: '#050c18', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #1a3a5c' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{ padding: '8px 18px', borderRadius: '7px', border: '1px solid #1a3a5c', background: 'transparent', color: '#4a6a8a', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '12px', letterSpacing: '0.04em', cursor: 'pointer', textTransform: 'uppercase' }}>Hủy bỏ</button>
                    <button onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            await deleteDeviceApi(id);
                            fetchDevices();
                            toast.success(`Đã xóa thiết bị ${code}!`);
                        } catch (err) {
                            toast.error(err.message || "Lỗi khi xóa thiết bị");
                        }
                    }} style={{ padding: '8px 18px', borderRadius: '7px', border: '1px solid #ff3c5a', background: 'rgba(255,60,90,0.15)', color: '#ff3c5a', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.04em', cursor: 'pointer', textTransform: 'uppercase' }}>Xóa ngay</button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const towers = devices.filter(d => d.type === 'COOLINGTOWER');
    const coolingPumps = devices.filter(d => d.type === 'COOLINGPUMP');
    const chillers = devices.filter(d => d.type === 'CHILLER');
    const coldPumps = devices.filter(d => d.type === 'COLDPUMP');
    const pipes = devices.filter(d => d.type === 'PIPE');
    const valves = devices.filter(d => d.type === 'VALVE');

    // ==========================================
    // DEVICE CARD — DARK CYBER THEME
    // ==========================================
    const DeviceCard = ({ device, icon: Icon }) => {
        const state = device.latest_state || {};
        const hasFault = state.fault === 1;
        const isRunning =
            device.type === 'VALVE' ? state.state === 1 :
                device.type === 'PIPE' ? state.flow_status === 1 :
                    state.power === 1;
        const isAuto = (state['auto-mode'] === 1) || (state.auto_mode === 1);

        const cardClass = `cyber-card ${hasFault ? 'fault' : isRunning ? 'running' : ''}`;

        return (
            <div className={cardClass}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div className="cyber-icon-wrap">
                        <Icon size={16} className={isRunning && !hasFault && device.type !== 'PIPE' ? 'spin' : ''} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                        <div className={`cyber-dot ${hasFault ? 'fault' : isRunning ? 'running' : ''}`} />
                        {device.type !== 'PIPE' && device.type !== 'VALVE' && (
                            <span className={`cyber-badge-auto ${isAuto ? 'auto' : 'manual'}`}>
                                {isAuto ? 'AUTO' : 'MAN'}
                            </span>
                        )}
                    </div>
                </div>

                <div>
                    <div className="cyber-device-code">{device.code}</div>
                    <div className="cyber-device-type">{device.type}</div>
                </div>

                <div className="cyber-divider" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {device.type.includes('PUMP') && (
                        <div className="cyber-metric">
                            <span>Tốc độ chạy</span>
                            <span className="cyber-metric-val">{state.speed || 0} Hz</span>
                        </div>
                    )}
                    {device.type === 'PIPE' && (
                        <>
                            <div className="cyber-metric">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Thermometer size={10} style={{ color: '#ff9955' }} /> Nhiệt độ
                                </span>
                                <span className="cyber-metric-val">{state.temperature || '--'}°C</span>
                            </div>
                            <div className="cyber-metric">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Gauge size={10} style={{ color: '#55aaff' }} /> Áp suất
                                </span>
                                <span className="cyber-metric-val">{state.pressure || '--'} bar</span>
                            </div>
                            <div className="cyber-metric">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Droplets size={10} style={{ color: '#55ddff' }} /> Lưu lượng
                                </span>
                                <span className="cyber-metric-val">{state.flow_rate || '--'} m³</span>
                            </div>
                        </>
                    )}
                    {device.type === 'VALVE' && (
                        <div className="cyber-metric">
                            <span>Trạng thái</span>
                            <span className="cyber-metric-val" style={{ color: state.state === 1 ? 'var(--cyber-green)' : 'var(--cyber-text-dim)', fontSize: 10 }}>
                                {state.state === 1 ? 'MỞ HOÀN TOÀN' : 'ĐANG ĐÓNG'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="cyber-card-footer">
                    <div className="cyber-location">
                        <MapPin size={9} /> {device.location || 'N/A'}
                    </div>
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                        <button className="cyber-action-btn edit" onClick={() => handleOpenEdit(device)} title="Chỉnh sửa">
                            <Edit size={11} />
                        </button>
                        <button className="cyber-action-btn del" onClick={() => handleDeleteDevice(device.id, device.code)} title="Xóa">
                            <Trash2 size={11} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ==========================================
    // STATS BAR — computed from devices
    // ==========================================
    const onlineDevices = devices.filter(d => {
        const s = d.latest_state || {};
        if (d.type === 'VALVE') return s.state === 1;
        if (d.type === 'PIPE') return s.flow_status === 1;
        return s.power === 1;
    });
    const faultDevices = devices.filter(d => (d.latest_state || {}).fault === 1);

    // Lấy nhiệt độ, lưu lượng, áp suất từ pipe devices
    const pipeDevicesData = devices.filter(d => d.type === 'PIPE' && d.latest_state);
    const avgTemp = pipeDevicesData.length
        ? (pipeDevicesData.reduce((sum, d) => sum + (parseFloat(d.latest_state?.temperature) || 0), 0) / pipeDevicesData.length).toFixed(2)
        : null;
    const totalFlow = pipeDevicesData.length
        ? pipeDevicesData.reduce((sum, d) => sum + (parseFloat(d.latest_state?.flow_rate) || 0), 0).toFixed(2)
        : null;
    const avgPressure = pipeDevicesData.length
        ? (pipeDevicesData.reduce((sum, d) => sum + (parseFloat(d.latest_state?.pressure) || 0), 0) / pipeDevicesData.length).toFixed(2)
        : null;

    const onlinePct = devices.length > 0 ? Math.round((onlineDevices.length / devices.length) * 100) : 0;

    const StatsBar = () => (
        <div className="cyber-stats-bar">
            {/* Tổng thiết bị */}
            <div className="cyber-stat-item">
                <div className="cyber-stat-icon stat-blue">
                    <Activity size={20} />
                </div>
                <div>
                    <div className="cyber-stat-label">Tổng thiết bị</div>
                    <div className="cyber-stat-value">{devices.length}</div>
                    <div className="cyber-stat-sub">Thiết bị đang hoạt động</div>
                </div>
            </div>

            {/* Thiết bị online */}
            <div className="cyber-stat-item">
                <div className="cyber-stat-icon stat-green">
                    <Power size={20} />
                </div>
                <div style={{ flex: 1 }}>
                    <div className="cyber-stat-label">Thiết bị Online</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <div className="cyber-stat-value">{onlineDevices.length}</div>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: 'var(--cyber-green)' }}>{onlinePct}%</span>
                    </div>
                    <div className="cyber-stat-progress">
                        <div className="cyber-stat-progress-fill" style={{ width: `${onlinePct}%` }} />
                    </div>
                </div>
            </div>

            {/* Cảnh báo */}
            <div className="cyber-stat-item">
                <div className={`cyber-stat-icon ${faultDevices.length > 0 ? 'stat-red' : 'stat-blue'}`}>
                    <AlertCircle size={20} />
                </div>
                <div>
                    <div className="cyber-stat-label">Cảnh báo</div>
                    <div className="cyber-stat-value" style={{ color: faultDevices.length > 0 ? 'var(--cyber-red)' : '#fff' }}>
                        {faultDevices.length}
                    </div>
                    <div className="cyber-stat-sub">{faultDevices.length === 0 ? 'Không có cảnh báo' : `${faultDevices.length} thiết bị lỗi`}</div>
                </div>
            </div>

            {/* Nhiệt độ TB */}
            <div className="cyber-stat-item">
                <div className="cyber-stat-icon stat-purple">
                    <Thermometer size={20} />
                </div>
                <div>
                    <div className="cyber-stat-label">Nhiệt độ TB</div>
                    <div className="cyber-stat-value">
                        {avgTemp !== null ? avgTemp : '--'}<span>°C</span>
                    </div>
                    <div className="cyber-stat-sub">Nước lạnh hiện tại</div>
                </div>
            </div>

            {/* Lưu lượng TB */}
            <div className="cyber-stat-item">
                <div className="cyber-stat-icon stat-cyan">
                    <Droplets size={20} />
                </div>
                <div>
                    <div className="cyber-stat-label">Lưu lượng TB</div>
                    <div className="cyber-stat-value">
                        {totalFlow !== null ? totalFlow : '--'}<span>m³/h</span>
                    </div>
                    <div className="cyber-stat-sub">Lưu lượng nước</div>
                </div>
            </div>

            {/* Áp suất TB */}
            <div className="cyber-stat-item">
                <div className="cyber-stat-icon stat-amber">
                    <Gauge size={20} />
                </div>
                <div>
                    <div className="cyber-stat-label">Áp suất TB</div>
                    <div className="cyber-stat-value">
                        {avgPressure !== null ? avgPressure : '--'}<span>bar</span>
                    </div>
                    <div className="cyber-stat-sub">Áp suất hệ thống</div>
                </div>
            </div>
        </div>
    );

    const FlowArrow = () => (
        <div className="cyber-flow-arrow">
            <ArrowRightLeft size={18} style={{ animation: 'faultPulse 2s ease-in-out infinite alternate' }} />
        </div>
    );

    // ==========================================
    // RENDER
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
                        <h1 className="cyber-title" style={{ fontSize: '18px', margin: 0 }}>
                            Hệ Thống Chiller Trung Tâm
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--cyber-text-dim)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'IBM Plex Mono', monospace" }}>
                                <MapPin size={10} /> {user?.building?.name || 'Local Station'}
                            </span>
                            <span className="cyber-badge-live">
                                <RefreshCw size={9} className="spin-fast" /> LIVE
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="cyber-btn-toggle">
                        <button className={`cyber-btn-view ${viewMode === '2D' ? 'active' : ''}`} onClick={() => setViewMode('2D')}>
                            <Layers size={13} strokeWidth={2.5} /> SCADA 2D
                        </button>
                        <button className={`cyber-btn-view ${viewMode === '3D' ? 'active' : ''}`} onClick={() => setViewMode('3D')}>
                            <Box size={13} strokeWidth={2.5} /> 3D TWIN
                        </button>
                    </div>

                    <button className="cyber-btn-add" onClick={() => setIsModalOpen(true)}>
                        <Plus size={14} /> THÊM THIẾT BỊ
                    </button>
                </div>
            </div>

            {/* STATS BAR */}
            <StatsBar />

            {/* SCADA BOARD */}
            <div className="cyber-scada-wrap" style={{ padding: '20px' }}>
                <div className="cyber-flow-line" />

                {loading ? (
                    <div className="cyber-loading">
                        <RefreshCw size={36} style={{ color: 'var(--cyber-blue)', animation: 'spin 1.2s linear infinite' }} />
                        ĐANG ĐỒNG BỘ DỮ LIỆU...
                    </div>
                ) : viewMode === '2D' ? (
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: '1280px', gap: '4px', position: 'relative', zIndex: 1 }}>

                            {/* ZONE: COOLING TOWER */}
                            <div className="cyber-zone" style={{ flex: 1 }}>
                                <div className="cyber-zone-label">Heat Rejection / Tower</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {towers.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : towers.map(d => <DeviceCard key={d.id} device={d} icon={Fan} />)}
                                </div>
                            </div>

                            <FlowArrow />

                            {/* ZONE: CONDENSER PUMPS */}
                            <div className="cyber-zone" style={{ flex: 1 }}>
                                <div className="cyber-zone-label">Condenser Pumps</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {coolingPumps.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : coolingPumps.map(d => <DeviceCard key={d.id} device={d} icon={Power} />)}
                                </div>
                            </div>

                            <FlowArrow />

                            {/* ZONE: CHILLER PLANT */}
                            <div className="cyber-zone cyber-zone-chiller" style={{ flex: 1 }}>
                                <div className="cyber-zone-label">Chiller Plant</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {chillers.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : chillers.map(d => <DeviceCard key={d.id} device={d} icon={Snowflake} />)}
                                </div>
                            </div>

                            <FlowArrow />

                            {/* ZONE: CHILLED WATER PUMPS */}
                            <div className="cyber-zone" style={{ flex: 1 }}>
                                <div className="cyber-zone-label">Chilled Water Pumps</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {coldPumps.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : coldPumps.map(d => <DeviceCard key={d.id} device={d} icon={Power} />)}
                                </div>
                            </div>

                            <FlowArrow />

                            {/* ZONE: PIPES */}
                            <div className="cyber-zone cyber-zone-pipe" style={{ flex: 1 }}>
                                <div className="cyber-zone-label">Telemetry / Pipes</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {pipes.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : pipes.map(d => <DeviceCard key={d.id} device={d} icon={Droplets} />)}
                                </div>
                            </div>

                            <FlowArrow />

                            {/* ZONE: VALVES */}
                            <div className="cyber-zone" style={{ flex: 1 }}>
                                <div className="cyber-zone-label">Isolation Valves</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {valves.length === 0 ? <p className="cyber-empty">— TRỐNG —</p> : valves.map(d => <DeviceCard key={d.id} device={d} icon={Activity} />)}
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div style={{ width: '100%' }}>
                        <Building3D devices={devices} />
                    </div>
                )}
            </div>

            {/* ===== MODAL THÊM THIẾT BỊ ===== */}
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
                                <label className="cyber-form-label">Mã định danh (Code MQTT)</label>
                                <input className="cyber-input" type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="Ví dụ: PIPE-001" />
                            </div>
                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Tên thiết bị</label>
                                <input className="cyber-input" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ví dụ: Cảm biến hồi tổng" />
                            </div>
                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Phân loại hệ thống</label>
                                <select className="cyber-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="CHILLER">Máy làm lạnh (CHILLER)</option>
                                    <option value="COOLINGTOWER">Tháp giải nhiệt (COOLINGTOWER)</option>
                                    <option value="COOLINGPUMP">Bơm giải nhiệt (COOLINGPUMP)</option>
                                    <option value="COLDPUMP">Bơm nước lạnh (COLDPUMP)</option>
                                    <option value="VALVE">Van cách ly (VALVE)</option>
                                    <option value="PIPE">Cảm biến đường ống (PIPE)</option>
                                </select>
                            </div>
                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Vị trí lắp đặt vật lý</label>
                                <input className="cyber-input" type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Ví dụ: Tầng hầm B2" />
                            </div>
                            <div className="cyber-form-actions">
                                <button type="button" className="cyber-btn-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
                                <button type="submit" className="cyber-btn-submit">Lưu thiết bị</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== MODAL CHỈNH SỬA THIẾT BỊ ===== */}
            {isEditModalOpen && (
                <div className="cyber-modal-overlay">
                    <div className="cyber-modal">
                        <div className="cyber-modal-header">
                            <span className="cyber-modal-title">Chỉnh sửa thiết bị</span>
                            <button className="cyber-modal-close" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateDevice} className="cyber-form">
                            {error && <div className="cyber-error"><AlertCircle size={14} />{error}</div>}

                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Mã thiết bị <span style={{ color: 'var(--cyber-red)' }}>*</span></label>
                                <input className="cyber-input" type="text" required value={editFormData.code} onChange={e => setEditFormData({ ...editFormData, code: e.target.value })} />
                                <div className="cyber-warning-text">⚠ Đổi mã này yêu cầu cập nhật lại MQTT tại trạm phát.</div>
                            </div>
                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Tên hiển thị</label>
                                <input className="cyber-input" type="text" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
                            </div>
                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Vị trí lắp đặt vật lý</label>
                                <input className="cyber-input" type="text" value={editFormData.location} onChange={e => setEditFormData({ ...editFormData, location: e.target.value })} />
                            </div>
                            <div className="cyber-form-actions">
                                <button type="button" className="cyber-btn-cancel" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
                                <button type="submit" className="cyber-btn-submit">Cập nhật</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}