import { motion, useScroll, useTransform } from "framer-motion";
import {
    Activity,
    Settings,
    Building2,
    Database,
    LineChart,
    Cpu,
    ShieldCheck,
    Box,
    Layers,
    History
} from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const heroRef = useRef(null);
    const navigate = useNavigate();

    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });

    const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    // ĐÃ VIẾT LẠI NỘI DUNG TÍNH NĂNG CHUẨN BMS DOANH NGHIỆP
    const features = [
        {
            icon: Box,
            title: "Bản sao số (Digital Twin) 3D",
            description: "Trực quan hóa không gian tòa nhà bằng mô hình 3D tương tác. Cho phép bóc tách từng tầng và giám sát thiết bị cơ điện trực tiếp trên mô hình không gian."
        },
        {
            icon: Activity,
            title: "Vận hành Đa phân hệ",
            description: "Quản lý tập trung toàn bộ hạ tầng: Hệ thống HVAC (Chiller, AHU), Chiếu sáng thông minh (Dimmer), Bơm cấp nước và Quạt thông gió trên cùng một nền tảng."
        },
        {
            icon: Building2,
            title: "Quản trị Đa cơ sở (Multi-tenant)",
            description: "Kiến trúc phân tán cho phép Super Admin quản lý hàng chục tòa nhà. Tự động nội suy và phân quyền dữ liệu độc lập cho từng Building Admin."
        },
        {
            icon: ShieldCheck,
            title: "Truy vết kiểm toán (Audit Trail)",
            description: "Tính năng điều khiển vòng kín (Closed-loop). Ghi nhận và đối chiếu mọi thao tác điều khiển của nhân sự, đảm bảo an toàn tuyệt đối trong vận hành công nghiệp."
        },
        {
            icon: LineChart,
            title: "Phân tích Dữ liệu Time-series",
            description: "Vẽ biểu đồ lịch sử siêu tốc độ từ InfluxDB. Hỗ trợ xuất báo cáo Excel (CSV) để tính toán tải lạnh, mức tiêu thụ và tối ưu hóa năng lượng (Energy Efficiency)."
        },
        {
            icon: Settings,
            title: "Cảnh báo & Liên động an toàn",
            description: "Phát hiện sự cố phần cứng theo thời gian thực với độ trễ mili-giây qua WebSocket. Tự động hiển thị cảnh báo đỏ và khóa các lệnh điều khiển nguy hiểm."
        }
    ];

    return (
        <div className="w-full bg-slate-50 font-sans">
            {/* Hero Section */}
            <section ref={heroRef} className="relative h-screen overflow-hidden">
                <motion.div
                    className="absolute inset-0"
                    style={{ y: imageY }}
                >
                    <img
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop"
                        alt="Tòa nhà thông minh"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/95 via-[#0f172a]/80 to-transparent" />
                </motion.div>

                <motion.div
                    className="relative h-full flex items-center px-6 md:px-12 lg:px-24"
                    style={{ opacity }}
                >
                    <div className="max-w-4xl text-white">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <div className="inline-block text-xs tracking-widest uppercase mb-6 text-blue-400 font-bold bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                Nền tảng PropTech & IoT Cloud 2026
                            </div>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6 leading-tight font-extrabold text-white tracking-tight">
                                Hệ thống Quản trị <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Tòa Nhà Thông Minh</span>
                            </h1>
                            <p className="text-lg md:text-xl mb-10 text-slate-300 max-w-2xl leading-relaxed">
                                Giải pháp BMS toàn diện tích hợp giao thức MQTT. Đưa toàn bộ hạ tầng cơ điện (MEP) của doanh nghiệp lên Đám mây để giám sát, điều khiển và tối ưu hóa năng lượng.
                            </p>
                            <div className="flex gap-4">
                                <motion.button
                                    onClick={() => navigate('/login')}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 text-sm uppercase tracking-widest font-bold transition-all rounded-xl shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center gap-3"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Cpu size={18} /> Đăng nhập hệ thống BMS
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="px-6 md:px-12 lg:px-24 py-24 bg-slate-50">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="max-w-7xl mx-auto"
                >
                    <h2 className="text-4xl md:text-5xl mb-6 text-slate-900 font-black tracking-tight">
                        Kiến trúc vận hành toàn diện
                    </h2>
                    <p className="text-lg text-slate-500 mb-16 max-w-3xl leading-relaxed">
                        Chấm dứt kỷ nguyên giám sát rời rạc. Hệ thống cung cấp một bảng điều khiển duy nhất (Single Pane of Glass) để quản trị mọi ngóc ngách của công trình.
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="bg-white p-8 border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:border-blue-200 rounded-[1.5rem] group"
                            >
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                                    <feature.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300" strokeWidth={2} />
                                </div>
                                <h3 className="text-xl mb-3 text-slate-900 font-bold tracking-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Technology Section */}
            <section className="px-6 md:px-12 lg:px-24 py-24 bg-[#020617] text-slate-200">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="inline-block text-[10px] tracking-widest uppercase mb-4 text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                            Core Technology
                        </div>
                        <h2 className="text-4xl md:text-5xl mb-6 text-white font-black tracking-tight">
                            Hạ tầng Viễn thông & Dữ liệu
                        </h2>
                        <p className="text-slate-400 mb-10 leading-relaxed text-lg">
                            Hệ thống Edge Gateway thu thập dữ liệu Modbus/BACnet từ PLC tại hiện trường, đóng gói và truyền tải lên Cloud Server thông qua giao thức MQTT với cơ chế bảo mật TLS/SSL.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                                <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30">
                                    <Database className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-1">Kiến trúc CSDL Lai (Hybrid DB)</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">Sử dụng MySQL (Prisma ORM) cho quan hệ thực thể, kết hợp InfluxDB để xử lý hàng triệu điểm dữ liệu Time-series mỗi ngày.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                                <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
                                    <Activity className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-1">Mạng lưới Socket.io Real-time</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">Phân luồng dữ liệu độc lập (Rooms) cho từng Tòa nhà. Đảm bảo Dashboard và mô hình 3D luôn đồng bộ với trạng thái máy móc thực tế.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="relative"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1558442074-3c19857bc1dc?q=80&w=1200&auto=format&fit=crop"
                            alt="Data Control Center"
                            className="w-full h-[600px] object-cover rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 relative border border-slate-800"
                        />
                        {/* Hiệu ứng trang trí đằng sau ảnh */}
                        <div className="absolute inset-0 border-2 border-blue-500/30 rounded-3xl transform translate-x-6 translate-y-6 z-0"></div>
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 md:px-12 lg:px-24 py-10 bg-[#010409] text-slate-500 text-sm border-t border-slate-800/50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Building2 size={20} className="text-blue-500" />
                        <span className="font-bold tracking-widest text-slate-300 uppercase">Hệ thống BMS Trung Tâm</span>
                    </div>
                    <p className="font-medium tracking-wide">
                        © 2026 ĐỒ ÁN TỐT NGHIỆP KỸ SƯ
                    </p>
                    <p className="flex items-center gap-2">
                        Xây dựng bằng <span className="text-cyan-400 font-bold">React Fiber</span> & <span className="text-green-500 font-bold">Node.js</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}