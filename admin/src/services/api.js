// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Generic request handler
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({
            message: 'Đã xảy ra lỗi không xác định'
        }));
        throw new Error(error.message || `HTTP Error: ${response.status}`);
    }
    return response.json();
};

const handleError = (error) => {
    console.error('API Error:', error);
    throw error;
};

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// ============ FACULTY APIs ============
export const facultyAPI = {
    // Lấy tất cả khoa
    getAll: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/faculties`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Lấy khoa theo ID
    getById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/faculties/${id}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Tạo khoa mới
    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/faculties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Cập nhật khoa
    update: async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/faculties/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Xóa khoa
    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/faculties/${id}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
};

// ============ CLASS APIs ============
export const classAPI = {
    // Lấy tất cả lớp
    getAll: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/classes`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Lấy lớp theo ID
    getById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/classes/${id}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Lấy lớp theo khoa
    getByFaculty: async (facultyId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/classes/faculty/${facultyId}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Tạo lớp mới
    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/classes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Cập nhật lớp
    update: async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Xóa lớp
    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
};

// ============ STUDENT APIs ============
export const studentAPI = {
    // Lấy tất cả sinh viên
    getAll: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/students`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Lấy sinh viên theo ID
    getById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/${id}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Lấy sinh viên theo lớp
    getByClass: async (classId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/class/${classId}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Lấy sinh viên theo khoa
    getByFaculty: async (facultyId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/faculty/${facultyId}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Tạo sinh viên mới
    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Tạo nhiều sinh viên (bulk)
    createBulk: async (students) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ students }),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Cập nhật sinh viên
    update: async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Xóa sinh viên
    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/${id}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Cập nhật Bí thư lớp
    updateSecretary: async (id, isSecretary) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/${id}/secretary`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isSecretary }),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Xóa tất cả sinh viên của lớp
    deleteByClass: async (classId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/class/${classId}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
};

// ============ CATEGORY APIs ============
export const categoryAPI = {
    getAll: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    getById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${id}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    update: async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
};

// ============ CRITERIA APIs ============
export const criteriaAPI = {
    getAll: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/criteria`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    getByCategory: async (categoryId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/criteria/category/${categoryId}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    getById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/criteria/${id}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/criteria`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    update: async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/criteria/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/criteria/${id}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
};

// ============ SEMESTER APIs ============
export const semesterAPI = {
    getAll: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/semesters`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    getById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/semesters/${id}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/semesters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    update: async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/semesters/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/semesters/${id}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
};

// ============ EVENT APIs ============
export const eventAPI = {
    getAll: async (params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${API_BASE_URL}/events${queryString ? `?${queryString}` : ''}`;
            const response = await fetch(url);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    getById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    getBySemester: async (academicYear, semester) => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/semester/${academicYear}/${semester}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    getByStatus: async (status) => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/status/${status}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    create: async (data) => {
        try {
            const headers = {};
            let body = data;
            if (!(data instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(data);
            }
            const response = await fetch(`${API_BASE_URL}/events`, {
                method: 'POST',
                headers,
                body,
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    update: async (id, data) => {
        try {
            const headers = {};
            let body = data;
            if (!(data instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(data);
            }
            const response = await fetch(`${API_BASE_URL}/events/${id}`, {
                method: 'PUT',
                headers,
                body,
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    approve: async (id, approvedBy) => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvedBy }),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    reject: async (id, approvedBy, rejectionReason) => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvedBy, rejectionReason }),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    getParticipants: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}/participants`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    cancel: async (id, reason) => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
};

// ============ USER APIs ============
// DEPRECATED - Không dùng User model nữa, thay bằng Student + Admin
// export const userAPI = { ... };

// ============ AUTH APIs ============
export const authAPI = {
    // Kiểm tra mã cán bộ
    checkAdmin: async (adminCode) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/check-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminCode }),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Yêu cầu gửi OTP
    requestOTP: async (email, adminCode, purpose) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, adminCode, purpose }),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Xác thực OTP và đặt mật khẩu
    verifyOTP: async (email, otpCode, newPassword) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otpCode, newPassword }),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Đăng nhập
    login: async (email, adminCode, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, adminCode, password }),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Lấy thông tin admin profile (để refresh data)
    getAdminProfile: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/admin/${id}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
};

// ============ ADMIN APIs ============
export const adminAPI = {
    getAll: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admins`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    getById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admins/${id}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    getByLevel: async (level) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admins/level/${level}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    getByFaculty: async (facultyId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admins/faculty/${facultyId}`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    update: async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admins/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
    
    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admins/${id}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
};

// ============ DASHBOARD APIs ============
export const dashboardAPI = {
    getStats: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    }
};

// ============ ASSESSMENT APIs ============
export const assessmentAPI = {
    getFacultyClasses: async (facultyId, semesterId) => {
        try {
            const url = new URL(`${API_BASE_URL}/students/assessment/faculty/${facultyId}/classes`);
            if (semesterId) url.searchParams.append('semesterId', semesterId);
            
            const response = await fetch(url, {
                headers: getHeaders()
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    approveClass: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/assessment/faculty/approve-class`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    remindClass: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/assessment/faculty/remind`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    }
};

export default {
    faculty: facultyAPI,
    class: classAPI,
    student: studentAPI,
    category: categoryAPI,
    criteria: criteriaAPI,
    event: eventAPI,
    // user: userAPI, // DEPRECATED
    auth: authAPI,
    admin: adminAPI,
    dashboard: dashboardAPI,
    assessment: assessmentAPI
};
