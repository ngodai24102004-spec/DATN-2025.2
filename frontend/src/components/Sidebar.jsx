// src/components/Sidebar.jsx
import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    History,
    LogOut,
    Building2,
    ShieldCheck,
    Sliders,
    ChevronsLeft,
    Users,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    // ==========================================
    // LOGIC PHÂN QUYỀN HIỂN THỊ MENU SIDEBAR
    // ==========================================
    let menuItems = [];

    if (user?.role === 'SUPER_ADMIN') {
        // 1. NẾU LÀ SUPER ADMIN: Chỉ hiển thị menu Quản lý hệ thống
        menuItems = [
            { name: 'Dashboard Tổng', path: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'Quản lý Tòa nhà', path: '/admin', icon: ShieldCheck },
            { name: 'Quản lý Admin', path: '/admin/managers', icon: Users }
        ];
    } else {
        // 2. NẾU LÀ BUILDING ADMIN: Hiển thị các menu vận hành trạm
        menuItems = [
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Lịch sử dữ liệu', path: '/history', icon: History },
            { name: 'Bảng Điều khiển', path: '/control', icon: Sliders },
            { name: 'Thông tin cơ sở', path: '/info', icon: Building2 },
        ];
    }

    return (
        // Đổi màu nền tối sâu hơn (chuẩn Dark Mode SCADA) kết hợp với các class điều hướng ẩn/hiện mượt mà của Tailwind
        <aside
            className={`w-72 bg-[#040914] border-r border-slate-800/60 text-white h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-50 transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        >

            {/* --- LOGO SECTION --- */}
            <div className="p-6 flex items-center justify-between border-b border-slate-800/50 mb-4 mt-2">
                <div className="flex items-center gap-4">
                    {/* Hộp logo phát sáng viền */}
                    <div className="relative p-2.5 rounded-2xl border border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-blue-950/20">
                        <Building2 className="w-6 h-6 text-blue-400" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-wide text-white leading-tight"> BMS</h1>
                        <p className="text-[8px] text-slate-400 uppercase tracking-[0.15em] font-bold mt-0.5">Building Management</p>
                    </div>
                </div>

                {/* Nút đóng nhanh Sidebar ngăn kéo (Chỉ hiển thị trên điện thoại/máy tính bảng) */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-1.5 bg-slate-800/60 hover:bg-slate-700/50 border border-slate-700/50 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                    title="Đóng trình đơn"
                >
                    <ChevronsLeft size={16} />
                </button>
            </div>

            {/* --- NAVIGATION LINKS --- */}
            <nav className="flex-1 px-5 space-y-3 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end
                        onClick={onClose} // Tự động đóng ngăn kéo khi click chọn chuyển trang trên di động
                        className={({ isActive }) =>
                            `flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group border ${isActive
                                ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)] text-white'
                                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className="flex items-center gap-4">
                                    {/* Icon có background nếu inactive, không background nếu active */}
                                    <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-transparent text-blue-400' : 'bg-slate-800/60 text-slate-400 group-hover:text-slate-300 group-hover:bg-slate-700/50'
                                        }`}>
                                        <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <span className={`font-semibold text-sm tracking-wide ${isActive ? 'text-white' : ''}`}>
                                        {item.name}
                                    </span>
                                </div>

                                {/* Chấm trạng thái (Dot Indicator) */}
                                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' : 'bg-slate-700 group-hover:bg-slate-500'
                                    }`}></span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* --- LOGOUT BUTTON --- */}
            <div className="p-6 mt-auto">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-colors font-bold text-sm"
                >
                    <LogOut className="w-5 h-5" strokeWidth={2.5} />
                    <span>Đăng xuất</span>
                </button>
            </div>

        </aside>
    );
};

export default Sidebar;