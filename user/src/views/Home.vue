<template>
    <div class="home-page">
        <!-- Welcome Section -->
        <n-card class="welcome-card" :bordered="false">
            <div class="welcome-content">
                <div class="welcome-text">
                    <n-h2 style="margin: 0 0 8px 0; color: white;">
                        Xin chào, {{ userData.fullName || 'Sinh viên' }}! 👋
                    </n-h2>
                    <n-text style="color: rgba(255,255,255,0.85); font-size: 15px;">
                        {{ userData.class?.className || 'Chưa có lớp' }} - {{ userData.faculty?.facultyName || 'Chưa có khoa' }}
                    </n-text>
                    <n-tag 
                        v-if="userData.isSecretary" 
                        type="warning" 
                        round 
                        style="margin-top: 12px;"
                    >
                        <template #icon>
                            <i class="fa-solid fa-star"></i>
                        </template>
                        Bí thư lớp
                    </n-tag>
                </div>
                <div class="welcome-icon">
                    <n-icon size="80" color="rgba(255,255,255,0.3)">
                        <i class="fa-solid fa-calendar-days"></i>
                    </n-icon>
                </div>
            </div>
        </n-card>

        <!-- Stats Cards -->
        <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" item-responsive style="margin-top: 20px;">
            <n-gi span="3 m:1">
                <n-card hoverable>
                    <n-statistic label="Tổng sự kiện" :value="stats.totalEvents">
                        <template #prefix>
                            <n-icon color="#2563eb" size="24" style="margin-right: 8px;">
                                <i class="fa-solid fa-calendar"></i>
                            </n-icon>
                        </template>
                    </n-statistic>
                </n-card>
            </n-gi>
            <n-gi span="3 m:1">
                <n-card hoverable>
                    <n-statistic label="Đã tham gia" :value="stats.registeredEvents">
                        <template #prefix>
                            <n-icon color="#16a34a" size="24" style="margin-right: 8px;">
                                <i class="fa-solid fa-check-circle"></i>
                            </n-icon>
                        </template>
                    </n-statistic>
                </n-card>
            </n-gi>
            <n-gi span="3 m:1">
                <n-card hoverable>
                    <n-statistic label="Tổng điểm" :value="stats.totalScore">
                        <template #prefix>
                            <n-icon color="#9333ea" size="24" style="margin-right: 8px;">
                                <i class="fa-solid fa-star"></i>
                            </n-icon>
                        </template>
                    </n-statistic>
                </n-card>
            </n-gi>
        </n-grid>

        <!-- Events Section -->
        <n-card title="Sự kiện" style="margin-top: 20px;">
            <template #header-extra>
                <n-space :size="12">
                    <n-select
                        v-model:value="filterScope"
                        :options="scopeOptions"
                        placeholder="Phạm vi"
                        style="width: 160px;"
                    />
                    <n-select
                        v-model:value="filterStatus"
                        :options="statusOptions"
                        placeholder="Trạng thái"
                        style="width: 160px;"
                    />
                </n-space>
            </template>

            <n-spin :show="loading">
                <n-grid 
                    v-if="filteredEvents.length > 0" 
                    :cols="3" 
                    :x-gap="16" 
                    :y-gap="16" 
                    responsive="screen" 
                    item-responsive
                >
                    <n-gi v-for="event in filteredEvents" :key="event._id" span="3 m:1">
                        <n-card 
                            hoverable 
                            class="event-card"
                            @click="viewEventDetail(event)"
                            content-style="padding: 0;"
                        >
                            <!-- Thumbnail -->
                            <div class="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                <img 
                                    v-if="event.image" 
                                    :src="`http://localhost:3000/${event.image}`" 
                                    class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                    alt="Event Thumbnail"
                                />
                                <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                                    <i class="fa-solid fa-image text-4xl"></i>
                                </div>
                            </div>

                            <div class="p-3!">
                                <!-- Event Title -->
                                <n-h4 class="event-title mb-3 text-lg font-semibold line-clamp-2 h-14" style="margin-top: 0;">
                                    {{ event.eventName }}
                                </n-h4>

                                <!-- Event Info -->
                                <n-space vertical :size="8">
                                    <n-text depth="3" class="flex items-center gap-2 text-sm">
                                        <i class="fa-solid fa-calendar w-4 text-center"></i>
                                        {{ formatDate(event.eventDate) }}
                                        <span v-if="event.endDate"> - {{ formatDate(event.endDate) }}</span>
                                    </n-text>
                                    <n-text depth="3" class="flex items-center gap-2 text-sm">
                                        <i class="fa-solid fa-location-dot w-4 text-center"></i>
                                        <span class="truncate">{{ event.location || 'Chưa xác định' }}</span>
                                    </n-text>
                                    <n-text depth="3" class="flex items-center gap-2 text-sm">
                                        <i class="fa-solid fa-star w-4 text-center"></i>
                                        {{ event.score }} điểm
                                    </n-text>
                                </n-space>

                                <!-- Registration Status -->
                                <n-divider style="margin: 16px 0 12px 0;" />
                                
                                <div class="flex flex-col gap-3">
                                    <div class="registration-status">
                                        <template v-if="event.isRegistered">
                                            <n-text type="success" class="flex items-center gap-2 font-medium">
                                                <i class="fa-solid fa-check-circle"></i>
                                                <span>Đã đăng ký</span>
                                            </n-text>
                                        </template>
                                        <template v-else-if="isEventOpen(event.eventDate, event.eventDate)">
                                            <n-text type="info" class="flex items-center gap-2 font-medium">
                                                <i class="fa-solid fa-circle-plus"></i>
                                                <span>Đăng ký ngay</span>
                                            </n-text>
                                        </template>
                                        <template v-else-if="isEventUpcoming(event.eventDate)">
                                            <n-text type="warning" class="flex items-center gap-2 font-medium">
                                                <i class="fa-solid fa-clock"></i>
                                                <span>Sắp diễn ra</span>
                                            </n-text>
                                        </template>
                                        <template v-else>
                                            <n-text depth="3" class="flex items-center gap-2 font-medium">
                                                <i class="fa-solid fa-ban"></i>
                                                <span>Đã kết thúc</span>
                                            </n-text>
                                        </template>
                                    </div>

                                    <!-- Tags moved to footer -->
                                    <div class="flex gap-2">
                                        <n-tag :type="getScopeTagType(event.scope)" size="small" round class="shadow-sm">
                                            {{ getScopeLabel(event.scope) }}
                                        </n-tag>
                                        <n-tag :type="getStatusTagType(event)" size="small" class="shadow-sm">
                                            {{ getEventStatus(event) }}
                                        </n-tag>
                                    </div>
                                </div>
                            </div>
                        </n-card>
                    </n-gi>
                </n-grid>

                <n-empty v-else description="Không có sự kiện nào" style="padding: 48px 0;">
                    <template #icon>
                        <n-icon size="48" color="#999">
                            <i class="fa-solid fa-calendar-xmark"></i>
                        </n-icon>
                    </template>
                </n-empty>
            </n-spin>
        </n-card>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
    NCard, NGrid, NGi, NStatistic, NSpace, NSelect, NSpin, NTag, NEmpty, 
    NH2, NH4, NText, NIcon, NDivider, useMessage 
} from 'naive-ui';
import { eventAPI } from '../services/api';
import { formatDate, isEventOpen, isEventUpcoming, isEventEnded } from '../utils/dateFormat';

const router = useRouter();
const message = useMessage();

const loading = ref(false);
const events = ref([]);
const registeredEventIds = ref([]);
const filterScope = ref('all');
const filterStatus = ref('all');

const userData = computed(() => {
    return JSON.parse(localStorage.getItem('userData') || '{}');
});

const stats = computed(() => {
    return {
        totalEvents: events.value.length,
        registeredEvents: events.value.filter(e => e.isRegistered).length,
        totalScore: 0
    };
});

const scopeOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Sự kiện trường', value: 'university' },
    { label: 'Sự kiện khoa', value: 'faculty' },
    { label: 'Sự kiện lớp', value: 'class' }
];

const statusOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Sắp diễn ra', value: 'upcoming' },
    { label: 'Đang diễn ra', value: 'ongoing' },
    { label: 'Đã kết thúc', value: 'ended' }
];

const filteredEvents = computed(() => {
    let result = events.value;

    if (filterScope.value !== 'all') {
        result = result.filter(e => e.scope === filterScope.value);
    }

    if (filterStatus.value !== 'all') {
        result = result.filter(e => {
            if (filterStatus.value === 'upcoming') return isEventUpcoming(e.eventDate);
            if (filterStatus.value === 'ongoing') return isEventOpen(e.eventDate, e.eventDate);
            if (filterStatus.value === 'ended') return isEventEnded(e.eventDate);
            return true;
        });
    }

    return result;
});

const getScopeTagType = (scope) => {
    const types = { 'university': 'success', 'faculty': 'info', 'class': 'warning' };
    return types[scope] || 'default';
};

const getScopeLabel = (scope) => {
    const labels = { 'university': 'Trường', 'faculty': 'Khoa', 'class': 'Lớp' };
    return labels[scope] || scope;
};

const getEventStatus = (event) => {
    if (isEventOpen(event.eventDate, event.eventDate)) return 'Đang diễn ra';
    if (isEventUpcoming(event.eventDate)) return 'Sắp diễn ra';
    return 'Đã kết thúc';
};

const getStatusTagType = (event) => {
    if (isEventOpen(event.eventDate, event.eventDate)) return 'success';
    if (isEventUpcoming(event.eventDate)) return 'warning';
    return 'default';
};

const loadEvents = async () => {
    loading.value = true;
    try {
        // Lấy thông tin khoa và lớp của sinh viên
        const facultyId = userData.value.faculty?._id || userData.value.faculty;
        const classId = userData.value.class?._id || userData.value.class;
        
        // Gọi API lấy sự kiện phù hợp cho sinh viên
        const response = await eventAPI.getForStudent(facultyId, classId);
        events.value = response.data || [];
    } catch (error) {
        console.error('Error loading events:', error);
        message.error('Lỗi khi tải danh sách sự kiện');
    } finally {
        loading.value = false;
    }
};

const loadRegisteredEvents = async () => {
    try {
        registeredEventIds.value = [];
    } catch (error) {
        console.error('Error loading registered events:', error);
    }
};

const viewEventDetail = (event) => {
    router.push(`/events/${event._id}`);
};

onMounted(async () => {
    await loadRegisteredEvents();
    await loadEvents();
});
</script>

<style scoped>
.home-page {
    width: 100%;
    max-width: 100%;
}

/* Welcome Card */
.welcome-card {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    border-radius: 16px;
}

.welcome-card :deep(.n-card__content) {
    padding: 24px 28px;
}

.welcome-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.welcome-text {
    flex: 1;
}

.welcome-icon {
    display: none;
}

@media (min-width: 768px) {
    .welcome-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 120px;
        height: 120px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
    }
}

/* Event Card */
.event-card {
    cursor: pointer;
    transition: all 0.2s ease;
    height: 100%;
}

.event-card:hover {
    transform: translateY(-2px);
}

.event-tags {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.event-title {
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 2;
    min-height: 48px;
}

.text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
}

.registration-status {
    font-weight: 500;
}
</style>
