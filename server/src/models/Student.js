import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    studentCode: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Họ là bắt buộc'],
        trim: true
    },
    firstName: {
        type: String,
        required: [true, 'Tên là bắt buộc'],
        trim: true
    },
    gender: {
        type: String,
        enum: ['Nam', 'Nữ', 'Khác'],
        required: [true, 'Giới tính là bắt buộc']
    },
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Ngày sinh là bắt buộc']
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: [true, 'Lớp là bắt buộc']
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: [true, 'Khoa là bắt buộc']
    },
    isSecretary: {
        type: Boolean,
        default: false,
        comment: 'Xác định sinh viên có phải là Bí thư lớp hay không'
    },
    // Quyền hạn của Bí thư lớp (chỉ áp dụng khi isSecretary = true)
    secretaryPermissions: {
        canOrganizeClassEvents: {
            type: Boolean,
            default: function() { return this.isSecretary; }
        },
        canApproveClassScores: {
            type: Boolean,
            default: function() { return this.isSecretary; }
        },
        canEditClassEvents: {
            type: Boolean,
            default: function() { return this.isSecretary; }
        }
    },
    password: {
        type: String,
        select: false // Không trả về password khi query
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
    return `${this.lastName} ${this.firstName}`;
});

// Ensure virtuals are included in JSON
studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

// Auto-generate studentCode (format: year + 5 digits, VD: 2024000001)
studentSchema.pre('save', async function(next) {
    if (this.isNew && !this.studentCode) {
        try {
            const currentYear = new Date().getFullYear();
            const count = await mongoose.model('Student').countDocuments();
            this.studentCode = `${currentYear}${String(count + 1).padStart(5, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Indexes for better query performance
studentSchema.index({ studentCode: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ class: 1 });
studentSchema.index({ faculty: 1 });

const Student = mongoose.model('Student', studentSchema);

export default Student;
