import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
// API Gửi yêu cầu đăng ký tài khoản mới (Không cần truyền token)
export const requestRegisterApi = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/auth/request-register`, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi không xác định từ máy chủ");
    }
};

export const getPendingUsersApi = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/auth/pending-users`, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
};

// Xử lý Duyệt / Từ chối
export const handleApprovalApi = async (data) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/auth/handle-approval`, data, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
};

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

// Khóa / Mở khóa tài khoản
export const toggleLockUserApi = async (id) => {
    try {
        // GIẢI PHÁP TỐI ƯU: Tìm Token ở cả sessionStorage và localStorage
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');

        const response = await axios.put(`${API_URL}/auth/users/${id}/lock`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        // Bắt lỗi và ném ra để giao diện nhận được đúng câu chữ
        throw error;
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

export const changePasswordApi = async (data) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/auth/change-password`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
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