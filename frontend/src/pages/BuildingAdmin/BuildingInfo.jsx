import React, { useState, useEffect } from 'react';
import { getProfileApi } from '../../services/auth.service';
import {
    Building2, MapPin, Hash, UserCircle, Shield,
    Server, Activity, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BuildingInfo() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    // GỌI API LẤY THÔNG TIN CHUẨN XÁC TỪ DATABASE (MỚI NHẤT)
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfileApi();
                setProfileData(data);
            } catch (error) {
                console.error("Lỗi tải thông tin:", error);
                toast.error("Không thể tải thông tin cơ sở!");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // Hiệu ứng Loading chuyên nghiệp
    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-blue-500 gap-4">
                <RefreshCw size={40} className="animate-spin" />
                <p className="font-bold tracking-widest text-xs uppercase">Đang đồng bộ hồ sơ...</p>
            </div>
        );
    }

    // Bóc tách dữ liệu an toàn từ API trả về
    const building = profileData?.managedBuildings?.[0]?.building || {};
    const user = profileData || {};

    return (
        <div className="min-h-screen bg-[#020617] bg-scada-grid p-6 font-sans text-slate-200">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-3xl shadow-2xl mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600/20 border border-blue-500/30 p-3 rounded-2xl shadow-lg shadow-blue-500/10">
                        <Building2 size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white uppercase tracking-tight">Hồ Sơ Cơ Sở Hạ Tầng</h1>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5">THÔNG TIN ĐỊNH DANH HỆ THỐNG</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1200px] mx-auto">

                {/* CARD 1: THÔNG TIN TÒA NHÀ */}
                <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
                    {/* Hiệu ứng ánh sáng nền */}
                    <div className="absolute right-0 top-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>

                    <h2 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-8 border-b border-slate-800/50 pb-4">
                        <Server size={18} /> Định Danh Cơ Sở
                    </h2>

                    <div className="space-y-6 relative z-10">
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                <Building2 size={12} /> Tên Tòa Nhà / Dự Án
                            </p>
                            <p className="text-xl font-bold text-white">{building.name || 'N/A'}</p>
                        </div>

                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                <Hash size={12} /> Mã Hệ Thống (Building Code)
                            </p>
                            <div className="inline-block bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-lg mt-1">
                                <p className="text-sm font-mono font-bold text-blue-400 tracking-wider">
                                    {building.code || 'N/A'}
                                </p>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 italic">
                                * Sử dụng mã này để đồng bộ hệ thống trên thiết bị Edge Gateway.
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                <MapPin size={12} /> Vị trí tọa lạc
                            </p>
                            <p className="text-sm font-medium text-slate-300">
                                {building.address || <span className="text-slate-500 italic">Chưa có dữ liệu địa chỉ trên hệ thống.</span>}
                            </p>
                        </div>
                    </div>
                </div>

                {/* CARD 2: THÔNG TIN TÀI KHOẢN VẬN HÀNH */}
                <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>

                    <h2 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-8 border-b border-slate-800/50 pb-4">
                        <UserCircle size={18} /> Hồ Sơ Vận Hành Viên
                    </h2>

                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/60">
                            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/30 flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Họ và tên Quản lý</p>
                                <p className="text-lg font-bold text-white leading-tight">{user.fullName || 'N/A'}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                <UserCircle size={12} /> Tên đăng nhập (Username)
                            </p>
                            {/* DỮ LIỆU USERNAME ĐÃ ĐƯỢC LOAD LÊN CHUẨN XÁC TỪ DATABASE */}
                            <p className="text-sm font-mono font-medium text-slate-300">@{user.username || 'N/A'}</p>
                        </div>

                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                <Shield size={12} /> Chức vụ / Phân quyền
                            </p>
                            <span className="inline-block bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 mt-1 rounded text-[10px] font-black text-emerald-400 tracking-widest">
                                {user.role || 'BUILDING_ADMIN'}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}