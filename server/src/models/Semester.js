import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
    semesterNumber: {
        type: Number,
        enum: [1, 2, 3],
        required: true
    },
    academicYear: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    gradingStartDate: {
        type: Date,
        required: true
    },
    gradingDeadline: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure no duplicate semester for the same academic year
semesterSchema.index({ semesterNumber: 1, academicYear: 1 }, { unique: true });

const Semester = mongoose.model('Semester', semesterSchema);

export default Semester;
