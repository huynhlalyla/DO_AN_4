import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    categoryCode: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    categoryName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    maxScore: {
        type: Number,
        required: true,
        min: 0
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

// Auto-generate categoryCode (format: DM + 2 digits)
categorySchema.pre('save', async function(next) {
    if (this.isNew && !this.categoryCode) {
        try {
            const count = await mongoose.model('Category').countDocuments();
            this.categoryCode = `DM${String(count + 1).padStart(2, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Indexes
categorySchema.index({ categoryCode: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ isActive: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
