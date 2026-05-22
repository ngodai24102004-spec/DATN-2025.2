import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBuildingsApi, deleteBuildingApi, updateBuildingApi } from '../../services/building.service';
import { registerApi } from '../../services/auth.service';
import { Building2, MapPin, ShieldCheck, Plus, Eye, UserCircle, Search, RefreshCw, Layers, AlertTriangle, Trash2, Edit, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function SystemManagement() {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ id: null, name: '', code: '', address: '' });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addFormData, setAddFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        buildingName: '',
        buildingCode: '',
        address: ''
    });



    const fetchBuildings = async () => {
        setLoading(true);
        try {
            const data = await getBuildingsApi();
            setBuildings(data);
        } catch (error) {
            console.error("Lỗi tải danh sách cơ sở:", error);
            toast.error("Không thể kết nối đến máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBuilding = (id, name) => {
        toast.custom((t) => (
            <div className="bg-[#070f1f] border border-red-500/40 p-6 rounded-2xl shadow-2xl max-w-md w-full">
                <div className="flex items-start gap-4">
                    <div className="bg-red-500/20 p-3 rounded-xl text-red-500"><AlertTriangle size={24} /></div>
                    <div>
                        <h3 className="text-white font-bold uppercase text-sm tracking-widest">Xác nhận xóa cơ sở</h3>
                        <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                            Bạn có chắc chắn muốn xóa tòa nhà <span className="text-white font-bold">{name}</span>?<br />
                            Mọi thiết bị và dữ liệu vận hành của cơ sở này sẽ bị mất vĩnh viễn.
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-white uppercase">Hủy</button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await deleteBuildingApi(id);
                                fetchBuildings(); // Tải lại danh sách
                                toast.success("Đã gỡ bỏ cơ sở khỏi hệ thống");
                            } catch (error) { toast.error("Không thể xóa cơ sở này"); }
                        }}
                        className="bg-red-600 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-red-900/40 uppercase"
                    > Xóa vĩnh viễn </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const handleOpenEdit = (b) => {
        setEditData({ id: b.id, name: b.name, code: b.code, address: b.address || '' });
        setIsEditModalOpen(true);
    };

    const handleUpdateBuilding = async (e) => {
        e.preventDefault();
        try {
            await updateBuildingApi(editData.id, editData);
            toast.success("Đã cập nhật thông tin tòa nhà!");
            setIsEditModalOpen(false);
            fetchBuildings(); // Load lại danh sách
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật");
        }
    };

    const handleAddBuilding = async (e) => {
        e.preventDefault();
        try {
            // Logic: Luôn gán role là BUILDING_ADMIN để bảo mật
            const finalData = { ...addFormData, role: 'BUILDING_ADMIN' };

            await registerApi(finalData);

            toast.success("Khởi tạo tòa nhà và cấp quyền quản lý thành công!");
            setIsAddModalOpen(false); // Đóng modal
            setAddFormData({ username: '', password: '', fullName: '', buildingName: '', buildingCode: '', address: '' }); // Reset form
            fetchBuildings(); // Tải lại danh sách
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi khởi tạo");
        }
    };


    useEffect(() => {
        fetchBuildings();
    }, []);

    const filteredBuildings = buildings.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="cyber-dashboard" style={{ padding: '24px' }}>
            <Toaster position="top-right" />

            {/* --- HEADER --- */}
            <div className="cyber-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '24px', marginBottom: '24px', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0055cc, #003388)', border: '1px solid rgba(0,170,255,0.4)', borderRadius: '12px', padding: '12px', boxShadow: '0 0 20px rgba(0,100,255,0.3)' }}>
                        <ShieldCheck size={28} style={{ color: '#55aaff' }} />
                    </div>
                    <div>
                        <h1 className="cyber-title" style={{ fontSize: '20px', margin: 0 }}>
                            Quản trị toàn hệ thống
                        </h1>
                        <p style={{ fontSize: '12px', color: 'var(--cyber-text-dim)', marginTop: '4px', fontWeight: 600 }}>
                            Quản lý các cơ sở và phân quyền Building Admin
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Thanh tìm kiếm phong cách Cyber */}
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cyber-text-dim)' }} />
                        <input
                            type="text"
                            placeholder="Nhập mã hoặc tên tòa nhà..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="cyber-input"
                            style={{ paddingLeft: '40px', fontSize: '13px' }}
                        />
                    </div>

                    <button className="cyber-btn-add" onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={16} /> THÊM TÒA NHÀ
                    </button>
                </div>
            </div>

            {/* --- DANH SÁCH TÒA NHÀ (CYBER TABLE) --- */}
            <div className="cyber-scada-wrap">
                <div className="cyber-flow-line" />

                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--cyber-border)', background: 'rgba(0,170,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-text)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={18} style={{ color: 'var(--cyber-blue)' }} /> Danh sách cơ sở
                    </h2>
                    <span className="cyber-badge-live" style={{ background: 'rgba(0,170,255,0.1)', borderColor: 'rgba(0,170,255,0.4)', color: 'var(--cyber-blue)' }}>
                        <Layers size={20} /> TỔNG: {filteredBuildings.length}
                    </span>
                </div>

                {loading ? (
                    <div className="cyber-loading">
                        <RefreshCw size={40} style={{ color: 'var(--cyber-blue)', animation: 'spin 1.2s linear infinite' }} />
                        ĐANG TẢI DỮ LIỆU CƠ SỞ...
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', position: 'relative', zIndex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--cyber-border)' }}>
                                    <th style={{ padding: '16px 24px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mã Định Danh</th>
                                    <th style={{ padding: '16px 24px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tên Cơ Sở</th>
                                    <th style={{ padding: '16px 24px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Vị Trí / Địa Chỉ</th>
                                    <th style={{ padding: '16px 24px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Building Admin</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--cyber-text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBuildings.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '60px', textAlign: 'center' }}>
                                            <p className="cyber-empty">— KHÔNG TÌM THẤY TÒA NHÀ NÀO —</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBuildings.map((building) => (
                                        <tr key={building.id} style={{ borderBottom: '1px solid rgba(26,58,92,0.5)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,170,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>

                                            {/* CỘT 1: MÃ CODE */}
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#c8dff5', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--cyber-border)', padding: '4px 10px', borderRadius: '6px' }}>
                                                    {building.code}
                                                </span>
                                            </td>

                                            {/* CỘT 2: TÊN TÒA NHÀ */}
                                            <td style={{ padding: '16px 24px', fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                                                {building.name}
                                            </td>

                                            {/* CỘT 3: ĐỊA CHỈ */}
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-text-dim)', fontSize: '13px', fontWeight: 500 }}>
                                                    <MapPin size={14} style={{ color: 'var(--cyber-amber)' }} />
                                                    {building.address || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Chưa cập nhật</span>}
                                                </div>
                                            </td>

                                            {/* CỘT 4: NGƯỜI QUẢN LÝ */}
                                            <td style={{ padding: '16px 24px' }}>
                                                {building.managers.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {building.managers.map((mgr) => (
                                                            <div key={mgr.user.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)', padding: '6px 12px', borderRadius: '8px', width: 'fit-content' }}>
                                                                <UserCircle size={16} style={{ color: 'var(--cyber-green)' }} />
                                                                <div>
                                                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#aaffdd', lineHeight: 1 }}>{mgr.user.fullName}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '11px', background: 'rgba(255,60,90,0.15)', color: 'var(--cyber-red)', border: '1px solid rgba(255,60,90,0.3)', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>CHƯA BỔ NHIỆM</span>
                                                )}
                                            </td>

                                            {/* CỘT 5: THAO TÁC */}
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenEdit(building)}
                                                        className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-900/10"
                                                        title="Sửa thông tin"
                                                    >
                                                        <Edit size={14} />
                                                    </button>

                                                    {/* NÚT XÓA (MỚI THÊM) */}
                                                    <button
                                                        onClick={() => handleDeleteBuilding(building.id, building.name)}
                                                        className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-900/10"
                                                        title="Xóa tòa nhà"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>

                                                    {/* NÚT CHI TIẾT */}
                                                    <button
                                                        onClick={() => navigate(`/admin/building/${building.id}`)}
                                                        className="p-2.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-900/10"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={14} />
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {isEditModalOpen && (
                <div className="cyber-modal-overlay">
                    <div className="cyber-modal">
                        <div className="cyber-modal-header">
                            <span className="cyber-modal-title">Chỉnh sửa thông tin tòa nhà</span>
                            <button className="cyber-modal-close" onClick={() => setIsEditModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateBuilding} className="cyber-form">
                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Mã định danh</label>
                                <input className="cyber-input" type="text" value={editData.code} onChange={e => setEditData({ ...editData, code: e.target.value })} required />
                            </div>
                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Tên cơ sở</label>
                                <input className="cyber-input" type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} required />
                            </div>
                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Địa chỉ / Vị trí</label>
                                <input className="cyber-input" type="text" value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} />
                            </div>
                            <div className="cyber-form-actions">
                                <button type="button" className="cyber-btn-cancel" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
                                <button type="submit" className="cyber-btn-submit">Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddModalOpen && (
                <div className="cyber-modal-overlay">
                    <div className="cyber-modal" style={{ maxWidth: '600px' }}>
                        <div className="cyber-modal-header">
                            <span className="cyber-modal-title">Khởi tạo cơ sở & Quản trị viên</span>
                            <button className="cyber-modal-close" onClick={() => setIsAddModalOpen(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleAddBuilding} className="cyber-form">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                                {/* CỘT 1: THÔNG TIN TÒA NHÀ */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h3 style={{ fontSize: '11px', color: 'var(--cyber-blue)', fontWeight: 800, borderLeft: '3px solid var(--cyber-blue)', paddingLeft: '8px' }}>THÔNG TIN TÒA NHÀ</h3>
                                    <div className="cyber-form-group">
                                        <label className="cyber-form-label">Mã tòa nhà (Unique Code)</label>
                                        <input className="cyber-input" type="text" required value={addFormData.buildingCode} onChange={e => setAddFormData({ ...addFormData, buildingCode: e.target.value.toUpperCase() })} placeholder="VD: L81_SAIGON" />
                                    </div>
                                    <div className="cyber-form-group">
                                        <label className="cyber-form-label">Tên cơ sở</label>
                                        <input className="cyber-input" type="text" required value={addFormData.buildingName} onChange={e => setAddFormData({ ...addFormData, buildingName: e.target.value })} placeholder="VD: Landmark 81" />
                                    </div>
                                    <div className="cyber-form-group">
                                        <label className="cyber-form-label">Địa chỉ</label>
                                        <input className="cyber-input" type="text" value={addFormData.address} onChange={e => setAddFormData({ ...addFormData, address: e.target.value })} placeholder="Quận/Huyện, TP" />
                                    </div>
                                </div>

                                {/* CỘT 2: THÔNG TIN TÀI KHOẢN ADMIN */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h3 style={{ fontSize: '11px', color: 'var(--cyber-green)', fontWeight: 800, borderLeft: '3px solid var(--cyber-green)', paddingLeft: '8px' }}>TÀI KHOẢN BUILDING ADMIN</h3>
                                    <div className="cyber-form-group">
                                        <label className="cyber-form-label">Tên đăng nhập</label>
                                        <input className="cyber-input" type="text" required value={addFormData.username} onChange={e => setAddFormData({ ...addFormData, username: e.target.value })} placeholder="Username" />
                                    </div>
                                    <div className="cyber-form-group">
                                        <label className="cyber-form-label">Mật khẩu cấp phát</label>
                                        <input className="cyber-input" type="password" required value={addFormData.password} onChange={e => setAddFormData({ ...addFormData, password: e.target.value })} placeholder="••••••••" />
                                    </div>
                                    <div className="cyber-form-group">
                                        <label className="cyber-form-label">Họ và tên Quản lý</label>
                                        <input className="cyber-input" type="text" required value={addFormData.fullName} onChange={e => setAddFormData({ ...addFormData, fullName: e.target.value })} placeholder="Nguyễn Văn A" />
                                    </div>
                                </div>
                            </div>

                            <div className="cyber-form-actions" style={{ marginTop: '20px', borderTop: '1px solid var(--cyber-border)', paddingTop: '20px', display: 'flex', gap: '12px' }}>
                                {/* Nút HỦY BỎ */}
                                <button
                                    type="button"
                                    className="cyber-btn-cancel"
                                    onClick={() => setIsAddModalOpen(false)}
                                    style={{ flex: 1 }} // Đặt tỉ lệ 1
                                >
                                    Hủy bỏ
                                </button>

                                {/* Nút KÍCH HOẠT HỆ THỐNG */}
                                <button
                                    type="submit"
                                    className="cyber-btn-submit"
                                    style={{
                                        flex: 1, // Đổi từ 2 thành 1 để cân bằng với nút Hủy
                                        background: 'linear-gradient(135deg, #007a54, #00e5a0)',
                                        borderColor: 'var(--cyber-green)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <ShieldCheck size={16} /> KÍCH HOẠT HỆ THỐNG
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
}