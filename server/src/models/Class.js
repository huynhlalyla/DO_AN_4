import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
    classCode: {
        type: String,
        required: [true, 'Mã lớp là bắt buộc'],
        unique: true,
        uppercase: true,
        trim: true
    },
    className: {
        type: String,
        required: [true, 'Tên lớp là bắt buộc'],
        trim: true
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: [true, 'Khoa là bắt buộc']
    },
    academicYear: {
        type: String,
        required: [true, 'Năm học là bắt buộc'],
        // Format: 2021-2025
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes
classSchema.index({ classCode: 1 });
classSchema.index({ faculty: 1 });

const Class = mongoose.model('Class', classSchema);

export default Class;
