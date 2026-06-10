import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBuildingByIdApi } from '../../services/building.service';
import { addManagerToBuildingApi } from '../../services/auth.service'; // Import API mới
import { NotificationContext } from '../../context/NotificationContext';
import {
    ArrowLeft, Building2, MapPin, UserCircle, Activity,
    Snowflake, Fan, Power, Droplets, AlertTriangle, Server, Wind, Users, Plus, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BuildingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { socket } = useContext(NotificationContext);

    const [building, setBuilding] = useState(null);
    const [loading, setLoading] = useState(true);

    // STATE CHO MODAL QUẢN LÝ
    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [managerForm, setManagerForm] = useState({ fullName: '', username: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tách hàm fetchDetail ra để gọi lại sau khi thêm người
    const fetchDetail = async () => {
        try {
            const data = await getBuildingByIdApi(id);
            setBuilding(data);
        } catch (error) {
            toast.error("Không thể tải thông tin tòa nhà");
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id, navigate]);

    useEffect(() => {
        if (!socket || !building) return;

        const handleDeviceUpdate = (payload) => {
            setBuilding(prevBuilding => {
                if (!prevBuilding) return prevBuilding;
                const updatedDevices = prevBuilding.devices.map(device => {
                    if (device.code.toLowerCase() === payload.code.toLowerCase()) {
                        return { ...device, latest_state: payload.latest_state, last_updated: new Date() };
                    }
                    return device;
                });
                return { ...prevBuilding, devices: updatedDevices };
            });
        };

        socket.on("device-update", handleDeviceUpdate);
        return () => { socket.off("device-update", handleDeviceUpdate); };
    }, [socket, building?.id]);

    const handleAddManager = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addManagerToBuildingApi({ ...managerForm, buildingId: id });
            toast.success("Đã thêm Quản lý mới thành công!");
            setManagerForm({ fullName: '', username: '', password: '' });
            setShowAddForm(false);
            fetchDetail(); // Load lại để có danh sách mới
        } catch (error) {
            // Nhờ bước 1, bây giờ error.message chứa đúng 100% câu chữ của Backend
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="cyber-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="cyber-loading">
                    <Server size={40} style={{ color: 'var(--cyber-blue)', animation: 'spin 1.2s linear infinite' }} />
                    ĐANG TẢI DỮ LIỆU CƠ SỞ...
                </div>
            </div>
        );
    }

    const managers = building?.managers || [];
    const devices = building?.devices || [];

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
            case 'AHU': return Wind;
            default: return Server;
        }
    };

    return (
        <div className="cyber-dashboard" style={{ padding: '24px' }}>

            <button onClick={() => navigate('/admin')} className="cyber-btn-view" style={{ marginBottom: '20px' }}>
                <ArrowLeft size={14} /> QUAY LẠI DANH SÁCH
            </button>

            {/* HEADER THÔNG TIN TÒA NHÀ */}
            <div className="cyber-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '32px', marginBottom: '24px', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', zIndex: 10 }}>
                    <div style={{ background: 'linear-gradient(135deg, #0055cc, #003388)', border: '1px solid rgba(0,170,255,0.4)', borderRadius: '16px', padding: '16px', boxShadow: '0 0 30px rgba(0,100,255,0.3)' }}>
                        <Building2 size={40} style={{ color: '#ffffff' }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span style={{ background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.3)', color: 'var(--cyber-blue)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: '0.1em' }}>
                                {building.code}
                            </span>
                            {totalFaults > 0 && (
                                <span style={{ background: 'rgba(255,60,90,0.1)', border: '1px solid rgba(255,60,90,0.4)', color: 'var(--cyber-red)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '4px', animation: 'faultPulse 1s infinite alternate' }}>
                                    <AlertTriangle size={10} /> CÓ SỰ CỐ
                                </span>
                            )}
                        </div>
                        <h1 className="cyber-title" style={{ fontSize: '28px', margin: 0, textShadow: '0 0 20px rgba(0,170,255,0.3)' }}>
                            {building.name}
                        </h1>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyber-text-dim)', fontSize: '14px', marginTop: '8px', fontWeight: 500 }}>
                            <MapPin size={14} style={{ color: 'var(--cyber-blue)' }} /> {building.address || 'Chưa cập nhật địa chỉ'}
                        </p>
                    </div>
                </div>

                {/* KHU VỰC ĐỘI NGŨ QUẢN LÝ */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--cyber-border)', minWidth: '250px' }}>
                        <div style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--cyber-green)', padding: '12px', borderRadius: '50%', border: '1px solid rgba(0,229,160,0.3)' }}>
                            <Users size={24} />
                        </div>
                        <div>
                            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>Đội ngũ quản lý</p>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>{managers.length} Nhân sự</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsManagerModalOpen(true)}
                        style={{ padding: '8px 16px', background: 'rgba(0,170,255,0.1)', border: '1px solid var(--cyber-blue)', color: 'var(--cyber-blue)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cyber-blue)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,170,255,0.1)'; e.currentTarget.style.color = 'var(--cyber-blue)'; }}
                    >
                        Xem chi tiết danh sách
                    </button>
                </div>
            </div>

            {/* THỐNG KÊ NHANH */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--cyber-text)', padding: '12px', borderRadius: '12px' }}><Server size={24} /></div><div><p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{totalDevices}</p><p style={{ fontSize: '10px', color: 'var(--cyber-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Tổng thiết bị</p></div></div>
                <div style={{ background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--cyber-green)', padding: '12px', borderRadius: '12px', boxShadow: '0 0 15px rgba(0,229,160,0.2)' }}><Activity size={24} /></div><div><p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cyber-green)', lineHeight: 1 }}>{activeDevices}</p><p style={{ fontSize: '10px', color: 'var(--cyber-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Đang vận hành</p></div></div>
                <div style={{ background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8', padding: '12px', borderRadius: '12px' }}><Power size={24} /></div><div><p style={{ fontSize: '24px', fontWeight: 700, color: '#94a3b8', lineHeight: 1 }}>{stoppedDevices}</p><p style={{ fontSize: '10px', color: 'var(--cyber-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Đang dừng</p></div></div>
                <div style={{ background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ background: 'rgba(255,60,90,0.1)', color: 'var(--cyber-red)', padding: '12px', borderRadius: '12px', boxShadow: '0 0 15px rgba(255,60,90,0.2)' }}><AlertTriangle size={24} /></div><div><p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cyber-red)', lineHeight: 1 }}>{totalFaults}</p><p style={{ fontSize: '10px', color: 'var(--cyber-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Đang báo lỗi</p></div></div>
            </div>

            {/* DANH SÁCH THIẾT BỊ DẠNG LƯỚI */}
            <div className="cyber-scada-wrap" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--cyber-border)', paddingBottom: '16px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-text)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Server size={18} style={{ color: 'var(--cyber-blue)' }} /> Hệ thống thiết bị tòa nhà
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                    {devices.length === 0 ? (
                        <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--cyber-text-dim)', padding: '40px', fontFamily: "'IBM Plex Mono', monospace" }}>— Tòa nhà này chưa được khai báo thiết bị nào —</p>
                    ) : (
                        devices.map(device => {
                            const Icon = getDeviceIcon(device.type);
                            const state = device.latest_state || {};
                            const hasFault = state.fault === 1;
                            const isRunning = device.type === 'VALVE' ? state.state === 1 : device.type === 'PIPE' ? state.flow_status === 1 : state.power === 1;
                            const cardClass = `cyber-card ${hasFault ? 'fault' : isRunning ? 'running' : ''}`;

                            return (
                                <div key={device.id} className={cardClass}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div className="cyber-icon-wrap"><Icon size={16} className={isRunning && !hasFault && device.type !== 'PIPE' ? 'spin' : ''} /></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: hasFault ? 'var(--cyber-red)' : isRunning ? 'var(--cyber-green)' : 'var(--cyber-text-dim)' }}>
                                                {hasFault ? 'LỖI' : isRunning ? 'ON' : 'OFF'}
                                            </span>
                                            <div className={`cyber-dot ${hasFault ? 'fault' : isRunning ? 'running' : ''}`} />
                                        </div>
                                    </div>
                                    <div className="cyber-device-code" style={{ fontSize: '14px', marginBottom: '2px' }}>{device.code}</div>
                                    <div className="cyber-device-type" style={{ color: 'var(--cyber-blue)' }}>{device.type}</div>
                                    <div className="cyber-card-footer" style={{ marginTop: '12px', paddingTop: '12px' }}>
                                        <div className="cyber-location"><MapPin size={10} style={{ color: 'var(--cyber-text-dim)' }} /> {device.location || 'N/A'}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ===== MODAL QUẢN LÝ DANH SÁCH ADMIN ===== */}
            {isManagerModalOpen && (
                <div className="cyber-modal-overlay">
                    <div className="cyber-modal" style={{ maxWidth: '500px' }}>
                        <div className="cyber-modal-header">
                            <span className="cyber-modal-title">Đội ngũ Quản lý tòa nhà</span>
                            <button className="cyber-modal-close" onClick={() => { setIsManagerModalOpen(false); setShowAddForm(false); }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            {/* Nút chuyển đổi giữa Danh sách và Form thêm mới */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', border: '1px solid var(--cyber-border)', background: !showAddForm ? 'rgba(0,170,255,0.1)' : 'transparent', color: !showAddForm ? 'var(--cyber-blue)' : 'var(--cyber-text-dim)', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    DANH SÁCH ({managers.length})
                                </button>
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', border: '1px solid var(--cyber-border)', background: showAddForm ? 'rgba(0,229,160,0.1)' : 'transparent', color: showAddForm ? 'var(--cyber-green)' : 'var(--cyber-text-dim)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <Plus size={14} /> THÊM QUẢN LÝ
                                </button>
                            </div>

                            {/* HIỂN THỊ DANH SÁCH */}
                            {!showAddForm && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                                    {managers.length === 0 ? (
                                        <p style={{ textAlign: 'center', padding: '30px', color: 'var(--cyber-text-dim)', fontStyle: 'italic', fontSize: '13px' }}>Chưa có nhân sự nào được phân công.</p>
                                    ) : (
                                        managers.map((mgr) => (
                                            <div key={mgr.user.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)', padding: '12px 16px', borderRadius: '12px' }}>
                                                <div style={{ background: 'rgba(0,170,255,0.1)', color: 'var(--cyber-blue)', padding: '10px', borderRadius: '50%' }}>
                                                    <UserCircle size={20} />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{mgr.user.fullName}</p>
                                                    <p style={{ fontSize: '11px', color: 'var(--cyber-text-dim)', fontFamily: "'IBM Plex Mono', monospace" }}>@{mgr.user.username}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* FORM THÊM QUẢN LÝ MỚI */}
                            {showAddForm && (
                                <form onSubmit={handleAddManager} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="cyber-form-group">
                                        <label className="cyber-form-label">Họ và tên nhân sự</label>
                                        <input className="cyber-input" type="text" required value={managerForm.fullName} onChange={e => setManagerForm({ ...managerForm, fullName: e.target.value })} placeholder="VD: Trần Văn A" />
                                    </div>
                                    <div className="cyber-form-group">
                                        <label className="cyber-form-label">Tên đăng nhập (Username)</label>
                                        <input className="cyber-input" type="text" required value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} placeholder="VD: quanly_a" />
                                    </div>
                                    <div className="cyber-form-group">
                                        <label className="cyber-form-label">Mật khẩu cấp phát</label>
                                        <input className="cyber-input" type="password" required value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} placeholder="••••••••" />
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="cyber-btn-submit" style={{ marginTop: '10px', width: '100%' }}>
                                        {isSubmitting ? 'ĐANG TẠO...' : 'TẠO TÀI KHOẢN & PHÂN QUYỀN'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}