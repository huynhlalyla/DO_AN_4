import Semester from '../models/Semester.js';

// Lấy tất cả học kỳ
export const getAllSemesters = async (req, res) => {
    try {
        const semesters = await Semester.find().sort({ academicYear: -1, semesterNumber: -1 });
        res.status(200).json({
            success: true,
            count: semesters.length,
            data: semesters
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách học kỳ',
            error: error.message
        });
    }
};

// Lấy học kỳ theo ID
export const getSemesterById = async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.id);
        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy học kỳ'
            });
        }
        res.status(200).json({
            success: true,
            data: semester
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin học kỳ',
            error: error.message
        });
    }
};

// Tạo học kỳ mới
export const createSemester = async (req, res) => {
    try {
        const { semesterNumber, academicYear, startDate, endDate, gradingStartDate } = req.body;

        // Kiểm tra trùng lặp
        const existingSemester = await Semester.findOne({ semesterNumber, academicYear });
        if (existingSemester) {
            return res.status(400).json({
                success: false,
                message: `Học kỳ ${semesterNumber} năm học ${academicYear} đã tồn tại`
            });
        }

        // Tính toán gradingDeadline (2 tuần sau gradingStartDate)
        const gradingStart = new Date(gradingStartDate);
        const gradingDeadline = new Date(gradingStart);
        gradingDeadline.setDate(gradingStart.getDate() + 14);

        const newSemester = await Semester.create({
            semesterNumber,
            academicYear,
            startDate,
            endDate,
            gradingStartDate,
            gradingDeadline
        });

        res.status(201).json({
            success: true,
            message: 'Tạo học kỳ thành công',
            data: newSemester
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo học kỳ',
            error: error.message
        });
    }
};

// Cập nhật học kỳ
export const updateSemester = async (req, res) => {
    try {
        const { startDate, endDate, gradingStartDate } = req.body;
        
        const updateData = { ...req.body };

        // Nếu có thay đổi gradingStartDate, tính lại gradingDeadline
        if (gradingStartDate) {
            const gradingStart = new Date(gradingStartDate);
            const gradingDeadline = new Date(gradingStart);
            gradingDeadline.setDate(gradingStart.getDate() + 14);
            updateData.gradingDeadline = gradingDeadline;
        }

        const semester = await Semester.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy học kỳ'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật học kỳ thành công',
            data: semester
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật học kỳ',
            error: error.message
        });
    }
};

// Xóa học kỳ
export const deleteSemester = async (req, res) => {
    try {
        const semester = await Semester.findByIdAndDelete(req.params.id);
        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy học kỳ'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Xóa học kỳ thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa học kỳ',
            error: error.message
        });
    }
};
