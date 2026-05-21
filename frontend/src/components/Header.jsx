import { useState, useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import { getProfileApi, updateNameApi } from '../services/auth.service';
import { AuthContext } from '../context/AuthContext';

import {
    Bell, MoreVertical, User, MapPin, Settings as SettingsIcon,
    X, Calendar, Shield, Trash2, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Header = () => {
    const { user } = useContext(AuthContext);

    // Lấy dữ liệu và hàm xử lý chuông thông báo từ Context
    // Không cần markAsRead nữa vì thông báo tự xóa khi hết lỗi
    const { notifications, clearAll } = useContext(NotificationContext);

    const [showDropdown, setShowDropdown] = useState(false);
    const [showNoti, setShowNoti] = useState(false);

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [newName, setNewName] = useState(user?.fullName || "");
    const [isUpdating, setIsUpdating] = useState(false);

    // Mọi thông báo trong list đều là lỗi đang HIỆN HÀNH (Active Faults)
    const activeFaultsCount = notifications.length;

    const handleShowProfile = async () => {
        setShowDropdown(false);
        setLoadingProfile(true);
        try {
            const data = await getProfileApi();
            setProfileData(data);
            setIsProfileModalOpen(true);
        } catch (error) {
            console.error("Lỗi lấy profile:", error);
            toast.error("Không thể tải thông tin tài khoản!");
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleUpdateName = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const result = await updateNameApi(newName);

            const updatedUser = { ...user, fullName: result.user.fullName };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload();
            toast.success("Cập nhật tên thành công!");
            setIsSettingsModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <>
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 ml-64">
                <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-slate-700">
                        {user?.building?.name || 'Toàn hệ thống quản trị'}
                    </span>
                </div>

                <div className="flex items-center gap-6">

                    {/* ========================================== */}
                    {/* KHU VỰC NÚT CHUÔNG BÁO ĐỘNG (ALARM BELL)    */}
                    {/* ========================================== */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNoti(!showNoti)}
                            className={`p-2 rounded-full transition-all ${showNoti ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50 hover:text-blue-600'}`}
                        >
                            <Bell className="w-5 h-5" />
                            {/* Chấm đỏ báo số lượng máy đang lỗi */}
                            {activeFaultsCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce shadow-sm">
                                    {activeFaultsCount}
                                </span>
                            )}
                        </button>

                        {/* DROPDOWN DANH SÁCH LỖI */}
                        {showNoti && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowNoti(false)}></div>

                                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">

                                    {/* Tiêu đề popup */}
                                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="font-bold text-red-600 text-sm flex items-center gap-2">
                                            <AlertTriangle size={16} /> CẢNH BÁO HIỆN HÀNH
                                        </h3>
                                        {notifications.length > 0 && (
                                            <button onClick={clearAll} className="text-slate-400 hover:text-slate-700 transition-colors tooltip" title="Ẩn tất cả (Bỏ qua cảnh báo)">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Danh sách lỗi */}
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center text-slate-300">
                                                <Shield size={40} className="mx-auto mb-3 opacity-20 text-emerald-500" />
                                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Hệ thống an toàn</p>
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.code} className="p-4 border-b border-slate-50 flex gap-3 transition-colors bg-red-50/40 hover:bg-red-50">
                                                    <div className="bg-red-100 p-2 rounded-xl h-fit text-red-600 animate-pulse shadow-sm">
                                                        <AlertTriangle size={18} />
                                                    </div>
                                                    <div className="flex-1 space-y-1.5">
                                                        {/* Tên và Mã thiết bị */}
                                                        <p className="text-xs text-red-700 font-black leading-tight">
                                                            {n.details?.name} <span className="text-red-500 font-mono">({n.code})</span> đang báo sự cố!
                                                        </p>

                                                        {/* Hiển thị chi tiết (Rất hữu ích cho Super Admin) */}
                                                        <div className="text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-red-100 shadow-sm space-y-1">
                                                            <p className="flex justify-between">
                                                                <span className="text-slate-400">Vị trí:</span>
                                                                <span className="font-bold">{n.details?.location || 'N/A'}</span>
                                                            </p>
                                                            {/* Chỉ hiện Tòa nhà và Quản lý nếu là SUPER ADMIN */}
                                                            {user?.role === 'SUPER_ADMIN' && (
                                                                <>
                                                                    <p className="flex justify-between">
                                                                        <span className="text-slate-400">Cơ sở:</span>
                                                                        <span className="font-bold text-blue-600">{n.details?.buildingName}</span>
                                                                    </p>
                                                                    <p className="flex justify-between">
                                                                        <span className="text-slate-400">Người quản lý:</span>
                                                                        <span className="font-bold text-emerald-600">{n.details?.managerName}</span>
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>

                                                        <p className="text-[9px] text-slate-400 font-mono text-right">
                                                            Cập nhật: <span className="font-bold">{n.time}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {/* ========================================== */}

                    {/* Thông tin User tóm tắt */}
                    <div className="flex items-center gap-3 border-l border-slate-100 pl-6 relative">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 leading-none">{user?.fullName}</p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 font-bold">{user?.role}</p>
                        </div>

                        <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
                            {user?.fullName?.charAt(0).toUpperCase()}
                        </div>

                        {/* Nút 3 chấm menu */}
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className={`p-1 rounded-lg transition-colors ${showDropdown ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu Tài khoản */}
                        {showDropdown && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                                <div className="absolute right-0 top-12 w-56 bg-white border border-slate-100 rounded-xl shadow-2xl p-2 z-20 animate-in fade-in zoom-in duration-150 origin-top-right">
                                    <button
                                        onClick={handleShowProfile}
                                        disabled={loadingProfile}
                                        className="flex items-center gap-3 w-full p-3 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group"
                                    >
                                        <User className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                                        {loadingProfile ? 'Đang tải...' : 'Thông tin tài khoản'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsSettingsModalOpen(true);
                                            setNewName(user?.fullName || "");
                                            setShowDropdown(false);
                                        }}
                                        className="flex items-center gap-3 w-full p-3 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group"
                                    >
                                        <SettingsIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-600" /> Cài đặt cá nhân
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* MODAL CHI TIẾT TÀI KHOẢN */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-blue-600 p-6 text-white">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Thông tin chi tiết</h2>
                                <button onClick={() => setIsProfileModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/30">
                                    {profileData?.fullName?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{profileData?.fullName}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> Vai trò hệ thống
                                    </p>
                                    <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        {profileData?.role}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Ngày tham gia
                                    </p>
                                    <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {profileData?.managedBuildings?.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Cơ sở quản lý trực tiếp
                                    </p>
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <p className="text-blue-800 font-bold text-sm">
                                            {profileData.managedBuildings[0].building.name}
                                        </p>
                                        <p className="text-blue-600 text-xs mt-1">
                                            {profileData.managedBuildings[0].building.address || 'Chưa cập nhật địa chỉ'}
                                        </p>
                                        <div className="mt-2 inline-block px-2 py-1 bg-blue-600 text-[9px] font-bold text-white rounded uppercase">
                                            Mã: {profileData.managedBuildings[0].building.code}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {profileData?.role === 'SUPER_ADMIN' && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                    <p className="text-amber-800 font-bold text-sm">Quản trị viên toàn quyền</p>
                                    <p className="text-amber-600 text-xs mt-1">Tài khoản có quyền truy cập tất cả các cơ sở trong hệ thống.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors shadow-sm"
                            >
                                Đóng
                            </button>
                            <button className="rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors px-4 py-2 text-sm font-bold ml-3"
                                onClick={() => {
                                    localStorage.clear();
                                    window.location.href = '/login';
                                }}
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CÀI ĐẶT CÁ NHÂN */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSettingsModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="font-black text-slate-800 uppercase text-sm tracking-tight">Cài đặt cá nhân</h2>
                            <button onClick={() => setIsSettingsModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleUpdateName} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Thay đổi họ và tên</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsSettingsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl text-xs">Hủy</button>
                                <button type="submit" disabled={isUpdating} className="flex-2 py-3 bg-blue-600 text-white font-black rounded-2xl text-xs px-8 shadow-lg shadow-blue-200">
                                    {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;