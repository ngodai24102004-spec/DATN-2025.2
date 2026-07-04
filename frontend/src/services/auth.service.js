// src/services/auth.service.js
import api from './api'; // 

export const sendOtpApi = async (emailData) => {
    try {
        const response = await api.post('/auth/send-otp', emailData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi khi gửi mã xác thực");
    }
};

// API Gửi yêu cầu đăng ký tài khoản mới (Không cần truyền token thủ công nữa)
export const requestRegisterApi = async (data) => {
    try {
        const response = await api.post('/auth/request-register', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi không xác định từ máy chủ");
    }
};

// Lấy danh sách tài khoản đang chờ duyệt
export const getPendingUsersApi = async () => {
    const response = await api.get('/auth/pending-users');
    return response.data;
};

// Xử lý Duyệt / Từ chối
export const handleApprovalApi = async (data) => {
    const response = await api.post('/auth/handle-approval', data);
    return response.data;
};

// Đăng nhập hệ thống (Sẽ nhận về accessToken từ BE)
export const loginApi = async (username, password) => {
    try {
        const response = await api.post('/auth/login', {
            username,
            password
        });
        return response.data; // Trả về { accessToken, user }
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
        const response = await api.put(`/auth/users/${id}/lock`, {});
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Khởi tạo cơ sở và quản trị viên trực tiếp
export const registerApi = async (registerData) => {
    const response = await api.post('/auth/register', registerData);
    return response.data;
};

// Lấy thông tin cá nhân của phiên làm việc hiện tại
export const getProfileApi = async () => {
    const response = await api.get('/auth/profile');
    return response.data;
};

// Cập nhật tên hiển thị
export const updateNameApi = async (fullName) => {
    const response = await api.put('/auth/profile/name', { fullName });
    return response.data;
};

// Thay đổi mật khẩu cá nhân
export const changePasswordApi = async (data) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
};

// Lấy danh sách tất cả các Building Admin
export const getBuildingAdminsApi = async () => {
    const response = await api.get('/auth/building-admins');
    return response.data;
};

// Xóa tài khoản vĩnh viễn
export const deleteUserApi = async (id) => {
    const response = await api.delete(`/auth/users/${id}`);
    return response.data;
};

// Cập nhật thông tin tài khoản bằng Admin
export const updateUserApi = async (id, data) => {
    const response = await api.put(`/auth/users/${id}`, data);
    return response.data;
};

// Thêm một quản lý mới vào tòa nhà đã tồn tại
export const addManagerToBuildingApi = async (data) => {
    try {
        const response = await api.post('/auth/add-manager', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Lỗi không xác định từ máy chủ");
    }
};