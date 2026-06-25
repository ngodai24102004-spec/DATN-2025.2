// src/services/building.service.js
import api from './api'; // 1. Thay thế import axios bằng api instance dùng chung

// Lấy danh sách tất cả tòa nhà (Chỉ Super Admin)
export const getBuildingsApi = async () => {
    const response = await api.get('/buildings/list');
    return response.data;
};

// Lấy chi tiết 1 tòa nhà kèm thiết bị và người quản lý
export const getBuildingByIdApi = async (id) => {
    const response = await api.get(`/buildings/${id}`);
    return response.data;
};

// Xóa tòa nhà (Chỉ Super Admin)
export const deleteBuildingApi = async (id) => {
    const response = await api.delete(`/buildings/${id}`);
    return response.data;
};

// Cập nhật tòa nhà (Chỉ Super Admin)
export const updateBuildingApi = async (id, data) => {
    const response = await api.put(`/buildings/${id}`, data);
    return response.data;
};

// Lấy dashboard tổng quan hệ thống (Chỉ Super Admin)
export const getSystemDashboardApi = async () => {
    const response = await api.get('/buildings/system-dashboard');
    return response.data;
};