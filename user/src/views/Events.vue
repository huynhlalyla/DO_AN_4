<template>
    <div class="container mx-auto px-4! py-6!">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Danh sách sự kiện
            </h1>
        </div>

        <!-- Filters -->
        <n-card class="mb-6" :bordered="false">
            <n-grid :x-gap="12" :y-gap="12" cols="1 s:2 m:4">
                <n-gi>
                    <n-input v-model:value="searchQuery" placeholder="Tìm kiếm sự kiện..." clearable>
                        <template #prefix>
                            <i class="fa-solid fa-magnifying-glass text-gray-400"></i>
                        </template>
                    </n-input>
                </n-gi>
                <n-gi>
                    <n-select v-model:value="filterScope" :options="scopeOptions" placeholder="Phạm vi" />
                </n-gi>
                <n-gi>
                    <n-select v-model:value="filterStatus" :options="statusOptions" placeholder="Trạng thái" />
                </n-gi>
                <n-gi>
                    <n-select v-model:value="sortBy" :options="sortOptions" placeholder="Sắp xếp" />
                </n-gi>
            </n-grid>
        </n-card>

        <!-- Events Grid -->
        <n-spin :show="loading">
            <n-grid v-if="filteredEvents.length > 0" :x-gap="16" :y-gap="16" cols="1 s:2 m:3 l:4" responsive="screen">
                <n-gi v-for="event in paginatedEvents" :key="event._id">
                    <n-card 
                        hoverable 
                        class="h-full flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" 
                        content-style="padding: 0; display: flex; flex-direction: column; height: 100%;"
                        @click="openEventDetail(event)"
                    >
                        <!-- Thumbnail -->
                        <div class="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                            <img 
                                v-if="event.image" 
                                :src="`http://localhost:3000/${event.image}`" 
                                class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                alt="Event Thumbnail"
                            />
                            <div v-else class="w-full h-full flex items-center justify-center text-gray-300 bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                <i class="fa-solid fa-image text-4xl opacity-50"></i>
                            </div>
                            
                            <!-- Scope Tag -->
                            <div class="absolute top-3 right-3">
                                <n-tag :type="getScopeTagType(event.scope)" size="small" round class="shadow-md font-medium">
                                    {{ getScopeLabel(event.scope) }}
                                </n-tag>
                            </div>

                            <!-- Date Badge -->
                            <div class="absolute bottom-0 left-0 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3! py-1! rounded-tr-lg text-xs font-bold shadow-sm">
                                <i class="fa-regular fa-calendar mr-1"></i>
                                {{ formatDate(event.eventDate) }}
                            </div>
                        </div>

                        <div class="p-4! flex flex-col grow">
                            <n-h4 class="text-lg font-bold line-clamp-2 mb-3 h-14 mt-0 leading-tight text-gray-800 dark:text-gray-100">
                                {{ event.eventName }}
                            </n-h4>

                            <div class="space-y-3 mb-5 grow">
                                <div class="flex items-start text-sm text-gray-600 dark:text-gray-400">
                                    <i class="fa-solid fa-location-dot w-5 mt-0.5 text-center mr-2 text-red-500"></i>
                                    <span class="line-clamp-1">{{ event.location || 'Chưa xác định' }}</span>
                                </div>
                                <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <i class="fa-solid fa-star w-5 text-center mr-2 text-yellow-500"></i>
                                    <span class="font-medium">{{ event.score }} điểm rèn luyện</span>
                                </div>
                                <div class="flex items-center text-sm text-gray-600 dark:text-gray-400" v-if="event.semester">
                                    <i class="fa-solid fa-graduation-cap w-5 text-center mr-2 text-blue-500"></i>
                                    <span class="font-medium">HK{{ event.semester.semesterNumber }} ({{ event.semester.academicYear }})</span>
                                </div>
                            </div>

                            <div class="mt-auto pt-4! border-t border-gray-100 dark:border-gray-700">
                                <div class="flex justify-between items-center">
                                    <n-tag :type="getStatusTagType(event)" size="small" :bordered="false" class="font-medium">
                                        {{ getEventStatus(event) }}
                                    </n-tag>
                                    
                                    <n-button 
                                        v-if="canRegister(event)" 
                                        type="primary" 
                                        size="small" 
                                        @click.stop="handleRegister(event)"
                                        :loading="registeringId === event._id"
                                        class="shadow-sm"
                                    >
                                        Đăng ký ngay
                                    </n-button>
                                    <n-button 
                                        v-else-if="isRegistered(event._id)" 
                                        type="success" 
                                        secondary 
                                        size="small" 
                                        disabled
                                        class="opacity-80"
                                    >
                                        <template #icon><i class="fa-solid fa-check"></i></template>
                                        Đã đăng ký
                                    </n-button>
                                </div>
                            </div>
                        </div>
                    </n-card>
                </n-gi>
            </n-grid>
            <n-empty v-else description="Không tìm thấy sự kiện nào" class="py-12!" />
            
            <div class="flex justify-center mt-8" v-if="filteredEvents.length > 0">
                <n-pagination v-model:page="currentPage" :page-count="totalPages" />
            </div>
        </n-spin>

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
import { 
    NCard, NGrid, NGi, NInput, NSelect, NTag, NButton, NSpin, NEmpty, NPagination, NH4, NModal, NProgress, useMessage 
} from 'naive-ui';
import { eventAPI } from '../services/api';
import { formatDate, isEventOpen, isEventUpcoming, isEventEnded } from '../utils/dateFormat';

const message = useMessage();
const loading = ref(false);
const events = ref([]);
const registeredEventIds = ref([]);
const registeringId = ref(null);

// Detail Modal State
const showDetailModal = ref(false);
const selectedEvent = ref(null);
const participants = ref([]);
const detailLoading = ref(false);

// Filters
const searchQuery = ref('');
const filterScope = ref('all');
const filterStatus = ref('all');
const sortBy = ref('date_desc');
const currentPage = ref(1);
const pageSize = 12;

const userData = JSON.parse(localStorage.getItem('userData') || '{}');

const scopeOptions = [
    { label: 'Tất cả phạm vi', value: 'all' },
    { label: 'Cấp Trường', value: 'university' },
    { label: 'Cấp Khoa', value: 'faculty' },
    { label: 'Cấp Lớp', value: 'class' }
];

const statusOptions = [
    { label: 'Tất cả trạng thái', value: 'all' },
    { label: 'Sắp diễn ra', value: 'upcoming' },
    { label: 'Đang diễn ra', value: 'ongoing' },
    { label: 'Đã kết thúc', value: 'ended' }
];

const sortOptions = [
    { label: 'Mới nhất', value: 'date_desc' },
    { label: 'Cũ nhất', value: 'date_asc' },
    { label: 'Điểm cao nhất', value: 'score_desc' },
    { label: 'Điểm thấp nhất', value: 'score_asc' }
];

const fetchEvents = async () => {
    loading.value = true;
    try {
        // Fetch events suitable for student
        const facultyId = userData.faculty?._id || userData.faculty;
        const classId = userData.class?._id || userData.class;
        
        const response = await eventAPI.getForStudent(facultyId, classId);
        events.value = response.data || [];
        
        // Fetch registered events to check status
        if (userData._id) {
            const regResponse = await eventAPI.getRegisteredEvents(userData._id);
            registeredEventIds.value = (regResponse.data || [])
                .filter(p => p.event)
                .map(p => p.event._id || p.event);
        }
    } catch (error) {
        message.error('Lỗi tải dữ liệu: ' + error.message);
    } finally {
        loading.value = false;
    }
};

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

const filteredEvents = computed(() => {
    let result = events.value;

    // Search
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(e => e.eventName.toLowerCase().includes(query));
    }

    // Filter Scope
    if (filterScope.value !== 'all') {
        result = result.filter(e => e.scope === filterScope.value);
    }

    // Filter Status
    if (filterStatus.value !== 'all') {
        const now = new Date();
        result = result.filter(e => {
            const start = new Date(e.eventDate);
            const end = e.endDate ? new Date(e.endDate) : new Date(start);
            
            if (filterStatus.value === 'upcoming') return start > now;
            if (filterStatus.value === 'ongoing') return start <= now && end >= now;
            if (filterStatus.value === 'ended') return end < now;
            return true;
        });
    }

    // Sort
    result.sort((a, b) => {
        if (sortBy.value === 'date_desc') return new Date(b.eventDate) - new Date(a.eventDate);
        if (sortBy.value === 'date_asc') return new Date(a.eventDate) - new Date(b.eventDate);
        if (sortBy.value === 'score_desc') return b.score - a.score;
        if (sortBy.value === 'score_asc') return a.score - b.score;
        return 0;
    });

    return result;
});

const paginatedEvents = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    return filteredEvents.value.slice(start, start + pageSize);
});

const totalPages = computed(() => Math.ceil(filteredEvents.value.length / pageSize));

// Helpers
const getScopeLabel = (scope) => {
    const map = { university: 'Trường', faculty: 'Khoa', class: 'Lớp' };
    return map[scope] || scope;
};

const getScopeTagType = (scope) => {
    const map = { university: 'error', faculty: 'info', class: 'success' };
    return map[scope] || 'default';
};

const getEventStatus = (event) => {
    // Use endDate for checking if ended, fallback to eventDate if endDate is missing
    const endDate = event.endDate || event.eventDate;
    if (isEventEnded(endDate)) return 'Đã kết thúc';
    if (isEventUpcoming(event.eventDate)) return 'Sắp diễn ra';
    return 'Đang diễn ra';
};

const getStatusTagType = (event) => {
    const endDate = event.endDate || event.eventDate;
    if (isEventEnded(endDate)) return 'default';
    if (isEventUpcoming(event.eventDate)) return 'warning';
    return 'success';
};

const isRegistered = (eventId) => registeredEventIds.value.includes(eventId);

const canRegister = (event) => {
    if (!event) return false;
    if (isRegistered(event._id)) return false;
    
    // Check if event has started (registration closes when event starts)
    const now = new Date();
    const startDate = new Date(event.eventDate);
    
    if (event.startTime) {
        const [hours, minutes] = event.startTime.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
        startDate.setHours(0, 0, 0, 0);
    }

    if (now >= startDate) return false;
    
    // Check scope eligibility
    if (event.scope === 'faculty') {
        // Check if student belongs to target faculty
        const targetFacultyId = event.targetFaculty?._id || event.targetFaculty;
        const studentFacultyId = userData.faculty?._id || userData.faculty;
        if (targetFacultyId !== studentFacultyId) return false;
    }
    
    if (event.scope === 'class') {
        // Check if student belongs to target class
        const targetClassId = event.targetClass?._id || event.targetClass;
        const studentClassId = userData.class?._id || userData.class;
        if (targetClassId !== studentClassId) return false;
    }
    
    return true;
};

const handleRegister = async (event) => {
    if (!userData._id) {
        message.error('Vui lòng đăng nhập lại');
        return;
    }

    registeringId.value = event._id;
    try {
        await eventAPI.register(event._id, userData._id);
        message.success('Đăng ký thành công!');
        registeredEventIds.value.push(event._id);
        // Refresh participants if modal is open
        if (showDetailModal.value && selectedEvent.value?._id === event._id) {
            openEventDetail(event);
        }
    } catch (error) {
        message.error(error.message || 'Đăng ký thất bại');
    } finally {
        registeringId.value = null;
    }
};

onMounted(() => {
    fetchEvents();
});
</script>

<style scoped>
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
