import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    otpCode: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ['first-login', 'reset-password'],
        required: true
    },
    // Tham chiếu đến Student hoặc Admin
    userType: {
        type: String,
        enum: ['Student', 'Admin'],
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'userType',
        required: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 phút
    }
}, {
    timestamps: true
});

// Index để tự động xóa OTP hết hạn
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index để query nhanh
otpSchema.index({ email: 1, otpCode: 1 });
otpSchema.index({ userId: 1, userType: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
