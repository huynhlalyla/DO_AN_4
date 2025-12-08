import mongoose from 'mongoose';

const criteriaScoreSchema = new mongoose.Schema({
    criteria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria',
        required: true
    },
    // Điểm tự động từ sự kiện
    autoScore: {
        type: Number,
        default: 0
    },
    // Số lần tham gia sự kiện (cho scoringType = event_plus/event_minus)
    participationCount: {
        type: Number,
        default: 0
    },
    // Điểm thủ công (cho scoringType = manual)
    manualScore: {
        type: Number,
        default: 0
    },
    // Tổng điểm cho tiêu chí này
    totalScore: {
        type: Number,
        default: 0
    },
    // Ghi chú
    note: {
        type: String,
        trim: true
    }
}, { _id: false });

const studentAssessmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    academicYear: {
        type: String,
        required: true,
        trim: true
    },
    semester: {
        type: Number,
        enum: [1, 2, 3],
        required: true
    },
    // Điểm cho từng tiêu chí
    criteriaScores: [criteriaScoreSchema],
    // Tổng điểm theo từng danh mục
    categoryScores: [{
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        },
        totalScore: {
            type: Number,
            default: 0
        },
        maxScore: {
            type: Number,
            required: true
        }
    }],
    // Tổng điểm chung
    totalScore: {
        type: Number,
        default: 0
    },
    maxTotalScore: {
        type: Number,
        default: 100
    },
    // Xếp loại
    classification: {
        type: String,
        enum: ['excellent', 'good', 'average', 'below_average', 'poor', null],
        default: null
        // excellent: Xuất sắc (>= 90)
        // good: Tốt (>= 80)
        // average: Khá (>= 65)
        // below_average: Trung bình (>= 50)
        // poor: Yếu (< 50)
    },
    // Trạng thái
    status: {
        type: String,
        enum: ['draft', 'submitted', 'class_reviewed', 'faculty_reviewed', 'finalized'],
        default: 'draft'
    },
    // Thời gian nộp
    submittedAt: {
        type: Date
    },
    // Đánh giá của lớp
    classReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    classReviewedAt: {
        type: Date
    },
    classComment: {
        type: String,
        trim: true
    },
    // Đánh giá của khoa
    facultyReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    facultyReviewedAt: {
        type: Date
    },
    facultyComment: {
        type: String,
        trim: true
    },
    // Thời gian hoàn tất
    finalizedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes
studentAssessmentSchema.index({ student: 1, academicYear: 1, semester: 1 }, { unique: true });
studentAssessmentSchema.index({ academicYear: 1, semester: 1 });
studentAssessmentSchema.index({ status: 1 });
studentAssessmentSchema.index({ classification: 1 });
studentAssessmentSchema.index({ totalScore: -1 });

// Method để tính xếp loại
studentAssessmentSchema.methods.calculateClassification = function() {
    const score = this.totalScore;
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 65) return 'average';
    if (score >= 50) return 'below_average';
    return 'poor';
};

const StudentAssessment = mongoose.model('StudentAssessment', studentAssessmentSchema);

export default StudentAssessment;
