import mongoose from 'mongoose';

const eventParticipationSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    // Trạng thái tham gia
    status: {
        type: String,
        enum: ['registered', 'attended', 'absent', 'cancelled'],
        default: 'registered'
    },
    // Thời gian đăng ký
    registeredAt: {
        type: Date,
        default: Date.now
    },
    // Thời gian điểm danh (nếu có)
    attendedAt: {
        type: Date
    },
    // Điểm nhận được
    scoreReceived: {
        type: Number,
        default: 0
    },
    // Ghi chú
    note: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Đảm bảo 1 sinh viên chỉ đăng ký 1 lần cho 1 sự kiện
eventParticipationSchema.index({ event: 1, student: 1 }, { unique: true });
eventParticipationSchema.index({ student: 1, status: 1 });
eventParticipationSchema.index({ event: 1, status: 1 });

const EventParticipation = mongoose.model('EventParticipation', eventParticipationSchema);

export default EventParticipation;
