import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    eventCode: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    eventName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    // Liên kết với tiêu chí chấm điểm
    criteria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria',
        required: true
    },
    // Điểm cộng/trừ cho sự kiện này
    score: {
        type: Number,
        required: true
    },
    // Thời gian
    eventDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: false
    },
    startTime: {
        type: String,
        trim: true
    },
    endTime: {
        type: String,
        trim: true
    },
    // Học kỳ và năm học
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    // academicYear: { // DEPRECATED: Use semester reference instead
    //     type: String,
    //     required: true,
    //     trim: true
    // },
    // Đơn vị tổ chức
    organizerType: {
        type: String,
        enum: ['school', 'faculty', 'class'],
        required: true
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'organizerModel'
    },
    organizerModel: {
        type: String,
        enum: ['Faculty', 'Class']
    },
    // Phạm vi sự kiện (ai được xem và tham gia)
    scope: {
        type: String,
        enum: ['class', 'faculty', 'university'],
        required: true,
        comment: 'class: chỉ lớp cụ thể, faculty: khoa cụ thể, university: toàn trường'
    },
    // Lớp mục tiêu (bắt buộc nếu scope = class)
    targetClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: function() { return this.scope === 'class'; }
    },
    // Khoa mục tiêu (bắt buộc nếu scope = class hoặc faculty)
    targetFaculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: function() { return this.scope === 'class' || this.scope === 'faculty'; }
    },
    // Số lượng
    maxParticipants: {
        type: Number,
        default: null
    },
    currentParticipants: {
        type: Number,
        default: 0
    },
    // Địa điểm
    location: {
        type: String,
        trim: true
    },
    // Ghi chú
    note: {
        type: String,
        trim: true
    },
    // Trạng thái phê duyệt
    isAccept: {
        type: Boolean,
        default: false
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'approverModel'
    },
    approverModel: {
        type: String,
        enum: ['Admin', 'Student']
    },
    approvedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    // Người tạo (có thể là Student nếu isSecretary, hoặc Admin)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'creatorModel',
        required: false
    },
    creatorModel: {
        type: String,
        enum: ['Student', 'Admin'],
        required: function() { return !!this.createdBy; }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Mật khẩu điểm danh
    attendancePassword: {
        type: String,
        select: false // Không trả về khi query thường
    }
}, {
    timestamps: true
});

// Auto-generate eventCode (format: SK + year + 4 digits, VD: SK20240001)
eventSchema.pre('save', async function(next) {
    if (this.isNew && !this.eventCode) {
        try {
            const currentYear = new Date().getFullYear();
            // const count = await mongoose.model('Event').countDocuments();
            const count = Math.floor(Math.random() * 9000); // Temporary random count to avoid
            this.eventCode = `SK${currentYear}${String(count + 1).padStart(4, '0')}`;
            
            // Generate random 6-digit password for attendance
            if (!this.attendancePassword) {
                this.attendancePassword = Math.floor(100000 + Math.random() * 900000).toString();
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Indexes
eventSchema.index({ eventCode: 1 });
eventSchema.index({ criteria: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ academicYear: 1, semester: 1 });
eventSchema.index({ approvalStatus: 1 });
eventSchema.index({ organizerType: 1, organizer: 1 });
eventSchema.index({ isActive: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
