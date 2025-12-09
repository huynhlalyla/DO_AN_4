import jwt from 'jsonwebtoken';
import OTP from '../models/OTP.js';
import Student from '../models/Student.js';
import Admin from '../models/Admin.js';
import { sendOTP, generateOTP } from '../services/emailService.js';
import bcrypt from 'bcrypt';

/**
 * Kiểm tra sinh viên theo email hoặc mã sinh viên
 */
export const checkStudent = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mã sinh viên'
            });
        }

        // Tìm sinh viên theo studentCode
        const student = await Student.findOne({ studentCode: identifier.toUpperCase() }).select('+password').populate('class faculty');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Mã sinh viên không tồn tại trong hệ thống',
                details: 'Vui lòng kiểm tra lại mã sinh viên của bạn'
            });
        }

        // Kiểm tra tài khoản có active không
        if (!student.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa',
                details: 'Vui lòng liên hệ quản trị viên để được hỗ trợ'
            });
        }

        // Kiểm tra xem đã có password chưa (lần đầu đăng nhập)
        const isFirstLogin = !student.password;

        res.status(200).json({
            success: true,
            data: {
                isFirstLogin,
                email: student.email,
                studentCode: student.studentCode,
                fullName: student.fullName,
                className: student.class?.className,
                facultyName: student.faculty?.facultyName
            }
        });

    } catch (error) {
        console.error('Error in checkStudent:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra sinh viên',
            details: error.message
        });
    }
};

/**
 * Kiểm tra Admin theo mã cán bộ (MSCB) để xác định lần đầu đăng nhập
 */
export const checkAdminCode = async (req, res) => {
    try {
        const { adminCode } = req.body;

        if (!adminCode) {
            return res.status(400).json({
                success: false,
                message: 'Mã số cán bộ là bắt buộc'
            });
        }

        const admin = await Admin.findOne({ adminCode }).select('+password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Mã số cán bộ không tồn tại'
            });
        }

        // Kiểm tra xem đã có password chưa
        const isFirstLogin = !admin.password;

        res.status(200).json({
            success: true,
            isFirstLogin,
            email: admin.email,
            adminCode: admin.adminCode,
            fullName: admin.fullName
        });

    } catch (error) {
        console.error('Error in checkAdminCode:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra mã cán bộ'
        });
    }
};

/**
 * Yêu cầu gửi OTP (cho lần đầu đăng nhập hoặc quên mật khẩu)
 */
export const requestOTP = async (req, res) => {
    try {
        const { email, adminCode, purpose } = req.body; // purpose: 'first-login' | 'reset-password'

        if ((!email && !adminCode) || !purpose) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mã cán bộ và mục đích là bắt buộc'
            });
        }

        // Tìm user (Student hoặc Admin)
        let user = null;
        let userType = 'Student';

        if (adminCode) {
            user = await Admin.findOne({ adminCode });
            userType = 'Admin';
        } else if (email) {
            user = await Student.findOne({ email });
            if (!user) {
                user = await Admin.findOne({ email });
                userType = 'Admin';
            }
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: adminCode ? 'Mã cán bộ không tồn tại' : 'Email không tồn tại trong hệ thống'
            });
        }

        // Kiểm tra logic purpose
        if (purpose === 'first-login' && user.password) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản đã có mật khẩu. Vui lòng sử dụng chức năng quên mật khẩu.'
            });
        }

        // Xóa các OTP cũ chưa sử dụng của user này
        await OTP.deleteMany({ 
            userId: user._id, 
            userType,
            isUsed: false 
        });

        // Tạo OTP mới
        const otpCode = generateOTP();
        const newOTP = new OTP({
            email: user.email,
            otpCode,
            purpose,
            userType,
            userId: user._id
        });

        await newOTP.save();

        // Gửi OTP qua email
        await sendOTP(user.email, otpCode, purpose);

        res.status(200).json({
            success: true,
            message: 'Mã OTP đã được gửi đến email của bạn',
            email: user.email,
            expiresIn: 10 // phút
        });

    } catch (error) {
        console.error('Error in requestOTP:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi gửi OTP'
        });
    }
};

/**
 * Xác thực OTP và đặt mật khẩu mới
 */
export const verifyOTPAndSetPassword = async (req, res) => {
    try {
        const { email, otpCode, newPassword } = req.body;

        if (!email || !otpCode || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, mã OTP và mật khẩu mới là bắt buộc'
            });
        }

        // Validate password
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Tìm OTP
        const otp = await OTP.findOne({
            email,
            otpCode,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
            });
        }

        // Tìm user
        let user;
        if (otp.userType === 'Student') {
            user = await Student.findById(otp.userId).select('+password');
        } else {
            user = await Admin.findById(otp.userId).select('+password');
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật password
        user.password = hashedPassword;
        await user.save();

        // Đánh dấu OTP đã sử dụng
        otp.isUsed = true;
        await otp.save();

        res.status(200).json({
            success: true,
            message: 'Mật khẩu đã được đặt thành công. Bạn có thể đăng nhập ngay.',
            userType: otp.userType,
            email: user.email
        });

    } catch (error) {
        console.error('Error in verifyOTPAndSetPassword:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xác thực OTP'
        });
    }
};

/**
 * Đăng nhập (Student/Admin)
 */
export const login = async (req, res) => {
    try {
        const { email, adminCode, password } = req.body;

        if ((!email && !adminCode) || !password) {
            return res.status(400).json({
                success: false,
                message: adminCode ? 'Mã cán bộ và mật khẩu là bắt buộc' : 'Mã sinh viên và mật khẩu là bắt buộc'
            });
        }

        // Tìm user
        let user = null;
        let userType = 'Student';

        if (adminCode) {
            user = await Admin.findOne({ adminCode }).select('+password').populate('faculty');
            userType = 'Admin';
        } else if (email) {
            // Try finding by student code
            user = await Student.findOne({ studentCode: email.toUpperCase() }).select('+password').populate('class faculty');
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: adminCode ? 'Mã cán bộ hoặc mật khẩu không đúng' : 'Mã sinh viên hoặc mật khẩu không đúng'
            });
        }

        // Kiểm tra nếu chưa có password (lần đầu đăng nhập)
        if (!user.password) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản chưa được kích hoạt. Vui lòng yêu cầu mã OTP để đặt mật khẩu.',
                requireOTP: true,
                email: user.email
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: adminCode ? 'Mã cán bộ hoặc mật khẩu không đúng' : 'Mã sinh viên hoặc mật khẩu không đúng'
            });
        }

        // Kiểm tra tài khoản có active không
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa'
            });
        }

        // Xóa password khỏi response
        const userObj = user.toObject();
        delete userObj.password;

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                role: userType,
                email: user.email 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: userObj,
                userType,
                token
            }
        });

    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng nhập'
        });
    }
};

/**
 * Lấy thông tin profile của admin theo ID
 */
export const getAdminProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = await Admin.findById(id).populate('faculty');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin admin'
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa'
            });
        }

        res.status(200).json({
            success: true,
            data: admin
        });

    } catch (error) {
        console.error('Error in getAdminProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin profile'
        });
    }
};

/**
 * Đổi mật khẩu
 */
export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới'
            });
        }

        let user = null;
        if (role === 'Admin') {
            user = await Admin.findById(userId).select('+password');
        } else {
            user = await Student.findById(userId).select('+password');
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu cũ không chính xác'
            });
        }

        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });

    } catch (error) {
        console.error('Error in changePassword:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đổi mật khẩu'
        });
    }
};

export default {
    checkStudent,
    checkAdminCode,
    requestOTP,
    verifyOTPAndSetPassword,
    login,
    getAdminProfile,
    changePassword
};
