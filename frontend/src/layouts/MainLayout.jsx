// src/layouts/MainLayout.jsx
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = ({ children }) => {
    // Khởi tạo State quản lý đóng/mở Sidebar dạng ngăn kéo trên di động
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#020617] bg-scada-grid relative overflow-x-hidden">
            {/* 1. Sidebar nhận thêm trạng thái mở và hàm đóng */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* 2. Lớp phủ đen mờ (Backdrop) khi mở ngăn kéo trên điện thoại */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* 3. Cột nội dung chính tự động thụt lề trên máy tính */}
            <div className="flex flex-col min-w-0 lg:pl-72 transition-all duration-300 min-h-screen">
                {/* Truyền hàm toggle mở sidebar vào Header */}
                <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="p-4 sm:p-6 lg:p-8 relative flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;