import Category from '../models/Category.js';

// Lấy tất cả danh mục
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách danh mục',
            error: error.message
        });
    }
};

// Lấy danh mục theo ID
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin danh mục',
            error: error.message
        });
    }
};

// Tạo danh mục mới
export const createCategory = async (req, res) => {
    try {
        const { categoryName, description, maxScore, order } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!categoryName || maxScore === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tên danh mục và điểm tối đa'
            });
        }

        const category = await Category.create({
            categoryName,
            description,
            maxScore,
            order
        });

        res.status(201).json({
            success: true,
            message: 'Tạo danh mục thành công',
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo danh mục',
            error: error.message
        });
    }
};

// Cập nhật danh mục
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            data: updatedCategory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật danh mục',
            error: error.message
        });
    }
};

// Xóa danh mục (soft delete)
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        category.isActive = false;
        await category.save();

        res.status(200).json({
            success: true,
            message: 'Xóa danh mục thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa danh mục',
            error: error.message
        });
    }
};
