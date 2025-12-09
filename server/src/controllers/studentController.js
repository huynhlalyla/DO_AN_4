import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Faculty from '../models/Faculty.js';
import { generateEmail, parseVietnameseDate } from '../utils/helpers.js';

// @desc    Lấy tất cả sinh viên
// @route   GET /api/students
// @access  Public
const getAllStudents = async (req, res, next) => {
    try {
        const students = await Student.find({ isActive: true })
            .populate('class', 'classCode className')
            .populate('faculty', 'facultyCode facultyName')
            .sort({ studentCode: 1 });

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Lấy sinh viên theo ID
// @route   GET /api/students/:id
// @access  Public
const getStudentById = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('class', 'classCode className academicYear')
            .populate('faculty', 'facultyCode facultyName');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sinh viên'
            });
        }

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Lấy sinh viên theo lớp
// @route   GET /api/students/class/:classId
// @access  Public
const getStudentsByClass = async (req, res, next) => {
    try {
        const students = await Student.find({ 
            class: req.params.classId,
            isActive: true 
        })
            .populate('class', 'classCode className')
            .populate('faculty', 'facultyCode facultyName')
            .sort({ studentCode: 1 });

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Lấy sinh viên theo khoa
// @route   GET /api/students/faculty/:facultyId
// @access  Public
const getStudentsByFaculty = async (req, res, next) => {
    try {
        const students = await Student.find({ 
            faculty: req.params.facultyId,
            isActive: true 
        })
            .populate('class', 'classCode className')
            .populate('faculty', 'facultyCode facultyName')
            .sort({ studentCode: 1 });

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Tạo sinh viên mới
// @route   POST /api/students
// @access  Private/Admin
const createStudent = async (req, res, next) => {
    try {
        let { 
            lastName, 
            firstName, 
            gender, 
            email, 
            dateOfBirth, 
            class: classId, 
            faculty: facultyId 
        } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!lastName || !firstName || !gender || !dateOfBirth || !classId || !facultyId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        // Kiểm tra lớp có tồn tại
        const classExists = await Class.findById(classId);
        if (!classExists) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp'
            });
        }

        // Kiểm tra khoa có tồn tại
        const facultyExists = await Faculty.findById(facultyId);
        if (!facultyExists) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoa'
            });
        }

        // Parse ngày sinh nếu là string (dd/mm/yyyy)
        let parsedDateOfBirth = dateOfBirth;
        if (typeof dateOfBirth === 'string' && dateOfBirth.includes('/')) {
            parsedDateOfBirth = parseVietnameseDate(dateOfBirth);
        }

        // Tạo sinh viên (studentCode sẽ được auto-generate)
        const student = await Student.create({
            lastName,
            firstName,
            gender,
            email,
            dateOfBirth: parsedDateOfBirth,
            class: classId,
            faculty: facultyId
        });

        // Populate thông tin
        await student.populate('class', 'classCode className');
        await student.populate('faculty', 'facultyCode facultyName');

        res.status(201).json({
            success: true,
            message: 'Tạo sinh viên thành công',
            data: student
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Tạo nhiều sinh viên cùng lúc
// @route   POST /api/students/bulk
// @access  Private/Admin
const createBulkStudents = async (req, res, next) => {
    try {
        const { students } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách sinh viên không hợp lệ'
            });
        }

        const createdStudents = [];
        const errors = [];

        for (let i = 0; i < students.length; i++) {
            try {
                let { 
                    studentCode, 
                    lastName, 
                    firstName, 
                    gender, 
                    email,
                    dateOfBirth, 
                    class: classId, 
                    faculty: facultyId 
                } = students[i];

                // Kiểm tra mã sinh viên đã tồn tại
                const existingStudent = await Student.findOne({ studentCode });
                if (existingStudent) {
                    errors.push({
                        index: i,
                        studentCode,
                        message: 'Mã sinh viên đã tồn tại'
                    });
                    continue;
                }

                // Tự động tạo email nếu không có
                if (!email) {
                    email = generateEmail(lastName, firstName, studentCode);
                } else {
                    const existingEmail = await Student.findOne({ email: email.toLowerCase() });
                    if (existingEmail) {
                        errors.push({
                            index: i,
                            studentCode,
                            message: 'Email đã tồn tại'
                        });
                        continue;
                    }
                }

                // Parse ngày sinh
                let parsedDateOfBirth = dateOfBirth;
                if (typeof dateOfBirth === 'string' && dateOfBirth.includes('/')) {
                    parsedDateOfBirth = parseVietnameseDate(dateOfBirth);
                }

                const student = await Student.create({
                    studentCode,
                    lastName,
                    firstName,
                    gender,
                    email,
                    dateOfBirth: parsedDateOfBirth,
                    class: classId,
                    faculty: facultyId
                });

                createdStudents.push(student);
            } catch (err) {
                errors.push({
                    index: i,
                    studentCode: students[i].studentCode,
                    message: err.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Tạo thành công ${createdStudents.length}/${students.length} sinh viên`,
            data: {
                created: createdStudents.length,
                total: students.length,
                errors: errors
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cập nhật sinh viên
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = async (req, res, next) => {
    try {
        const { 
            lastName, 
            firstName, 
            gender, 
            email, 
            dateOfBirth, 
            class: classId, 
            faculty: facultyId,
            isActive,
            isSecretary // Thêm isSecretary nhưng sẽ không xử lý ở đây
        } = req.body;

        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sinh viên'
            });
        }

        // Kiểm tra email nếu được cập nhật
        if (email && email !== student.email) {
            const existingEmail = await Student.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã tồn tại'
                });
            }
            student.email = email;
        }

        // Kiểm tra lớp nếu được cập nhật
        if (classId && classId !== student.class.toString()) {
            const classExists = await Class.findById(classId);
            if (!classExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lớp'
                });
            }
            student.class = classId;
        }

        // Kiểm tra khoa nếu được cập nhật
        if (facultyId && facultyId !== student.faculty.toString()) {
            const facultyExists = await Faculty.findById(facultyId);
            if (!facultyExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy khoa'
                });
            }
            student.faculty = facultyId;
        }

        // Cập nhật thông tin
        if (lastName) student.lastName = lastName;
        if (firstName) student.firstName = firstName;
        if (gender) student.gender = gender;
        if (dateOfBirth) {
            let parsedDateOfBirth = dateOfBirth;
            if (typeof dateOfBirth === 'string' && dateOfBirth.includes('/')) {
                parsedDateOfBirth = parseVietnameseDate(dateOfBirth);
            }
            student.dateOfBirth = parsedDateOfBirth;
        }
        if (isActive !== undefined) student.isActive = isActive;

        await student.save();
        await student.populate('class', 'classCode className');
        await student.populate('faculty', 'facultyCode facultyName');

        res.status(200).json({
            success: true,
            message: 'Cập nhật sinh viên thành công',
            data: student
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Xóa sinh viên (hard delete)
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res, next) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sinh viên'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa sinh viên thành công'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cập nhật Bí thư lớp
// @route   PUT /api/students/:id/secretary
// @access  Private/Admin
const updateSecretary = async (req, res, next) => {
    try {
        const { isSecretary } = req.body;

        if (typeof isSecretary !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái bí thư không hợp lệ'
            });
        }

        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sinh viên'
            });
        }

        // Nếu đặt làm bí thư
        if (isSecretary) {
            // Kiểm tra lớp này đã có bí thư chưa
            const currentSecretary = await Student.findOne({
                class: student.class,
                isSecretary: true,
                isActive: true,
                _id: { $ne: student._id } // Không phải chính sinh viên này
            });

            // Nếu đã có bí thư khác, bỏ quyền bí thư của người đó
            if (currentSecretary) {
                currentSecretary.isSecretary = false;
                currentSecretary.secretaryPermissions = {
                    canOrganizeClassEvents: false,
                    canApproveClassScores: false,
                    canEditClassEvents: false
                };
                await currentSecretary.save();
            }

            // Đặt sinh viên này làm bí thư
            student.isSecretary = true;
            student.secretaryPermissions = {
                canOrganizeClassEvents: true,
                canApproveClassScores: true,
                canEditClassEvents: true
            };
        } else {
            // Bỏ quyền bí thư
            student.isSecretary = false;
            student.secretaryPermissions = {
                canOrganizeClassEvents: false,
                canApproveClassScores: false,
                canEditClassEvents: false
            };
        }

        await student.save();
        await student.populate('class', 'classCode className');
        await student.populate('faculty', 'facultyCode facultyName');

        res.status(200).json({
            success: true,
            message: isSecretary ? 'Đã đặt làm Bí thư lớp' : 'Đã bỏ quyền Bí thư lớp',
            data: student
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Xóa tất cả sinh viên của một lớp
// @route   DELETE /api/students/class/:classId
// @access  Private/Admin
const deleteStudentsByClass = async (req, res, next) => {
    try {
        const { classId } = req.params;

        // Kiểm tra lớp có tồn tại không
        const classExists = await Class.findById(classId);
        if (!classExists) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp học'
            });
        }

        // Xóa cứng tất cả sinh viên của lớp
        const result = await Student.deleteMany({ class: classId });

        res.status(200).json({
            success: true,
            message: `Đã xóa ${result.deletedCount} sinh viên của lớp ${classExists.classCode}`,
            data: {
                deletedCount: result.deletedCount
            }
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getAllStudents,
    getStudentById,
    getStudentsByClass,
    getStudentsByFaculty,
    createStudent,
    createBulkStudents,
    updateStudent,
    deleteStudent,
    updateSecretary,
    deleteStudentsByClass
};
