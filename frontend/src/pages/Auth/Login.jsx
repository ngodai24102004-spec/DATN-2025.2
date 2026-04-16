import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { loginApi } from '../../services/auth.service';
import { User, Lock, AlertCircle, Loader2, ArrowLeft, Building2 } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await loginApi(username, password);
            loginUser(data.user, data.token);

            if (data.user.role === 'SUPER_ADMIN') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 font-sans">
            {/* Cột trái - Hình ảnh & Branding (Sẽ ẩn trên điện thoại nhỏ) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
                {/* Ảnh nền */}
                <img
                    src="https://images.unsplash.com/photo-1558442074-3c19857bc1dc?q=80&w=1200&auto=format&fit=crop"
                    alt="BMS Chiller System"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
                />

                <div className="relative z-10 p-12 flex flex-col h-full justify-between w-full">
                    {/* Logo / Tên hệ thống */}
                    <div>
                        <div className="flex items-center gap-3 text-blue-400 font-bold text-2xl mb-2">
                            <Building2 className="w-8 h-8" />
                            BMS
                        </div>
                    </div>

                    {/* Slogan */}
                    <div className="max-w-xl">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Quản lý tòa nhà <br /> Thông minh & Hiệu quả
                        </h1>
                        <p className="text-lg text-slate-300 leading-relaxed">
                            Nền tảng giám sát và điều khiển Chiller trung tâm đa tòa nhà. Tối ưu hóa quy trình vận hành và giảm thiểu rủi ro sự cố.
                        </p>
                    </div>

                    {/* Footer nhỏ */}
                    <div className="text-sm text-slate-400 font-medium">
                        &copy; 2026 Đồ án tốt nghiệp Kỹ sư
                    </div>
                </div>
            </div>

            {/* Cột phải - Form Đăng nhập */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-10">
                    <div className="p-8 sm:p-10">

                        {/* Nút quay lại */}
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-8"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Quay lại trang chủ
                        </button>

                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Đăng nhập</h2>
                            <p className="text-slate-500 font-medium">Vui lòng nhập thông tin tài khoản để tiếp tục</p>
                        </div>

                        {/* Thông báo lỗi */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-start gap-3 rounded-r-md animate-pulse">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 font-medium leading-relaxed">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Input Tài khoản */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Tài khoản</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Nhập username..."
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 font-medium"
                                    />
                                </div>
                            </div>

                            {/* Input Mật khẩu */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 font-medium"
                                    />
                                </div>
                            </div>

                            {/* Nút Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all focus:ring-4 focus:ring-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-lg shadow-blue-500/30"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'ĐĂNG NHẬP VÀO HỆ THỐNG'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Vòng tròn trang trí mờ phía sau form */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl opacity-50 z-0 pointer-events-none"></div>
            </div>
        </div>
    );
};

export default Login;