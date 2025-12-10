import Class from '../models/Class.js';
import Faculty from '../models/Faculty.js';
import Admin from '../models/Admin.js';
import Student from '../models/Student.js';

// @desc    Lấy tất cả lớp
// @route   GET /api/classes
// @access  Public/Private
const getAllClasses = async (req, res, next) => {
    try {
        let query = { isActive: true };

        // Nếu là Admin cấp Khoa (Department), chỉ lấy lớp thuộc khoa đó
        if (req.user && req.user.role === 'Admin') {
            const admin = await Admin.findById(req.user.userId);
            if (admin && admin.level === 'Department' && admin.faculty) {
                query.faculty = admin.faculty;
            }
        }

        const classes = await Class.find(query)
            .populate('faculty', 'facultyCode facultyName')
            .sort({ className: 1 });

        res.status(200).json({
            success: true,
            count: classes.length,
            data: classes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Lấy lớp theo ID
// @route   GET /api/classes/:id
// @access  Public
const getClassById = async (req, res, next) => {
    try {
        const classData = await Class.findById(req.params.id)
            .populate('faculty', 'facultyCode facultyName');

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp'
            });
        }

        res.status(200).json({
            success: true,
            data: classData
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Lấy lớp theo khoa
// @route   GET /api/classes/faculty/:facultyId
// @access  Public
const getClassesByFaculty = async (req, res, next) => {
    try {
        const classes = await Class.find({ 
            faculty: req.params.facultyId,
            isActive: true 
        })
            .populate('faculty', 'facultyCode facultyName')
            .sort({ className: 1 });

        res.status(200).json({
            success: true,
            count: classes.length,
            data: classes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Tạo lớp mới
// @route   POST /api/classes
// @access  Private/Admin
const createClass = async (req, res, next) => {
    try {
        const { classCode, className, faculty, academicYear } = req.body;

        // Kiểm tra quyền hạn (nếu là Admin Khoa)
        if (req.user && req.user.role === 'Admin') {
            const admin = await Admin.findById(req.user.userId);
            if (admin && admin.level === 'Department') {
                if (admin.faculty.toString() !== faculty) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn chỉ có thể tạo lớp cho khoa của mình'
                    });
                }
            }
        }

        // Kiểm tra thông tin bắt buộc
        if (!classCode || !className || !faculty || !academicYear) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        // Kiểm tra khoa có tồn tại
        const facultyExists = await Faculty.findById(faculty);
        if (!facultyExists) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoa'
            });
        }

        const classData = await Class.create({
            classCode,
            className,
            faculty,
            academicYear
        });

        // Populate faculty info
        await classData.populate('faculty', 'facultyCode facultyName');

        res.status(201).json({
            success: true,
            message: 'Tạo lớp thành công',
            data: classData
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cập nhật lớp
// @route   PUT /api/classes/:id
// @access  Private/Admin
const updateClass = async (req, res, next) => {
    try {
        const { classCode, className, faculty, academicYear, isActive } = req.body;

        const classData = await Class.findById(req.params.id);

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp'
            });
        }

        // Kiểm tra quyền hạn (nếu là Admin Khoa)
        if (req.user && req.user.role === 'Admin') {
            const admin = await Admin.findById(req.user.userId);
            if (admin && admin.level === 'Department') {
                // Kiểm tra lớp có thuộc khoa của admin không
                if (classData.faculty.toString() !== admin.faculty.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn chỉ có thể cập nhật lớp thuộc khoa của mình'
                    });
                }
                // Kiểm tra nếu đang cố chuyển lớp sang khoa khác
                if (faculty && faculty !== admin.faculty.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không thể chuyển lớp sang khoa khác'
                    });
                }
            }
        }

        // Kiểm tra khoa nếu được cập nhật
        if (faculty) {
            const facultyExists = await Faculty.findById(faculty);
            if (!facultyExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy khoa'
                });
            }
            classData.faculty = faculty;
        }

        // Cập nhật thông tin
        if (classCode) classData.classCode = classCode;
        if (className) classData.className = className;
        if (faculty) classData.faculty = faculty;
        if (academicYear) classData.academicYear = academicYear;
        if (isActive !== undefined) classData.isActive = isActive;

        await classData.save();
        await classData.populate('faculty', 'facultyCode facultyName');

        res.status(200).json({
            success: true,
            message: 'Cập nhật lớp thành công',
            data: classData
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Xóa lớp (soft delete)
// @route   DELETE /api/classes/:id
// @access  Private/Admin
const deleteClass = async (req, res, next) => {
    try {
        const classData = await Class.findById(req.params.id);

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp'
            });
        }

        // Kiểm tra quyền hạn (nếu là Admin Khoa)
        if (req.user && req.user.role === 'Admin') {
            const admin = await Admin.findById(req.user.userId);
            if (admin && admin.level === 'Department') {
                if (classData.faculty.toString() !== admin.faculty.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn chỉ có thể xóa lớp thuộc khoa của mình'
                    });
                }
            }
        }

        // Hard delete class and related students
        await Class.findByIdAndDelete(req.params.id);
        await Student.deleteMany({ class: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Xóa lớp và toàn bộ sinh viên trong lớp thành công'
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getAllClasses,
    getClassById,
    getClassesByFaculty,
    createClass,
    updateClass,
    deleteClass
};
