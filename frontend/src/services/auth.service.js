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

export const registerApi = async (registerData) => {
    const response = await axios.post(`${API_URL}/auth/register`, registerData);
    return response.data;
};

export const getProfileApi = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateNameApi = async (fullName) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/auth/profile/name`,
        { fullName },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

export const getBuildingAdminsApi = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/auth/building-admins`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteUserApi = async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateUserApi = async (id, data) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/auth/users/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const addManagerToBuildingApi = async (data) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/auth/add-manager`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi không xác định từ máy chủ");
    }
};