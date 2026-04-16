import { motion, useScroll, useTransform } from "framer-motion";
import {
    Activity,
    Settings,
    Building2,
    Database,
    LineChart,
    CalendarClock,
    Cpu,
    ShieldCheck
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

    const features = [
        {
            icon: Activity,
            title: "Giám sát Real-time",
            description: "Theo dõi liên tục nhiệt độ, áp suất, lưu lượng và trạng thái vận hành của Chiller, Bơm, Tháp giải nhiệt với độ trễ tính bằng mili-giây."
        },
        {
            icon: Settings,
            title: "Điều khiển Liên động",
            description: "Điều khiển Bật/Tắt và thay đổi tốc độ thiết bị từ xa. Tích hợp logic liên động an toàn giữa Van, Bơm và Chiller."
        },
        {
            icon: Building2,
            title: "Quản lý Đa tòa nhà",
            description: "Kiến trúc Multi-tenant cho phép Super Admin quản lý toàn dự án, trong khi Admin tòa nhà chỉ thao tác trên hệ thống được phân quyền."
        },
        {
            icon: LineChart,
            title: "Tính toán Tải lạnh",
            description: "Tự động phân tích dữ liệu cảm biến đường ống để tính toán Cooling Load, tối ưu hóa năng lượng tiêu thụ của hệ thống."
        },
        {
            icon: Database,
            title: "Lưu trữ Lai (Hybrid DB)",
            description: "Sử dụng MySQL để quản lý thực thể, phân quyền và InfluxDB chuyên dụng để lưu trữ dữ liệu chuỗi thời gian (Time-series) siêu tốc."
        },
        {
            icon: CalendarClock,
            title: "Lập lịch & Runtime",
            description: "Tự động tính toán tổng thời gian hoạt động (Runtime) phục vụ bảo trì và hỗ trợ lập lịch vận hành tự động trong năm."
        }
    ];

    return (
        <div className="w-full bg-white font-sans">
            {/* Hero Section */}
            <section ref={heroRef} className="relative h-screen overflow-hidden">
                <motion.div
                    className="absolute inset-0"
                    style={{ y: imageY }}
                >
                    {/* ẢNH TÒA NHÀ THÔNG MINH HIỆN ĐẠI CỦA BẠN NẰM Ở ĐÂY */}
                    <img
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop"
                        alt="Tòa nhà thông minh"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-transparent" />
                </motion.div>

                <motion.div
                    className="relative h-full flex items-center px-6 md:px-12 lg:px-24"
                    style={{ opacity }}
                >
                    <div className="max-w-3xl text-white">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <div className="text-sm tracking-widest uppercase mb-6 text-blue-400 font-bold">
                                Đồ án Tốt Nghiệp Kỹ Sư - Smart Building
                            </div>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6 leading-tight font-extrabold text-white">
                                Hệ thống Quản lý<br />
                                <span className="text-blue-500">Chiller Trung Tâm</span>
                            </h1>
                            <p className="text-xl md:text-2xl mb-10 text-slate-300 max-w-2xl leading-relaxed">
                                Nền tảng IoT Cloud ứng dụng giao thức MQTT, giám sát và điều khiển thông minh hệ thống HVAC đa tòa nhà.
                            </p>
                            <div className="flex gap-4">
                                <motion.button
                                    onClick={() => navigate('/login')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 text-lg font-bold transition-colors rounded shadow-lg shadow-blue-500/30"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Đăng nhập hệ thống
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
                    <h2 className="text-4xl md:text-5xl mb-6 text-slate-900 font-bold">
                        Kiến trúc toàn diện
                    </h2>
                    <p className="text-xl text-slate-600 mb-16 max-w-3xl">
                        Giải quyết triệt để bài toán giám sát rời rạc bằng nền tảng Cloud tập trung,
                        tối ưu hóa quy trình vận hành và tiết kiệm năng lượng.
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="bg-white p-8 border border-slate-200 shadow-sm transition-all hover:shadow-xl rounded-xl"
                            >
                                <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                                    <feature.icon className="w-8 h-8 text-blue-600" strokeWidth={2} />
                                </div>
                                <h3 className="text-2xl mb-4 text-slate-900 font-bold">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Technology Section */}
            <section className="px-6 md:px-12 lg:px-24 py-24 bg-white">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <h2 className="text-4xl md:text-5xl mb-6 text-slate-900 font-bold">
                            Công nghệ & Viễn thông
                        </h2>
                        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                            Sử dụng Enterprise Server (EBO) đóng vai trò Edge Gateway, thu thập dữ liệu Modbus/BACnet từ PLC và đẩy lên Cloud qua giao thức MQTT bảo mật.
                        </p>
                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <Cpu className="w-6 h-6 text-blue-700" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-1">Node.js & Express</h4>
                                    <p className="text-slate-600">Backend xử lý bất đồng bộ mạnh mẽ, đáp ứng hàng ngàn request/giây.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <Database className="w-6 h-6 text-blue-700" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-1">Prisma ORM & InfluxDB</h4>
                                    <p className="text-slate-600">Tối ưu truy vấn dữ liệu quan hệ và dữ liệu chuỗi thời gian (Time-series).</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <ShieldCheck className="w-6 h-6 text-blue-700" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-1">Bảo mật RBAC</h4>
                                    <p className="text-slate-600">Mã hóa Bcrypt, xác thực JWT và phân quyền chặn chẽ theo từng Tòa nhà.</p>
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
                        {/* ẢNH HỆ THỐNG ĐIỀU KHIỂN DATA CENTER/BMS Ở ĐÂY */}
                        <img
                            src="https://images.unsplash.com/photo-1558442074-3c19857bc1dc?q=80&w=1200&auto=format&fit=crop"
                            alt="Data Control Center"
                            className="w-full h-[600px] object-cover rounded-2xl shadow-2xl"
                        />
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-2xl transform translate-x-4 translate-y-4 -z-10"></div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 md:px-12 lg:px-24 py-8 bg-slate-950 text-slate-400 text-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <p className="font-semibold tracking-wide">
                        © 2026 ĐỒ ÁN TỐT NGHIỆP KỸ SƯ
                    </p>
                    <p className="mt-4 md:mt-0 flex items-center gap-2">
                        Phát triển với <span className="text-blue-400 font-bold">React</span> & <span className="text-blue-400 font-bold">Node.js</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}