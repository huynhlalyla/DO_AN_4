<script setup>
import { ref, h, onMounted } from 'vue'
import {
    NSpace,
    NCard,
    NStatistic,
    NGrid,
    NGi,
    NButton,
    NTag,
    NTable,
    NDataTable,
    NProgress,
    NIcon,
    NEmpty,
    useMessage
} from 'naive-ui'
import api from '../../services/api'

const message = useMessage()
const loading = ref(false)

// Statistics data
const stats = ref([
    {
        title: 'Tổng số sự kiện',
        value: 0,
        prefix: () => h('i', { class: 'fa-solid fa-calendar-days text-blue-500' }),
        suffix: 'sự kiện',
        description: 'Tổng số sự kiện trong hệ thống',
        trend: 'neutral',
        color: '#3b82f6'
    },
    {
        title: 'Tổng sinh viên',
        value: 0,
        prefix: () => h('i', { class: 'fa-solid fa-user-graduate text-green-500' }),
        suffix: 'sinh viên',
        description: 'Tổng số sinh viên đang hoạt động',
        trend: 'neutral',
        color: '#10b981'
    },
    {
        title: 'Sự kiện đang diễn ra',
        value: 0,
        prefix: () => h('i', { class: 'fa-solid fa-hourglass-half text-orange-500' }),
        suffix: 'sự kiện',
        description: 'Đang diễn ra ngay lúc này',
        trend: 'neutral',
        color: '#f97316'
    },
    {
        title: 'Lượt tham gia',
        value: 0,
        prefix: () => h('i', { class: 'fa-solid fa-users text-purple-500' }),
        suffix: 'lượt',
        description: 'Tổng lượt tham gia sự kiện',
        trend: 'neutral',
        color: '#a855f7'
    }
])

// Recent events table
const recentEvents = ref([])
const weeklyEvents = ref([])

// Helper to calculate status
const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.eventDate);
    // If no endDate, assume it ends same day or check logic. 
    // Usually events have duration. If not, assume 1 day.
    const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 24*60*60*1000);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'completed';
}

// Table columns
const columns = [
    {
        title: 'Tên sự kiện',
        key: 'eventName',
        width: 250
    },
    {
        title: 'Ngày diễn ra',
        key: 'eventDate',
        width: 150,
        render: (row) => new Date(row.eventDate).toLocaleDateString('vi-VN')
    },
    {
        title: 'Địa điểm',
        key: 'location',
        width: 150
    },
    {
        title: 'Điểm',
        key: 'score',
        width: 80
    },
    {
        title: 'Trạng thái',
        key: 'status',
        width: 120,
        render: (row) => {
            const statusKey = getEventStatus(row);
            const statusMap = {
                upcoming: { text: 'Sắp diễn ra', type: 'warning' },
                ongoing: { text: 'Đang diễn ra', type: 'success' },
                completed: { text: 'Đã kết thúc', type: 'default' }
            }
            const status = statusMap[statusKey]
            return h(NTag, { type: status.type, size: 'small' }, { default: () => status.text })
        }
    }
]

// Category distribution
const categoryStats = ref([])

// Quick actions
const quickActions = [
    {
        title: 'Tạo sự kiện mới',
        icon: 'fa-plus',
        color: 'primary',
        path: '/events',
        desc: 'Thêm sự kiện mới vào hệ thống'
    },
    {
        title: 'Quản lý sinh viên',
        icon: 'fa-users',
        color: 'info',
        path: '/students',
        desc: 'Xem và quản lý danh sách sinh viên'
    }
]

const fetchData = async () => {
    loading.value = true
    try {
        const response = await api.dashboard.getStats()
        if (response.success) {
            const data = response.data
            
            // Update stats
            stats.value[0].value = data.totalEvents
            stats.value[1].value = data.totalStudents
            stats.value[2].value = data.ongoingEvents
            stats.value[3].value = data.totalParticipations
            
            // Update recent events
            recentEvents.value = data.recentEvents
            
            // Update category stats
            categoryStats.value = data.categoryStats

            // Update weekly events
            weeklyEvents.value = data.weeklyEvents
        }
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        message.error('Không thể tải dữ liệu thống kê')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchData()
})
</script>

<template>
<NSpace vertical :size="24">
    <!-- Welcome Header -->
    <div class="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-700 dark:to-purple-800 rounded-lg p-6 text-white shadow-lg">
        <h1 class="text-2xl sm:text-3xl font-bold mb-2">
            Xin chào, Quản trị viên! 👋
        </h1>
        <p class="text-blue-100 text-sm sm:text-base">
            Chào mừng bạn đến với hệ thống quản lý sự kiện & điểm rèn luyện
        </p>
        <div class="mt-4 text-sm">
            <i class="fa-solid fa-calendar mr-2"></i>
            {{ new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
        </div>
    </div>

    <!-- Statistics Cards -->
    <NGrid :x-gap="16" :y-gap="16" cols="1 s:2 m:4" responsive="screen">
        <NGi v-for="stat in stats" :key="stat.title">
            <NCard 
                :bordered="false" 
                class="hover:shadow-lg transition-shadow duration-300"
                :style="{ borderLeft: `4px solid ${stat.color}` }"
            >
                <NStatistic :value="stat.value" :tabular-nums="true">
                    <template #label>
                        <div class="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <component :is="stat.prefix" />
                            {{ stat.title }}
                        </div>
                    </template>
                    <template #suffix>
                        <span class="text-sm text-slate-500">{{ stat.suffix }}</span>
                    </template>
                </NStatistic>
                <div class="mt-3 flex items-center gap-2">
                    <i 
                        v-if="stat.trend === 'up'" 
                        class="fa-solid fa-arrow-up text-green-500 text-xs"
                    ></i>
                    <i 
                        v-else-if="stat.trend === 'down'" 
                        class="fa-solid fa-arrow-down text-red-500 text-xs"
                    ></i>
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                        {{ stat.description }}
                    </span>
                </div>
            </NCard>
        </NGi>
    </NGrid>

    <!-- Quick Actions -->
    <NCard title="Thao tác nhanh" :bordered="false">
        <NGrid :x-gap="16" :y-gap="16" cols="1 s:2 m:4" responsive="screen">
            <NGi v-for="action in quickActions" :key="action.title">
                <div 
                    class="h-full group cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-800"
                    @click="$router.push(action.path)"
                >
                    <div class="flex items-center gap-4">
                        <div :class="`w-12 h-12 rounded-lg flex items-center justify-center bg-${action.color}-100 dark:bg-${action.color}-900/30 text-${action.color}-600 dark:text-${action.color}-400`">
                            <i :class="`fa-solid ${action.icon} text-xl`"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                                {{ action.title }}
                            </h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {{ action.desc }}
                            </p>
                        </div>
                    </div>
                </div>
            </NGi>
        </NGrid>
    </NCard>

    <!-- Main Content Grid -->
    <NGrid :x-gap="16" :y-gap="16" cols="1 m:3" responsive="screen">
        <!-- Recent Events -->
        <NGi span="1 m:2">
            <NCard title="Sự kiện gần đây" :bordered="false">
                <template #header-extra>
                    <NButton text type="primary" @click="$router.push('/events')">
                        Xem tất cả <i class="fa-solid fa-arrow-right ml-1"></i>
                    </NButton>
                </template>
                <NDataTable
                    :columns="columns"
                    :data="recentEvents"
                    :pagination="false"
                    :bordered="false"
                    size="small"
                />
            </NCard>
        </NGi>

        <!-- Category Distribution -->
        <NGi span="1">
            <NCard title="Phân loại theo đề mục" :bordered="false">
                <NSpace vertical :size="16">
                    <div v-if="categoryStats.length === 0" class="text-center py-4 text-slate-500">
                        Chưa có dữ liệu
                    </div>
                    <div 
                        v-for="category in categoryStats" 
                        :key="category.name"
                        class="space-y-2"
                    >
                        <div class="flex justify-between items-center text-sm">
                            <span class="w-9/12 font-medium text-slate-700 dark:text-slate-300">
                                {{ category.name }}
                            </span>
                            <span class="w-3/12text-slate-500 dark:text-slate-400">
                                {{ category.percentage }}%
                            </span>
                        </div>
                        <NProgress
                            type="line"
                            :percentage="category.percentage"
                            :color="category.color"
                            :show-indicator="false"
                            :height="8"
                        />
                    </div>
                </NSpace>
            </NCard>

            <!-- Activity Summary -->
            <NCard title="Hoạt động tuần này" :bordered="false" class="mt-4">
                <NSpace vertical :size="12">
                    <div v-if="weeklyEvents.length === 0" class="text-center py-4 text-slate-500">
                        Không có sự kiện nào trong tuần này
                    </div>
                    <div 
                        v-for="event in weeklyEvents" 
                        :key="event._id"
                        class="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <div class="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg shrink-0">
                            <i class="fa-solid fa-calendar-day text-blue-600"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                {{ event.eventName }}
                            </div>
                            <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                                <span><i class="fa-regular fa-clock mr-1"></i>{{ new Date(event.eventDate).toLocaleDateString('vi-VN') }}</span>
                                <span v-if="event.startTime">| {{ event.startTime }}</span>
                            </div>
                        </div>
                    </div>
                </NSpace>
            </NCard>
        </NGi>
    </NGrid>
</NSpace>
</template>

<style scoped>
/* Custom card hover effects */
:deep(.n-card) {
    transition: all 0.3s ease;
}

/* Progress bar styling */
:deep(.n-progress-graph-line-fill) {
    transition: all 0.3s ease;
}

/* Table hover effects */
:deep(.n-data-table-tr:hover) {
    background-color: rgba(59, 130, 246, 0.05);
}
</style>
