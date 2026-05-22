import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBuildingByIdApi } from '../../services/building.service';
import { NotificationContext } from '../../context/NotificationContext';
import {
    ArrowLeft, Building2, MapPin, UserCircle, Activity,
    Snowflake, Fan, Power, Droplets, AlertTriangle, Server, Wind
} from 'lucide-react';

export default function BuildingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { socket } = useContext(NotificationContext);

    const [building, setBuilding] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const manager = building?.managers[0]?.user;
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

            {/* NÚT QUAY LẠI */}
            <button
                onClick={() => navigate('/admin')}
                className="cyber-btn-view"
                style={{ marginBottom: '20px' }}
            >
                <ArrowLeft size={14} /> QUAY LẠI DANH SÁCH
            </button>

            {/* HEADER THÔNG TIN TÒA NHÀ (Banner) */}
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid var(--cyber-border)', zIndex: 10, minWidth: '300px' }}>
                    <div style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--cyber-green)', padding: '12px', borderRadius: '50%', border: '1px solid rgba(0,229,160,0.3)' }}>
                        <UserCircle size={28} />
                    </div>
                    <div>
                        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
                            Người Quản Lý Chiller
                        </p>
                        {manager ? (
                            <>
                                <p style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>{manager.fullName}</p>
                                <p style={{ fontSize: '11px', color: 'var(--cyber-green)', fontFamily: "'IBM Plex Mono', monospace" }}>@{manager.username}</p>
                            </>
                        ) : (
                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-red)' }}>Chưa phân công</p>
                        )}
                    </div>
                </div>
            </div>

            {/* THỐNG KÊ NHANH */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>

                <div style={{ background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--cyber-text)', padding: '12px', borderRadius: '12px' }}><Server size={24} /></div>
                    <div><p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{totalDevices}</p><p style={{ fontSize: '10px', color: 'var(--cyber-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Tổng thiết bị</p></div>
                </div>

                <div style={{ background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--cyber-green)', padding: '12px', borderRadius: '12px', boxShadow: '0 0 15px rgba(0,229,160,0.2)' }}><Activity size={24} /></div>
                    <div><p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cyber-green)', lineHeight: 1 }}>{activeDevices}</p><p style={{ fontSize: '10px', color: 'var(--cyber-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Đang vận hành</p></div>
                </div>

                <div style={{ background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8', padding: '12px', borderRadius: '12px' }}><Power size={24} /></div>
                    <div><p style={{ fontSize: '24px', fontWeight: 700, color: '#94a3b8', lineHeight: 1 }}>{stoppedDevices}</p><p style={{ fontSize: '10px', color: 'var(--cyber-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Đang dừng</p></div>
                </div>

                <div style={{ background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,60,90,0.1)', color: 'var(--cyber-red)', padding: '12px', borderRadius: '12px', boxShadow: '0 0 15px rgba(255,60,90,0.2)' }}><AlertTriangle size={24} /></div>
                    <div><p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cyber-red)', lineHeight: 1 }}>{totalFaults}</p><p style={{ fontSize: '10px', color: 'var(--cyber-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Đang báo lỗi</p></div>
                </div>

            </div>

            {/* DANH SÁCH THIẾT BỊ */}
            <div className="cyber-scada-wrap" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--cyber-border)', paddingBottom: '16px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-text)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Server size={18} style={{ color: 'var(--cyber-blue)' }} /> Hệ thống thiết bị tòa nhà
                    </h2>
                    <span className="cyber-badge-live">
                        <span style={{ width: '6px', height: '6px', background: 'var(--cyber-green)', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s infinite' }}></span>
                        Đồng bộ Real-time
                    </span>
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
                                        <div className="cyber-icon-wrap">
                                            <Icon size={16} className={isRunning && !hasFault && device.type !== 'PIPE' ? 'spin' : ''} />
                                        </div>
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
                                        <div className="cyber-location">
                                            <MapPin size={10} style={{ color: 'var(--cyber-text-dim)' }} /> {device.location || 'N/A'}
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