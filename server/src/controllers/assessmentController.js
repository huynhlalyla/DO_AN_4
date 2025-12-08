import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Criteria from '../models/Criteria.js';
import ManualScore from '../models/ManualScore.js';
import EventParticipation from '../models/EventParticipation.js';
import Semester from '../models/Semester.js';
import Event from '../models/Event.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import StudentAssessment from '../models/StudentAssessment.js';
import { sendEmail } from '../services/emailService.js';

// Helper to check if within student grading period (1 week from start)
const isWithinGradingPeriod = (semester) => {
    if (!semester || !semester.gradingStartDate) return false;
    
    const now = new Date();
    const startDate = new Date(semester.gradingStartDate);
    const studentDeadline = new Date(startDate);
    studentDeadline.setDate(startDate.getDate() + 7); // 1 week window for students

    return now >= startDate && now <= studentDeadline;
};

export const getStudentScoreSheet = async (req, res) => {
    try {
        const studentId = req.user.userId; // Assuming auth middleware sets this
        const { semesterId } = req.query;

        // 1. Determine Semester
        let semester;
        if (semesterId) {
            semester = await Semester.findById(semesterId);
        } else {
            // Find current active semester based on date
            const now = new Date();
            semester = await Semester.findOne({
                startDate: { $lte: now },
                endDate: { $gte: now },
                isActive: true
            });
        }

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy học kỳ phù hợp'
            });
        }

        // 2. Fetch Structure (Categories & Criteria)
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        const criteriaList = await Criteria.find({ isActive: true }).sort({ order: 1 });

        // 3. Fetch Student Data
        // Manual Scores
        const manualScores = await ManualScore.find({
            student: studentId,
            semester: semester.semesterNumber,
            academicYear: semester.academicYear
        });

        // Auto Scores (from Event Participation)
        // Find events in this semester that the student attended OR registered (and event ended)
        const participations = await EventParticipation.find({
            student: studentId,
            status: { $in: ['attended', 'registered'] }
        }).populate({
            path: 'event',
            match: { semester: semester._id }, // Filter events by semester
            select: 'criteria score eventDate'
        });

        // 4. Build the Score Sheet
        const scoreSheet = categories.map(cat => {
            const catCriteria = criteriaList.filter(c => c.category.toString() === cat._id.toString());
            
            let catTotalScore = 0;

            const criteriaData = catCriteria.map(crit => {
                let selfScore = 0;
                let achievedScore = 0;
                let evidence = [];
                let note = '';
                let isLocked = false; // For manual input

                if (crit.scoringType === 'manual') {
                    const ms = manualScores.find(m => m.criteria.toString() === crit._id.toString());
                    if (ms) {
                        selfScore = ms.selfScore;
                        achievedScore = ms.approvalStatus === 'approved' ? ms.approvedScore : 0; // Only count if approved
                        evidence = ms.evidence;
                        note = ms.approvalStatus === 'rejected' ? `Bị từ chối: ${ms.rejectionReason || ''}` : ms.approvalStatus;
                    }
                    
                    // Check if grading is open
                    if (!isWithinGradingPeriod(semester)) {
                        isLocked = true;
                    }
                } else {
                    // Auto scoring
                    const critParticipations = participations.filter(p => {
                        if (!p.event || !p.event.criteria || p.event.criteria.toString() !== crit._id.toString()) return false;
                        
                        // Check if eligible for score
                        if (p.status === 'attended') return true;
                        if (p.status === 'registered') {
                            // Check if event ended
                            const now = new Date();
                            const eventDate = new Date(p.event.eventDate);
                            return eventDate < now;
                        }
                        return false;
                    });
                    
                    // Sum scores
                    const totalAuto = critParticipations.reduce((sum, p) => {
                        // Use scoreReceived if available (for attended), otherwise use event score
                        const score = p.scoreReceived || p.event.score || 0;
                        return sum + score;
                    }, 0);
                    
                    achievedScore = totalAuto;
                    selfScore = totalAuto; // Auto scores are "self" evident
                    isLocked = true;
                }

                catTotalScore += achievedScore;

                return {
                    _id: crit._id,
                    content: crit.content,
                    scoringType: crit.scoringType,
                    maxScore: crit.plusScore, // Display unit score
                    unit: crit.unit,
                    selfScore,
                    achievedScore,
                    evidence,
                    note,
                    isLocked,
                    requireEvidence: crit.requireEvidence
                };
            });

            // Cap category total
            const finalCatScore = Math.min(catTotalScore, cat.maxScore);

            return {
                _id: cat._id,
                categoryName: cat.categoryName,
                maxScore: cat.maxScore,
                criteria: criteriaData,
                totalScore: finalCatScore
            };
        });

        // Calculate Grand Total
        const grandTotal = scoreSheet.reduce((sum, cat) => sum + cat.totalScore, 0);

        res.status(200).json({
            success: true,
            data: {
                semester,
                scoreSheet,
                grandTotal,
                isGradingPeriod: isWithinGradingPeriod(semester)
            }
        });

    } catch (error) {
        console.error('Get score sheet error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy bảng điểm',
            error: error.message
        });
    }
};

export const submitSelfScore = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { semesterId, criteriaId, selfScore, evidence } = req.body;

        const semester = await Semester.findById(semesterId);
        if (!semester) {
            return res.status(404).json({ message: 'Học kỳ không tồn tại' });
        }

        // Check grading period
        if (!isWithinGradingPeriod(semester)) {
            return res.status(400).json({ message: 'Đã hết thời gian chấm điểm' });
        }

        const criteria = await Criteria.findById(criteriaId);
        if (!criteria) {
            return res.status(404).json({ message: 'Tiêu chí không tồn tại' });
        }

        if (criteria.scoringType !== 'manual') {
            return res.status(400).json({ message: 'Tiêu chí này được chấm tự động' });
        }

        // Update or Create ManualScore
        let manualScore = await ManualScore.findOne({
            student: studentId,
            criteria: criteriaId,
            semester: semester.semesterNumber,
            academicYear: semester.academicYear
        });

        if (manualScore) {
            manualScore.selfScore = selfScore;
            manualScore.evidence = evidence; // Array of { url, fileName }
            manualScore.approvalStatus = 'pending'; // Reset status on update
            manualScore.updatedAt = Date.now();
        } else {
            manualScore = new ManualScore({
                student: studentId,
                criteria: criteriaId,
                semester: semester.semesterNumber,
                academicYear: semester.academicYear,
                selfScore,
                evidence,
                approvalStatus: 'pending'
            });
        }

        await manualScore.save();

        res.status(200).json({
            success: true,
            message: 'Lưu điểm thành công',
            data: manualScore
        });

    } catch (error) {
        console.error('Submit score error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lưu điểm',
            error: error.message
        });
    }
};

// --- Class Secretary Functions ---

export const getClassAssessmentStatus = async (req, res) => {
    try {
        const { classId } = req.params;
        const { semesterId } = req.query;

        // Validate semester
        let semester;
        if (semesterId) {
            semester = await Semester.findById(semesterId);
        } else {
            const now = new Date();
            semester = await Semester.findOne({
                startDate: { $lte: now },
                endDate: { $gte: now },
                isActive: true
            });
        }

        if (!semester) {
            return res.status(404).json({ message: 'Không tìm thấy học kỳ' });
        }

        // Get all students in class
        const students = await Student.find({ class: classId }).select('studentCode lastName firstName isSecretary');
        const studentIds = students.map(s => s._id);

        // Get assessments for this semester
        const assessments = await StudentAssessment.find({
            student: { $in: studentIds },
            semester: semester.semesterNumber,
            academicYear: semester.academicYear
        });

        // Fetch Data for Self Score Calculation
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        const criteriaList = await Criteria.find({ isActive: true }).sort({ order: 1 });

        const manualScores = await ManualScore.find({
            student: { $in: studentIds },
            semester: semester.semesterNumber,
            academicYear: semester.academicYear
        });

        // Find events in this semester
        const events = await Event.find({
            startDate: { $gte: semester.startDate, $lte: semester.endDate }
        }).select('_id criteria');
        const eventIds = events.map(e => e._id);

        const participations = await EventParticipation.find({
            student: { $in: studentIds },
            event: { $in: eventIds },
            status: { $in: ['attended', 'registered'] }
        }).populate('event');

        // Map status
        const result = students.map(student => {
            const assessment = assessments.find(a => a.student.toString() === student._id.toString());
            
            // Calculate Self Score
            let totalSelfScore = 0;
            
            categories.forEach(cat => {
                const catCriteria = criteriaList.filter(c => c.category.toString() === cat._id.toString());
                let catSelfScore = 0;

                catCriteria.forEach(crit => {
                    let score = 0;
                    if (crit.scoringType === 'manual') {
                        const ms = manualScores.find(m => 
                            m.student.toString() === student._id.toString() && 
                            m.criteria.toString() === crit._id.toString()
                        );
                        if (ms) score = ms.selfScore;
                    } else {
                        // Auto
                        const critParticipations = participations.filter(p => {
                            if (p.student.toString() !== student._id.toString()) return false;
                            if (!p.event || !p.event.criteria || p.event.criteria.toString() !== crit._id.toString()) return false;
                            
                            if (p.status === 'attended') return true;
                            if (p.status === 'registered') {
                                const now = new Date();
                                const eventDate = new Date(p.event.eventDate);
                                const endDate = p.event.endDate ? new Date(p.event.endDate) : eventDate;
                                return endDate < now;
                            }
                            return false;
                        });
                        score = critParticipations.reduce((sum, p) => {
                            const s = p.scoreReceived || p.event.score || 0;
                            return sum + s;
                        }, 0);
                    }
                    catSelfScore += score;
                });

                totalSelfScore += Math.min(catSelfScore, cat.maxScore);
            });

            return {
                _id: student._id,
                studentCode: student.studentCode,
                fullName: `${student.lastName} ${student.firstName}`,
                isSecretary: student.isSecretary,
                status: assessment ? assessment.status : 'not_started',
                totalScore: assessment ? assessment.totalScore : 0,
                totalSelfScore: totalSelfScore
            };
        });

        res.status(200).json({
            success: true,
            data: {
                semester,
                students: result
            }
        });

    } catch (error) {
        console.error('Get class status error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách lớp' });
    }
};

export const getStudentScoreSheetForSecretary = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semesterId } = req.query;

        // 1. Determine Semester
        let semester;
        if (semesterId) {
            semester = await Semester.findById(semesterId);
        } else {
            const now = new Date();
            semester = await Semester.findOne({
                startDate: { $lte: now },
                endDate: { $gte: now },
                isActive: true
            });
        }

        if (!semester) return res.status(404).json({ message: 'Không tìm thấy học kỳ' });

        // 2. Fetch Structure
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        const criteriaList = await Criteria.find({ isActive: true }).sort({ order: 1 });

        // 3. Fetch Data
        const manualScores = await ManualScore.find({
            student: studentId,
            semester: semester.semesterNumber,
            academicYear: semester.academicYear
        });

        const participations = await EventParticipation.find({
            student: studentId,
            status: { $in: ['attended', 'registered'] }
        }).populate('event');

        // Filter participations by semester and status rules
        const semesterParticipations = participations.filter(p => {
            if (!p.event || !p.event.eventDate) return false;
            const eventDate = new Date(p.event.eventDate);
            
            // Check if event is within semester
            if (eventDate < new Date(semester.startDate) || eventDate > new Date(semester.endDate)) {
                return false;
            }

            // Status check
            if (p.status === 'attended') return true;
            if (p.status === 'registered') {
                const now = new Date();
                // Use endDate if available, otherwise eventDate
                const endDate = p.event.endDate ? new Date(p.event.endDate) : eventDate;
                return endDate < now;
            }
            return false;
        });

        // 4. Build Score Sheet
        let grandTotal = 0;
        const scoreSheet = categories.map(cat => {
            const catCriteria = criteriaList.filter(c => c.category.toString() === cat._id.toString());
            let catTotalScore = 0;

            const criteriaData = catCriteria.map(crit => {
                let achievedScore = 0;
                let selfScore = 0;
                let approvedScore = 0;
                let evidence = [];
                let note = '';
                let approvalStatus = 'pending';

                if (crit.scoringType === 'manual') {
                    const ms = manualScores.find(m => m.criteria.toString() === crit._id.toString());
                    if (ms) {
                        selfScore = ms.selfScore;
                        approvedScore = ms.approvedScore !== undefined ? ms.approvedScore : ms.selfScore; // Default to selfScore if not approved yet
                        evidence = ms.evidence;
                        note = ms.description;
                        approvalStatus = ms.approvalStatus;
                        achievedScore = approvedScore; // Use approved score for calculation
                    }
                } else {
                    // Auto
                    const critParticipations = semesterParticipations.filter(p => 
                        p.event.criteria && p.event.criteria.toString() === crit._id.toString()
                    );
                    const totalAuto = critParticipations.reduce((sum, p) => sum + (p.scoreReceived || p.event.score || 0), 0);
                    achievedScore = totalAuto;
                    selfScore = totalAuto;
                    approvedScore = totalAuto;
                    approvalStatus = 'approved';
                }

                catTotalScore += achievedScore;

                return {
                    _id: crit._id,
                    content: crit.content,
                    scoringType: crit.scoringType,
                    maxScore: crit.plusScore,
                    unit: crit.unit,
                    selfScore,
                    approvedScore,
                    achievedScore,
                    evidence,
                    note,
                    approvalStatus,
                    requireEvidence: crit.requireEvidence
                };
            });

            const finalCatScore = Math.min(catTotalScore, cat.maxScore);
            grandTotal += finalCatScore;

            return {
                _id: cat._id,
                categoryName: cat.categoryName,
                maxScore: cat.maxScore,
                criteria: criteriaData,
                totalScore: finalCatScore
            };
        });

        res.status(200).json({
            success: true,
            data: {
                semester,
                scoreSheet,
                grandTotal
            }
        });

    } catch (error) {
        console.error('Get secretary score sheet error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy bảng điểm' });
    }
};

export const updateStudentScore = async (req, res) => {
    try {
        const { studentId, criteriaId, approvedScore, note } = req.body;
        const { semesterId } = req.query; 

        let semester;
        if (semesterId) {
            semester = await Semester.findById(semesterId);
        } else {
             const now = new Date();
            semester = await Semester.findOne({
                startDate: { $lte: now },
                endDate: { $gte: now },
                isActive: true
            });
        }

        let manualScore = await ManualScore.findOne({
            student: studentId,
            criteria: criteriaId,
            semester: semester.semesterNumber,
            academicYear: semester.academicYear
        });

        if (!manualScore) {
            manualScore = new ManualScore({
                student: studentId,
                criteria: criteriaId,
                semester: semester.semesterNumber,
                academicYear: semester.academicYear,
                selfScore: 0, 
                approvedScore: approvedScore,
                approvalStatus: 'approved',
                description: note
            });
        } else {
            manualScore.approvedScore = approvedScore;
            manualScore.approvalStatus = 'approved';
            // if (note) manualScore.description = note; 
        }

        await manualScore.save();

        res.status(200).json({ success: true, message: 'Cập nhật điểm thành công' });

    } catch (error) {
        console.error('Update score error:', error);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật điểm' });
    }
};

export const finalizeStudentAssessment = async (req, res) => {
    try {
        const { studentId, semesterId, totalScore } = req.body;

        const semester = await Semester.findById(semesterId);
        
        let assessment = await StudentAssessment.findOne({
            student: studentId,
            semester: semester.semesterNumber,
            academicYear: semester.academicYear
        });

        if (!assessment) {
            assessment = new StudentAssessment({
                student: studentId,
                semester: semester.semesterNumber,
                academicYear: semester.academicYear,
                status: 'class_reviewed',
                totalScore: totalScore,
                classReviewedBy: req.user.userId,
                classReviewedAt: new Date()
            });
        } else {
            assessment.status = 'class_reviewed';
            assessment.totalScore = totalScore;
            assessment.classReviewedBy = req.user.userId;
            assessment.classReviewedAt = new Date();
        }

        await assessment.save();

        res.status(200).json({ success: true, message: 'Đã chốt điểm sinh viên' });

    } catch (error) {
        console.error('Finalize error:', error);
        res.status(500).json({ success: false, message: 'Lỗi chốt điểm' });
    }
};

// --- Faculty Secretary Functions ---

export const getFacultyClassesStatus = async (req, res) => {
    try {
        const { facultyId } = req.params;
        const { semesterId } = req.query;

        let semester;
        if (semesterId) {
            semester = await Semester.findById(semesterId);
        } else {
            const now = new Date();
            semester = await Semester.findOne({
                startDate: { $lte: now },
                endDate: { $gte: now },
                isActive: true
            });
        }

        const classes = await Class.find({ faculty: facultyId });
        
        const result = await Promise.all(classes.map(async (cls) => {
            const studentCount = await Student.countDocuments({ class: cls._id });
            
            const students = await Student.find({ class: cls._id }).select('_id');
            const studentIds = students.map(s => s._id);

            const finalizedCount = await StudentAssessment.countDocuments({
                student: { $in: studentIds },
                semester: semester.semesterNumber,
                academicYear: semester.academicYear,
                status: { $in: ['class_reviewed', 'faculty_reviewed', 'finalized'] }
            });

            return {
                _id: cls._id,
                className: cls.className,
                studentCount,
                finalizedCount,
                percentage: studentCount > 0 ? Math.round((finalizedCount / studentCount) * 100) : 0
            };
        }));

        res.status(200).json({ success: true, data: result });

    } catch (error) {
        console.error('Get faculty stats error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thống kê khoa' });
    }
};

export const approveClassAssessment = async (req, res) => {
    try {
        const { classId, semesterId } = req.body;

        const semester = await Semester.findById(semesterId);

        const studentCount = await Student.countDocuments({ class: classId });
        const students = await Student.find({ class: classId }).select('_id');
        const studentIds = students.map(s => s._id);

        const finalizedCount = await StudentAssessment.countDocuments({
            student: { $in: studentIds },
            semester: semester.semesterNumber,
            academicYear: semester.academicYear,
            status: { $in: ['class_reviewed', 'faculty_reviewed', 'finalized'] }
        });

        if (finalizedCount < studentCount) {
            return res.status(400).json({ success: false, message: 'Lớp chưa hoàn thành chấm điểm 100%' });
        }

        await StudentAssessment.updateMany(
            {
                student: { $in: studentIds },
                semester: semester.semesterNumber,
                academicYear: semester.academicYear
            },
            {
                $set: {
                    status: 'faculty_reviewed',
                    facultyReviewedBy: req.user.userId,
                    facultyReviewedAt: new Date()
                }
            }
        );

        res.status(200).json({ success: true, message: 'Đã duyệt điểm lớp' });

    } catch (error) {
        console.error('Approve class error:', error);
        res.status(500).json({ success: false, message: 'Lỗi duyệt điểm lớp' });
    }
};

export const remindClassSecretary = async (req, res) => {
    try {
        const { classId } = req.body;

        const secretary = await Student.findOne({ class: classId, isSecretary: true });
        if (!secretary) {
            return res.status(404).json({ success: false, message: 'Lớp chưa có bí thư' });
        }

        await sendEmail(
            secretary.email,
            'Nhắc nhở chấm điểm rèn luyện',
            `Chào ${secretary.firstName},<br>Vui lòng hoàn thành việc chấm điểm rèn luyện cho lớp của bạn.`
        );

        res.status(200).json({ success: true, message: 'Đã gửi email nhắc nhở' });

    } catch (error) {
        console.error('Remind error:', error);
        res.status(500).json({ success: false, message: 'Lỗi gửi nhắc nhở' });
    }
};
