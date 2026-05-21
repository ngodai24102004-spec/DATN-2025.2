// src/pages/SuperAdmin/SystemManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBuildingsApi } from '../../services/building.service';
import { Building2, MapPin, ShieldCheck, Plus, Eye, UserCircle, Search, RefreshCw } from 'lucide-react';

export default function SystemManagement() {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchBuildings = async () => {
        setLoading(true);
        try {
            const data = await getBuildingsApi();
            setBuildings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuildings();
    }, []);

    const filteredBuildings = buildings.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans space-y-6">
            {/* --- HEADER --- */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg shadow-slate-200">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Quản trị toàn hệ thống</h1>
                        <p className="text-xs text-slate-500 font-bold">Quản lý các cơ sở và phân quyền Building Admin</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tòa nhà..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                        />
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-200 whitespace-nowrap">
                        <Plus size={16} /> THÊM TÒA NHÀ
                    </button>
                </div>
            </div>

            {/* --- DANH SÁCH TÒA NHÀ (TABLE) --- */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <Building2 size={16} className="text-blue-600" /> Danh sách cơ sở
                    </h2>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest">
                        TỔNG: {filteredBuildings.length}
                    </span>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center text-slate-400 font-bold animate-pulse">
                        <RefreshCw className="animate-spin mb-4" size={32} /> ĐANG TẢI DỮ LIỆU...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                    <th className="p-4 pl-6">Mã Định Danh (Code)</th>
                                    <th className="p-4">Tên Cơ Sở</th>
                                    <th className="p-4">Vị Trí / Địa Chỉ</th>
                                    <th className="p-4">Building Admin</th>
                                    <th className="p-4 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredBuildings.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-medium">Không tìm thấy tòa nhà nào</td></tr>
                                ) : (
                                    filteredBuildings.map((building) => (
                                        <tr key={building.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">

                                            {/* CỘT 1: MÃ CODE */}
                                            <td className="p-4 pl-6 font-mono font-bold text-slate-700">
                                                <div className="bg-slate-100 w-fit px-2 py-1 rounded border border-slate-200">
                                                    {building.code}
                                                </div>
                                            </td>

                                            {/* CỘT 2: TÊN TÒA NHÀ */}
                                            <td className="p-4 font-bold text-slate-800">
                                                {building.name}
                                            </td>

                                            {/* CỘT 3: ĐỊA CHỈ */}
                                            <td className="p-4 text-slate-500 font-medium flex items-center gap-1.5 mt-2">
                                                <MapPin size={14} className="text-orange-500" />
                                                {building.address || <span className="italic opacity-50">Chưa cập nhật</span>}
                                            </td>

                                            {/* CỘT 4: NGƯỜI QUẢN LÝ */}
                                            <td className="p-4">
                                                {building.managers.length > 0 ? (
                                                    <div className="flex flex-col gap-2">
                                                        {building.managers.map((mgr) => (
                                                            <div key={mgr.user.id} className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 w-fit">
                                                                <UserCircle size={14} className="text-emerald-600" />
                                                                <div>
                                                                    <p className="text-[11px] font-bold text-emerald-800 leading-none">{mgr.user.fullName}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-md font-bold border border-red-100">Chưa bổ nhiệm</span>
                                                )}
                                            </td>

                                            {/* CỘT 5: THAO TÁC */}
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => navigate(`/admin/building/${building.id}`)}
                                                    className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 transition-all shadow-sm group-hover:shadow-md"
                                                >
                                                    <Eye size={14} /> CHI TIẾT
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}