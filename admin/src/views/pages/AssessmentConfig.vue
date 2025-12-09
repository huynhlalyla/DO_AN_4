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
    NTag,
    NSpin,
    NEmpty,
    NInputNumber,
    NTabs,
    NTabPane,
    NCollapse,
    NCollapseItem,
    NDivider,
    NAlert,
    useMessage,
    NCheckbox,
    NRadioGroup,
    NRadio,
    NEllipsis
} from 'naive-ui'
import { categoryAPI, criteriaAPI } from '../../services/api'

const message = useMessage()

// State
const categories = ref([])
const criteria = ref([])
const loading = ref(false)
const showCategoryModal = ref(false)
const showCriteriaModal = ref(false)
const formLoading = ref(false)
const isEditCategory = ref(false)
const isEditCriteria = ref(false)
const currentCategory = ref(null)
const currentCriteria = ref(null)
const activeTab = ref('config')

// Form data
const categoryForm = ref({
    categoryName: '',
    description: '',
    maxScore: null,
    order: 1
})

const criteriaForm = ref({
    category: null,
    content: '',
    description: [], // Array of { content: string, score: number }
    scoringType: 'auto',
    plusScore: null,
    maxTimes: null,
    minusScore: null,
    requireEvidence: false,
    isActive: true
})

// Options
const scoringTypeOptions = [
    { 
        label: 'Sự kiện', 
        value: 'auto',
        description: 'Tự động tính điểm qua sự kiện - Có thể cộng điểm (tham gia) hoặc trừ điểm (vi phạm)'
    },
    { 
        label: 'Thủ công', 
        value: 'manual',
        description: 'Sinh viên tự chấm → Bí thư duyệt'
    }
]

// Computed
const categoryOptions = computed(() => {
    return categories.value.map(c => ({
        label: `${c.categoryCode} - ${c.categoryName} (${c.maxScore}đ)`,
        value: c._id
    }))
})

const sortedCategories = computed(() => {
    return [...categories.value].sort((a, b) => a.order - b.order)
})

const criteriaByCategory = computed(() => {
    const grouped = {}
    categories.value.forEach(cat => {
        grouped[cat._id] = criteria.value.filter(cr => cr.category?._id === cat._id)
    })
    return grouped
})

const totalMaxScore = computed(() => {
    return categories.value.reduce((sum, cat) => sum + (cat.maxScore || 0), 0)
})

// Category Table Columns
const categoryColumns = [
    {
        title: 'STT',
        key: 'index',
        width: 60,
        render: (_, index) => index + 1
    },
    {
        title: 'Mã đề mục',
        key: 'categoryCode',
        width: 120,
        render: (row) => h(NTag, { type: 'info' }, { default: () => row.categoryCode })
    },
    {
        title: 'Tên đề mục',
        key: 'categoryName',
        minWidth: 250
    },
    {
        title: 'Điểm tối đa',
        key: 'maxScore',
        width: 120,
        align: 'center',
        render: (row) => h(NTag, { type: 'success', size: 'small' }, { default: () => `${row.maxScore}đ` })
    },
    {
        title: 'Thứ tự',
        key: 'order',
        width: 100,
        align: 'center'
    },
    {
        title: 'Số tiêu chí',
        key: 'criteriaCount',
        width: 120,
        align: 'center',
        render: (row) => {
            const count = criteria.value.filter(c => c.category?._id === row._id).length
            return h(NTag, { type: 'warning', size: 'small' }, { default: () => count })
        }
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
                            onClick: () => handleEditCategory(row)
                        },
                        { default: () => 'Sửa' }
                    ),
                    h(
                        NPopconfirm,
                        {
                            onPositiveClick: () => handleDeleteCategory(row._id),
                            'positive-text': 'Chấp nhận',
                            'negative-text': 'Huỷ'
                        },
                        {
                            default: () => 'Xóa đề mục này sẽ xóa tất cả tiêu chí bên trong. Bạn chắc chắn?',
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

// Criteria Table Columns
const criteriaColumns = [
    {
        title: 'STT',
        key: 'index',
        width: 60,
        render: (_, index) => index + 1
    },
    {
        title: 'Nội dung tiêu chí',
        key: 'content',
        minWidth: 300,
        render: (row) => {
            const hasDescription = row.description && row.description.length > 0
            return h(
                'div',
                { class: 'flex items-start gap-2 flex-col' },
                [
                    h('span', {}, row.content),
                    hasDescription ? h(
                        NButton,
                        {
                            size: 'tiny',
                            type: 'info',
                            ghost: true,
                            onClick: () => showDescriptionDetail(row)
                        },
                        { default: () => 'Xem chi tiết' }
                    ) : null
                ]
            )
        }
    },
    {
        title: 'Loại chấm điểm',
        key: 'scoringType',
        width: 140,
        render: (row) => {
            const typeMap = {
                auto: { type: 'success', text: 'Sự kiện' },
                manual: { type: 'info', text: 'Thủ công' }
            }
            const type = typeMap[row.scoringType] || { type: 'default', text: row.scoringType }
            return h(NTag, { type: type.type, size: 'small' }, { default: () => type.text })
        }
    },
    {
        title: 'Điểm cộng',
        key: 'plusScore',
        width: 100,
        align: 'center',
        render: (row) => row.plusScore ? `+${row.plusScore}đ` : '-'
    },
    {
        title: 'Điểm trừ',
        key: 'minusScore',
        width: 100,
        align: 'center',
        render: (row) => row.minusScore ? `${row.minusScore}đ` : '-'
    },
    {
        title: 'Số lần tối đa',
        key: 'maxTimes',
        width: 120,
        align: 'center',
        render: (row) => row.maxTimes || 'Không giới hạn'
    },
    {
        title: 'Yêu cầu minh chứng',
        key: 'requireEvidence',
        width: 150,
        align: 'center',
        render: (row) => h(
            NTag, 
            { type: row.requireEvidence ? 'warning' : 'default', size: 'small' }, 
            { default: () => row.requireEvidence ? 'Có' : 'Không' }
        )
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
                            onClick: () => handleEditCriteria(row)
                        },
                        { default: () => 'Sửa' }
                    ),
                    h(
                        NPopconfirm,
                        {
                            onPositiveClick: () => handleDeleteCriteria(row._id),
                            'positive-text': 'Chấp nhận',
                            'negative-text': 'Huỷ'
                        },
                        {
                            default: () => 'Bạn có chắc muốn xóa tiêu chí này?',
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
const fetchCategories = async () => {
    loading.value = true
    try {
        const response = await categoryAPI.getAll()
        categories.value = response.data || []
    } catch (error) {
        message.error('Lỗi khi tải đề mục: ' + error.message)
    } finally {
        loading.value = false
    }
}

const fetchCriteria = async () => {
    try {
        const response = await criteriaAPI.getAll()
        criteria.value = response.data || []
    } catch (error) {
        message.error('Lỗi khi tải tiêu chí: ' + error.message)
    }
}

const fetchAll = async () => {
    loading.value = true
    await Promise.all([fetchCategories(), fetchCriteria()])
    loading.value = false
}

// Category CRUD
const handleCreateCategory = () => {
    isEditCategory.value = false
    currentCategory.value = null
    categoryForm.value = {
        categoryName: '',
        description: '',
        maxScore: null,
        order: categories.value.length + 1
    }
    showCategoryModal.value = true
}

const handleEditCategory = (category) => {
    isEditCategory.value = true
    currentCategory.value = category
    categoryForm.value = {
        categoryName: category.categoryName,
        description: category.description,
        maxScore: category.maxScore,
        order: category.order
    }
    showCategoryModal.value = true
}

const handleSubmitCategory = async () => {
    if (!categoryForm.value.categoryName || !categoryForm.value.maxScore) {
        message.error('Vui lòng nhập đầy đủ thông tin bắt buộc')
        return
    }

    formLoading.value = true
    try {
        if (isEditCategory.value) {
            await categoryAPI.update(currentCategory.value._id, categoryForm.value)
            message.success('Cập nhật đề mục thành công')
        } else {
            await categoryAPI.create(categoryForm.value)
            message.success('Tạo đề mục mới thành công')
        }
        showCategoryModal.value = false
        fetchAll()
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    } finally {
        formLoading.value = false
    }
}

const handleDeleteCategory = async (id) => {
    try {
        await categoryAPI.delete(id)
        message.success('Xóa đề mục thành công')
        fetchAll()
    } catch (error) {
        message.error('Lỗi khi xóa: ' + error.message)
    }
}

// Criteria CRUD
const handleCreateCriteria = () => {
    isEditCriteria.value = false
    currentCriteria.value = null
    criteriaForm.value = {
        category: null,
        content: '',
        description: [],
        scoringType: 'auto',
        plusScore: null,
        maxTimes: null,
        minusScore: null,
        requireEvidence: false,
        isActive: true
    }
    showCriteriaModal.value = true
}

const handleEditCriteria = (criteria) => {
    isEditCriteria.value = true
    currentCriteria.value = criteria
    criteriaForm.value = {
        category: criteria.category?._id,
        content: criteria.content,
        description: criteria.description || [],
        scoringType: criteria.scoringType,
        plusScore: criteria.plusScore,
        maxTimes: criteria.maxTimes,
        minusScore: criteria.minusScore,
        requireEvidence: criteria.requireEvidence,
        isActive: criteria.isActive
    }
    showCriteriaModal.value = true
}

const handleSubmitCriteria = async () => {
    if (!criteriaForm.value.category || !criteriaForm.value.content) {
        message.error('Vui lòng nhập đầy đủ thông tin bắt buộc')
        return
    }

    formLoading.value = true
    try {
        if (isEditCriteria.value) {
            await criteriaAPI.update(currentCriteria.value._id, criteriaForm.value)
            message.success('Cập nhật tiêu chí thành công')
        } else {
            await criteriaAPI.create(criteriaForm.value)
            message.success('Tạo tiêu chí mới thành công')
        }
        showCriteriaModal.value = false
        fetchAll()
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    } finally {
        formLoading.value = false
    }
}

const handleDeleteCriteria = async (id) => {
    try {
        await criteriaAPI.delete(id)
        message.success('Xóa tiêu chí thành công')
        fetchAll()
    } catch (error) {
        message.error('Lỗi khi xóa: ' + error.message)
    }
}

// Description management
const addDescriptionItem = () => {
    criteriaForm.value.description.push({
        content: '',
        score: 0
    })
}

const removeDescriptionItem = (index) => {
    criteriaForm.value.description.splice(index, 1)
}

// Description detail modal
const showDescriptionDetailModal = ref(false)
const currentDescriptionDetail = ref(null)

const showDescriptionDetail = (criteria) => {
    currentDescriptionDetail.value = criteria
    showDescriptionDetailModal.value = true
}

// Track expanded description state for template preview
const expandedDescriptions = ref(new Set())

const toggleDescriptionInPreview = (criteriaId) => {
    if (expandedDescriptions.value.has(criteriaId)) {
        expandedDescriptions.value.delete(criteriaId)
    } else {
        expandedDescriptions.value.add(criteriaId)
    }
}

const isDescriptionExpanded = (criteriaId) => {
    return expandedDescriptions.value.has(criteriaId)
}

// Load data
onMounted(() => {
    fetchAll()
})
</script>

<template>
<NSpace vertical :size="24">
    <!-- Header -->
    <NCard :bordered="false">
        <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
                <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    <i class="fa-solid fa-table-list mr-2 text-purple-600"></i>
                    Cấu hình Bảng điểm Rèn luyện
                </h2>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                    Quản lý đề mục và tiêu chí chấm điểm, xem bảng điểm mẫu
                </p>
            </div>
            <div class="flex gap-2">
                <NButton type="success" size="large" @click="handleCreateCategory">
                    <template #icon>
                        <i class="fa-solid fa-folder-plus"></i>
                    </template>
                    Thêm Đề mục
                </NButton>
                <NButton type="primary" size="large" @click="handleCreateCriteria">
                    <template #icon>
                        <i class="fa-solid fa-plus"></i>
                    </template>
                    Thêm Tiêu chí
                </NButton>
            </div>
        </div>
    </NCard>

    <!-- Tabs -->
    <NCard :bordered="false">
        <NTabs v-model:value="activeTab" type="line" size="large">
            <!-- Config Tab -->
            <NTabPane name="config" tab="Cấu hình">
                <NSpace vertical :size="24">
                    <!-- Summary Stats -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm opacity-90">Tổng đề mục</p>
                                    <p class="text-3xl font-bold mt-1">{{ categories.length }}</p>
                                </div>
                                <i class="fa-solid fa-folder text-4xl opacity-20"></i>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm opacity-90">Tổng tiêu chí</p>
                                    <p class="text-3xl font-bold mt-1">{{ criteria.length }}</p>
                                </div>
                                <i class="fa-solid fa-list-check text-4xl opacity-20"></i>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm opacity-90">Tổng điểm tối đa</p>
                                    <p class="text-3xl font-bold mt-1">{{ totalMaxScore }}đ</p>
                                </div>
                                <i class="fa-solid fa-trophy text-4xl opacity-20"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Categories Table -->
                    <NCard title="Danh sách Đề mục" :bordered="false">
                        <template #header-extra>
                            <NButton type="success" size="small" @click="handleCreateCategory">
                                <template #icon>
                                    <i class="fa-solid fa-plus"></i>
                                </template>
                                Thêm đề mục
                            </NButton>
                        </template>
                        <NSpin :show="loading">
                            <NDataTable
                                :columns="categoryColumns"
                                :data="sortedCategories"
                                :bordered="false"
                                striped
                                size="small"
                            />
                            <NEmpty 
                                v-if="!loading && categories.length === 0"
                                description="Chưa có đề mục nào. Hãy tạo đề mục đầu tiên!"
                                class="py-8"
                            />
                        </NSpin>
                    </NCard>

                    <!-- Criteria Table -->
                    <NCard title="Danh sách Tiêu chí" :bordered="false">
                        <template #header-extra>
                            <NButton type="primary" size="small" @click="handleCreateCriteria">
                                <template #icon>
                                    <i class="fa-solid fa-plus"></i>
                                </template>
                                Thêm tiêu chí
                            </NButton>
                        </template>
                        <NSpin :show="loading">
                            <NDataTable
                                :columns="criteriaColumns"
                                :data="criteria"
                                :bordered="false"
                                striped
                                size="small"
                                :scroll-x="1400"
                            />
                            <NEmpty 
                                v-if="!loading && criteria.length === 0"
                                description="Chưa có tiêu chí nào. Hãy tạo tiêu chí đầu tiên!"
                                class="py-8"
                            />
                        </NSpin>
                    </NCard>
                </NSpace>
            </NTabPane>

            <!-- Preview Tab -->
            <NTabPane name="preview" tab="Xem Bảng điểm mẫu">
                <NSpace vertical :size="16">
                    <NAlert type="info" title="Bảng điểm mẫu">
                        Đây là bảng điểm rèn luyện mẫu dựa trên cấu hình hiện tại. 
                        Bảng này sẽ được sử dụng để chấm điểm cho sinh viên.
                    </NAlert>

                    <div class="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <table class="min-w-full assessment-template-table">
                            <thead>
                                <tr class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                    <th class="px-4 py-3 text-center border border-slate-300 dark:border-slate-600" style="width: 80px">STT</th>
                                    <th class="px-4 py-3 text-left border border-slate-300 dark:border-slate-600" style="min-width: 400px">NỘI DUNG</th>
                                    <th class="px-4 py-3 text-center border border-slate-300 dark:border-slate-600" style="width: 120px">ĐIỂM TỐI ĐA</th>
                                    <th class="px-4 py-3 text-center border border-slate-300 dark:border-slate-600" style="width: 120px">ĐIỂM ĐẠT</th>
                                    <th class="px-4 py-3 text-center border border-slate-300 dark:border-slate-600" style="width: 200px">GHI CHÚ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <template v-if="sortedCategories.length > 0">
                                    <template v-for="(category, catIndex) in sortedCategories" :key="category._id">
                                        <!-- Category Header Row -->
                                        <tr class="bg-blue-50 dark:bg-blue-900/20">
                                            <td class="px-4 py-2 text-center font-bold border border-slate-300 dark:border-slate-600">
                                                {{ category.order }}
                                            </td>
                                            <td class="px-4 py-2 font-bold border border-slate-300 dark:border-slate-600">
                                                {{ category.categoryName }}
                                            </td>
                                            <td class="px-4 py-2 text-center font-bold border border-slate-300 dark:border-slate-600">
                                                {{ category.maxScore }}
                                            </td>
                                            <td class="px-4 py-2 border border-slate-300 dark:border-slate-600"></td>
                                            <td class="px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm italic text-slate-500">
                                                {{ category.description || '' }}
                                            </td>
                                        </tr>
                                        
                                        <!-- Criteria Rows -->
                                        <template v-if="criteriaByCategory[category._id] && criteriaByCategory[category._id].length > 0">
                                            <tr 
                                                v-for="(criterion, criterionIndex) in criteriaByCategory[category._id]" 
                                                :key="criterion._id"
                                                class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                            >
                                                <td class="px-4 py-2 text-center text-sm border border-slate-300 dark:border-slate-600">
                                                    {{ category.order }}.{{ criterionIndex + 1 }}
                                                </td>
                                                <td class="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600">
                                                    <div class="flex items-start justify-between gap-2">
                                                        <div class="flex items-start gap-2 flex-1">
                                                            <span>{{ criterion.content }}</span>
                                                            <!-- <NTag 
                                                                v-if="criterion.scoringType === 'auto'" 
                                                                type="success" 
                                                                size="tiny"
                                                            >
                                                                Sự kiện
                                                            </NTag>
                                                            <NTag 
                                                                v-else 
                                                                type="info" 
                                                                size="tiny"
                                                            >
                                                                Thủ công
                                                            </NTag> -->
                                                        </div>
                                                        <!-- Toggle button for description -->
                                                        <NButton
                                                            v-if="criterion.description && criterion.description.length > 0"
                                                            size="tiny"
                                                            type="primary"
                                                            ghost
                                                            @click="toggleDescriptionInPreview(criterion._id)"
                                                        >
                                                            <template #icon>
                                                                <i :class="isDescriptionExpanded(criterion._id) ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                                                            </template>
                                                            {{ isDescriptionExpanded(criterion._id) ? 'Ẩn' : 'Chi tiết' }}
                                                        </NButton>
                                                    </div>
                                                    <!-- Description details table (collapsible) -->
                                                    <div 
                                                        v-if="criterion.description && criterion.description.length > 0 && isDescriptionExpanded(criterion._id)" 
                                                        class="mt-2 ml-4"
                                                    >
                                                        <table class="min-w-full text-xs border border-slate-200 dark:border-slate-600 bg-blue-50 dark:bg-blue-900/10">
                                                            <thead>
                                                                <tr class="bg-slate-100 dark:bg-slate-700">
                                                                    <th class="px-2 py-1 text-left border-r border-slate-200 dark:border-slate-600" style="width: 40px">STT</th>
                                                                    <th class="px-2 py-1 text-left border-r border-slate-200 dark:border-slate-600">Nội dung đánh giá</th>
                                                                    <th class="px-2 py-1 text-center" style="width: 80px">Điểm cộng</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr 
                                                                    v-for="(desc, descIndex) in criterion.description" 
                                                                    :key="descIndex"
                                                                    class="border-t border-slate-200 dark:border-slate-600"
                                                                >
                                                                    <td class="px-2 py-1 text-center border-r border-slate-200 dark:border-slate-600">
                                                                        {{ descIndex + 1 }}
                                                                    </td>
                                                                    <td class="px-2 py-1 border-r border-slate-200 dark:border-slate-600">
                                                                        {{ desc.content }}
                                                                    </td>
                                                                    <td class="px-2 py-1 text-center text-green-600 font-semibold">
                                                                        +{{ desc.score }}đ
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                                <td class="px-4 py-2 text-center text-sm border border-slate-300 dark:border-slate-600">
                                                    <div>
                                                        <span v-if="criterion.plusScore">
                                                            {{ criterion.plusScore }}đ/lần
                                                        </span>
                                                    </div>
                                                    <div v-if="criterion.maxTimes" class="text-xs text-slate-500">
                                                        (Tối đa {{ criterion.maxTimes }} lần)
                                                    </div>
                                                </td>
                                                <td class="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-yellow-50 dark:bg-yellow-900/10">
                                                    <!-- Điểm đạt - sẽ được điền khi chấm -->
                                                </td>
                                                <td class="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600">
                                                    <div class="text-xs space-y-1">
                                                        <div v-if="criterion.requireEvidence" class="text-orange-600">
                                                            <i class="fa-solid fa-paperclip mr-1"></i>
                                                            Yêu cầu minh chứng
                                                        </div>
                                                        <div v-if="criterion.scoringType === 'manual'" class="text-blue-600">
                                                            <i class="fa-solid fa-user-check mr-1"></i>
                                                            Cần phê duyệt
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </template>
                                        <tr v-else>
                                            <td colspan="5" class="px-4 py-2 text-center text-sm text-slate-400 italic border border-slate-300 dark:border-slate-600">
                                                Chưa có tiêu chí nào trong đề mục này
                                            </td>
                                        </tr>
                                    </template>
                                    
                                    <!-- Total Row -->
                                    <tr class="bg-gradient-to-r from-green-600 to-green-700 text-white font-bold">
                                        <td colspan="2" class="px-4 py-3 text-center border border-slate-300 dark:border-slate-600">
                                            TỔNG ĐIỂM
                                        </td>
                                        <td class="px-4 py-3 text-center border border-slate-300 dark:border-slate-600">
                                            {{ totalMaxScore }}
                                        </td>
                                        <td class="px-4 py-3 border border-slate-300 dark:border-slate-600 bg-yellow-300 dark:bg-yellow-600">
                                            <!-- Tổng điểm đạt -->
                                        </td>
                                        <td class="px-4 py-3 border border-slate-300 dark:border-slate-600"></td>
                                    </tr>
                                    
                                    <!-- Classification Row -->
                                    <tr class="bg-purple-50 dark:bg-purple-900/20">
                                        <td colspan="5" class="px-4 py-3 border border-slate-300 dark:border-slate-600">
                                            <div class="flex items-center gap-4 text-sm">
                                                <span class="font-semibold">Xếp loại:</span>
                                                <div class="flex gap-4">
                                                    <span><strong>Xuất sắc:</strong> ≥ 90đ</span>
                                                    <span><strong>Tốt:</strong> ≥ 80đ</span>
                                                    <span><strong>Khá:</strong> ≥ 65đ</span>
                                                    <span><strong>Trung bình:</strong> ≥ 50đ</span>
                                                    <span><strong>Yếu:</strong> &lt; 50đ</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                                <tr v-else>
                                    <td colspan="5" class="px-4 py-8 text-center text-slate-400">
                                        <NEmpty description="Chưa có cấu hình đề mục. Vui lòng thêm đề mục và tiêu chí để xem bảng điểm mẫu." />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Export Button -->
                    <div class="flex justify-end gap-2">
                        <NButton type="primary" size="large">
                            <template #icon>
                                <i class="fa-solid fa-file-excel"></i>
                            </template>
                            Xuất Excel
                        </NButton>
                        <NButton type="info" size="large">
                            <template #icon>
                                <i class="fa-solid fa-file-pdf"></i>
                            </template>
                            Xuất PDF
                        </NButton>
                    </div>
                </NSpace>
            </NTabPane>
        </NTabs>
    </NCard>

    <!-- Category Modal -->
    <NModal
        v-model:show="showCategoryModal"
        preset="card"
        :title="isEditCategory ? 'Chỉnh sửa Đề mục' : 'Thêm Đề mục mới'"
        style="width: 700px"
        :bordered="false"
        :segmented="{ content: true, footer: 'soft' }"
    >
        <NForm
            :model="categoryForm"
            label-placement="left"
            label-width="150"
            require-mark-placement="left"
        >
            <NFormItem label="Tên đề mục" path="categoryName" required>
                <NInput
                    v-model:value="categoryForm.categoryName"
                    placeholder="VD: Ý thức và thái độ trong học tập"
                    maxlength="200"
                />
            </NFormItem>

            <NFormItem label="Mô tả" path="description">
                <NInput
                    v-model:value="categoryForm.description"
                    type="textarea"
                    placeholder="Mô tả chi tiết về đề mục"
                    :rows="3"
                />
            </NFormItem>

            <div class="grid grid-cols-2 gap-4">
                <NFormItem label="Điểm tối đa" path="maxScore" required>
                    <NInputNumber
                        v-model:value="categoryForm.maxScore"
                        placeholder="Nhập điểm"
                        :min="0"
                        :max="100"
                        style="width: 100%"
                    />
                </NFormItem>

                <NFormItem label="Thứ tự hiển thị" path="order" required>
                    <NInputNumber
                        v-model:value="categoryForm.order"
                        placeholder="Thứ tự"
                        :min="1"
                        style="width: 100%"
                    />
                </NFormItem>
            </div>
        </NForm>

        <template #footer>
            <div class="flex justify-end gap-2">
                <NButton @click="showCategoryModal = false">Hủy</NButton>
                <NButton type="primary" @click="handleSubmitCategory" :loading="formLoading">
                    {{ isEditCategory ? 'Cập nhật' : 'Tạo mới' }}
                </NButton>
            </div>
        </template>
    </NModal>

    <!-- Criteria Modal -->
    <NModal
        v-model:show="showCriteriaModal"
        preset="card"
        :title="isEditCriteria ? 'Chỉnh sửa Tiêu chí' : 'Thêm Tiêu chí mới'"
        style="width: 800px"
        :bordered="false"
        :segmented="{ content: true, footer: 'soft' }"
    >
        <NForm
            :model="criteriaForm"
            label-placement="left"
            label-width="180"
            require-mark-placement="left"
        >
            <NFormItem label="Đề mục" path="category" required>
                <NSelect
                    v-model:value="criteriaForm.category"
                    :options="categoryOptions"
                    placeholder="Chọn đề mục"
                    filterable
                />
            </NFormItem>

            <NFormItem label="Nội dung tiêu chí" path="content" required>
                <NInput
                    v-model:value="criteriaForm.content"
                    type="textarea"
                    placeholder="VD: Tham gia các hoạt động văn hóa, văn nghệ"
                    :rows="2"
                />
            </NFormItem>

            <NDivider />

            <!-- Description Items Section -->
            <div class="mb-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="font-semibold text-base">Chi tiết nội dung đánh giá</span>
                    <NButton type="primary" size="small" @click="addDescriptionItem">
                        <template #icon>
                            <i class="fa-solid fa-plus"></i>
                        </template>
                        Thêm mô tả
                    </NButton>
                </div>

                <NAlert v-if="criteriaForm.description.length === 0" type="info" size="small" class="mb-3">
                    Chưa có mô tả chi tiết. Click "Thêm mô tả" để thêm nội dung đánh giá và điểm cộng tương ứng.
                </NAlert>

                <NSpace vertical :size="12" v-if="criteriaForm.description.length > 0">
                    <NCard 
                        v-for="(item, index) in criteriaForm.description" 
                        :key="index"
                        size="small"
                        :bordered="true"
                        class="bg-slate-50 dark:bg-slate-800"
                    >
                        <template #header>
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-semibold">Mô tả {{ index + 1 }}</span>
                                <NButton 
                                    type="error" 
                                    size="tiny" 
                                    ghost
                                    @click="removeDescriptionItem(index)"
                                >
                                    <template #icon>
                                        <i class="fa-solid fa-trash"></i>
                                    </template>
                                </NButton>
                            </div>
                        </template>
                        
                        <div class="grid grid-cols-1 gap-3">
                            <NFormItem label="Nội dung đánh giá" :show-label="true">
                                <NInput
                                    v-model:value="item.content"
                                    type="textarea"
                                    placeholder="VD: Tham gia đầy đủ các buổi sinh hoạt lớp"
                                    :rows="2"
                                />
                            </NFormItem>
                            
                            <NFormItem label="Điểm cộng" :show-label="true">
                                <NInputNumber
                                    v-model:value="item.score"
                                    placeholder="Nhập điểm"
                                    :min="0"
                                    style="width: 100%"
                                >
                                    <template #suffix>điểm</template>
                                </NInputNumber>
                            </NFormItem>
                        </div>
                    </NCard>
                </NSpace>
            </div>

            <NDivider />

            <NFormItem label="Loại chấm điểm" path="scoringType" required>
                <NRadioGroup v-model:value="criteriaForm.scoringType">
                    <NSpace vertical>
                        <NRadio 
                            v-for="option in scoringTypeOptions" 
                            :key="option.value" 
                            :value="option.value"
                        >
                            <div>
                                <div class="font-semibold">{{ option.label }}</div>
                                <div class="text-xs text-slate-500">{{ option.description }}</div>
                            </div>
                        </NRadio>
                    </NSpace>
                </NRadioGroup>
            </NFormItem>

            <NAlert type="info" class="mb-4" v-if="criteriaForm.scoringType === 'auto'">
                <strong>Hướng dẫn:</strong> Điểm cộng = điểm nhận khi tham gia sự kiện. Điểm trừ = điểm bị trừ mỗi lần vi phạm.
            </NAlert>

            <div class="grid grid-cols-2 gap-4">
                <NFormItem label="Điểm cộng (mỗi lần)" path="plusScore">
                    <NInputNumber
                        v-model:value="criteriaForm.plusScore"
                        placeholder="VD: 5"
                        :min="0"
                        style="width: 100%"
                    >
                        <template #suffix>điểm</template>
                    </NInputNumber>
                </NFormItem>

                <NFormItem label="Điểm trừ (mỗi lần)" path="minusScore">
                    <NInputNumber
                        v-model:value="criteriaForm.minusScore"
                        placeholder="VD: -5"
                        :max="0"
                        style="width: 100%"
                    >
                        <template #suffix>điểm</template>
                    </NInputNumber>
                </NFormItem>
            </div>

            <NFormItem label="Số lần tối đa" path="maxTimes">
                <NInputNumber
                    v-model:value="criteriaForm.maxTimes"
                    placeholder="Không giới hạn (để trống)"
                    :min="1"
                    style="width: 100%"
                    clearable
                />
            </NFormItem>

            <NFormItem label="Yêu cầu minh chứng" path="requireEvidence">
                <NCheckbox v-model:checked="criteriaForm.requireEvidence">
                    Sinh viên cần upload file minh chứng khi chấm điểm
                </NCheckbox>
            </NFormItem>

            <NFormItem label="Trạng thái" path="isActive">
                <NCheckbox v-model:checked="criteriaForm.isActive">
                    Kích hoạt tiêu chí (hiển thị cho sinh viên)
                </NCheckbox>
            </NFormItem>
        </NForm>

        <template #footer>
            <div class="flex justify-end gap-2">
                <NButton @click="showCriteriaModal = false">Hủy</NButton>
                <NButton type="primary" @click="handleSubmitCriteria" :loading="formLoading">
                    {{ isEditCriteria ? 'Cập nhật' : 'Tạo mới' }}
                </NButton>
            </div>
        </template>
    </NModal>

    <!-- Description Detail Modal -->
    <NModal
        v-model:show="showDescriptionDetailModal"
        preset="card"
        title="Chi tiết nội dung đánh giá"
        style="width: 700px"
        :bordered="false"
    >
        <div v-if="currentDescriptionDetail">
            <div class="mb-4">
                <h3 class="text-lg font-semibold mb-2">{{ currentDescriptionDetail.content }}</h3>
                <NTag :type="currentDescriptionDetail.scoringType === 'auto' ? 'success' : 'info'" size="small">
                    {{ currentDescriptionDetail.scoringType === 'auto' ? 'Sự kiện' : 'Thủ công' }}
                </NTag>
            </div>

            <NDivider />

            <div v-if="currentDescriptionDetail.description && currentDescriptionDetail.description.length > 0">
                <h4 class="font-semibold mb-3">Các nội dung đánh giá chi tiết:</h4>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full border border-slate-300 dark:border-slate-600 rounded-lg">
                        <thead>
                            <tr class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                                <th class="px-4 py-3 text-left border-r border-slate-300 dark:border-slate-600" style="width: 80px">STT</th>
                                <th class="px-4 py-3 text-left border-r border-slate-300 dark:border-slate-600">Nội dung đánh giá</th>
                                <th class="px-4 py-3 text-center" style="width: 150px">Điểm cộng</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr 
                                v-for="(desc, index) in currentDescriptionDetail.description" 
                                :key="index"
                                class="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <td class="px-4 py-3 text-center border-r border-slate-200 dark:border-slate-700">
                                    {{ index + 1 }}
                                </td>
                                <td class="px-4 py-3 border-r border-slate-200 dark:border-slate-700">
                                    {{ desc.content }}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <NTag type="success" size="small">+{{ desc.score }}đ</NTag>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <NEmpty v-else description="Tiêu chí này chưa có mô tả chi tiết" size="small" class="py-8" />
        </div>

        <template #footer>
            <div class="flex justify-end">
                <NButton @click="showDescriptionDetailModal = false">Đóng</NButton>
            </div>
        </template>
    </NModal>
</NSpace>
</template>

<style scoped>
.assessment-template-table {
    font-size: 14px;
    border-collapse: collapse;
}

.assessment-template-table th,
.assessment-template-table td {
    border: 1px solid #e2e8f0;
}

.dark .assessment-template-table th,
.dark .assessment-template-table td {
    border-color: #475569;
}

.assessment-template-table thead th {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Print styles */
@media print {
    .assessment-template-table {
        border: 2px solid #000;
    }
    
    .assessment-template-table th,
    .assessment-template-table td {
        border: 1px solid #000;
    }
}
</style>
