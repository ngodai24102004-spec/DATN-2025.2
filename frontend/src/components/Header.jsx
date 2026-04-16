import { useState, useContext } from 'react';
import { getProfileApi } from '../services/auth.service';
import { AuthContext } from '../context/AuthContext';
import { Bell, MoreVertical, User, MapPin, Settings as SettingsIcon, X, Calendar, Shield } from 'lucide-react';

const Header = () => {
    const { user } = useContext(AuthContext);
    const [showDropdown, setShowDropdown] = useState(false);

    // State quản lý Modal thông tin tài khoản
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    // Hàm xử lý lấy thông tin chi tiết và mở Modal
    const handleShowProfile = async () => {
        setShowDropdown(false); // Đóng dropdown 3 chấm
        setLoadingProfile(true);
        try {
            const data = await getProfileApi();
            setProfileData(data);
            setIsProfileModalOpen(true);
        } catch (error) {
            console.error("Lỗi lấy profile:", error);
            alert("Không thể tải thông tin tài khoản!");
        } finally {
            setLoadingProfile(false);
        }
    };

    return (
        <>
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 ml-64">
                {/* Tên Tòa nhà đang xem */}
                <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-slate-700">
                        {user?.building?.name || 'Toàn hệ thống quản trị'}
                    </span>
                </div>

                {/* Actions (Bell & User) */}
                <div className="flex items-center gap-6">
                    {/* Nút chuông thông báo */}
                    <button className="relative p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600 rounded-full transition-all">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

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

                        {/* Dropdown Menu */}
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
                                    <button className="flex items-center gap-3 w-full p-3 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group">
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
                    {/* Overlay làm mờ nền */}
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)}></div>

                    {/* Nội dung Modal */}
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        {/* Header Modal */}
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
                                    <p className="text-blue-100 text-sm">@{profileData?.username}</p>
                                </div>
                            </div>
                        </div>

                        {/* Body Modal */}
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

                            {/* Thông tin tòa nhà quản lý (nếu có) */}
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

                            {/* Nếu là Super Admin không có nhà cụ thể */}
                            {profileData?.role === 'SUPER_ADMIN' && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                    <p className="text-amber-800 font-bold text-sm">Quản trị viên toàn quyền</p>
                                    <p className="text-amber-600 text-xs mt-1">Tài khoản có quyền truy cập tất cả các cơ sở trong hệ thống.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors shadow-sm"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;