// src/services/device.service.js
import api from './api'; // 1. Thay thế import axios bằng api instance dùng chung

// API Thêm thiết bị
export const addDeviceApi = async (deviceData) => {
    try {
        const response = await api.post('/devices/add', deviceData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi khi thêm thiết bị");
    }
};

// API Lấy danh sách thiết bị
export const getDevicesApi = async () => {
    try {
        const response = await api.get('/devices/list');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi khi tải danh sách thiết bị");
    }
};

// API Lấy lịch sử thiết bị (Hỗ trợ truyền params để vẽ biểu đồ)
export const getDeviceHistoryApi = async (params) => {
    const response = await api.get('/devices/history', { params });
    return response.data;
};

// API Xóa thiết bị
export const deleteDeviceApi = async (id) => {
    try {
        const response = await api.delete(`/devices/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi khi xóa thiết bị");
    }
};

// API Điều khiển thiết bị (MQTT Publish)
export const controlDeviceApi = async (controlData) => {
    const response = await api.post('/devices/control', controlData);
    return response.data;
};

// API Cập nhật thiết bị
export const updateDeviceApi = async (id, updateData) => {
    try {
        const response = await api.put(`/devices/${id}`, updateData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi khi cập nhật thiết bị");
    }
};