import Admin from '../models/Admin.js';
import Faculty from '../models/Faculty.js';

// Lấy tất cả admins
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({ isActive: true })
            .populate('faculty')
            .sort({ level: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: admins.length,
            data: admins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách admin',
            error: error.message
        });
    }
};

// Lấy admin theo ID
export const getAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).populate('faculty');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy admin'
            });
        }

        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin admin',
            error: error.message
        });
    }
};

// Lấy admins theo level
export const getAdminsByLevel = async (req, res) => {
    try {
        const { level } = req.params;

        if (!['Department', 'University'].includes(level)) {
            return res.status(400).json({
                success: false,
                message: 'Level không hợp lệ. Chỉ chấp nhận "Department" hoặc "University"'
            });
        }

        const admins = await Admin.find({ level, isActive: true })
            .populate('faculty')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: admins.length,
            data: admins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách admin',
            error: error.message
        });
    }
};

// Lấy admins theo khoa (chỉ Department level)
export const getAdminsByFaculty = async (req, res) => {
    try {
        const { facultyId } = req.params;

        const admins = await Admin.find({ 
            level: 'Department',
            faculty: facultyId,
            isActive: true
        })
            .populate('faculty')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: admins.length,
            data: admins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách admin theo khoa',
            error: error.message
        });
    }
};

// Tạo admin mới
export const createAdmin = async (req, res) => {
    try {
        const {
            lastName,
            firstName,
            email,
            phone,
            level,
            faculty
        } = req.body;

        // Validate required fields
        if (!lastName || !firstName || !email || !level) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin bắt buộc'
            });
        }

        // Validate level
        if (!['Department', 'University'].includes(level)) {
            return res.status(400).json({
                success: false,
                message: 'Level không hợp lệ. Chỉ chấp nhận "Department" hoặc "University"'
            });
        }

        // Validate faculty for Department level
        if (level === 'Department' && !faculty) {
            return res.status(400).json({
                success: false,
                message: 'Bí thư đoàn khoa phải được gán vào một khoa'
            });
        }

        // Check if faculty exists
        if (level === 'Department') {
            const facultyExists = await Faculty.findById(faculty);
            if (!facultyExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy khoa'
                });
            }
        }

        // Check if email already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại'
            });
        }

        const admin = await Admin.create({
            lastName,
            firstName,
            email,
            phone,
            level,
            faculty: level === 'Department' ? faculty : undefined
        });

        const populatedAdmin = await Admin.findById(admin._id).populate('faculty');

        res.status(201).json({
            success: true,
            message: 'Tạo admin thành công',
            data: populatedAdmin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo admin',
            error: error.message
        });
    }
};

// Cập nhật admin
export const updateAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy admin'
            });
        }

        const {
            lastName,
            firstName,
            email,
            phone,
            level,
            faculty,
            isActive
        } = req.body;

        // Validate level if changed
        if (level && !['Department', 'University'].includes(level)) {
            return res.status(400).json({
                success: false,
                message: 'Level không hợp lệ. Chỉ chấp nhận "Department" hoặc "University"'
            });
        }

        // Check email uniqueness if changed
        if (email && email !== admin.email) {
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã tồn tại'
                });
            }
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(
            req.params.id,
            {
                lastName,
                firstName,
                email,
                phone,
                level,
                faculty,
                isActive
            },
            { new: true, runValidators: true }
        ).populate('faculty');

        res.status(200).json({
            success: true,
            message: 'Cập nhật admin thành công',
            data: updatedAdmin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật admin',
            error: error.message
        });
    }
};

// Xóa admin (soft delete)
export const deleteAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy admin'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa admin thành công',
            data: admin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa admin',
            error: error.message
        });
    }
};
