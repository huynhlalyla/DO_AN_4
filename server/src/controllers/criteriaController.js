import Criteria from '../models/Criteria.js';
import Category from '../models/Category.js';

// Lấy tất cả tiêu chí
export const getAllCriteria = async (req, res) => {
    try {
        const criteria = await Criteria.find({ isActive: true })
            .populate('category')
            .sort({ category: 1, order: 1 });

        res.status(200).json({
            success: true,
            count: criteria.length,
            data: criteria
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách tiêu chí',
            error: error.message
        });
    }
};

// Lấy tiêu chí theo danh mục
export const getCriteriaByCategory = async (req, res) => {
    try {
        const criteria = await Criteria.find({
            category: req.params.categoryId,
            isActive: true
        })
            .populate('category')
            .sort({ order: 1 });

        res.status(200).json({
            success: true,
            count: criteria.length,
            data: criteria
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách tiêu chí',
            error: error.message
        });
    }
};

// Lấy tiêu chí theo ID
export const getCriteriaById = async (req, res) => {
    try {
        const criteria = await Criteria.findById(req.params.id).populate('category');

        if (!criteria) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chí'
            });
        }

        res.status(200).json({
            success: true,
            data: criteria
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin tiêu chí',
            error: error.message
        });
    }
};

// Tạo tiêu chí mới
export const createCriteria = async (req, res) => {
    try {
        const {
            category,
            content,
            description,
            scoringType,
            plusScore,
            maxTimes,
            minusScore,
            requireEvidence,
            order
        } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!category || !content || !scoringType) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin bắt buộc'
            });
        }

        // Kiểm tra category có tồn tại
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        const criteria = await Criteria.create({
            category,
            content,
            description,
            scoringType,
            plusScore: plusScore || 0,
            maxTimes,
            minusScore: minusScore || 0,
            requireEvidence,
            order
        });

        const populatedCriteria = await Criteria.findById(criteria._id).populate('category');

        res.status(201).json({
            success: true,
            message: 'Tạo tiêu chí thành công',
            data: populatedCriteria
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo tiêu chí',
            error: error.message
        });
    }
};

// Cập nhật tiêu chí
export const updateCriteria = async (req, res) => {
    try {
        const criteria = await Criteria.findById(req.params.id);

        if (!criteria) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chí'
            });
        }

        const updatedCriteria = await Criteria.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('category');

        res.status(200).json({
            success: true,
            message: 'Cập nhật tiêu chí thành công',
            data: updatedCriteria
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật tiêu chí',
            error: error.message
        });
    }
};

// Xóa tiêu chí (soft delete)
export const deleteCriteria = async (req, res) => {
    try {
        const criteria = await Criteria.findById(req.params.id);

        if (!criteria) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chí'
            });
        }

        criteria.isActive = false;
        await criteria.save();

        res.status(200).json({
            success: true,
            message: 'Xóa tiêu chí thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa tiêu chí',
            error: error.message
        });
    }
};
