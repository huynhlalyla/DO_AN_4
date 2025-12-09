import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import fs from 'fs';
import Event from '../models/Event.js';
import Criteria from '../models/Criteria.js';
import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import EventParticipation from '../models/EventParticipation.js';
import Semester from '../models/Semester.js';
import { sendEventCancellationEmail } from '../services/emailService.js';
import e from 'express';

// Lấy tất cả sự kiện
export const getAllEvents = async (req, res) => {
    try {
        const { facultyId, level, status } = req.query;
        let query = {};

        // Filter by status (active/cancelled)
        if (status === 'cancelled') {
            query.isActive = false;
        } else {
            query.isActive = true;
        }

        // Filter by Faculty (for Department level)
        if (level === 'Department' && facultyId) {
            query.targetFaculty = facultyId;
        }

        const events = await Event.find(query)
            .populate('criteria')
            .populate('organizer')
            .populate('targetClass')
            .populate('targetFaculty')
            .populate('semester')
            .populate('createdBy', 'firstName lastName email adminCode')
            .populate('approvedBy', 'firstName lastName email adminCode')
            .sort({ eventDate: -1 });

        console.log(events);
        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sự kiện',
            error: error.message
        });
    }
};

// Lấy sự kiện theo ID
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('criteria')
            .populate('organizer')
            .populate('targetClass')
            .populate('targetFaculty')
            .populate('semester')
            .populate('createdBy', 'firstName lastName email adminCode')
            .populate('approvedBy', 'firstName lastName email adminCode');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sự kiện'
            });
        }

        res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin sự kiện',
            error: error.message
        });
    }
};

// Lấy sự kiện theo học kỳ (ID)
export const getEventsBySemester = async (req, res) => {
    try {
        const { semesterId } = req.params;

        const events = await Event.find({
            semester: semesterId,
            isActive: true
        })
            .populate('criteria')
            .populate('organizer')
            .populate('targetClass')
            .populate('targetFaculty')
            .sort({ eventDate: -1 });

        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sự kiện',
            error: error.message
        });
    }
};

// Lấy sự kiện theo trạng thái phê duyệt
export const getEventsByApprovalStatus = async (req, res) => {
    try {
        const { status } = req.params;

        const events = await Event.find({
            approvalStatus: status,
            isActive: true
        })
            .populate('criteria')
            .populate('organizer')
            .populate('targetClass')
            .populate('targetFaculty')
            .populate('createdBy', 'firstName lastName email adminCode')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sự kiện',
            error: error.message
        });
    }
};

// Tạo sự kiện mới
export const createEvent = async (req, res) => {
    try {
        let {
            eventName,
            description,
            criteria,
            score,
            eventDate,
            endDate,
            startTime,
            endTime,
            semester,
            organizerType,
            organizer,
            targetClass,
            targetFaculty,
            maxParticipants,
            location,
            note,
            createdBy
        } = req.body;

        // Sanitize inputs (handle "undefined"/"null" strings from FormData)
        const sanitize = (val) => (val === 'undefined' || val === 'null' || val === '') ? undefined : val;
        
        criteria = sanitize(criteria);
        semester = sanitize(semester);
        organizer = sanitize(organizer);
        targetClass = sanitize(targetClass);
        targetFaculty = sanitize(targetFaculty);
        createdBy = sanitize(createdBy);
        score = sanitize(score);
        maxParticipants = sanitize(maxParticipants);
        description = sanitize(description);
        location = sanitize(location);
        note = sanitize(note);
        startTime = sanitize(startTime);
        endTime = sanitize(endTime);
        endDate = sanitize(endDate);
        eventDate = sanitize(eventDate);
        organizerType = sanitize(organizerType);

        // Validate ObjectIds
        if (criteria && !mongoose.Types.ObjectId.isValid(criteria)) return res.status(400).json({ success: false, message: 'Criteria ID không hợp lệ' });
        if (semester && !mongoose.Types.ObjectId.isValid(semester)) return res.status(400).json({ success: false, message: 'Semester ID không hợp lệ' });
        if (organizer && !mongoose.Types.ObjectId.isValid(organizer)) return res.status(400).json({ success: false, message: 'Organizer ID không hợp lệ' });
        if (targetClass && !mongoose.Types.ObjectId.isValid(targetClass)) return res.status(400).json({ success: false, message: 'Target Class ID không hợp lệ' });
        if (targetFaculty && !mongoose.Types.ObjectId.isValid(targetFaculty)) return res.status(400).json({ success: false, message: 'Target Faculty ID không hợp lệ' });
        if (createdBy && !mongoose.Types.ObjectId.isValid(createdBy)) return res.status(400).json({ success: false, message: 'CreatedBy ID không hợp lệ' });

        // Kiểm tra các trường bắt buộc
        if (!eventName || !criteria || score === undefined || !eventDate || !semester || !organizerType) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin bắt buộc'
            });
        }

        // Kiểm tra criteria có tồn tại
        const criteriaExists = await Criteria.findById(criteria);
        if (!criteriaExists) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chí chấm điểm'
            });
        }
        // Kiểm tra quyền tạo sự kiện
        let autoApprove = false;
        let creatorModel = 'Admin';

        if (createdBy) {
            // Tìm Admin theo ID
            let creator = await Admin.findById(createdBy);
            
            if (!creator) {
                // Nếu không phải Admin, tìm Student (Bí thư lớp)
                creator = await Student.findById(createdBy);
                if (creator) {
                    creatorModel = 'Student';
                    // Kiểm tra xem có phải bí thư không
                    if (!creator.isSecretary) {
                         return res.status(403).json({
                            success: false,
                            message: 'Chỉ bí thư lớp mới được tạo sự kiện'
                        });
                    }
                    // Bí thư lớp chỉ được tạo sự kiện cấp lớp cho lớp của mình
                    if (organizerType !== 'class') {
                         return res.status(403).json({
                            success: false,
                            message: 'Bí thư lớp chỉ được tạo sự kiện cấp lớp'
                        });
                    }
                    // Kiểm tra targetClass phải là lớp của mình
                    if (targetClass && targetClass !== creator.class.toString()) {
                         return res.status(403).json({
                            success: false,
                            message: 'Bí thư lớp chỉ được tạo sự kiện cho lớp của mình'
                        });
                    }
                    // Sự kiện lớp cần Khoa duyệt -> autoApprove = false
                }
            } else {
                // Logic cho Admin
                if (creator.level === 'Department') {
                    // Không được tạo sự kiện cấp trường
                    if (organizerType === 'school') {
                        return res.status(403).json({
                            success: false,
                            message: 'Bí thư khoa không được tạo sự kiện cấp trường'
                        });
                    }
                    
                    // Kiểm tra targetFaculty phải là khoa của mình
                    const creatorFacultyId = creator.faculty?.toString() || creator.faculty;
                    if (targetFaculty && targetFaculty !== creatorFacultyId) {
                        return res.status(403).json({
                            success: false,
                            message: 'Bí thư khoa chỉ được tạo sự kiện cho khoa của mình'
                        });
                    }
                }
                
                // Tự động duyệt chỉ cho Admin cấp trường (University)
                if (creator.level === 'University') {
                    autoApprove = true;
                } else {
                    // Admin cấp khoa (Department) tạo sự kiện -> Cần trường duyệt
                    autoApprove = false;
                }
            }
        }

        // Tạo organizerModel dựa vào organizerType
        let organizerModel = null;
        if (organizerType === 'faculty') {
            organizerModel = 'Faculty';
        } else if (organizerType === 'class') {
            organizerModel = 'Class';
        }

        // Xác định scope dựa vào organizerType
        // school -> university (toàn trường)
        // faculty -> faculty (cấp khoa)
        // class -> class (cấp lớp)
        let scope = 'university';
        if (organizerType === 'faculty') {
            scope = 'faculty';
        } else if (organizerType === 'class') {
            scope = 'class';
        }

        // Handle image upload
        let image = undefined;
        if (req.file) {
            image = req.file.path.replace(/\\/g, '/');
        }
        console.log("hehe");

        const event = await Event.create({
            eventName,
            description,
            image,
            criteria,
            score,
            eventDate,
            endDate,
            startTime,
            endTime,
            semester,
            organizerType,
            organizer: organizerType !== 'school' ? organizer : undefined,
            organizerModel,
            scope,
            // Sự kiện cấp lớp: lưu cả targetClass và targetFaculty
            targetClass: scope === 'class' ? targetClass : undefined,
            // Sự kiện cấp lớp hoặc cấp khoa: lưu targetFaculty
            targetFaculty: (scope === 'class' || scope === 'faculty') ? targetFaculty : undefined,
            maxParticipants,
            location,
            note,
            createdBy: createdBy || undefined,
            creatorModel: createdBy ? creatorModel : undefined,
            approvalStatus: autoApprove ? 'approved' : 'pending',
            isAccept: autoApprove,
            approvedBy: autoApprove ? createdBy : undefined,
            approverModel: autoApprove ? creatorModel : undefined,
            approvedAt: autoApprove ? new Date() : undefined
        });

        const populatedEvent = await Event.findById(event._id)
            .populate('criteria')
            .populate('organizer')
            .populate('targetClass')
            .populate('targetFaculty')
            .populate('createdBy', 'firstName lastName email adminCode');

        res.status(201).json({
            success: true,
            message: 'Tạo sự kiện thành công',
            data: populatedEvent
        });
    } catch (error) {
        console.error('Create Event Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo sự kiện',
            error: error.message
        });
    }
};

// Cập nhật sự kiện
export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sự kiện'
            });
        }

        // Không cho phép cập nhật sự kiện đã được duyệt
        // if (event.approvalStatus === 'approved') {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Không thể cập nhật sự kiện đã được duyệt'
        //     });
        // }

        const {
            eventName,
            description,
            criteria,
            score,
            eventDate,
            endDate,
            startTime,
            endTime,
            semester,
            organizerType,
            organizer,
            targetClass,
            targetFaculty,
            maxParticipants,
            location,
            note
        } = req.body;

        // Cập nhật organizerModel nếu có thay đổi organizerType
        let organizerModel = event.organizerModel;
        let scope = event.scope;
        if (organizerType) {
            if (organizerType === 'faculty') {
                organizerModel = 'Faculty';
                scope = 'faculty';
            } else if (organizerType === 'class') {
                organizerModel = 'Class';
                scope = 'class';
            } else {
                organizerModel = null;
                scope = 'university';
            }
        }

        // Handle image upload
        let image = undefined;
        if (req.file) {
            image = req.file.path.replace(/\\/g, '/');
        }

        const updateData = {
            eventName,
            description,
            criteria,
            score,
            eventDate,
            endDate,
            startTime,
            endTime,
            semester,
            organizerType,
            organizer: organizerType !== 'school' ? organizer : undefined,
            organizerModel,
            scope,
            // Sự kiện cấp lớp: lưu cả targetClass và targetFaculty
            targetClass: scope === 'class' ? targetClass : undefined,
            // Sự kiện cấp lớp hoặc cấp khoa: lưu targetFaculty
            targetFaculty: (scope === 'class' || scope === 'faculty') ? targetFaculty : undefined,
            maxParticipants,
            location,
            note
        };

        if (image) {
            updateData.image = image;
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('criteria')
            .populate('organizer')
            .populate('targetClass')
            .populate('targetFaculty')
            .populate('createdBy', 'firstName lastName email adminCode');

        res.status(200).json({
            success: true,
            message: 'Cập nhật sự kiện thành công',
            data: updatedEvent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật sự kiện',
            error: error.message
        });
    }
};

// Phê duyệt sự kiện (chỉ admin)
export const approveEvent = async (req, res) => {
    try {
        const { approvedBy } = req.body;

        // Kiểm tra quyền phê duyệt
        if (approvedBy) {
            const approver = await Admin.findById(approvedBy);
            if (!approver) {
                return res.status(403).json({
                    success: false,
                    message: 'Chỉ admin mới có quyền phê duyệt sự kiện'
                });
            }
        }

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sự kiện'
            });
        }

        if (event.approvalStatus === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Sự kiện đã được duyệt'
            });
        }

        event.approvalStatus = 'approved';
        event.isAccept = true;
        event.approvedBy = approvedBy || undefined;
        event.approverModel = approvedBy ? 'Admin' : undefined;
        event.approvedAt = new Date();
        event.rejectionReason = undefined;

        await event.save();

        const populatedEvent = await Event.findById(event._id)
            .populate('criteria')
            .populate('organizer')
            .populate('targetClass')
            .populate('targetFaculty')
            .populate('createdBy', 'firstName lastName email adminCode')
            .populate('approvedBy', 'firstName lastName email adminCode');

        res.status(200).json({
            success: true,
            message: 'Phê duyệt sự kiện thành công',
            data: populatedEvent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phê duyệt sự kiện',
            error: error.message
        });
    }
};

// Từ chối sự kiện (chỉ admin)
export const rejectEvent = async (req, res) => {
    try {
        const { approvedBy, rejectionReason } = req.body;

        // Kiểm tra quyền từ chối
        if (approvedBy) {
            const approver = await Admin.findById(approvedBy);
            if (!approver) {
                return res.status(403).json({
                    success: false,
                    message: 'Chỉ admin mới có quyền từ chối sự kiện'
                });
            }
        }

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sự kiện'
            });
        }

        if (event.approvalStatus === 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Sự kiện đã bị từ chối'
            });
        }

        event.approvalStatus = 'rejected';
        event.isAccept = false;
        event.approvedBy = approvedBy || undefined;
        event.approverModel = approvedBy ? 'Admin' : undefined;
        event.approvedAt = new Date();
        event.rejectionReason = rejectionReason || 'Không đạt yêu cầu';

        await event.save();

        const populatedEvent = await Event.findById(event._id)
            .populate('criteria')
            .populate('organizer')
            .populate('targetClass')
            .populate('targetFaculty')
            .populate('createdBy', 'firstName lastName email adminCode')
            .populate('approvedBy', 'firstName lastName email adminCode');

        res.status(200).json({
            success: true,
            message: 'Từ chối sự kiện thành công',
            data: populatedEvent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối sự kiện',
            error: error.message
        });
    }
};

// Lấy danh sách sự kiện do người dùng tạo
export const getCreatedEvents = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Thiếu User ID' });
        }

        const events = await Event.find({ createdBy: userId })
            .populate('criteria')
            .populate('semester')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách sự kiện', error: error.message });
    }
};

// Xóa sự kiện (Hard delete nếu đã hủy/kết thúc)
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sự kiện'
            });
        }

        // Rule: Chỉ xóa được sự kiện đã hủy (rejected/cancelled) hoặc đã kết thúc
        const isEnded = new Date(event.eventDate) < new Date();
        const isCancelled = event.approvalStatus === 'rejected' || !event.isActive;

        // Nếu sự kiện Đang hoạt động (Approved & Active) và Chưa kết thúc -> Không được xóa
        if (event.approvalStatus === 'approved' && event.isActive && !isEnded) {
             return res.status(400).json({
                success: false,
                message: 'Không thể xóa sự kiện đang diễn ra. Vui lòng hủy sự kiện trước.'
            });
        }

        // Thực hiện xóa hoàn toàn
        await Event.findByIdAndDelete(req.params.id);
        await EventParticipation.deleteMany({ event: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Xóa sự kiện thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa sự kiện',
            error: error.message
        });
    }
};

// Lấy danh sách sự kiện phù hợp cho sinh viên
// Sinh viên chỉ thấy: sự kiện toàn trường, sự kiện khoa của mình, sự kiện lớp của mình
export const getEventsForStudent = async (req, res) => {
    try {
        const { facultyId, classId } = req.query;

        // Find active semester
        const now = new Date();
        const activeSemester = await Semester.findOne({
            startDate: { $lte: now },
            endDate: { $gte: now },
            isActive: true
        });

        // Xây dựng điều kiện tìm kiếm:
        // 1. Sự kiện toàn trường (scope = university)
        // 2. Sự kiện khoa của sinh viên (scope = faculty AND targetFaculty = facultyId)
        // 3. Sự kiện lớp của sinh viên (scope = class AND targetClass = classId)
        const query = {
            isActive: true,
            approvalStatus: 'approved',
            isAccept: true,
            $or: [
                { scope: 'university' }
            ]
        };

        // Filter by semester if found
        if (activeSemester) {
            query.semester = activeSemester._id;
        }

        // Thêm điều kiện cho sự kiện khoa nếu có facultyId
        if (facultyId) {
            query.$or.push({ 
                scope: 'faculty', 
                targetFaculty: facultyId 
            });
        }

        // Thêm điều kiện cho sự kiện lớp nếu có classId
        if (classId) {
            query.$or.push({ 
                scope: 'class', 
                targetClass: classId 
            });
        }

        const events = await Event.find(query)
            .populate({
                path: 'criteria',
                populate: { path: 'category' }
            })
            .populate('organizer')
            .populate('targetClass')
            .populate('targetFaculty')
            .populate('semester')
            .sort({ eventDate: -1 });

        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sự kiện',
            error: error.message
        });
    }
};

// Đăng ký tham gia sự kiện
export const registerEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body; // Lấy studentId từ body (tạm thời)

        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin sinh viên' });
        }

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Sự kiện không tồn tại' });
        }

        if (!event.isActive || event.approvalStatus !== 'approved' || !event.isAccept) {
            return res.status(400).json({ success: false, message: 'Sự kiện chưa được phê duyệt hoặc đã bị hủy' });
        }

        const now = new Date();
        if (new Date(event.eventDate) < now) {
             return res.status(400).json({ success: false, message: 'Sự kiện đã kết thúc' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin sinh viên' });
        }

        if (event.scope === 'faculty') {
            if (student.faculty.toString() !== event.targetFaculty?.toString()) {
                return res.status(403).json({ success: false, message: 'Sự kiện chỉ dành cho sinh viên khoa này' });
            }
        } else if (event.scope === 'class') {
            if (student.class.toString() !== event.targetClass?.toString()) {
                return res.status(403).json({ success: false, message: 'Sự kiện chỉ dành cho sinh viên lớp này' });
            }
        }

        const existingParticipation = await EventParticipation.findOne({
            event: id,
            student: studentId
        });

        if (existingParticipation) {
            return res.status(400).json({ success: false, message: 'Bạn đã đăng ký sự kiện này rồi' });
        }

        const participation = new EventParticipation({
            event: id,
            student: studentId,
            status: 'registered'
        });

        await participation.save();

        res.status(201).json({
            success: true,
            message: 'Đăng ký tham gia thành công',
            data: participation
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi đăng ký sự kiện', error: error.message });
    }
};

// Hủy đăng ký sự kiện (Sinh viên)
export const unregisterEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Sự kiện không tồn tại' });
        }

        // Kiểm tra thời gian: không được hủy nếu sự kiện đã bắt đầu
        const now = new Date();
        if (new Date(event.eventDate) <= now) {
             return res.status(400).json({ success: false, message: 'Không thể hủy đăng ký sự kiện đã diễn ra' });
        }

        const participation = await EventParticipation.findOne({
            event: id,
            student: studentId,
            status: 'registered'
        });

        if (!participation) {
            return res.status(400).json({ success: false, message: 'Bạn chưa đăng ký sự kiện này' });
        }

        await EventParticipation.findByIdAndDelete(participation._id);

        res.status(200).json({
            success: true,
            message: 'Hủy đăng ký thành công'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hủy đăng ký', error: error.message });
    }
};

// Hủy sự kiện (và gửi mail)
export const cancelEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Sự kiện không tồn tại' });
        }

        event.isActive = false; 
        await event.save();

        const participations = await EventParticipation.find({ event: id, status: 'registered' })
            .populate('student', 'email');

        const emails = participations.map(p => p.student.email).filter(email => email);

        if (emails.length > 0) {
            await sendEventCancellationEmail(emails, event, reason);
        }
        
        await EventParticipation.updateMany(
            { event: id },
            { status: 'cancelled' }
        );

        res.status(200).json({
            success: true,
            message: 'Đã hủy sự kiện và gửi email thông báo'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hủy sự kiện', error: error.message });
    }
};

// Lấy danh sách sự kiện đã đăng ký của sinh viên
export const getMyEvents = async (req, res) => {
    try {
        const { studentId } = req.query; // Lấy studentId từ query params
        
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin sinh viên' });
        }

        const participations = await EventParticipation.find({ student: studentId })
            .populate({
                path: 'event',
                populate: [
                    { path: 'organizer' },
                    { path: 'semester' },
                    { 
                        path: 'criteria',
                        populate: { path: 'category' }
                    }
                ]
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: participations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách sự kiện', error: error.message });
    }
};

// Lấy danh sách người tham gia sự kiện (Admin)
export const getEventParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        const participations = await EventParticipation.find({ event: id })
            .populate({
                 path: 'student',
                 select: 'studentCode lastName firstName email class faculty',
                 populate: { path: 'class faculty', select: 'classCode facultyName' }
            });

        res.status(200).json({
            success: true,
            count: participations.length,
            data: participations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách người tham gia', error: error.message });
    }
};

// ==========================================
// ATTENDANCE FEATURES
// ==========================================

// Get Attendance Info (Password) - Should be protected
export const getEventAttendanceInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id).select('+attendancePassword');
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Sự kiện không tồn tại' });
        }

        // Generate password if missing (for old events)
        if (!event.attendancePassword) {
            event.attendancePassword = Math.floor(100000 + Math.random() * 900000).toString();
            await event.save();
        }

        res.status(200).json({
            success: true,
            data: {
                attendancePassword: event.attendancePassword
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy thông tin điểm danh', error: error.message });
    }
};

// Login for Attendance
export const loginAttendance = async (req, res) => {
    try {
        const { eventCode, password } = req.body;

        const event = await Event.findOne({ eventCode }).select('+attendancePassword');
        if (!event) {
            return res.status(404).json({ success: false, message: 'Sự kiện không tồn tại' });
        }

        if (event.attendancePassword !== password) {
            return res.status(401).json({ success: false, message: 'Mật khẩu điểm danh không đúng' });
        }

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                eventId: event._id,
                eventName: event.eventName,
                eventCode: event.eventCode
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi đăng nhập điểm danh', error: error.message });
    }
};

// Get Attendance List (for Attendance Taker)
export const getAttendanceList = async (req, res) => {
    try {
        const { id } = req.params;
        const { search } = req.query;

        // If search is provided, we need to filter by student name or code
        const participations = await EventParticipation.find({ event: id, status: { $in: ['registered', 'attended'] } })
            .populate('student', 'studentCode lastName firstName class faculty')
            .sort({ 'student.lastName': 1, 'student.firstName': 1 });

        let filtered = participations;
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = participations.filter(p => 
                p.student.studentCode.toLowerCase().includes(searchLower) ||
                `${p.student.lastName} ${p.student.firstName}`.toLowerCase().includes(searchLower)
            );
        }

        res.status(200).json({
            success: true,
            count: filtered.length,
            data: filtered
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách điểm danh', error: error.message });
    }
};

// Mark Attendance (Toggle)
export const markAttendance = async (req, res) => {
    try {
        const { id } = req.params; // Event ID
        const { studentId, status } = req.body; // status: 'attended' or 'registered' (uncheck)

        // Check event date
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Sự kiện không tồn tại' });
        }

        const now = new Date();
        const eventDate = new Date(event.eventDate);
        // Reset time part for comparison if needed, but usually exact time matters if startTime is included
        // Assuming eventDate includes time or is just date. 
        // If strict: now < eventDate means event hasn't started.
        if (now < eventDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Chưa đến thời gian diễn ra sự kiện. Không thể điểm danh.' 
            });
        }

        const participation = await EventParticipation.findOne({ event: id, student: studentId });
        if (!participation) {
            return res.status(404).json({ success: false, message: 'Sinh viên chưa đăng ký sự kiện này' });
        }

        participation.status = status;
        if (status === 'attended') {
            participation.attendedAt = new Date();
        } else {
            participation.attendedAt = undefined;
        }

        await participation.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật điểm danh thành công',
            data: participation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật điểm danh', error: error.message });
    }
};

// Export Attendance Excel
export const exportAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ success: false, message: 'Sự kiện không tồn tại' });

        const participations = await EventParticipation.find({ event: id, status: { $in: ['registered', 'attended'] } })
            .populate('student', 'studentCode lastName firstName email class faculty')
            .populate({ path: 'student', populate: { path: 'class faculty', select: 'classCode facultyName' } });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách tham gia');

        worksheet.columns = [
            { header: 'STT', key: 'stt', width: 5 },
            { header: 'MSSV', key: 'studentCode', width: 15 },
            { header: 'Họ đệm', key: 'lastName', width: 20 },
            { header: 'Tên', key: 'firstName', width: 15 },
            { header: 'Lớp', key: 'class', width: 15 },
            { header: 'Khoa', key: 'faculty', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Điểm danh (x)', key: 'status', width: 15 },
            { header: 'Thời gian điểm danh', key: 'attendedAt', width: 20 }
        ];

        // Add Data Validation for Status column (Column H / 8)
        // Note: ExcelJS uses 1-based indexing for columns
        const statusCol = worksheet.getColumn(8);
        statusCol.eachCell((cell, rowNumber) => {
            if (rowNumber > 1) {
                cell.dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: ['"x"'],
                    showErrorMessage: true,
                    errorStyle: 'warning',
                    errorTitle: 'Giá trị không hợp lệ',
                    error: 'Vui lòng chọn "x" hoặc để trống'
                };
            }
        });

        participations.forEach((p, index) => {
            worksheet.addRow({
                stt: index + 1,
                studentCode: p.student.studentCode,
                lastName: p.student.lastName,
                firstName: p.student.firstName,
                class: p.student.class?.classCode,
                faculty: p.student.faculty?.facultyName,
                email: p.student.email,
                status: p.status === 'attended' ? 'x' : '',
                attendedAt: p.attendedAt ? p.attendedAt.toLocaleString('vi-VN') : ''
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=DanhSach_ThamGia_${event.eventCode}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xuất file Excel', error: error.message });
    }
};

// Import Attendance Excel
export const importAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng tải lên file Excel' });

        // Check event date
        const event = await Event.findById(id);
        if (!event) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'Sự kiện không tồn tại' });
        }

        const now = new Date();
        const eventDate = new Date(event.eventDate);
        if (now < eventDate) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                success: false, 
                message: 'Chưa đến thời gian diễn ra sự kiện. Không thể nhập điểm danh.' 
            });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const worksheet = workbook.getWorksheet(1);

        const updates = [];
        const errors = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const studentCode = row.getCell(2).value; // Assuming MSSV is column 2
            const statusText = row.getCell(8).value; // Assuming Status is column 8

            if (studentCode) {
                updates.push({ studentCode: studentCode.toString(), statusText });
            }
        });

        let successCount = 0;
        for (const update of updates) {
            const student = await Student.findOne({ studentCode: update.studentCode });
            if (student) {
                const participation = await EventParticipation.findOne({ event: id, student: student._id });
                if (participation) {
                    // Check for various "attended" indicators
                    const val = update.statusText;
                    const isAttended = val === 'x' || val === 'X' || val === 'có' || val === 'Có' || val === true || val === 1 || val === 'Đã tham gia';
                    
                    if (isAttended) {
                        participation.status = 'attended';
                        if (!participation.attendedAt) {
                            participation.attendedAt = new Date();
                        }
                    } else {
                        // If unchecked/empty, revert to registered? 
                        // User said: "chưa check = không tham gia". 
                        // So if it was attended but now empty, should we un-attend?
                        // Usually yes for full sync.
                        participation.status = 'registered';
                        participation.attendedAt = undefined;
                    }
                    await participation.save();
                    if (isAttended) successCount++;
                }
            }
        }
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            message: `Đã điểm danh thành công cho ${successCount} sinh viên`,
            errors
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi nhập file Excel', error: error.message });
    }
};
