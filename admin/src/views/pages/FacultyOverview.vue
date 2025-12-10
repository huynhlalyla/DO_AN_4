<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Quản lý các Khoa
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Tổng quan và quản lý tất cả các khoa trong trường
                </p>
            </div>
            <div class="flex gap-2">
                <n-button type="info" @click="handleOpenAssessment">
                    <template #icon>
                        <i class="fa-solid fa-chart-line"></i>
                    </template>
                    Tiến độ chấm điểm
                </n-button>
                <n-button type="primary" @click="isEditing = false; showModal = true">
                    <template #icon>
                        <i class="fa-solid fa-plus"></i>
                    </template>
                    Thêm Khoa mới
                </n-button>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center items-center py-20">
            <n-spin size="large" />
        </div>

        <!-- Faculty Cards Grid -->
        <div v-else-if="faculties.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <n-card 
                v-for="faculty in faculties" 
                :key="faculty._id"
                :bordered="false"
                class="shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer faculty-card"
                @click="viewFacultyDetail(faculty)"
            >
                <!-- Card Header with Icon -->
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-building-columns text-white text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">
                                {{ faculty.facultyName }}
                            </h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400">
                                {{ faculty.facultyCode }}
                            </p>
                        </div>
                    </div>
                    
                    <!-- Actions Menu -->
                    <n-dropdown :options="getCardActions(faculty)" @select="(key) => handleAction(key, faculty)">
                        <n-button text circle @click.stop>
                            <template #icon>
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                            </template>
                        </n-button>
                    </n-dropdown>
                </div>

                <!-- Description -->
                <p class="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {{ faculty.description || 'Chưa có mô tả' }}
                </p>

                <!-- Bí thư Khoa -->
                <div class="mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-user-tie text-blue-500 text-sm"></i>
                        <span class="text-xs text-slate-500 dark:text-slate-400">Bí thư Khoa:</span>
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {{ getFacultySecretary(faculty._id) }}
                        </span>
                    </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div class="text-center">
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {{ getFacultyStats(faculty._id).totalClasses }}
                        </p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Lớp học</p>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                            {{ getFacultyStats(faculty._id).totalStudents }}
                        </p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Sinh viên</p>
                    </div>
                </div>

                <!-- Status Badge -->
                <div class="mt-4">
                    <n-tag :type="faculty.isActive ? 'success' : 'error'" size="small">
                        {{ faculty.isActive ? 'Hoạt động' : 'Không hoạt động' }}
                    </n-tag>
                </div>
            </n-card>
        </div>

        <!-- Empty state -->
        <n-empty v-else description="Chưa có khoa nào" class="py-20">
            <template #icon>
                <i class="fa-solid fa-building-columns text-6xl text-slate-300"></i>
            </template>
            <template #extra>
                <n-button type="primary" @click="isEditing = false; showModal = true">
                    Thêm Khoa đầu tiên
                </n-button>
            </template>
        </n-empty>

        <!-- Add/Edit Modal -->
        <n-modal
            v-model:show="showModal"
            :mask-closable="false"
            preset="card"
            :title="isEditing ? 'Chỉnh sửa Khoa' : 'Thêm Khoa mới'"
            style="width: 600px"
        >
            <n-form
                ref="formRef"
                :model="facultyForm"
                :rules="formRules"
                label-placement="top"
                require-mark-placement="left"
            >
                <n-form-item label="Mã khoa" path="facultyCode">
                    <n-input v-model:value="facultyForm.facultyCode" placeholder="VD: CNTT" />
                </n-form-item>

                <n-form-item label="Tên khoa" path="facultyName">
                    <n-input v-model:value="facultyForm.facultyName" placeholder="VD: Công nghệ thông tin" />
                </n-form-item>

                <n-form-item label="Mô tả" path="description">
                    <n-input
                        v-model:value="facultyForm.description"
                        type="textarea"
                        :rows="3"
                        placeholder="Mô tả về khoa"
                    />
                </n-form-item>
            </n-form>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <n-button @click="showModal = false">Hủy</n-button>
                    <n-button type="primary" :loading="submitting" @click="handleSubmit">
                        {{ isEditing ? 'Cập nhật' : 'Thêm mới' }}
                    </n-button>
                </div>
            </template>
        </n-modal>

        <!-- Detail Modal -->
        <n-modal
            v-model:show="showDetailModal"
            preset="card"
            title="Chi tiết Khoa"
            style="width: 700px"
        >
            <n-descriptions v-if="selectedFaculty" :column="2" bordered>
                <n-descriptions-item label="Mã khoa">
                    {{ selectedFaculty.facultyCode }}
                </n-descriptions-item>
                <n-descriptions-item label="Tên khoa">
                    {{ selectedFaculty.facultyName }}
                </n-descriptions-item>
                <n-descriptions-item label="Số lớp">
                    {{ getFacultyStats(selectedFaculty._id).totalClasses }}
                </n-descriptions-item>
                <n-descriptions-item label="Số sinh viên">
                    {{ getFacultyStats(selectedFaculty._id).totalStudents }}
                </n-descriptions-item>
                <n-descriptions-item label="Mô tả" :span="2">
                    {{ selectedFaculty.description || 'Chưa có mô tả' }}
                </n-descriptions-item>
                <n-descriptions-item label="Trạng thái">
                    <n-tag :type="selectedFaculty.isActive ? 'success' : 'error'">
                        {{ selectedFaculty.isActive ? 'Hoạt động' : 'Không hoạt động' }}
                    </n-tag>
                </n-descriptions-item>
            </n-descriptions>
        </n-modal>

        <!-- Add Secretary Modal -->
        <n-modal
            v-model:show="showSecretaryModal"
            :mask-closable="false"
            preset="card"
            :title="isEditingSecretary ? 'Sửa Bí thư Khoa' : 'Thêm Bí thư Khoa'"
            style="width: 600px"
        >
            <n-form
                ref="secretaryFormRef"
                :model="secretaryForm"
                :rules="secretaryFormRules"
                label-placement="top"
                require-mark-placement="left"
            >
                <n-form-item label="Mã số cán bộ" path="adminCode">
                    <n-input v-model:value="secretaryForm.adminCode" placeholder="VD: CB001" />
                </n-form-item>

                <n-form-item label="Họ và tên" path="fullName">
                    <n-input v-model:value="secretaryForm.fullName" placeholder="Nguyễn Văn A" />
                </n-form-item>

                <n-form-item label="Email" path="email">
                    <n-input v-model:value="secretaryForm.email" placeholder="example@university.edu.vn" />
                </n-form-item>

                <n-form-item label="Số điện thoại" path="phone">
                    <n-input v-model:value="secretaryForm.phone" placeholder="0123456789" />
                </n-form-item>

                <n-form-item label="Khoa">
                    <n-input v-model:value="secretaryForm.facultyName" disabled />
                </n-form-item>
            </n-form>
            
            <template #footer>
                <div class="flex justify-end gap-2">
                    <n-button @click="showSecretaryModal = false">Đóng</n-button>
                    <n-button type="primary" :loading="submittingSecretary" @click="handleSecretarySubmit">
                        {{ isEditingSecretary ? 'Cập nhật' : 'Thêm' }}
                    </n-button>
                </div>
            </template>
        </n-modal>

        <!-- Assessment Progress Modal -->
        <n-modal
            v-model:show="showAssessmentModal"
            preset="card"
            title="Tiến độ chấm điểm các Khoa"
            style="width: 900px"
        >
            <n-data-table
                :columns="assessmentColumns"
                :data="assessmentFaculties"
                :loading="assessmentLoading"
                :pagination="{ pageSize: 10 }"
            />
        </n-modal>
    </div>
</template>

<script setup>
import { ref, onMounted, h, watch } from 'vue';
import { 
    NCard, NButton, NTag, NSpin, NEmpty, NModal, NForm, NFormItem, 
    NInput, NDescriptions, NDescriptionsItem, NDropdown, NSpace, NSelect,
    useMessage, useDialog, NDataTable, NProgress
} from 'naive-ui';
import { facultyAPI, classAPI, studentAPI, adminAPI, assessmentAPI } from '../../services/api';

const message = useMessage();
const dialog = useDialog();

// State
const loading = ref(false);
const submitting = ref(false);
const submittingSecretary = ref(false);
const faculties = ref([]);
const classes = ref([]);
const students = ref([]);
const admins = ref([]);
const showModal = ref(false);
const showDetailModal = ref(false);
const showSecretaryModal = ref(false);
const isEditing = ref(false);
const isEditingSecretary = ref(false);
const selectedFaculty = ref(null);
const formRef = ref(null);

// Form
const facultyForm = ref({
    facultyCode: '',
    facultyName: '',
    description: ''
});

const defaultForm = {
    facultyCode: '',
    facultyName: '',
    description: ''
};

const formRules = {
    facultyCode: [
        { required: true, message: 'Vui lòng nhập mã khoa', trigger: 'blur' },
        { min: 2, max: 20, message: 'Mã khoa từ 2-20 ký tự', trigger: 'blur' }
    ],
    facultyName: [
        { required: true, message: 'Vui lòng nhập tên khoa', trigger: 'blur' },
        { min: 3, max: 100, message: 'Tên khoa từ 3-100 ký tự', trigger: 'blur' }
    ]
};

// Secretary Form
const secretaryFormRef = ref(null);
const secretaryForm = ref({
    adminCode: '',
    fullName: '',
    email: '',
    phone: '',
    faculty: null,
    facultyName: ''
});

const defaultSecretaryForm = {
    adminCode: '',
    fullName: '',
    email: '',
    phone: '',
    faculty: null,
    facultyName: ''
};

const secretaryFormRules = {
    adminCode: [
        { required: true, message: 'Vui lòng nhập mã số cán bộ', trigger: 'blur' },
        { min: 3, max: 20, message: 'Mã cán bộ từ 3-20 ký tự', trigger: 'blur' }
    ],
    fullName: [
        { required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur' },
        { min: 3, max: 50, message: 'Họ tên từ 3-50 ký tự', trigger: 'blur' }
    ],
    email: [
        { required: true, message: 'Vui lòng nhập email', trigger: 'blur' },
        { type: 'email', message: 'Email không hợp lệ', trigger: 'blur' }
    ],
    phone: [
        { required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' },
        { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số', trigger: 'blur' }
    ]
};

// Watch modal to reset form when opening for new faculty
watch(showModal, (val) => {
    if (val && !isEditing.value) {
        facultyForm.value = { ...defaultForm };
    }
});

// Get faculty stats
const getFacultyStats = (facultyId) => {
    const facultyClasses = classes.value.filter(c => c.faculty?._id === facultyId || c.faculty === facultyId);
    const facultyStudents = students.value.filter(s => s.faculty?._id === facultyId || s.faculty === facultyId);
    
    return {
        totalClasses: facultyClasses.length,
        totalStudents: facultyStudents.length
    };
};

// Get faculty secretary (Admin Department)
const getFacultySecretary = (facultyId) => {
    const secretary = admins.value.find(admin => 
        admin.level === 'Department' && 
        (admin.faculty?._id === facultyId || admin.faculty === facultyId)
    );
    return secretary ? secretary.fullName : 'Chưa có';
};

// Card actions
const getCardActions = (faculty) => {
    const secretary = admins.value.find(admin => 
        admin.level === 'Department' && 
        (admin.faculty?._id === faculty._id || admin.faculty === faculty._id)
    );

    return [
        {
            label: 'Xem chi tiết',
            key: 'view',
            icon: () => h('i', { class: 'fa-solid fa-eye' })
        },
        {
            label: 'Chỉnh sửa',
            key: 'edit',
            icon: () => h('i', { class: 'fa-solid fa-pen' })
        },
        {
            type: 'divider'
        },
        {
            label: secretary ? 'Sửa Bí thư Khoa' : 'Thêm Bí thư Khoa',
            key: secretary ? 'editSecretary' : 'addSecretary',
            icon: () => h('i', { class: 'fa-solid fa-user-tie' })
        },
        {
            type: 'divider'
        },
        {
            label: faculty.isActive ? 'Vô hiệu hóa' : 'Kích hoạt',
            key: 'toggle',
            icon: () => h('i', { class: faculty.isActive ? 'fa-solid fa-ban' : 'fa-solid fa-check' })
        }
    ];
};

// Handle action
const handleAction = (key, faculty) => {
    if (key === 'view') {
        viewFacultyDetail(faculty);
    } else if (key === 'edit') {
        editFaculty(faculty);
    } else if (key === 'addSecretary') {
        addSecretaryToFaculty(faculty);
    } else if (key === 'editSecretary') {
        editSecretaryOfFaculty(faculty);
    } else if (key === 'toggle') {
        toggleFacultyStatus(faculty);
    }
};

// Load data
const loadFaculties = async () => {
    loading.value = true;
    try {
        const result = await facultyAPI.getAll();
        if (result.success) {
            faculties.value = result.data;
        }
    } catch (error) {
        message.error('Lỗi khi tải danh sách khoa');
    } finally {
        loading.value = false;
    }
};

const loadClasses = async () => {
    try {
        const result = await classAPI.getAll();
        if (result.success) {
            classes.value = result.data;
        }
    } catch (error) {
        console.error('Error loading classes:', error);
    }
};

const loadStudents = async () => {
    try {
        const result = await studentAPI.getAll();
        if (result.success) {
            students.value = result.data;
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
};

const loadAdmins = async () => {
    try {
        const result = await adminAPI.getAll();
        if (result.success) {
            admins.value = result.data;
        }
    } catch (error) {
        console.error('Error loading admins:', error);
    }
};

// View detail
const viewFacultyDetail = (faculty) => {
    selectedFaculty.value = faculty;
    showDetailModal.value = true;
};

// Edit faculty
const editFaculty = (faculty) => {
    isEditing.value = true;
    facultyForm.value = {
        _id: faculty._id,
        facultyCode: faculty.facultyCode || '',
        facultyName: faculty.facultyName,
        description: faculty.description || ''
    };
    showModal.value = true;
};

// Add secretary to faculty
const addSecretaryToFaculty = (faculty) => {
    secretaryForm.value = {
        ...defaultSecretaryForm,
        faculty: faculty._id,
        facultyName: `${faculty.facultyCode} - ${faculty.facultyName}`
    };
    isEditingSecretary.value = false;
    showSecretaryModal.value = true;
};

// Edit secretary of faculty
const editSecretaryOfFaculty = (faculty) => {
    const secretary = admins.value.find(admin => 
        admin.level === 'Department' && 
        (admin.faculty?._id === faculty._id || admin.faculty === faculty._id)
    );
    
    if (secretary) {
        secretaryForm.value = {
            _id: secretary._id,
            adminCode: secretary.adminCode,
            fullName: secretary.fullName,
            email: secretary.email,
            phone: secretary.phoneNumber,
            faculty: faculty._id,
            facultyName: `${faculty.facultyCode} - ${faculty.facultyName}`
        };
        isEditingSecretary.value = true;
        showSecretaryModal.value = true;
    }
};

// Toggle status
const toggleFacultyStatus = (faculty) => {
    const action = faculty.isActive ? 'vô hiệu hóa' : 'kích hoạt';
    dialog.warning({
        title: `Xác nhận ${action}`,
        content: `Bạn có chắc chắn muốn ${action} khoa "${faculty.facultyName}"?`,
        positiveText: 'Xác nhận',
        negativeText: 'Hủy',
        onPositiveClick: async () => {
            try {
                const result = await facultyAPI.update(faculty._id, {
                    isActive: !faculty.isActive
                });
                if (result.success) {
                    message.success(`${action.charAt(0).toUpperCase() + action.slice(1)} thành công`);
                    await loadFaculties();
                }
            } catch (error) {
                message.error(`Lỗi khi ${action}`);
            }
        }
    });
};

// Submit form
const handleSubmit = async () => {
    try {
        await formRef.value?.validate();
        submitting.value = true;

        let result;
        if (isEditing.value) {
            result = await facultyAPI.update(facultyForm.value._id, {
                facultyCode: facultyForm.value.facultyCode,
                facultyName: facultyForm.value.facultyName,
                description: facultyForm.value.description
            });
        } else {
            result = await facultyAPI.create({
                facultyCode: facultyForm.value.facultyCode,
                facultyName: facultyForm.value.facultyName,
                description: facultyForm.value.description
            });
        }

        if (result.success) {
            message.success(isEditing.value ? 'Cập nhật thành công' : 'Thêm mới thành công');
            showModal.value = false;
            await loadFaculties();
        } else {
            message.error(result.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Validation error:', error);
    } finally {
        submitting.value = false;
    }
};

// Handle secretary submit
const handleSecretarySubmit = async () => {
    try {
        await secretaryFormRef.value?.validate();
        submittingSecretary.value = true;

        const nameParts = secretaryForm.value.fullName.trim().split(' ');
        const firstName = nameParts.pop();
        const lastName = nameParts.join(' ');

        const data = {
            adminCode: secretaryForm.value.adminCode,
            lastName: lastName || firstName,
            firstName: lastName ? firstName : '',
            email: secretaryForm.value.email,
            phone: secretaryForm.value.phone,
            level: 'Department',
            faculty: secretaryForm.value.faculty
        };

        let result;
        if (isEditingSecretary.value) {
            result = await adminAPI.update(secretaryForm.value._id, data);
        } else {
            result = await adminAPI.create(data);
        }

        if (result.success) {
            message.success(isEditingSecretary.value ? 'Cập nhật Bí thư Khoa thành công' : 'Thêm Bí thư Khoa thành công');
            showSecretaryModal.value = false;
            await loadAdmins();
        } else {
            message.error(result.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Validation error:', error);
    } finally {
        submittingSecretary.value = false;
    }
};

// Assessment Logic
const showAssessmentModal = ref(false)
const assessmentFaculties = ref([])
const assessmentLoading = ref(false)

const assessmentColumns = [
    { title: 'Tên Khoa', key: 'facultyName' },
    { title: 'Tổng số lớp', key: 'totalClasses', width: 120, align: 'center' },
    { title: 'Đã duyệt', key: 'approvedClasses', width: 120, align: 'center' },
    { 
        title: 'Tiến độ', 
        key: 'percentage',
        width: 200,
        render(row) {
            return h(NProgress, {
                type: 'line',
                percentage: row.percentage,
                indicatorPlacement: 'inside',
                status: row.percentage === 100 ? 'success' : 'default'
            });
        }
    },
    {
        title: 'Thao tác',
        key: 'actions',
        render(row) {
            if (row.isFinalized) {
                return h(NTag, { type: 'success', bordered: false }, { default: () => 'Đã chốt' });
            }
            return h(NSpace, {}, { default: () => [
                h(NButton, {
                    size: 'small',
                    type: 'primary',
                    disabled: row.percentage < 100,
                    onClick: () => handleFinalizeFaculty(row)
                }, { default: () => 'Chốt điểm' }),
                h(NButton, {
                    size: 'small',
                    type: 'warning',
                    onClick: () => handleRemindFaculty(row)
                }, { default: () => 'Nhắc nhở' })
            ]});
        }
    }
];

const handleOpenAssessment = async () => {
    showAssessmentModal.value = true
    assessmentLoading.value = true
    try {
        const res = await assessmentAPI.getSchoolFaculties();
        if (res.success) {
            assessmentFaculties.value = res.data;
        }
    } catch (error) {
        message.error('Lỗi tải tiến độ chấm điểm')
    } finally {
        assessmentLoading.value = false
    }
}

const handleFinalizeFaculty = async (fac) => {
    try {
        await assessmentAPI.finalizeFaculty({ facultyId: fac._id });
        message.success('Đã chốt điểm khoa ' + fac.facultyName);
        handleOpenAssessment(); // Refresh
    } catch (error) {
        message.error(error.message || 'Lỗi chốt điểm')
    }
}

const handleRemindFaculty = async (fac) => {
    try {
        await assessmentAPI.remindFaculty({ facultyId: fac._id });
        message.success('Đã gửi nhắc nhở tới bí thư khoa ' + fac.facultyName);
    } catch (error) {
        message.error('Lỗi gửi nhắc nhở')
    }
}

onMounted(async () => {
    await Promise.all([
        loadFaculties(),
        loadClasses(),
        loadStudents(),
        loadAdmins()
    ]);
});
</script>

<style scoped>
.faculty-card {
    transition: all 0.3s ease;
}

.faculty-card:hover {
    transform: translateY(-4px);
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

:deep(.n-card__content) {
    padding: 1.5rem;
}
</style>
