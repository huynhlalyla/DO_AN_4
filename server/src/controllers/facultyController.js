import Faculty from '../models/Faculty.js';

// @desc    Lấy tất cả khoa
// @route   GET /api/faculties
// @access  Public
const getAllFaculties = async (req, res, next) => {
    try {
        const faculties = await Faculty.find({})
            .sort({ facultyName: 1 });

        res.status(200).json({
            success: true,
            count: faculties.length,
            data: faculties
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Lấy khoa theo ID
// @route   GET /api/faculties/:id
// @access  Public
const getFacultyById = async (req, res, next) => {
    try {
        const faculty = await Faculty.findById(req.params.id);

        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoa'
            });
        }

        res.status(200).json({
            success: true,
            data: faculty
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Tạo khoa mới
// @route   POST /api/faculties
// @access  Private/Admin
const createFaculty = async (req, res, next) => {
    try {
        const { facultyCode, facultyName, description } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!facultyCode || !facultyName) {
            return res.status(400).json({
                success: false,
                message: 'Mã khoa và tên khoa là bắt buộc'
            });
        }

        const faculty = await Faculty.create({
            facultyCode,
            facultyName,
            description
        });

        res.status(201).json({
            success: true,
            message: 'Tạo khoa thành công',
            data: faculty
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cập nhật khoa
// @route   PUT /api/faculties/:id
// @access  Private/Admin
const updateFaculty = async (req, res, next) => {
    try {
        const { facultyCode, facultyName, description, isActive } = req.body;

        const faculty = await Faculty.findById(req.params.id);

        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoa'
            });
        }

        // Cập nhật thông tin
        if (facultyCode) faculty.facultyCode = facultyCode;
        if (facultyName) faculty.facultyName = facultyName;
        if (description !== undefined) faculty.description = description;
        if (isActive !== undefined) faculty.isActive = isActive;

        await faculty.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật khoa thành công',
            data: faculty
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Xóa khoa (soft delete)
// @route   DELETE /api/faculties/:id
// @access  Private/Admin
const deleteFaculty = async (req, res, next) => {
    try {
        const faculty = await Faculty.findById(req.params.id);

        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoa'
            });
        }

        // Soft delete
        faculty.isActive = false;
        await faculty.save();

        res.status(200).json({
            success: true,
            message: 'Xóa khoa thành công'
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getAllFaculties,
    getFacultyById,
    createFaculty,
    updateFaculty,
    deleteFaculty
};
