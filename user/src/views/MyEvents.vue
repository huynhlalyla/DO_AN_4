<template>
    <div class="container mx-auto px-4! py-6!">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Sự kiện đã đăng ký
        </h1>

        <n-spin :show="loading">
            <n-grid v-if="participations.length > 0" :x-gap="16" :y-gap="16" cols="1 s:2 m:3 l:4" responsive="screen">
                <n-gi v-for="p in participations" :key="p._id">
                    <n-card 
                        hoverable 
                        class="h-full flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" 
                        content-style="padding: 0; display: flex; flex-direction: column; height: 100%;"
                        @click="openEventDetail(p.event)"
                    >
                        <!-- Thumbnail -->
                        <div class="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                            <img 
                                v-if="p.event.image" 
                                :src="`http://localhost:3000/${p.event.image}`" 
                                class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                alt="Event Thumbnail"
                            />
                            <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                                <i class="fa-solid fa-image text-3xl"></i>
                            </div>
                            
                            <!-- Status Tag -->
                            <div class="absolute top-2 right-2">
                                <n-tag :type="getParticipationStatusType(p.status)" size="small" round class="shadow-sm">
                                    {{ getParticipationStatusLabel(p.status) }}
                                </n-tag>
                            </div>
                        </div>

                        <div class="p-4! flex flex-col grow">
                            <n-h4 class="text-base font-semibold line-clamp-2 mb-2 h-12 mt-0">
                                {{ p.event.eventName }}
                            </n-h4>

                            <div class="space-y-2 mb-4 grow">
                                <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                    <i class="fa-solid fa-calendar w-5 text-center mr-1"></i>
                                    <span>{{ formatDate(p.event.eventDate) }}</span>
                                </div>
                                <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                    <i class="fa-solid fa-location-dot w-5 text-center mr-1"></i>
                                    <span class="truncate">{{ p.event.location || 'Chưa xác định' }}</span>
                                </div>
                                <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                    <i class="fa-solid fa-star w-5 text-center mr-1"></i>
                                    <span>{{ p.event.score }} điểm</span>
                                </div>
                            </div>
                            
                            <div class="mt-auto pt-3! border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <span class="text-xs text-gray-500">Đăng ký: {{ formatDate(p.createdAt) }}</span>
                                <n-popconfirm
                                    v-if="canCancel(p.event) && p.status === 'registered'"
                                    @positive-click.stop="handleCancelRegistration(p.event._id)"
                                    @click.stop
                                >
                                    <template #trigger>
                                        <n-button size="tiny" type="error" ghost @click.stop>
                                            Hủy
                                        </n-button>
                                    </template>
                                    Bạn có chắc muốn hủy đăng ký?
                                </n-popconfirm>
                            </div>
                        </div>
                    </n-card>
                </n-gi>
            </n-grid>
            <n-empty v-else description="Bạn chưa đăng ký sự kiện nào" class="py-12!" />
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
                </div>
            </template>
        </n-modal>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { NCard, NGrid, NGi, NTag, NSpin, NEmpty, NH4, NModal, NProgress, NButton, NPopconfirm, useMessage } from 'naive-ui';
import { eventAPI } from '../services/api';
import { formatDate, isEventEnded, isEventUpcoming, isEventOpen } from '../utils/dateFormat';

const message = useMessage();
const loading = ref(false);
const participations = ref([]);
const userData = JSON.parse(localStorage.getItem('userData') || '{}');

// Detail Modal State
const showDetailModal = ref(false);
const selectedEvent = ref(null);
const participants = ref([]);
const detailLoading = ref(false);
const registeringId = ref(null);

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

const getScopeLabel = (scope) => {
    const map = { university: 'Trường', faculty: 'Khoa', class: 'Lớp' };
    return map[scope] || scope;
};

const getScopeTagType = (scope) => {
    const map = { university: 'error', faculty: 'info', class: 'success' };
    return map[scope] || 'default';
};

const getEventStatus = (event) => {
    if (isEventEnded(event.eventDate)) return 'Đã kết thúc';
    if (isEventUpcoming(event.eventDate)) return 'Sắp diễn ra';
    return 'Đang diễn ra';
};

const getStatusTagType = (event) => {
    if (isEventEnded(event.eventDate)) return 'default';
    if (isEventUpcoming(event.eventDate)) return 'warning';
    return 'success';
};

const canRegister = (event) => false;
const handleRegister = async (event) => {};

const fetchMyEvents = async () => {
    if (!userData._id) return;
    
    loading.value = true;
    try {
        const response = await eventAPI.getRegisteredEvents(userData._id);
        participations.value = response.data || [];
    } catch (error) {
        message.error('Lỗi tải dữ liệu: ' + error.message);
    } finally {
        loading.value = false;
    }
};

const getParticipationStatusLabel = (status) => {
    const map = {
        registered: 'Đã đăng ký',
        attended: 'Đã tham gia',
        absent: 'Vắng mặt',
        cancelled: 'Đã hủy'
    };
    return map[status] || status;
};

const getParticipationStatusType = (status) => {
    const map = {
        registered: 'info',
        attended: 'success',
        absent: 'error',
        cancelled: 'warning'
    };
    return map[status] || 'default';
};

const canCancel = (event) => {
    // Chỉ cho phép hủy nếu sự kiện chưa diễn ra
    return isEventUpcoming(event.eventDate);
};

const handleCancelRegistration = async (eventId) => {
    try {
        await eventAPI.unregister(eventId, userData._id);
        message.success('Hủy đăng ký thành công');
        fetchMyEvents();
    } catch (error) {
        message.error('Lỗi hủy đăng ký: ' + (error.response?.data?.message || error.message));
    }
};

onMounted(() => {
    fetchMyEvents();
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
