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

        <!-- Recommended Events Section -->
        <n-card title="Gợi ý cho bạn" style="margin-top: 20px;" v-if="recommendedEvents.length > 0">
            <template #header-extra>
                <n-tag type="success" round size="small">
                    <template #icon><i class="fa-solid fa-wand-magic-sparkles"></i></template>
                    Được đề xuất
                </n-tag>
            </template>
            <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
                <n-gi v-for="event in recommendedEvents" :key="event._id" span="3 m:1">
                    <n-card 
                        hoverable 
                        class="event-card border-l-4! border-l-green-500!"
                        @click="openEventDetail(event)"
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
                            
                            <div class="absolute top-2 right-2">
                                <n-tag type="success" size="small" round class="shadow-sm font-bold">
                                    {{ Math.round(event.recommendationScore) }}% phù hợp
                                </n-tag>
                            </div>
                        </div>

                        <div class="p-3!">
                            <n-h4 class="event-title mb-3 text-lg font-semibold line-clamp-2 h-14" style="margin-top: 0;">
                                {{ event.eventName }}
                            </n-h4>

                            <n-space vertical :size="8">
                                <n-text depth="3" class="flex items-center gap-2 text-sm">
                                    <i class="fa-solid fa-calendar w-4 text-center"></i>
                                    {{ formatDate(event.eventDate) }}
                                </n-text>
                                <n-text depth="3" class="flex items-center gap-2 text-sm">
                                    <i class="fa-solid fa-star w-4 text-center text-yellow-500"></i>
                                    <span class="font-bold text-yellow-600">{{ event.score }} điểm</span>
                                    <span class="text-xs text-gray-400" v-if="event.criteria?.category?.maxScore">
                                        (Max mục: {{ event.criteria.category.maxScore }})
                                    </span>
                                </n-text>
                            </n-space>

                            <n-divider style="margin: 16px 0 12px 0;" />
                            
                            <div class="flex justify-between items-center">
                                <n-tag :type="getScopeTagType(event.scope)" size="small" round>
                                    {{ getScopeLabel(event.scope) }}
                                </n-tag>
                                <n-button size="small" type="primary" ghost>Xem chi tiết</n-button>
                            </div>
                        </div>
                    </n-card>
                </n-gi>
            </n-grid>
        </n-card>

        <!-- Events Section -->
        <n-card title="Sự kiện nổi bật (3 ngày tới)" style="margin-top: 20px;">
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
                            @click="openEventDetail(event)"
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
                                
                                <!-- Hot/New Badge based on logic -->
                                <div class="absolute top-2 right-2" v-if="checkEventUpcoming(event)">
                                    <n-tag type="error" size="small" round class="shadow-sm font-bold">
                                        HOT
                                    </n-tag>
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
                                        <i class="fa-solid fa-star w-4 text-center text-yellow-500"></i>
                                        <span class="font-bold text-yellow-600">{{ event.score }} điểm</span>
                                    </n-text>
                                </n-space>

                                <!-- Registration Status -->
                                <n-divider style="margin: 16px 0 12px 0;" />
                                
                                <div class="flex flex-col gap-3">
                                    <div class="registration-status">
                                        <template v-if="isRegistered(event._id)">
                                            <n-text type="success" class="flex items-center gap-2 font-medium">
                                                <i class="fa-solid fa-check-circle"></i>
                                                <span>Đã đăng ký</span>
                                            </n-text>
                                        </template>
                                        <template v-else-if="checkEventOpen(event)">
                                            <n-text type="info" class="flex items-center gap-2 font-medium">
                                                <i class="fa-solid fa-circle-plus"></i>
                                                <span>Đăng ký ngay</span>
                                            </n-text>
                                        </template>
                                        <template v-else-if="checkEventUpcoming(event)">
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

                <n-empty v-else description="Không có sự kiện nào trong 3 ngày tới" style="padding: 48px 0;">
                    <template #icon>
                        <n-icon size="48" color="#999">
                            <i class="fa-solid fa-calendar-xmark"></i>
                        </n-icon>
                    </template>
                </n-empty>
            </n-spin>
        </n-card>

        <!-- Event Detail Modal -->
        <n-modal
            v-model:show="showDetailModal"
            preset="card"
            style="width: 900px; max-width: 95%"
            :title="selectedEvent?.eventName"
            :bordered="false"
            size="huge"
        >
            <div v-if="selectedEvent" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Left Column: Image & Key Stats -->
                <div class="md:col-span-1 space-y-4">
                    <div class="rounded-lg overflow-hidden shadow-md aspect-video bg-gray-100 dark:bg-gray-800">
                        <img 
                            v-if="selectedEvent.image" 
                            :src="`http://localhost:3000/${selectedEvent.image}`" 
                            class="w-full h-full object-cover"
                            alt="Event Image"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                            <i class="fa-solid fa-image text-5xl"></i>
                        </div>
                    </div>

                    <n-card size="small" :bordered="false" class="bg-gray-50 dark:bg-gray-800/50">
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-500 text-sm">Điểm rèn luyện</span>
                                <span class="font-bold text-yellow-600">{{ selectedEvent.score }}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-500 text-sm">Phạm vi</span>
                                <n-tag :type="getScopeTagType(selectedEvent.scope)" size="small" round>
                                    {{ getScopeLabel(selectedEvent.scope) }}
                                </n-tag>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-500 text-sm">Trạng thái</span>
                                <n-tag :type="getStatusTagType(selectedEvent)" size="small">
                                    {{ getEventStatus(selectedEvent) }}
                                </n-tag>
                            </div>
                        </div>
                    </n-card>

                    <!-- Participation Stats -->
                    <n-card size="small" title="Thống kê tham gia" :bordered="false" class="bg-blue-50 dark:bg-blue-900/10">
                        <div class="text-center mb-2">
                            <span class="text-3xl font-bold text-blue-600">{{ participants.length }}</span>
                            <span class="text-gray-400 text-sm mx-1">/</span>
                            <span class="text-gray-500 text-sm">{{ selectedEvent.maxParticipants || '∞' }}</span>
                        </div>
                        <n-progress
                            type="line"
                            :percentage="calculatePercentage(participants.length, selectedEvent.maxParticipants)"
                            :color="calculatePercentage(participants.length, selectedEvent.maxParticipants) >= 100 ? '#d03050' : '#2080f0'"
                            :height="8"
                            border-radius="4px"
                        />
                        <div class="text-center mt-2 text-xs text-gray-500">
                            Tỷ lệ đăng ký
                        </div>
                    </n-card>
                </div>

                <!-- Right Column: Details & Participants -->
                <div class="md:col-span-2 space-y-6">
                    <!-- Info Grid -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex items-start gap-3 p-3! rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <i class="fa-regular fa-calendar"></i>
                            </div>
                            <div>
                                <div class="text-xs text-gray-500 uppercase font-bold">Thời gian</div>
                                <div class="font-medium">{{ formatDate(selectedEvent.eventDate) }}</div>
                                <div v-if="selectedEvent.endDate" class="text-xs text-gray-500">
                                    đến {{ formatDate(selectedEvent.endDate) }}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-start gap-3 p-3! rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div class="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-location-dot"></i>
                            </div>
                            <div>
                                <div class="text-xs text-gray-500 uppercase font-bold">Địa điểm</div>
                                <div class="font-medium">{{ selectedEvent.location || 'Chưa xác định' }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div>
                        <h3 class="font-bold text-lg mb-2 flex items-center gap-2">
                            <i class="fa-solid fa-circle-info text-gray-400"></i>
                            Mô tả sự kiện
                        </h3>
                        <div class="p-4! rounded-lg bg-gray-50 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {{ selectedEvent.description || 'Không có mô tả chi tiết.' }}
                        </div>
                    </div>

                    <!-- Participants List -->
                    <div>
                        <h3 class="font-bold text-lg mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-users text-gray-400"></i>
                            Sinh viên tham gia
                        </h3>
                        <n-spin :show="detailLoading">
                            <div v-if="participants.length > 0" class="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div 
                                        v-for="(p, index) in participants" 
                                        :key="index"
                                        class="flex items-center gap-3 p-2! rounded border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div class="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                                            {{ getInitials(p.student?.lastName, p.student?.firstName) }}
                                        </div>
                                        <div class="overflow-hidden">
                                            <div class="font-medium text-sm truncate">
                                                {{ p.student?.lastName }} {{ p.student?.firstName }}
                                            </div>
                                            <div class="text-xs text-gray-500 truncate">
                                                {{ p.student?.studentCode }} - {{ p.student?.class?.classCode }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <n-empty v-else description="Chưa có sinh viên nào đăng ký" class="py-6!" />
                        </n-spin>
                    </div>
                </div>
            </div>
            
            <template #footer>
                <div class="flex justify-end gap-3">
                    <n-button @click="showDetailModal = false">Đóng</n-button>
                    <n-button 
                        v-if="canRegister(selectedEvent)" 
                        type="primary" 
                        @click="handleRegister(selectedEvent)"
                        :loading="registeringId === selectedEvent?._id"
                    >
                        Đăng ký tham gia
                    </n-button>
                </div>
            </template>
        </n-modal>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
    NCard, NGrid, NGi, NStatistic, NSpace, NSelect, NSpin, NTag, NEmpty, 
    NH2, NH4, NText, NIcon, NDivider, useMessage, NModal, NProgress, NButton 
} from 'naive-ui';
import { eventAPI } from '../services/api';
import { formatDate, isEventOpen, isEventUpcoming, isEventEnded, combineDateAndTime } from '../utils/dateFormat';

const router = useRouter();
const message = useMessage();

const loading = ref(false);
const events = ref([]);
const registeredEventIds = ref([]);
const participatedCategoryIds = ref(new Set());
const registeringId = ref(null);

// Detail Modal State
const showDetailModal = ref(false);
const selectedEvent = ref(null);
const participants = ref([]);
const detailLoading = ref(false);

const userData = computed(() => {
    return JSON.parse(localStorage.getItem('userData') || '{}');
});

const stats = computed(() => {
    return {
        totalEvents: events.value.length,
        registeredEvents: events.value.filter(e => registeredEventIds.value.includes(e._id)).length,
        totalScore: 0 // This would need more logic to calculate actual score
    };
});

const recommendedEvents = computed(() => {
    if (events.value.length === 0) return [];

    const now = new Date();
    
    // 1. Filter upcoming events only
    let candidates = events.value.filter(e => {
        const { start } = getEventDates(e);
        return start > now && !isRegistered(e._id);
    });

    // 2. Calculate Score for each event
    candidates = candidates.map(event => {
        let score = 0;
        const category = event.criteria?.category;
        
        // Base score from event points (normalized to 0-100 scale roughly)
        score += (event.score || 0) * 2; 

        if (category) {
            // Bonus for high category max score
            score += (category.maxScore || 0);

            // Bonus for unparticipated category (High priority)
            if (!participatedCategoryIds.value.has(category._id)) {
                score += 50; // Big boost for new categories
            }
        }

        return { ...event, recommendationScore: score };
    });

    // 3. Conflict Resolution (Group by Date)
    const eventsByDate = {};
    candidates.forEach(event => {
        const dateKey = new Date(event.eventDate).toDateString();
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
    });

    // For each date, pick the best event
    const bestEvents = [];
    Object.values(eventsByDate).forEach(dayEvents => {
        // Sort by score desc
        dayEvents.sort((a, b) => b.recommendationScore - a.recommendationScore);
        // Take the top one (or top N if we want to allow some choice)
        // User said: "ưu tiên sự kiện có mức điểm cộng cao..." implies picking the best one
        bestEvents.push(dayEvents[0]);
    });

    // 4. Final Sort & Limit
    bestEvents.sort((a, b) => b.recommendationScore - a.recommendationScore);
    
    // Return top 3 recommendations
    return bestEvents.slice(0, 3);
});

const filteredEvents = computed(() => {
    let result = events.value;
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);

    // Filter: Ongoing OR Starts within next 3 days
    result = result.filter(e => {
        const { start, end } = getEventDates(e);
        
        // Case 1: Ongoing (Start <= Now <= End)
        const isOngoing = start <= now && end >= now;
        
        // Case 2: Upcoming within 3 days (Now < Start <= 3 Days Later)
        const isUpcomingSoon = start > now && start <= threeDaysLater;
        
        return isOngoing || isUpcomingSoon;
    });

    // Sort: Nearest Date ASC, then Score DESC
    result.sort((a, b) => {
        const { start: dateA } = getEventDates(a);
        const { start: dateB } = getEventDates(b);
        
        // If dates are different, sort by date (nearest first)
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        
        // If dates are same, sort by score (highest first)
        return b.score - a.score;
    });

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

const getEventDates = (event) => {
    const start = combineDateAndTime(event.eventDate, event.startTime);
    let end = combineDateAndTime(event.endDate || event.eventDate, event.endTime);
    
    // If no end time/date, default to end of start day
    if (!event.endTime && !event.endDate) {
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
    } else if (!event.endTime && event.endDate) {
         // If end date but no end time, default to end of end day
         end.setHours(23, 59, 59, 999);
    }
    
    return { start, end };
};

const checkEventOpen = (event) => {
    const { start, end } = getEventDates(event);
    return isEventOpen(start, end);
};

const checkEventUpcoming = (event) => {
    const { start } = getEventDates(event);
    return isEventUpcoming(start);
};

const checkEventEnded = (event) => {
    const { end } = getEventDates(event);
    return isEventEnded(end);
};

const getEventStatus = (event) => {
    if (checkEventOpen(event)) return 'Đang diễn ra';
    if (checkEventUpcoming(event)) return 'Sắp diễn ra';
    return 'Đã kết thúc';
};

const getStatusTagType = (event) => {
    if (checkEventOpen(event)) return 'success';
    if (checkEventUpcoming(event)) return 'warning';
    return 'default';
};

const loadEvents = async () => {
    loading.value = true;
    try {
        const facultyId = userData.value.faculty?._id || userData.value.faculty;
        const classId = userData.value.class?._id || userData.value.class;
        
        const response = await eventAPI.getForStudent(facultyId, classId);
        events.value = response.data || [];
        
        // Fetch registered events
        if (userData.value._id) {
            const regResponse = await eventAPI.getRegisteredEvents(userData.value._id);
            const participations = regResponse.data || [];
            
            registeredEventIds.value = participations
                .filter(p => p.event)
                .map(p => p.event._id || p.event);

            // Extract participated categories
            participatedCategoryIds.value = new Set();
            participations.forEach(p => {
                if (p.event && p.event.criteria && p.event.criteria.category) {
                    participatedCategoryIds.value.add(p.event.criteria.category._id);
                }
            });
        }
    } catch (error) {
        console.error('Error loading events:', error);
        message.error('Lỗi khi tải danh sách sự kiện');
    } finally {
        loading.value = false;
    }
};

// Modal & Registration Logic
const openEventDetail = async (event) => {
    selectedEvent.value = event;
    showDetailModal.value = true;
    detailLoading.value = true;
    participants.value = [];
    
    try {
        const response = await eventAPI.getParticipants(event._id);
        participants.value = response.data || [];
    } catch (error) {
        console.error('Error fetching participants:', error);
    } finally {
        detailLoading.value = false;
    }
};

const calculatePercentage = (current, max) => {
    if (!max) return 0;
    return Math.min(Math.round((current / max) * 100), 100);
};

const getInitials = (lastName, firstName) => {
    if (!lastName && !firstName) return '?';
    const last = lastName ? lastName.charAt(0) : '';
    const first = firstName ? firstName.charAt(0) : '';
    return `${last}${first}`.toUpperCase();
};

const isRegistered = (eventId) => registeredEventIds.value.includes(eventId);

const canRegister = (event) => {
    if (!event) return false;
    if (isRegistered(event._id)) return false;
    if (checkEventEnded(event)) return false;
    
    // Check scope eligibility
    if (event.scope === 'faculty') {
        const targetFacultyId = event.targetFaculty?._id || event.targetFaculty;
        const studentFacultyId = userData.value.faculty?._id || userData.value.faculty;
        if (targetFacultyId !== studentFacultyId) return false;
    }
    
    if (event.scope === 'class') {
        const targetClassId = event.targetClass?._id || event.targetClass;
        const studentClassId = userData.value.class?._id || userData.value.class;
        if (targetClassId !== studentClassId) return false;
    }
    
    return true;
};

const handleRegister = async (event) => {
    if (!userData.value._id) {
        message.error('Vui lòng đăng nhập lại');
        return;
    }

    registeringId.value = event._id;
    try {
        await eventAPI.register(event._id, userData.value._id);
        message.success('Đăng ký thành công!');
        registeredEventIds.value.push(event._id);
        if (showDetailModal.value && selectedEvent.value?._id === event._id) {
            openEventDetail(event);
        }
    } catch (error) {
        message.error(error.message || 'Đăng ký thất bại');
    } finally {
        registeringId.value = null;
    }
};

onMounted(async () => {
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

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #aaa;
}
</style>
