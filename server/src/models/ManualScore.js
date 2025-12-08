import mongoose from 'mongoose';

const manualScoreSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    criteria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria',
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
    // Điểm sinh viên tự nhập
    selfScore: {
        type: Number,
        required: true,
        min: 0
    },
    // Minh chứng (URLs ảnh)
    evidence: [{
        url: String,
        fileName: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    description: {
        type: String,
        trim: true
    },
    // Trạng thái duyệt
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // Điểm được duyệt (có thể khác với selfScore)
    approvedScore: {
        type: Number,
        min: 0
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    note: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes
manualScoreSchema.index({ student: 1, criteria: 1, academicYear: 1, semester: 1 });
manualScoreSchema.index({ approvalStatus: 1 });
manualScoreSchema.index({ student: 1, academicYear: 1, semester: 1 });

const ManualScore = mongoose.model('ManualScore', manualScoreSchema);

export default ManualScore;
