import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    adminCode: {
        type: String,
        required: [true, 'Mã cán bộ là bắt buộc'],
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
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số']
    },
    password: {
        type: String,
        select: false, // Không trả về password khi query
        comment: 'Mật khẩu đăng nhập (sẽ được đặt qua OTP lần đầu)'
    },
    // Cấp quản lý: Department (Bí thư đoàn khoa) hoặc University (Bí thư trường)
    level: {
        type: String,
        enum: ['Department', 'University'],
        required: [true, 'Cấp quản lý là bắt buộc'],
        comment: 'Department: Bí thư đoàn khoa, University: Bí thư trường'
    },
    // Nếu level là Department, phải gán vào Khoa
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: function() {
            return this.level === 'Department';
        }
    },
    // Quyền hạn
    permissions: {
        // Quản lý sinh viên
        canManageStudents: {
            type: Boolean,
            default: true
        },
        // Quản lý sự kiện
        canManageEvents: {
            type: Boolean,
            default: true
        },
        // Phê duyệt điểm
        canApproveScores: {
            type: Boolean,
            default: true
        },
        // Quản lý lớp (chỉ department)
        canManageClasses: {
            type: Boolean,
            default: function() {
                return this.level === 'Department';
            }
        },
        // Quản lý toàn trường (chỉ university)
        canManageUniversity: {
            type: Boolean,
            default: function() {
                return this.level === 'University';
            }
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true,
    versionKey: false
});

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
    return `${this.lastName} ${this.firstName}`;
});

// Ensure virtuals are included in JSON
adminSchema.set('toJSON', { virtuals: true });
adminSchema.set('toObject', { virtuals: true });

// Validate faculty requirement for Department level
adminSchema.pre('save', function(next) {
    if (this.level === 'Department' && !this.faculty) {
        return next(new Error('Bí thư đoàn khoa phải được gán vào một khoa'));
    }
    if (this.level === 'University' && this.faculty) {
        this.faculty = undefined; // Bí thư trường không thuộc khoa cụ thể
    }
    next();
});

// Indexes for better query performance
adminSchema.index({ adminCode: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ level: 1 });
adminSchema.index({ faculty: 1 });
adminSchema.index({ isActive: 1 });

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
