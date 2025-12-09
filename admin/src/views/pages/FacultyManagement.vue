<script setup>
import { ref, h, onMounted } from 'vue'
import {
    NSpace,
    NCard,
    NButton,
    NDataTable,
    NModal,
    NForm,
    NFormItem,
    NInput,
    NPopconfirm,
    useMessage,
    useDialog,
    NTag,
    NSpin
} from 'naive-ui'
import { facultyAPI } from '../../services/api'

const message = useMessage()
const dialog = useDialog()

// State
const faculties = ref([])
const loading = ref(false)
const showModal = ref(false)
const formLoading = ref(false)
const isEdit = ref(false)
const currentFaculty = ref(null)

// Form data
const formValue = ref({
    facultyName: '',
    description: ''
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
        title: 'Mã khoa',
        key: 'facultyCode',
        width: 120,
        render: (row) => h(
            NTag,
            { type: row.isActive ? 'info' : 'error', size: 'small' },
            { default: () => row.facultyCode }
        )
    },
    {
        title: 'Tên khoa',
        key: 'facultyName',
        minWidth: 200
    },
    {
        title: 'Mô tả',
        key: 'description',
        minWidth: 250,
        ellipsis: {
            tooltip: true
        }
    },
    {
        title: 'Trạng thái',
        key: 'isActive',
        width: 120,
        render: (row) => h(
            NTag,
            { type: row.isActive ? 'success' : 'error', bordered: false },
            { default: () => row.isActive ? 'Hoạt động' : 'Vô hiệu' }
        )
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
        render: (row) => {
            if (!row.isActive) {
                return h(
                    NButton,
                    {
                        size: 'small',
                        type: 'success',
                        ghost: true,
                        onClick: () => handleActivate(row._id)
                    },
                    { default: () => 'Khôi phục' }
                )
            }
            return h(
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
                                default: () => 'Bạn có chắc muốn xóa khoa này?',
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
    }
]

const rowClassName = (row) => {
    return row.isActive ? '' : 'disabled-row'
}

// Fetch faculties
const fetchFaculties = async () => {
    loading.value = true
    try {
        const response = await facultyAPI.getAll()
        faculties.value = response.data || []
        message.success(`Đã tải ${response.count} khoa`)
    } catch (error) {
        message.error('Lỗi khi tải dữ liệu: ' + error.message)
    } finally {
        loading.value = false
    }
}

// Open create modal
const handleCreate = () => {
    isEdit.value = false
    currentFaculty.value = null
    formValue.value = {
        facultyName: '',
        description: ''
    }
    showModal.value = true
}

// Open edit modal
const handleEdit = (faculty) => {
    isEdit.value = true
    currentFaculty.value = faculty
    formValue.value = {
        facultyName: faculty.facultyName,
        description: faculty.description
    }
    showModal.value = true
}

// Submit form
const handleSubmit = async () => {
    // Validation
    if (!formValue.value.facultyName) {
        message.error('Vui lòng nhập tên khoa')
        return
    }

    formLoading.value = true
    try {
        if (isEdit.value) {
            // Update
            await facultyAPI.update(currentFaculty.value._id, {
                facultyName: formValue.value.facultyName,
                description: formValue.value.description
            })
            message.success('Cập nhật khoa thành công')
        } else {
            // Create
            await facultyAPI.create(formValue.value)
            message.success('Tạo khoa mới thành công')
        }
        
        showModal.value = false
        fetchFaculties()
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    } finally {
        formLoading.value = false
    }
}

// Delete faculty
const handleDelete = async (id) => {
    try {
        await facultyAPI.delete(id)
        message.success('Xóa khoa thành công')
        fetchFaculties()
    } catch (error) {
        message.error('Lỗi khi xóa: ' + error.message)
    }
}

// Activate faculty
const handleActivate = async (id) => {
    try {
        await facultyAPI.update(id, { isActive: true })
        message.success('Khôi phục khoa thành công')
        fetchFaculties()
    } catch (error) {
        message.error('Lỗi khi khôi phục: ' + error.message)
    }
}

// Load data on mount
onMounted(() => {
    fetchFaculties()
})
</script>

<template>
<NSpace vertical :size="24">
    <!-- Header -->
    <NCard :bordered="false">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    <i class="fa-solid fa-building-columns mr-2 text-blue-600"></i>
                    Quản lý Khoa
                </h2>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                    Quản lý thông tin các khoa trong trường
                </p>
            </div>
            <NButton type="primary" size="large" @click="handleCreate">
                <template #icon>
                    <i class="fa-solid fa-plus"></i>
                </template>
                Thêm khoa mới
            </NButton>
        </div>
    </NCard>

    <!-- Table -->
    <NCard :bordered="false">
        <NSpin :show="loading">
            <NDataTable
                :columns="columns"
                :data="faculties"
                :bordered="false"
                :single-line="false"
                striped
                size="small"
                :row-class-name="rowClassName"
            />
        </NSpin>
    </NCard>

    <!-- Modal Form -->
    <NModal
        v-model:show="showModal"
        preset="card"
        :title="isEdit ? 'Chỉnh sửa khoa' : 'Thêm khoa mới'"
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
            <NFormItem label="Tên khoa" path="facultyName" required>
                <NInput
                    v-model:value="formValue.facultyName"
                    placeholder="VD: Khoa Công nghệ thông tin"
                    maxlength="100"
                    show-count
                />
            </NFormItem>

            <NFormItem label="Mô tả" path="description">
                <NInput
                    v-model:value="formValue.description"
                    type="textarea"
                    placeholder="Mô tả về khoa..."
                    :rows="4"
                    maxlength="500"
                    show-count
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
</NSpace>
</template>

<style scoped>
@reference "../../style.css";

:deep(.n-data-table-th) {
    @apply font-semibold bg-slate-50 dark:bg-slate-800;
}

:deep(.disabled-row td) {
    background-color: rgba(255, 0, 0, 0.05) !important;
    color: #999;
}

:deep(.disabled-row td:first-child) {
    border-left: 3px solid #ff4d4f;
}

:deep(.dark .disabled-row td) {
    background-color: rgba(255, 0, 0, 0.1) !important;
    color: #aaa;
}
</style>
