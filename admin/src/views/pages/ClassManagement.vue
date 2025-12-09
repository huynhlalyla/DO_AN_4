<script setup>
import { ref, h, onMounted, computed } from 'vue'
import {
    NSpace,
    NCard,
    NButton,
    NDataTable,
    NModal,
    NForm,
    NFormItem,
    NInput,
    NSelect,
    NPopconfirm,
    useMessage,
    NTag,
    NSpin,
    NEmpty,
    NProgress
} from 'naive-ui'
import { classAPI, facultyAPI, studentAPI, assessmentAPI } from '../../services/api'

const message = useMessage()

// State
const classes = ref([])
const faculties = ref([])
const students = ref([])
const loading = ref(false)
const showModal = ref(false)
const formLoading = ref(false)
const isEdit = ref(false)
const currentClass = ref(null)

// Form data
const formValue = ref({
    className: '',
    faculty: null,
    academicYear: ''
})

// Faculty options for select
const facultyOptions = computed(() => {
    return faculties.value.map(f => ({
        label: `${f.facultyCode} - ${f.facultyName} ${!f.isActive ? '(Vô hiệu)' : ''}`,
        value: f._id,
        disabled: !f.isActive
    }))
})

// Table columns
const columns = [
    {
        title: 'STT',
        key: 'index',
        width: 60,
        render: (_, index) => index + 1
    },
    {
        title: 'Mã lớp',
        key: 'classCode',
        width: 120,
        render: (row) => h(
            NTag,
            { type: 'success', size: 'small' },
            { default: () => row.classCode }
        )
    },
    {
        title: 'Tên lớp',
        key: 'className',
        minWidth: 180
    },
    {
        title: 'Khoa',
        key: 'faculty',
        width: 250,
        render: (row) => row.faculty ? 
            `${row.faculty.facultyCode} - ${row.faculty.facultyName}` : 
            'N/A'
    },
    {
        title: 'Bí thư Lớp',
        key: 'secretary',
        width: 180,
        render: (row) => {
            const secretary = students.value.find(s => 
                s.isSecretary && 
                (s.class?._id === row._id || s.class === row._id)
            );
            return secretary ? secretary.fullName : 'Chưa có';
        }
    },
    {
        title: 'Năm học',
        key: 'academicYear',
        width: 120,
        align: 'center'
    },
    {
        title: 'Ngày tạo',
        key: 'createdAt',
        width: 160,
        render: (row) => new Date(row.createdAt).toLocaleString('vi-VN')
    },
    {
        title: 'Thao tác',
        key: 'actions',
        width: 180,
        fixed: 'right',
        render: (row) => h(
            NSpace,
            { size: 8 },
            {
                default: () => [
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: 'primary',
                            ghost: true,
                            onClick: () => handleEdit(row)
                        },
                        { default: () => 'Sửa' }
                    ),
                    h(
                        NPopconfirm,
                        {
                            onPositiveClick: () => handleDelete(row._id),
                            'positive-text': 'Chấp nhận',
                            'negative-text': 'Huỷ'
                        },
                        {
                            default: () => 'Bạn có chắc muốn xóa lớp này?',
                            trigger: () => h(
                                NButton,
                                {
                                    size: 'small',
                                    type: 'error',
                                    ghost: true
                                },
                                { default: () => 'Xóa' }
                            )
                        }
                    )
                ]
            }
        )
    }
]

// Fetch classes
const fetchClasses = async () => {
    loading.value = true
    try {
        const response = await classAPI.getAll()
        classes.value = response.data || []
        message.success(`Đã tải ${response.count} lớp`)
    } catch (error) {
        message.error('Lỗi khi tải dữ liệu: ' + error.message)
    } finally {
        loading.value = false
    }
}

// Fetch faculties
const fetchFaculties = async () => {
    try {
        const response = await facultyAPI.getAll()
        faculties.value = response.data || []
    } catch (error) {
        message.error('Lỗi khi tải danh sách khoa: ' + error.message)
    }
}

// Fetch students
const fetchStudents = async () => {
    try {
        const response = await studentAPI.getAll()
        students.value = response.data || []
    } catch (error) {
        console.error('Error loading students:', error)
    }
}

// Open create modal
const handleCreate = () => {
    isEdit.value = false
    currentClass.value = null
    formValue.value = {
        classCode: '',
        className: '',
        faculty: null,
        academicYear: ''
    }
    showModal.value = true
}

// Open edit modal
const handleEdit = (classData) => {
    isEdit.value = true
    currentClass.value = classData
    formValue.value = {
        classCode: classData.classCode || '',
        className: classData.className,
        faculty: classData.faculty?._id || null,
        academicYear: classData.academicYear
    }
    showModal.value = true
}

// Submit form
const handleSubmit = async () => {
    // Validation
    if (!formValue.value.classCode || !formValue.value.className || 
        !formValue.value.faculty || !formValue.value.academicYear) {
        message.error('Vui lòng nhập đầy đủ thông tin')
        return
    }

    formLoading.value = true
    try {
        if (isEdit.value) {
            // Update
            await classAPI.update(currentClass.value._id, {
                classCode: formValue.value.classCode,
                className: formValue.value.className,
                faculty: formValue.value.faculty,
                academicYear: formValue.value.academicYear
            })
            message.success('Cập nhật lớp thành công')
        } else {
            // Create
            await classAPI.create({
                classCode: formValue.value.classCode,
                className: formValue.value.className,
                faculty: formValue.value.faculty,
                academicYear: formValue.value.academicYear
            })
            message.success('Tạo lớp mới thành công')
        }
        
        showModal.value = false
        fetchClasses()
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    } finally {
        formLoading.value = false
    }
}

// Delete class
const handleDelete = async (id) => {
    try {
        await classAPI.delete(id)
        message.success('Xóa lớp thành công')
        fetchClasses()
    } catch (error) {
        message.error('Lỗi khi xóa: ' + error.message)
    }
}

// Assessment Logic
const showAssessmentModal = ref(false)
const assessmentClasses = ref([])
const assessmentLoading = ref(false)

const assessmentColumns = [
    { title: 'Lớp', key: 'className' },
    { title: 'Sĩ số', key: 'studentCount' },
    { title: 'Đã chốt', key: 'finalizedCount' },
    { 
        title: 'Tỷ lệ', 
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
            return h(NSpace, {}, { default: () => [
                h(NButton, {
                    size: 'small',
                    type: 'primary',
                    disabled: row.percentage < 100,
                    onClick: () => handleApproveClass(row)
                }, { default: () => 'Duyệt' }),
                h(NButton, {
                    size: 'small',
                    type: 'warning',
                    onClick: () => handleRemindClass(row)
                }, { default: () => 'Nhắc nhở' })
            ]});
        }
    }
];

const handleOpenAssessment = async () => {
    showAssessmentModal.value = true
    assessmentLoading.value = true
    try {
        const allStats = [];
        for (const fac of faculties.value) {
            const res = await assessmentAPI.getFacultyClasses(fac._id);
            if (res.success) {
                allStats.push(...res.data);
            }
        }
        assessmentClasses.value = allStats;
    } catch (error) {
        message.error('Lỗi tải tiến độ chấm điểm')
    } finally {
        assessmentLoading.value = false
    }
}

const handleApproveClass = async (cls) => {
    try {
        await assessmentAPI.approveClass({ classId: cls._id });
        message.success('Đã duyệt điểm lớp ' + cls.className);
        handleOpenAssessment(); // Refresh
    } catch (error) {
        message.error('Lỗi duyệt điểm')
    }
}

const handleRemindClass = async (cls) => {
    try {
        await assessmentAPI.remindClass({ classId: cls._id });
        message.success('Đã gửi nhắc nhở tới bí thư lớp ' + cls.className);
    } catch (error) {
        message.error('Lỗi gửi nhắc nhở')
    }
}

// Load data on mount
onMounted(() => {
    fetchFaculties()
    fetchClasses()
    fetchStudents()
})
</script>

<template>
<NSpace vertical :size="24">
    <!-- Header -->
    <NCard :bordered="false">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    <i class="fa-solid fa-school mr-2 text-green-600"></i>
                    Quản lý Lớp
                </h2>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                    Quản lý thông tin các lớp học trong trường
                </p>
            </div>
            <NSpace>
                <NButton type="info" size="large" @click="handleOpenAssessment">
                    <template #icon><i class="fa-solid fa-check-double"></i></template>
                    Duyệt điểm rèn luyện
                </NButton>
                <NButton type="primary" size="large" @click="handleCreate">
                    <template #icon>
                        <i class="fa-solid fa-plus"></i>
                    </template>
                    Thêm lớp mới
                </NButton>
            </NSpace>
        </div>
    </NCard>

    <!-- Table -->
    <NCard :bordered="false">
        <NSpin :show="loading">
            <NDataTable
                :columns="columns"
                :data="classes"
                :bordered="false"
                :single-line="false"
                striped
                size="small"
            />
            
            <NEmpty 
                v-if="!loading && classes.length === 0"
                description="Chưa có lớp nào"
                class="py-8"
            />
        </NSpin>
    </NCard>

    <!-- Modal Form -->
    <NModal
        v-model:show="showModal"
        preset="card"
        :title="isEdit ? 'Chỉnh sửa lớp' : 'Thêm lớp mới'"
        style="width: 600px"
        :bordered="false"
        :segmented="{
            content: true,
            footer: 'soft'
        }"
        >
        <NForm
            :model="formValue"
            label-placement="left"
            label-width="120"
            require-mark-placement="left"
        >
            <NFormItem label="Mã lớp" path="classCode" required>
                <NInput
                    v-model:value="formValue.classCode"
                    placeholder="VD: LOP001"
                    maxlength="20"
                    show-count
                />
            </NFormItem>

            <NFormItem label="Tên lớp" path="className" required>
                <NInput
                    v-model:value="formValue.className"
                    placeholder="VD: Công nghệ thông tin 01"
                    maxlength="100"
                    show-count
                />
            </NFormItem>

            <NFormItem label="Khoa" path="faculty" required>
                <NSelect
                    v-model:value="formValue.faculty"
                    :options="facultyOptions"
                    placeholder="Chọn khoa"
                    filterable
                />
            </NFormItem>

            <NFormItem label="Năm học" path="academicYear" required>
                <NInput
                    v-model:value="formValue.academicYear"
                    placeholder="VD: 2021-2025"
                    maxlength="20"
                />
            </NFormItem>
        </NForm>

        <template #footer>
            <div class="flex justify-end gap-2">
                <NButton @click="showModal = false">Hủy</NButton>
                <NButton
                    type="primary"
                    @click="handleSubmit"
                    :loading="formLoading"
                >
                    {{ isEdit ? 'Cập nhật' : 'Tạo mới' }}
                </NButton>
            </div>
        </template>
    </NModal>

    <!-- Assessment Modal -->
    <NModal v-model:show="showAssessmentModal" preset="card" title="Tiến độ chấm điểm rèn luyện" style="width: 900px">
        <NDataTable
            :columns="assessmentColumns"
            :data="assessmentClasses"
            :loading="assessmentLoading"
            :pagination="{ pageSize: 10 }"
        />
    </NModal>
</NSpace>
</template>

<style scoped>
@reference "../../style.css";

:deep(.n-data-table-th) {
    @apply font-semibold bg-slate-50 dark:bg-slate-800;
}
</style>
