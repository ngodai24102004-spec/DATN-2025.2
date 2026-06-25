import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});

// Tự động đính kèm Access Token vào Header của các API yêu cầu xác thực
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && token !== 'undefined' && token !== 'null') {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Tự động bắt lỗi Token hết hạn để đi xin Token mới
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // ====================================================================
        // BỔ SUNG KHÓA LOẠI TRỪ AN TOÀN CHO TRANG ĐĂNG NHẬP / LÀM MỚI
        // ====================================================================
        if (
            originalRequest.url.includes('/auth/login') ||
            originalRequest.url.includes('/auth/refresh-token')
        ) {
            // Ném lỗi thẳng về cho Component Login xử lý, không chạy logic bên dưới
            return Promise.reject(error);
        }
        // ====================================================================

        // Nếu lỗi 401/403 (Hết hạn Access Token) và chưa từng được thử lại
        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
                const { accessToken } = res.data;

                localStorage.setItem('token', accessToken);
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;