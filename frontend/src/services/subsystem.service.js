import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export const getSubsystemsApi = async () => {
    const response = await axios.get(`${API_URL}/subsystems/list`, { headers: getAuthHeader() });
    return response.data;
};
export const addSubsystemApi = async (data) => {
    const response = await axios.post(`${API_URL}/subsystems/add`, data, { headers: getAuthHeader() });
    return response.data;
};
export const deleteSubsystemApi = async (id) => {
    const response = await axios.delete(`${API_URL}/subsystems/${id}`, { headers: getAuthHeader() });
    return response.data;
};