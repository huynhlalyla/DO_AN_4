import express from 'express';
import { checkStudent, checkAdminCode, requestOTP, verifyOTPAndSetPassword, login, getAdminProfile, changePassword } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/auth/check-student - Kiểm tra sinh viên (bằng email hoặc mã sinh viên)
router.post('/check-student', checkStudent);

// POST /api/auth/check-admin - Kiểm tra mã cán bộ
router.post('/check-admin', checkAdminCode);

// POST /api/auth/request-otp - Yêu cầu gửi OTP
router.post('/request-otp', requestOTP);

// POST /api/auth/verify-otp - Xác thực OTP và đặt mật khẩu
router.post('/verify-otp', verifyOTPAndSetPassword);

// POST /api/auth/login - Đăng nhập
router.post('/login', login);

// GET /api/auth/admin/:id - Lấy thông tin admin profile
router.get('/admin/:id', getAdminProfile);

// POST /api/auth/change-password - Đổi mật khẩu
router.post('/change-password', verifyToken, changePassword);

export default router;
