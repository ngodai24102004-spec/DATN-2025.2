// src/services/subsystem.service.js
import api from './api'; // 1. Thay thế import axios bằng api instance dùng chung

export const getSubsystemsApi = async () => {
    const response = await api.get('/subsystems/list');
    return response.data;
};

export const addSubsystemApi = async (data) => {
    const response = await api.post('/subsystems/add', data);
    return response.data;
};

export const deleteSubsystemApi = async (id) => {
    const response = await api.delete(`/subsystems/${id}`);
    return response.data;
};