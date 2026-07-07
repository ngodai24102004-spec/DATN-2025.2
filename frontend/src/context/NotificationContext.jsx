import { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext'; // Gọi AuthContext để lấy thông tin user

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [socket, setSocket] = useState(null);

    // ==========================================
    // 1. QUẢN LÝ KẾT NỐI SOCKET TỔNG CHO TOÀN APP
    // ==========================================
    useEffect(() => {
        // Chỉ kết nối khi đã đăng nhập (có user)
        if (user) {
            const newSocket = io("http://localhost:3000");

            newSocket.on("connect", () => {
                if (user.role === 'SUPER_ADMIN') {
                    newSocket.emit("join-super-admin");
                } else if (user.building?.id) {
                    newSocket.emit("join-building", user.building.id);
                }
            });

            // LẮNG NGHE LỖI ĐỂ RUNG CHUÔNG BẤT KỂ ĐANG Ở TRANG NÀO
            newSocket.on("device-update", (payload) => {
                if (payload.latest_state.fault === 1) {
                    // Truyền toàn bộ payload vào để lấy details
                    addNotification(payload);
                } else {
                    removeNotification(payload.code);
                }
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
                console.log("🌐 [Global Socket] Disconnected!");
            };
        }
    }, [user]);

    // ==========================================
    // 2. LOGIC QUẢN LÝ CHUÔNG
    // ==========================================
    const addNotification = useCallback((payload) => {
        const now = new Date().toLocaleTimeString('vi-VN');
        setNotifications(prev => {
            const existingIndex = prev.findIndex(n => n.code === payload.code);
            if (existingIndex !== -1) {
                const updatedNotis = [...prev];
                updatedNotis[existingIndex].time = now; // Cập nhật giờ
                return updatedNotis;
            } else {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(() => { });

                // LƯU CẢ DETAILS VÀO STATE
                const newNoti = {
                    code: payload.code,
                    details: payload.details, // Dữ liệu chi tiết từ BE gửi xuống
                    time: now,
                };
                return [newNoti, ...prev];
            }
        });
    }, []);

    const removeNotification = useCallback((deviceCode) => {
        setNotifications(prev => prev.filter(n => n.code !== deviceCode));
    }, []);

    const clearAll = () => setNotifications([]);

    return (
        // Xuất biến `socket` ra ngoài để Dashboard có thể dùng ké
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll, socket }}>
            {children}
        </NotificationContext.Provider>
    );
};