<template>
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Quản lý lớp {{ userData?.class?.className }}
            </h1>
            <n-button v-if="isSecretary" type="primary" @click="() => { isEditMode = false; showCreateModal = true; }">
                <template #icon><i class="fa-solid fa-plus"></i></template>
                Tạo sự kiện lớp
            </n-button>
        </div>

        <n-alert v-if="!isSecretary" type="warning" title="Truy cập bị từ chối" class="mb-6">
            Bạn không có quyền truy cập trang này. Trang này chỉ dành cho Bí thư lớp.
        </n-alert>

        <div v-else>
            <n-tabs type="line" animated @update:value="handleTabChange">
                <n-tab-pane name="events" tab="Sự kiện lớp">
                     <n-card title="Danh sách sự kiện lớp" class="mb-6">
                        <n-data-table
                            :columns="columns"
                            :data="createdEvents"
                            :loading="loading"
                            :pagination="{ pageSize: 10 }"
                        />
                     </n-card>
                </n-tab-pane>
                <n-tab-pane name="scores" tab="Điểm rèn luyện">
                    <n-card title="Danh sách sinh viên" class="mb-6">
                        <template #header-extra>
                            <n-select 
                                v-model:value="selectedSemesterId" 
                                :options="semesterOptions" 
                                placeholder="Chọn học kỳ"
                                style="width: 200px"
                                @update:value="fetchClassStatus"
                            />
                        </template>
                        <n-data-table
                            :columns="studentColumns"
                            :data="students"
                            :loading="loadingStudents"
                            :pagination="{ pageSize: 10 }"
                        />
                    </n-card>
                </n-tab-pane>
            </n-tabs>
        </div>

        <!-- Create/Edit Event Modal -->
        <n-modal v-model:show="showCreateModal" preset="card" :title="isEditMode ? 'Cập nhật sự kiện' : 'Tạo sự kiện mới'" style="width: 600px">
            <n-form ref="formRef" :model="formModel" :rules="rules">
                <n-form-item label="Tên sự kiện" path="eventName">
                    <n-input v-model:value="formModel.eventName" placeholder="Nhập tên sự kiện" />
                </n-form-item>
                
                <n-form-item label="Mô tả" path="description">
                    <n-input v-model:value="formModel.description" type="textarea" placeholder="Mô tả chi tiết" />
                </n-form-item>

                <n-grid :cols="2" :x-gap="12">
                    <n-form-item-gi label="Thời gian" path="eventDate">
                        <n-date-picker 
                            v-model:value="formModel.eventDate" 
                            type="datetime" 
                            class="w-full" 
                            format="dd/MM/yyyy HH:mm"
                            clearable
                        />
                    </n-form-item-gi>
                    <n-form-item-gi label="Địa điểm" path="location">
                        <n-input v-model:value="formModel.location" placeholder="VD: Phòng A101" />
                    </n-form-item-gi>
                </n-grid>

                <n-grid :cols="2" :x-gap="12">
                    <n-form-item-gi label="Học kỳ" path="semester">
                        <n-select 
                            v-model:value="formModel.semester" 
                            :options="semesterOptions" 
                            placeholder="Chọn học kỳ"
                        />
                    </n-form-item-gi>
                    <n-form-item-gi label="Tiêu chí" path="criteria">
                        <n-select 
                            v-model:value="formModel.criteria" 
                            :options="criteriaOptions" 
                            placeholder="Chọn tiêu chí"
                        />
                    </n-form-item-gi>
                </n-grid>

                <n-grid :cols="2" :x-gap="12">
                    <n-form-item-gi label="Điểm rèn luyện" path="score">
                        <n-input-number v-model:value="formModel.score" :min="0" :max="10" />
                    </n-form-item-gi>
                    <n-form-item-gi label="Số lượng tối đa" path="maxParticipants">
                        <n-input-number v-model:value="formModel.maxParticipants" :min="0" />
                    </n-form-item-gi>
                </n-grid>
                
                <n-form-item label="Hình ảnh" path="image">
                     <input type="file" @change="handleFileChange" accept="image/*" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                </n-form-item>

                <div class="flex justify-end gap-2">
                    <n-button @click="showCreateModal = false">Hủy</n-button>
                    <n-button type="primary" :loading="submitting" @click="handleSubmit">Tạo sự kiện</n-button>
                </div>
            </n-form>
        </n-modal>

        <!-- Grade Modal -->
        <n-modal v-model:show="showGradeModal" preset="card" title="Chấm điểm rèn luyện" style="width: 900px">
            <div v-if="currentStudent" class="mb-4">
                <h3 class="text-lg font-bold">Sinh viên: {{ currentStudent.fullName }} ({{ currentStudent.studentCode }})</h3>
                <p>Tổng điểm hiện tại: <span class="font-bold text-blue-600">{{ grandTotal }}</span></p>
            </div>

            <n-collapse>
                <n-collapse-item v-for="cat in scoreSheet" :key="cat._id" :title="`${cat.categoryName} (Tối đa: ${cat.maxScore}đ)`" :name="cat._id">
                    <div class="space-y-4">
                        <div v-for="crit in cat.criteria" :key="crit._id" class="border-b pb-4 last:border-0">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex-1 pr-4">
                                    <p class="font-medium">{{ crit.content }}</p>
                                    <p class="text-sm text-gray-500">Đơn vị: {{ crit.unit }} | Điểm tối đa: {{ crit.maxScore }}</p>
                                    
                                    <!-- Evidence -->
                                    <div v-if="crit.evidence && crit.evidence.length > 0" class="mt-2">
                                        <p class="text-sm font-semibold">Minh chứng:</p>
                                        <div class="flex gap-2 mt-1">
                                            <a v-for="(ev, idx) in crit.evidence" :key="idx" :href="ev.url" target="_blank" class="text-blue-600 hover:underline text-sm">
                                                {{ ev.fileName || 'Xem ảnh' }}
                                            </a>
                                        </div>
                                    </div>
                                    <div v-if="crit.note" class="mt-1 text-sm text-gray-600 italic">
                                        Ghi chú SV: {{ crit.note }}
                                    </div>
                                </div>
                                <div class="w-48 flex flex-col items-end gap-2">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm text-gray-500">SV tự chấm:</span>
                                        <span class="font-bold">{{ crit.selfScore }}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm text-gray-500">Duyệt:</span>
                                        <n-input-number 
                                            v-model:value="crit.approvedScore" 
                                            :min="0" 
                                            :max="crit.maxScore" 
                                            size="small" 
                                            style="width: 80px"
                                            :disabled="crit.scoringType !== 'manual'"
                                            @update:value="() => handleUpdateScore(crit)"
                                        />
                                    </div>
                                    <n-tag v-if="crit.scoringType !== 'manual'" type="info" size="small">Tự động</n-tag>
                                </div>
                            </div>
                        </div>
                    </div>
                </n-collapse-item>
            </n-collapse>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <n-button @click="showGradeModal = false">Đóng</n-button>
                    <n-popconfirm @positive-click="handleFinalize">
                        <template #trigger>
                            <n-button type="primary">Chốt điểm</n-button>
                        </template>
                        Bạn có chắc chắn muốn chốt điểm cho sinh viên này? Sau khi chốt, điểm sẽ được gửi lên khoa.
                    </n-popconfirm>
                </div>
            </template>
        </n-modal>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, h } from 'vue';
import { 
    useMessage, NButton, NAlert, NCard, NEmpty, NModal, NForm, NFormItem, 
    NInput, NGrid, NFormItemGi, NDatePicker, NInputNumber, NSelect,
    NDataTable, NTag, NSpace, NPopconfirm, NTabs, NTabPane, NCollapse, NCollapseItem, NInputGroup
} from 'naive-ui';
import { eventAPI, commonAPI, assessmentAPI } from '../services/api';
import { formatDate, isEventUpcoming, isEventEnded } from '../utils/dateFormat';

const message = useMessage();
const userData = ref(null);
const showCreateModal = ref(false);
const submitting = ref(false);
const formRef = ref(null);
const file = ref(null);
const createdEvents = ref([]);
const loading = ref(false);
const isEditMode = ref(false);
const editingId = ref(null);

// Score Management Refs
const activeTab = ref('events');
const students = ref([]);
const loadingStudents = ref(false);
const showGradeModal = ref(false);
const currentStudent = ref(null);
const scoreSheet = ref([]);
const selectedSemesterId = ref(null);
const grandTotal = ref(0);

const criteriaOptions = ref([]);
const semesterOptions = ref([]);

const formModel = ref({
    eventName: '',
    description: '',
    eventDate: null,
    location: '',
    score: 0,
    maxParticipants: 50,
    scope: 'class',
    criteria: null,
    semester: null
});

const rules = {
    eventName: { required: true, message: 'Vui lòng nhập tên sự kiện', trigger: 'blur' },
    eventDate: { required: true, message: 'Vui lòng chọn thời gian', trigger: 'blur', type: 'number' },
    location: { required: true, message: 'Vui lòng nhập địa điểm', trigger: 'blur' },
    score: { required: true, message: 'Vui lòng nhập điểm', trigger: 'blur', type: 'number' },
    criteria: { required: true, message: 'Vui lòng chọn tiêu chí', trigger: 'blur' },
    semester: { required: true, message: 'Vui lòng chọn học kỳ', trigger: 'blur' }
};

const isSecretary = computed(() => {
    return userData.value?.isSecretary || false;
});

const columns = [
    { title: 'Tên sự kiện', key: 'eventName', width: 200, ellipsis: { tooltip: true } },
    { 
        title: 'Thời gian', 
        key: 'eventDate', 
        width: 150,
        render(row) {
            return formatDate(row.eventDate);
        }
    },
    {
        title: 'Trạng thái duyệt',
        key: 'approvalStatus',
        width: 120,
        render(row) {
            const map = {
                pending: { type: 'warning', label: 'Chờ duyệt' },
                approved: { type: 'success', label: 'Đã duyệt' },
                rejected: { type: 'error', label: 'Từ chối' }
            };
            const status = map[row.approvalStatus] || { type: 'default', label: row.approvalStatus };
            return h(NTag, { type: status.type, size: 'small' }, { default: () => status.label });
        }
    },
    {
        title: 'Tình trạng',
        key: 'isActive',
        width: 120,
        render(row) {
            if (!row.isActive) return h(NTag, { type: 'error', size: 'small' }, { default: () => 'Đã hủy' });
            if (isEventEnded(row.eventDate)) return h(NTag, { type: 'default', size: 'small' }, { default: () => 'Đã kết thúc' });
            return h(NTag, { type: 'success', size: 'small' }, { default: () => 'Đang diễn ra' });
        }
    },
    {
        title: 'Thao tác',
        key: 'actions',
        width: 200,
        render(row) {
            const buttons = [];
            
            // Edit button
            buttons.push(h(NButton, {
                size: 'small',
                type: 'primary',
                ghost: true,
                onClick: () => handleEdit(row)
            }, { default: () => 'Sửa' }));

            // Cancel button (Only if Active and Upcoming)
            if (row.isActive && isEventUpcoming(row.eventDate) && row.approvalStatus !== 'rejected') {
                buttons.push(h(NPopconfirm, {
                    onPositiveClick: () => handleCancel(row)
                }, {
                    trigger: () => h(NButton, {
                        size: 'small',
                        type: 'warning',
                        ghost: true
                    }, { default: () => 'Hủy' }),
                    default: () => 'Bạn có chắc muốn hủy sự kiện này?'
                }));
            }

            // Delete button (Only if Cancelled or Ended)
            const isEnded = isEventEnded(row.eventDate);
            const isCancelled = !row.isActive || row.approvalStatus === 'rejected';
            
            if (isEnded || isCancelled) {
                buttons.push(h(NPopconfirm, {
                    onPositiveClick: () => handleDelete(row)
                }, {
                    trigger: () => h(NButton, {
                        size: 'small',
                        type: 'error',
                        ghost: true
                    }, { default: () => 'Xóa' }),
                    default: () => 'Bạn có chắc muốn xóa vĩnh viễn sự kiện này?'
                }));
            }

            return h(NSpace, { size: 'small' }, { default: () => buttons });
        }
    }
];

const studentColumns = [
    { title: 'MSSV', key: 'studentCode', width: 120 },
    { title: 'Họ tên', key: 'fullName', width: 200 },
    { 
        title: 'Trạng thái', 
        key: 'status',
        width: 150,
        render(row) {
            const map = {
                not_started: { type: 'default', label: 'Chưa chấm' },
                draft: { type: 'warning', label: 'Đang chấm' },
                submitted: { type: 'info', label: 'Đã nộp' },
                class_reviewed: { type: 'success', label: 'Lớp đã duyệt' },
                faculty_reviewed: { type: 'success', label: 'Khoa đã duyệt' },
                finalized: { type: 'success', label: 'Đã chốt' }
            };
            const status = map[row.status] || { type: 'default', label: row.status };
            return h(NTag, { type: status.type, size: 'small' }, { default: () => status.label });
        }
    },
    { title: 'Tổng điểm', key: 'totalScore', width: 100 },
    { title: 'Điểm tự chấm', key: 'totalSelfScore', width: 120 },
    {
        title: 'Thao tác',
        key: 'actions',
        width: 150,
        render(row) {
            return h(NButton, {
                size: 'small',
                type: 'primary',
                ghost: true,
                onClick: () => handleOpenGrade(row)
            }, { default: () => 'Chấm điểm' });
        }
    }
];

const handleTabChange = (value) => {
    activeTab.value = value;
    if (value === 'scores') {
        fetchClassStatus();
    }
};

const fetchClassStatus = async () => {
    if (!userData.value?.class?._id) return;
    loadingStudents.value = true;
    try {
        const res = await assessmentAPI.getClassStatus(userData.value.class._id, selectedSemesterId.value);
        if (res.success) {
            students.value = res.data.students;
            if (!selectedSemesterId.value && res.data.semester) {
                selectedSemesterId.value = res.data.semester._id;
            }
        }
    } catch (error) {
        message.error('Lỗi tải danh sách sinh viên');
    } finally {
        loadingStudents.value = false;
    }
};

const handleOpenGrade = async (student) => {
    currentStudent.value = student;
    showGradeModal.value = true;
    try {
        const res = await assessmentAPI.getStudentScoreSheet(student._id, selectedSemesterId.value);
        if (res.success) {
            scoreSheet.value = res.data.scoreSheet;
            grandTotal.value = res.data.grandTotal;
        }
    } catch (error) {
        message.error('Lỗi tải bảng điểm');
    }
};

const handleUpdateScore = async (crit) => {
    try {
        await assessmentAPI.updateStudentScore({
            studentId: currentStudent.value._id,
            criteriaId: crit._id,
            approvedScore: crit.approvedScore,
            note: crit.note
        });
        message.success('Đã lưu điểm');
        // Recalculate grand total
        let total = 0;
        scoreSheet.value.forEach(cat => {
            let catTotal = 0;
            cat.criteria.forEach(c => {
                catTotal += (c.approvedScore || 0);
            });
            cat.totalScore = Math.min(catTotal, cat.maxScore);
            total += cat.totalScore;
        });
        grandTotal.value = total;
    } catch (error) {
        message.error('Lỗi lưu điểm');
    }
};

const handleFinalize = async () => {
    try {
        await assessmentAPI.finalizeStudent({
            studentId: currentStudent.value._id,
            semesterId: selectedSemesterId.value,
            totalScore: grandTotal.value
        });
        message.success('Đã chốt điểm');
        showGradeModal.value = false;
        fetchClassStatus();
    } catch (error) {
        message.error('Lỗi chốt điểm');
    }
};

const fetchCreatedEvents = async () => {
    if (!userData.value?._id) return;
    loading.value = true;
    try {
        const response = await eventAPI.getCreatedEvents(userData.value._id);
        createdEvents.value = response.data || [];
    } catch (error) {
        console.error('Error fetching created events:', error);
    } finally {
        loading.value = false;
    }
};

const handleEdit = (event) => {
    isEditMode.value = true;
    editingId.value = event._id;
    formModel.value = {
        eventName: event.eventName,
        description: event.description,
        eventDate: new Date(event.eventDate).getTime(),
        location: event.location,
        score: event.score,
        maxParticipants: event.maxParticipants,
        scope: event.scope,
        criteria: event.criteria?._id || event.criteria,
        semester: event.semester?._id || event.semester
    };
    showCreateModal.value = true;
};

const handleCancel = async (event) => {
    try {
        await eventAPI.cancelEvent(event._id, 'Bí thư lớp hủy sự kiện');
        message.success('Đã hủy sự kiện');
        fetchCreatedEvents();
    } catch (error) {
        message.error('Lỗi: ' + (error.response?.data?.message || error.message));
    }
};

const handleDelete = async (event) => {
    try {
        await eventAPI.deleteEvent(event._id);
        message.success('Đã xóa sự kiện');
        fetchCreatedEvents();
    } catch (error) {
        message.error('Lỗi: ' + (error.response?.data?.message || error.message));
    }
};

onMounted(async () => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
        userData.value = JSON.parse(storedUser);
        fetchCreatedEvents();
    }

    // Fetch options
    try {
        const [criteriaRes, semesterRes] = await Promise.all([
            commonAPI.getCriteria(),
            commonAPI.getSemesters()
        ]);

        if (criteriaRes.success) {
            criteriaOptions.value = criteriaRes.data.map(c => ({
                label: `${c.criteriaCode} - ${c.content}`,
                value: c._id
            }));
        }

        if (semesterRes.success) {
            semesterOptions.value = semesterRes.data.map(s => ({
                label: `HK${s.semesterNumber} (${s.academicYear})`,
                value: s._id
            }));
            
            // Auto select active semester
            const activeSemester = semesterRes.data.find(s => s.isActive);
            if (activeSemester) {
                formModel.value.semester = activeSemester._id;
            }
        }
    } catch (error) {
        console.error('Error fetching options:', error);
        message.error('Không thể tải dữ liệu danh mục');
    }
});

const handleFileChange = (e) => {
    file.value = e.target.files[0];
};

const handleSubmit = async () => {
    try {
        await formRef.value?.validate();
        submitting.value = true;

        const formData = new FormData();
        formData.append('eventName', formModel.value.eventName);
        formData.append('description', formModel.value.description);
        formData.append('eventDate', new Date(formModel.value.eventDate).toISOString());
        formData.append('location', formModel.value.location);
        formData.append('score', formModel.value.score);
        formData.append('maxParticipants', formModel.value.maxParticipants);
        formData.append('scope', 'class');
        formData.append('organizerType', 'class');
        formData.append('createdBy', userData.value._id);
        formData.append('targetClass', userData.value.class._id || userData.value.class);
        formData.append('targetFaculty', userData.value.faculty._id || userData.value.faculty);
        formData.append('criteria', formModel.value.criteria);
        formData.append('semester', formModel.value.semester);
        
        if (file.value) {
            formData.append('image', file.value);
        }

        if (isEditMode.value) {
            await eventAPI.updateEvent(editingId.value, formData);
            message.success('Cập nhật sự kiện thành công');
        } else {
            await eventAPI.createEvent(formData);
            message.success('Tạo sự kiện thành công');
        }
        
        showCreateModal.value = false;
        fetchCreatedEvents();
        
        // Reset form
        formModel.value = {
            eventName: '',
            description: '',
            eventDate: null,
            location: '',
            score: 0,
            maxParticipants: 50,
            scope: 'class',
            criteria: null,
            semester: formModel.value.semester
        };
        file.value = null;
        isEditMode.value = false;
        editingId.value = null;
    } catch (error) {
        message.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
        submitting.value = false;
    }
};

// Reset edit mode when modal closes
const onModalClose = () => {
    if (!showCreateModal.value) {
        isEditMode.value = false;
        editingId.value = null;
        formModel.value = {
            eventName: '',
            description: '',
            eventDate: null,
            location: '',
            score: 0,
            maxParticipants: 50,
            scope: 'class',
            criteria: null,
            semester: formModel.value.semester
        };
    }
};
</script>
