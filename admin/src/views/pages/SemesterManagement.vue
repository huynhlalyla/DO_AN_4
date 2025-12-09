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
    NDatePicker,
    NPopconfirm,
    useMessage
} from 'naive-ui'
import { semesterAPI } from '../../services/api'

const message = useMessage()

// State
const semesters = ref([])
const loading = ref(false)
const showModal = ref(false)
const formLoading = ref(false)
const isEdit = ref(false)
const currentSemester = ref(null)

// Form data
const formValue = ref({
    semesterNumber: null,
    academicYear: '',
    startDate: null,
    endDate: null,
    gradingStartDate: null,
    gradingDeadline: null
})

// Options
const semesterOptions = [
    { label: 'Học kỳ 1', value: 1 },
    { label: 'Học kỳ 2', value: 2 },
    { label: 'Học kỳ 3 (Hè)', value: 3 }
]

// Table columns
const columns = [
    {
        title: 'Học kỳ',
        key: 'semesterNumber',
        render: (row) => `Học kỳ ${row.semesterNumber}`
    },
    {
        title: 'Năm học',
        key: 'academicYear'
    },
    {
        title: 'Thời gian học',
        key: 'time',
        render: (row) => {
            const start = new Date(row.startDate).toLocaleDateString('vi-VN')
            const end = new Date(row.endDate).toLocaleDateString('vi-VN')
            return `${start} - ${end}`
        }
    },
    {
        title: 'Thời gian chấm điểm',
        key: 'gradingTime',
        render: (row) => {
            const start = new Date(row.gradingStartDate).toLocaleDateString('vi-VN')
            const end = new Date(row.gradingDeadline).toLocaleDateString('vi-VN')
            return `${start} - ${end}`
        }
    },
    {
        title: 'Thao tác',
        key: 'actions',
        render: (row) => h(
            NSpace,
            { size: 'small' },
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
                            default: () => 'Bạn có chắc muốn xóa học kỳ này?',
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

// Fetch data
const fetchSemesters = async () => {
    loading.value = true
    try {
        const response = await semesterAPI.getAll()
        semesters.value = response.data || []
    } catch (error) {
        message.error('Lỗi khi tải danh sách học kỳ: ' + error.message)
    } finally {
        loading.value = false
    }
}

// CRUD operations
const handleCreate = () => {
    isEdit.value = false
    currentSemester.value = null
    formValue.value = {
        semesterNumber: null,
        academicYear: '',
        startDate: null,
        endDate: null,
        gradingStartDate: null,
        gradingDeadline: null
    }
    showModal.value = true
}

const handleEdit = (semester) => {
    isEdit.value = true
    currentSemester.value = semester
    formValue.value = {
        semesterNumber: semester.semesterNumber,
        academicYear: semester.academicYear,
        startDate: new Date(semester.startDate).getTime(),
        endDate: new Date(semester.endDate).getTime(),
        gradingStartDate: new Date(semester.gradingStartDate).getTime(),
        gradingDeadline: new Date(semester.gradingDeadline).getTime()
    }
    showModal.value = true
}

const handleDelete = async (id) => {
    try {
        await semesterAPI.delete(id)
        message.success('Xóa học kỳ thành công')
        fetchSemesters()
    } catch (error) {
        message.error('Lỗi khi xóa học kỳ: ' + error.message)
    }
}

const handleSubmit = async () => {
    // Validate
    if (!formValue.value.semesterNumber || !formValue.value.academicYear || 
        !formValue.value.startDate || !formValue.value.endDate || 
        !formValue.value.gradingStartDate) {
        message.error('Vui lòng điền đầy đủ thông tin bắt buộc')
        return
    }

    if (formValue.value.startDate >= formValue.value.endDate) {
        message.error('Ngày kết thúc phải sau ngày bắt đầu')
        return
    }

    formLoading.value = true
    try {
        const data = {
            ...formValue.value,
            startDate: new Date(formValue.value.startDate),
            endDate: new Date(formValue.value.endDate),
            gradingStartDate: new Date(formValue.value.gradingStartDate)
            // gradingDeadline is calculated on backend or we can send it if we want to override
        }

        if (isEdit.value) {
            await semesterAPI.update(currentSemester.value._id, data)
            message.success('Cập nhật học kỳ thành công')
        } else {
            await semesterAPI.create(data)
            message.success('Tạo học kỳ thành công')
        }
        showModal.value = false
        fetchSemesters()
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    } finally {
        formLoading.value = false
    }
}

// Auto calculate grading deadline when grading start date changes
const handleGradingStartDateChange = (value) => {
    if (value) {
        // 2 weeks later
        const deadline = new Date(value)
        deadline.setDate(deadline.getDate() + 14)
        formValue.value.gradingDeadline = deadline.getTime()
    } else {
        formValue.value.gradingDeadline = null
    }
}

onMounted(() => {
    fetchSemesters()
})
</script>

<template>
    <NSpace vertical :size="24">
        <NCard :bordered="false">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                        <i class="fa-solid fa-calendar-check mr-2 text-blue-600"></i>
                        Quản lý Học kỳ
                    </h2>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        Quản lý thông tin học kỳ và thời gian chấm điểm
                    </p>
                </div>
                <NButton type="primary" size="large" @click="handleCreate">
                    <template #icon>
                        <i class="fa-solid fa-plus"></i>
                    </template>
                    Thêm học kỳ mới
                </NButton>
            </div>
        </NCard>

        <NCard :bordered="false">
            <NDataTable
                :columns="columns"
                :data="semesters"
                :loading="loading"
                :bordered="false"
                striped
            />
        </NCard>

        <NModal
            v-model:show="showModal"
            preset="card"
            :title="isEdit ? 'Cập nhật học kỳ' : 'Thêm học kỳ mới'"
            style="width: 600px"
            :bordered="false"
        >
            <NForm
                :model="formValue"
                label-placement="left"
                label-width="160"
                require-mark-placement="left"
            >
                <NFormItem label="Học kỳ" path="semesterNumber" required>
                    <NSelect
                        v-model:value="formValue.semesterNumber"
                        :options="semesterOptions"
                        placeholder="Chọn học kỳ"
                        :disabled="isEdit"
                    />
                </NFormItem>

                <NFormItem label="Năm học" path="academicYear" required>
                    <NInput
                        v-model:value="formValue.academicYear"
                        placeholder="VD: 2024-2025"
                        :disabled="isEdit"
                    />
                </NFormItem>

                <NFormItem label="Thời gian học" required>
                    <div class="flex gap-2 w-full">
                        <NDatePicker
                            v-model:value="formValue.startDate"
                            type="date"
                            placeholder="Bắt đầu"
                            class="flex-1"
                        />
                        <NDatePicker
                            v-model:value="formValue.endDate"
                            type="date"
                            placeholder="Kết thúc"
                            class="flex-1"
                        />
                    </div>
                </NFormItem>

                <NFormItem label="Thời gian chấm điểm" required>
                    <div class="flex flex-col gap-2 w-full">
                        <NDatePicker
                            v-model:value="formValue.gradingStartDate"
                            type="date"
                            placeholder="Ngày bắt đầu chấm"
                            @update:value="handleGradingStartDateChange"
                            class="w-full"
                        />
                        <div class="text-xs text-gray-500">
                            Thời gian chốt điểm (tự động): {{ formValue.gradingDeadline ? new Date(formValue.gradingDeadline).toLocaleDateString('vi-VN') : 'Chưa xác định' }}
                        </div>
                    </div>
                </NFormItem>
            </NForm>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <NButton @click="showModal = false">Hủy</NButton>
                    <NButton type="primary" :loading="formLoading" @click="handleSubmit">
                        {{ isEdit ? 'Cập nhật' : 'Tạo mới' }}
                    </NButton>
                </div>
            </template>
        </NModal>
    </NSpace>
</template>
