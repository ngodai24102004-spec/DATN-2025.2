// src/services/device.service.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Hàm tiện ích để lấy token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

// API Thêm thiết bị
export const addDeviceApi = async (deviceData) => {
    try {
        const response = await axios.post(`${API_URL}/devices/add`, deviceData, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi khi thêm thiết bị");
    }
};

// API Lấy danh sách thiết bị (Bạn sẽ cần API này ở Backend để render sơ đồ)
export const getDevicesApi = async () => {
    try {
        // Giả định bạn có viết route GET /api/devices/list ở backend
        const response = await axios.get(`${API_URL}/devices/list`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi khi tải danh sách thiết bị");
    }
};

// API Lấy lịch sử thiết bị
export const getDeviceHistoryApi = async (params) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/devices/history`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// API Xóa thiết bị
export const deleteDeviceApi = async (id) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${API_URL}/devices/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi khi xóa thiết bị");
    }
};

// API Điều khiển thiết bị
export const controlDeviceApi = async (controlData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/devices/control`, controlData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// API cập nhật thiết bị
export const updateDeviceApi = async (id, updateData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/devices/${id}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi khi cập nhật thiết bị");
    }
};