import { createContext, useState, useEffect } from 'react';
import api from '../services/api'; // Thêm dòng import này

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const loginUser = (userData, accessToken) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', accessToken); // Chỉ cần lưu Access Token ở client
    };

    const logoutUser = async () => {
        try {
            // Gọi API logout để xóa HttpOnly Cookie phía Backend
            await api.post('/auth/logout');
        } catch (err) {
            console.error("Lỗi gọi API đăng xuất:", err);
        } finally {
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};