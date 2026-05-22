import React, { useState, useEffect } from 'react';
import { getBuildingAdminsApi, deleteUserApi, updateUserApi } from '../../services/auth.service';
import { Users, Search, RefreshCw, MapPin, UserCheck, CalendarDays, Trash2, AlertTriangle, Home, Edit, Lock, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [editUserData, setEditUserData] = useState({ id: null, fullName: '', username: '', password: '' });

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const data = await getBuildingAdminsApi();
                setAdmins(data);
            } catch (error) {
                toast.error("Không thể tải danh sách Quản trị viên");
            } finally {
                setLoading(false);
            }
        };
        fetchAdmins();
    }, []);

    const filteredAdmins = admins.filter(admin =>
        admin.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteUser = (id, username) => {
        toast.custom((t) => (
            <div className="bg-[#070f1f] border border-red-500/40 p-6 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
                <div className="flex items-start gap-4">
                    <div className="bg-red-500/20 p-3 rounded-xl text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-bold uppercase text-sm tracking-widest">Xóa tài khoản</h3>
                        <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                            Bạn có chắc chắn muốn xóa tài khoản <span className="text-white font-bold">@{username}</span>?<br />
                            Người dùng này sẽ mất toàn bộ quyền truy cập vào hệ thống.
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-white uppercase transition-colors">Hủy</button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await deleteUserApi(id);
                                // Cập nhật lại danh sách tại chỗ (local state)
                                setAdmins(prev => prev.filter(a => a.id !== id));
                                toast.success("Đã xóa tài khoản thành công");
                            } catch (error) {
                                toast.error(error.response?.data?.message || "Không thể xóa");
                            }
                        }}
                        className="bg-red-600 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-red-900/40 uppercase hover:bg-red-500 transition-all"
                    > Xác nhận xóa </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const handleOpenEditUser = (u) => {
        setEditUserData({ id: u.id, fullName: u.fullName, username: u.username, password: '' }); // Pass để trống
        setIsEditUserModalOpen(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await updateUserApi(editUserData.id, editUserData);
            toast.success("Đã cập nhật thông tin tài khoản!");
            setIsEditUserModalOpen(false);
            // Hàm fetchAdmins() của bạn để load lại bảng
            const data = await getBuildingAdminsApi();
            setAdmins(data);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật");
        }
    };


    return (
        <div className="cyber-dashboard" style={{ padding: '24px' }}>
            <Toaster position="top-right" />

            {/* --- HEADER --- */}
            <div className="cyber-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '24px', marginBottom: '24px', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0055cc, #003388)', border: '1px solid rgba(0,170,255,0.4)', borderRadius: '12px', padding: '12px', boxShadow: '0 0 20px rgba(0,100,255,0.3)' }}>
                        <Users size={28} style={{ color: '#55aaff' }} />
                    </div>
                    <div>
                        <h1 className="cyber-title" style={{ fontSize: '20px', margin: 0 }}>
                            Quản lý Building Admin
                        </h1>
                        <p style={{ fontSize: '12px', color: 'var(--cyber-text-dim)', marginTop: '4px', fontWeight: 600 }}>
                            Danh sách tài khoản vận hành cấp cơ sở
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cyber-text-dim)' }} />
                        <input
                            type="text"
                            placeholder="Tìm tên hoặc username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="cyber-input"
                            style={{ paddingLeft: '40px', fontSize: '13px' }}
                        />
                    </div>
                </div>
            </div>

            {/* --- DANH SÁCH BẢNG --- */}
            <div className="cyber-scada-wrap">
                <div className="cyber-flow-line" />

                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--cyber-border)', background: 'rgba(0,170,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-text)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCheck size={18} style={{ color: 'var(--cyber-blue)' }} /> Danh sách tài khoản
                    </h2>
                    <span className="cyber-badge-live" style={{ background: 'rgba(0,170,255,0.1)', borderColor: 'rgba(0,170,255,0.4)', color: 'var(--cyber-blue)' }}>
                        TỔNG: {filteredAdmins.length}
                    </span>
                </div>

                {loading ? (
                    <div className="cyber-loading">
                        <RefreshCw size={40} style={{ color: 'var(--cyber-blue)', animation: 'spin 1.2s linear infinite' }} />
                        ĐANG TẢI DỮ LIỆU...
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', position: 'relative', zIndex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--cyber-border)' }}>
                                    <th style={{ padding: '16px 24px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Họ và Tên</th>
                                    <th style={{ padding: '16px 24px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Username</th>
                                    <th style={{ padding: '16px 24px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cơ sở quản lý</th>
                                    <th style={{ padding: '16px 24px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ngày cấp</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAdmins.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '60px', textAlign: 'center' }}>
                                            <p className="cyber-empty">— KHÔNG TÌM THẤY TÀI KHOẢN NÀO —</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAdmins.map((admin) => (
                                        <tr key={admin.id} style={{ borderBottom: '1px solid rgba(26,58,92,0.5)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,170,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>

                                            {/* HỌ VÀ TÊN */}
                                            <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                                                {admin.fullName}
                                            </td>

                                            {/* USERNAME */}
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, color: 'var(--cyber-blue)', background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.2)', padding: '4px 10px', borderRadius: '6px' }}>
                                                    @{admin.username}
                                                </span>
                                            </td>

                                            {/* CƠ SỞ QUẢN LÝ */}
                                            <td style={{ padding: '16px 24px' }}>
                                                {admin.managedBuildings.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {admin.managedBuildings.map(mb => (
                                                            <div key={mb.building.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <Home size={12} style={{ color: 'var(--cyber-green)' }} />
                                                                <span style={{ fontSize: '13px', color: '#aaffdd', fontWeight: 600 }}>{mb.building.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '11px', background: 'rgba(255,60,90,0.15)', color: 'var(--cyber-red)', border: '1px solid rgba(255,60,90,0.3)', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>CHƯA PHÂN CÔNG</span>
                                                )}
                                            </td>

                                            {/* NGÀY CẤP */}
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyber-text-dim)', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>
                                                    <CalendarDays size={14} />
                                                    {new Date(admin.createdAt).toLocaleDateString('vi-VN')}
                                                </div>
                                            </td>

                                            {/* CỘT THAO TÁC */}
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>

                                                    {/* NÚT CHỈNH SỬA (EDITION) */}
                                                    <button
                                                        onClick={() => handleOpenEditUser(admin)}
                                                        className="cyber-action-btn"
                                                        style={{
                                                            background: 'rgba(0, 170, 255, 0.08)',
                                                            border: '1px solid rgba(0, 170, 255, 0.3)',
                                                            color: 'var(--cyber-blue)',
                                                            padding: '8px',
                                                            borderRadius: '10px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(0, 170, 255, 0.2)';
                                                            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 170, 255, 0.4)';
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'rgba(0, 170, 255, 0.08)';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }}
                                                        title="Chỉnh sửa thông tin"
                                                    >
                                                        <Edit size={16} strokeWidth={2.5} />
                                                    </button>

                                                    {/* NÚT XÓA (DELETION) */}
                                                    <button
                                                        onClick={() => handleDeleteUser(admin.id, admin.username)}
                                                        className="cyber-action-btn"
                                                        style={{
                                                            background: 'rgba(255, 60, 90, 0.08)',
                                                            border: '1px solid rgba(255, 60, 90, 0.3)',
                                                            color: 'var(--cyber-red)',
                                                            padding: '8px',
                                                            borderRadius: '10px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(255, 60, 90, 0.2)';
                                                            e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 60, 90, 0.4)';
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'rgba(255, 60, 90, 0.08)';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }}
                                                        title="Xóa tài khoản vĩnh viễn"
                                                    >
                                                        <Trash2 size={16} strokeWidth={2.5} />
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {isEditUserModalOpen && (
                            <div className="cyber-modal-overlay">
                                <div className="cyber-modal">
                                    <div className="cyber-modal-header">
                                        <span className="cyber-modal-title">Sửa tài khoản quản trị viên</span>
                                        <button className="cyber-modal-close" onClick={() => setIsEditUserModalOpen(false)}><X size={20} /></button>
                                    </div>
                                    <form onSubmit={handleUpdateUser} className="cyber-form">
                                        <div className="cyber-form-group">
                                            <label className="cyber-form-label">Họ và tên</label>
                                            <input className="cyber-input" type="text" value={editUserData.fullName} onChange={e => setEditUserData({ ...editUserData, fullName: e.target.value })} required />
                                        </div>
                                        <div className="cyber-form-group">
                                            <label className="cyber-form-label">Tên đăng nhập (Username)</label>
                                            <input className="cyber-input" type="text" value={editUserData.username} onChange={e => setEditUserData({ ...editUserData, username: e.target.value })} required />
                                        </div>
                                        <div className="cyber-form-group">
                                            <label className="cyber-form-label">Mật khẩu mới (Bỏ trống nếu không đổi)</label>
                                            <div className="relative">
                                                <input className="cyber-input" type="password" value={editUserData.password} onChange={e => setEditUserData({ ...editUserData, password: e.target.value })} placeholder="Nhập mật khẩu mới..." />
                                                <Lock size={14} className="absolute right-3 top-3.5 text-slate-600" />
                                            </div>
                                        </div>
                                        <div className="cyber-form-actions">
                                            <button type="button" className="cyber-btn-cancel" onClick={() => setIsEditUserModalOpen(false)}>Hủy</button>
                                            <button type="submit" className="cyber-btn-submit">Lưu thay đổi</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                )}
            </div>
        </div>
    );
}