import { useContext } from 'react';
import { Navigate } from "react-router-dom";
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
    const { user, loading } = useContext(AuthContext);

    // Lấy token từ bộ nhớ
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    // Đang tải dữ liệu User thì không làm gì cả (Chống màn hình nháy)
    if (loading) return null;

    // TẦNG BẢO VỆ 1: CHƯA ĐĂNG NHẬP -> Đuổi ra trang Login
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // TẦNG BẢO VỆ 2: SAI QUYỀN HẠN 
    if (requiredRole && user.role !== requiredRole) {
        // Nếu là Sếp mà đi lạc vào trang nhân viên -> Đẩy về Dashboard Sếp
        if (user.role === 'SUPER_ADMIN') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        // Nếu là Nhân viên mà đi lạc vào trang Sếp -> Đẩy về Dashboard Nhân viên
        else {
            return <Navigate to="/dashboard" replace />;
        }
    }

    // TẦNG BẢO VỆ 3: HỢP LỆ HOÀN TOÀN -> Mời vào trong
    return children;
}