import mongoose from 'mongoose';

const criteriaSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    criteriaCode: {
        type: String,
        trim: true,
        uppercase: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    // Mô tả chi tiết - mảng các nội dung đánh giá kèm điểm cộng
    description: [{
        content: {
            type: String,
            required: true,
            trim: true
        },
        score: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    // Loại cách tính điểm
    scoringType: {
        type: String,
        enum: ['auto', 'manual'],
        required: true,
        default: 'auto'
        // auto: Tự động tính điểm qua sự kiện (cộng/trừ)
        // manual: Sinh viên tự chấm → Bí thư duyệt
    },
    // Đơn vị tính
    unit: {
        type: String,
        enum: ['per_semester', 'per_year', 'per_time'],
        required: true,
        default: 'per_time'
    },
    // Điểm cộng tối đa cho 1 lần tham gia (đơn vị: điểm/lần)
    plusScore: {
        type: Number,
        default: 0,
        min: 0
    },
    // Số lần tối đa được tính điểm cộng (null = không giới hạn)
    maxTimes: {
        type: Number,
        default: null,
        min: 0
    },
    // Điểm trừ tối đa cho 1 lần vi phạm (đơn vị: điểm/lần)
    minusScore: {
        type: Number,
        default: 0,
        max: 0  // Phải là số âm hoặc 0
    },
    // Yêu cầu minh chứng (dùng cho manual)
    requireEvidence: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Auto-generate criteriaCode (format: TC + category order + 3 digits)
criteriaSchema.pre('save', async function(next) {
    if (this.isNew && !this.criteriaCode) {
        try {
            // Đếm số tiêu chí trong cùng category
            const count = await mongoose.model('Criteria').countDocuments({ category: this.category });
            
            // Lấy thông tin category để lấy order
            const category = await mongoose.model('Category').findById(this.category);
            const categoryOrder = category ? category.order : 0;
            
            this.criteriaCode = `TC${categoryOrder}${String(count + 1).padStart(3, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Indexes
criteriaSchema.index({ category: 1, criteriaCode: 1 });
criteriaSchema.index({ category: 1, order: 1 });
criteriaSchema.index({ scoringType: 1 });
criteriaSchema.index({ isActive: 1 });

const Criteria = mongoose.model('Criteria', criteriaSchema);

export default Criteria;
