import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    History,
    Settings,
    LogOut,
    Building2,
    ChevronRight,
    ShieldCheck,
    Sliders
} from 'lucide-react';

const Sidebar = () => {
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
            { name: 'Quản lý Tòa nhà', path: '/admin', icon: ShieldCheck }
        ];
    } else {
        // 2. NẾU LÀ BUILDING ADMIN: Hiển thị các menu vận hành trạm
        menuItems = [
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Lịch sử dữ liệu', path: '/history', icon: History },
            { name: 'Bảng Điều khiển', path: '/control', icon: Sliders },
            { name: 'Cài đặt hệ thống', path: '/settings', icon: Settings },
        ];
    }

    return (
        <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-50">
            {/* Logo Section */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">YooTek BMS</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 mt-6 px-4 space-y-2">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center justify-between p-3 rounded-xl transition-all group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </NavLink>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;