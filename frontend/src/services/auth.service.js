import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const loginApi = async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            username,
            password
        });
        return response.data; // Trả về { token, user }
    } catch (error) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Không thể kết nối đến Máy chủ");
    }
};

export const getProfileApi = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};