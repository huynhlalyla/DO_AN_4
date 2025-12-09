import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor để thêm token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor để xử lý lỗi
axiosInstance.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token hết hạn hoặc không hợp lệ
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error.message);
    }
);

// Auth API
export const authAPI = {
    // Kiểm tra sinh viên tồn tại (bằng email hoặc mã sinh viên)
    checkStudent: (identifier) => axiosInstance.post('/auth/check-student', { identifier }),
    
    login: (email, password) => axiosInstance.post('/auth/login', { email, password }),
    
    changePassword: (data) => axiosInstance.post('/auth/change-password', data),

    // Request OTP for first-time login or password reset
    requestOTP: (email, purpose = 'first-login') => 
        axiosInstance.post('/auth/request-otp', { email, purpose }),
    
    forgotPassword: (email) => axiosInstance.post('/auth/request-otp', { 
        email, 
        purpose: 'reset-password' 
    }),
    
    resetPassword: (email, otpCode, newPassword) => 
        axiosInstance.post('/auth/verify-otp', { email, otpCode, newPassword }),
    
    getCurrentUser: () => axiosInstance.get('/auth/me'),
    
    logout: () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
    }
};

// Assessment API
export const assessmentAPI = {
    getScoreSheet: (semesterId) => axiosInstance.get('/students/assessment/score-sheet', { params: { semesterId } }),
    submitScore: (data) => axiosInstance.post('/students/assessment/submit', data),
    
    // Class Secretary
    getClassStatus: (classId, semesterId) => axiosInstance.get(`/students/assessment/class/${classId}`, { params: { semesterId } }),
    getStudentScoreSheet: (studentId, semesterId) => axiosInstance.get(`/students/assessment/secretary/student/${studentId}`, { params: { semesterId } }),
    updateStudentScore: (data) => axiosInstance.post('/students/assessment/secretary/update-score', data),
    finalizeStudent: (data) => axiosInstance.post('/students/assessment/secretary/finalize', data),

    // Faculty Secretary
    getFacultyClasses: (facultyId, semesterId) => axiosInstance.get(`/students/assessment/faculty/${facultyId}/classes`, { params: { semesterId } }),
    approveClass: (data) => axiosInstance.post('/students/assessment/faculty/approve-class', data),
    remindClass: (data) => axiosInstance.post('/students/assessment/faculty/remind', data)
};

// Event API
export const eventAPI = {
    getAll: () => axiosInstance.get('/events'),
    
    getById: (id) => axiosInstance.get(`/events/${id}`),
    
    // Lấy sự kiện phù hợp cho sinh viên (theo khoa/lớp)
    getForStudent: (facultyId, classId) => 
        axiosInstance.get('/events/for-student', { 
            params: { facultyId, classId } 
        }),
    
    // Đăng ký tham gia sự kiện
    register: (eventId, studentId) => axiosInstance.post(`/events/${eventId}/register`, { studentId }),
    
    // Hủy đăng ký sự kiện
    unregister: (eventId, studentId) => axiosInstance.post(`/events/${eventId}/unregister`, { studentId }),
    
    // Lấy danh sách sự kiện đã đăng ký
    getRegisteredEvents: (studentId) => axiosInstance.get('/events/my-events', { params: { studentId } }),

    // Lấy danh sách người tham gia (cho modal chi tiết)
    getParticipants: (eventId) => axiosInstance.get(`/events/${eventId}/participants`),
    
    // Submit điểm chứng nhận
    submitScore: (eventId, studentId, scoreData) => 
        axiosInstance.post(`/events/${eventId}/students/${studentId}/score`, scoreData),

    // Tạo sự kiện (cho bí thư lớp)
    createEvent: (formData) => axiosInstance.post('/events', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),

    // Cập nhật sự kiện
    updateEvent: (id, formData) => axiosInstance.put(`/events/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),

    // Lấy sự kiện do mình tạo
    getCreatedEvents: (userId) => axiosInstance.get('/events/created-by-me', { params: { userId } }),

    // Hủy sự kiện (Organizer)
    cancelEvent: (id, reason) => axiosInstance.post(`/events/${id}/cancel`, { reason }),

    // Xóa sự kiện
    deleteEvent: (id) => axiosInstance.delete(`/events/${id}`)
};

// Student API
export const studentAPI = {
    getById: (id) => axiosInstance.get(`/students/${id}`),
    
    update: (id, data) => axiosInstance.put(`/students/${id}`, data),
    
    getMyScores: () => axiosInstance.get('/students/my-scores'),
    
    // Cho bí thư lớp
    getClassStudents: () => axiosInstance.get('/students/my-class'),
    
    getClassScores: () => axiosInstance.get('/students/class-scores')
};

// Common API
export const commonAPI = {
    getCriteria: () => axiosInstance.get('/criteria'),
    getSemesters: () => axiosInstance.get('/semesters')
};

export default axiosInstance;
