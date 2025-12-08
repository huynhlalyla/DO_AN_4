import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
    facultyCode: {
        type: String,
        required: [true, 'Mã khoa là bắt buộc'],
        unique: true,
        uppercase: true,
        trim: true
    },
    facultyName: {
        type: String,
        required: [true, 'Tên khoa là bắt buộc'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Index for better query performance
facultySchema.index({ facultyCode: 1 });

const Faculty = mongoose.model('Faculty', facultySchema);

export default Faculty;
