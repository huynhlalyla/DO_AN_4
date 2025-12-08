import Event from '../models/Event.js';
import Student from '../models/Student.js';
import EventParticipation from '../models/EventParticipation.js';
import mongoose from 'mongoose';

export const getDashboardStats = async (req, res) => {
    try {
        // 1. Tổng số sự kiện (đã duyệt)
        const totalEvents = await Event.countDocuments({ isActive: true, approvalStatus: 'approved' });

        // 2. Tổng số sinh viên
        const totalStudents = await Student.countDocuments({ isActive: true });

        // 3. Sự kiện đang diễn ra (đã duyệt)
        const now = new Date();
        const ongoingEvents = await Event.countDocuments({
            isActive: true,
            approvalStatus: 'approved',
            eventDate: { $lte: now },
            endDate: { $gte: now }
        });

        // 4. Tổng lượt tham gia
        const totalParticipations = await EventParticipation.countDocuments({ 
            status: { $in: ['attended'] } 
        });

        // 5. Danh sách sự kiện gần đây (đã duyệt)
        const recentEvents = await Event.find({ isActive: true, approvalStatus: 'approved' })
            .sort({ eventDate: -1 })
            .limit(5)
            .populate('organizer')
            .select('eventName eventDate location score status organizerType');

        // 6. Phân loại sự kiện theo Đề mục (Category)
        const categoryStats = await Event.aggregate([
            { $match: { isActive: true, approvalStatus: 'approved' } },
            {
                $lookup: {
                    from: 'criterias',
                    localField: 'criteria',
                    foreignField: '_id',
                    as: 'criteriaDoc'
                }
            },
            { $unwind: '$criteriaDoc' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'criteriaDoc.category',
                    foreignField: '_id',
                    as: 'categoryDoc'
                }
            },
            { $unwind: '$categoryDoc' },
            {
                $group: {
                    _id: '$categoryDoc.categoryName',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: '$_id',
                    value: '$count',
                    _id: 0
                }
            }
        ]);

        // Tính phần trăm cho categoryStats
        const totalCategorizedEvents = categoryStats.reduce((acc, curr) => acc + curr.value, 0);
        const categoryStatsWithPercent = categoryStats.map(item => ({
            ...item,
            percentage: totalCategorizedEvents > 0 ? Math.round((item.value / totalCategorizedEvents) * 100) : 0,
            // Assign colors based on index or name (mock colors for now)
            color: '#' + Math.floor(Math.random()*16777215).toString(16) 
        }));

        // 7. Hoạt động tuần này
        const getStartAndEndOfWeek = () => {
            const d = new Date();
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const start = new Date(d.setDate(diff));
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        };
        
        const { start: startOfWeek, end: endOfWeek } = getStartAndEndOfWeek();
        
        const weeklyEvents = await Event.find({
            isActive: true,
            approvalStatus: 'approved',
            eventDate: { $gte: startOfWeek, $lte: endOfWeek }
        })
        .sort({ eventDate: 1 })
        .select('eventName eventDate startTime location');

        res.status(200).json({
            success: true,
            data: {
                totalEvents,
                totalStudents,
                ongoingEvents,
                totalParticipations,
                recentEvents,
                categoryStats: categoryStatsWithPercent,
                weeklyEvents
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy dữ liệu thống kê',
            error: error.message
        });
    }
};
