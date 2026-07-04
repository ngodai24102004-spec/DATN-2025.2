import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = ({ children }) => {
    // Khởi tạo State quản lý đóng/mở Sidebar dạng ngăn kéo trên di động
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        // 1. SỬA: Đổi từ min-h-screen sang h-screen và thêm overflow-hidden để khóa cứng cuộn toàn trang
        <div className="h-screen bg-[#020617] bg-scada-grid relative overflow-hidden flex flex-col font-sans">
            {/* 1. Sidebar nhận thêm trạng thái mở và hàm đóng */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* 2. Lớp phủ đen mờ (Backdrop) khi mở ngăn kéo trên điện thoại */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* 3. SỬA: Đổi min-h-screen sang h-screen để cột bên phải chiếm khít 100% chiều cao màn hình */}
            <div className="flex flex-col min-w-0 lg:pl-72 transition-all duration-300 h-screen">
                {/* Truyền hàm toggle mở sidebar vào Header */}
                <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                {/* 4. SỬA: Thêm overflow-y-auto để CHỈ CHO CUỘN RIÊNG vùng nội dung công việc (main) */}
                <main className="p-4 sm:p-6 lg:p-8 relative flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;