import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { loginApi, requestRegisterApi } from '../../services/auth.service';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    User, Lock, AlertCircle, Loader2, ArrowLeft,
    Building2, Mail, BadgeCheck
} from 'lucide-react';

const Login = () => {
    // State cho Form Đăng nhập
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // State chung
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // State cho Form Đăng ký
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [regForm, setRegForm] = useState({ username: '', password: '', confirm: '', fullName: '', email: '', buildingCode: '' });

    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();


    // XỬ LÝ ĐĂNG NHẬP
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await loginApi(username, password);
            loginUser(data.user, data.accessToken);

            if (data.user.role === 'SUPER_ADMIN') {
                window.location.href = '/admin/dashboard';
            } else {
                window.location.href = '/dashboard';
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // XỬ LÝ ĐĂNG KÝ
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (regForm.password !== regForm.confirm) {
            return setError("Mật khẩu xác nhận không khớp!");
        }
        if (!regForm.buildingCode) {
            return setError("Vui lòng nhập Mã tòa nhà bạn muốn quản lý!");
        }

        setIsLoading(true);
        try {
            await requestRegisterApi(regForm);
            toast.success("Gửi yêu cầu thành công! Vui lòng kiểm tra Email chờ phê duyệt.", { duration: 5000 });

            // Thành công thì quay lại trang login và xóa form
            setIsRegisterMode(false);
            setRegForm({ username: '', password: '', confirm: '', fullName: '', email: '', buildingId: '' });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 font-sans">
            {/* Cột trái - Hình ảnh & Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
                <img
                    src="https://images.unsplash.com/photo-1558442074-3c19857bc1dc?q=80&w=1200&auto=format&fit=crop"
                    alt="BMS System"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
                />
                <div className="relative z-10 p-12 flex flex-col h-full justify-between w-full">
                    <div>
                        <div className="flex items-center gap-3 text-blue-400 font-bold text-2xl mb-2">
                            <Building2 className="w-8 h-8" /> BMS
                        </div>
                    </div>
                    <div className="max-w-xl">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Quản lý tòa nhà <br /> Thông minh & Hiệu quả
                        </h1>
                        <p className="text-lg text-slate-300 leading-relaxed">
                            Nền tảng giám sát và điều khiển các thiết bị trong tòa nhà BMS đa phân hệ. Tối ưu hóa quy trình vận hành và giảm thiểu rủi ro sự cố.
                        </p>
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                        &copy; Một nút chạm, vạn tiện nghi
                    </div>
                </div>
            </div>

            {/* Cột phải - Form Đăng nhập / Đăng ký */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-10 my-8">
                    <div className="p-8 sm:p-10">

                        <button onClick={() => navigate('/')} className="flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-8">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại trang chủ
                        </button>

                        <div className="mb-6">
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                                {isRegisterMode ? 'Yêu cầu tài khoản' : 'Đăng nhập'}
                            </h2>
                            <p className="text-slate-500 font-medium">
                                {isRegisterMode ? 'Điền thông tin để gửi yêu cầu tới Super Admin' : 'Vui lòng nhập thông tin tài khoản để tiếp tục'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-start gap-3 rounded-r-md animate-pulse">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 font-medium leading-relaxed">{error}</p>
                            </div>
                        )}

                        {/* HIỂN THỊ FORM ĐĂNG KÝ */}
                        {isRegisterMode ? (
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Họ và tên</label>
                                        <div className="relative">
                                            <BadgeCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <input type="text" required value={regForm.fullName} onChange={e => setRegForm({ ...regForm, fullName: e.target.value })} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none font-medium" placeholder="Nguyễn Văn A" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Tên đăng nhập</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <input type="text" required value={regForm.username} onChange={e => setRegForm({ ...regForm, username: e.target.value })} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none font-medium" placeholder="Nhập username" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Email liên hệ (Để nhận xác nhận)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <input type="email" required value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none font-medium" placeholder="email@domain.com" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Mã Tòa nhà (Building Code)</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            value={regForm.buildingCode}
                                            onChange={e => setRegForm({ ...regForm, buildingCode: e.target.value.toUpperCase() })}
                                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none font-medium"
                                            placeholder="Nhập mã định danh (Ví dụ: L81_SAIGON)"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Mật khẩu</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <input type="password" required value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none font-medium" placeholder="••••••••" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Nhập lại mật khẩu</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <input type="password" required value={regForm.confirm} onChange={e => setRegForm({ ...regForm, confirm: e.target.value })} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none font-medium" placeholder="••••••••" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 mt-6 disabled:opacity-70">
                                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang gửi...</> : 'GỬI YÊU CẦU ĐĂNG KÝ'}
                                </button>

                                <p className="text-center text-sm text-slate-500 mt-4">
                                    Đã có tài khoản? <span onClick={() => { setIsRegisterMode(false); setError(''); }} className="font-bold text-blue-600 cursor-pointer hover:underline">Đăng nhập ngay</span>
                                </p>
                            </form>
                        ) : (
                            /* HIỂN THỊ FORM ĐĂNG NHẬP */
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Tài khoản</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                        <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 font-medium" placeholder="Nhập username..." />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 font-medium" placeholder="••••••••" />
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 mt-2 disabled:opacity-70">
                                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</> : 'ĐĂNG NHẬP VÀO HỆ THỐNG'}
                                </button>

                                <p className="text-center text-sm text-slate-500 mt-4">
                                    Nhân sự mới? <span onClick={() => { setIsRegisterMode(true); setError(''); }} className="font-bold text-blue-600 cursor-pointer hover:underline">Yêu cầu cấp tài khoản</span>
                                </p>
                            </form>
                        )}
                    </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl opacity-50 z-0 pointer-events-none"></div>
            </div>
        </div>
    );
};

export default Login;