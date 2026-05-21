// src/services/building.service.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
// Lấy danh sách tất cả tòa nhà (Chỉ Super Admin)
export const getBuildingsApi = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/buildings/list`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
// Lấy chi tiết 1 tòa nhà kèm thiết bị và người quản lý
export const getBuildingByIdApi = async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/buildings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};