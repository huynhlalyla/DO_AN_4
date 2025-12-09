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
    NUpload,
    NUploadDragger,
    useMessage,
    NTag,
    NSpin,
    NEmpty,
    NAlert,
    NCollapse,
    NCollapseItem,
    NPagination,
    NSwitch
} from 'naive-ui'
import { studentAPI, classAPI, facultyAPI } from '../../services/api'

const message = useMessage()

// State
const students = ref([])
const classes = ref([])
const faculties = ref([])
const loading = ref(false)
const showModal = ref(false)
const showImportModal = ref(false)
const formLoading = ref(false)
const isEdit = ref(false)
const currentStudent = ref(null)

// Filter state
const filterClass = ref(null)
const filterFaculty = ref(null)
const filterGender = ref(null)
const searchQuery = ref('')
const sortDateOfBirth = ref(null) // 'asc' or 'desc'

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)

// Computed total pages
const totalPages = computed(() => Math.ceil(filteredStudents.value.length / pageSize.value))

// Paginated students
const paginatedStudents = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredStudents.value.slice(start, end)
})

// Form data
const formValue = ref({
    lastName: '',
    firstName: '',
    gender: 'Nam',
    email: '',
    dateOfBirth: null,
    class: null,
    faculty: null,
    isSecretary: false
})

// Import data
const importData = ref('')
const importResult = ref(null)
const importFormValue = ref({
    faculty: null,
    class: null
})

// Options
const genderOptions = [
    { label: 'Nam', value: 'Nam' },
    { label: 'Nữ', value: 'Nữ' },
    { label: 'Khác', value: 'Khác' }
]

const sortOptions = [
    { label: 'Ngày sinh tăng dần', value: 'asc' },
    { label: 'Ngày sinh giảm dần', value: 'desc' }
]

const filterClassOptions = computed(() => {
    let filteredClasses = classes.value
    if (filterFaculty.value) {
        filteredClasses = filteredClasses.filter(c => c.faculty?._id === filterFaculty.value)
    }
    return filteredClasses.map(c => ({
        label: `${c.classCode} - ${c.className}`,
        value: c._id
    }))
})

const formClassOptions = computed(() => {
    let filteredClasses = classes.value
    if (formValue.value.faculty) {
        filteredClasses = filteredClasses.filter(c => c.faculty?._id === formValue.value.faculty)
    }
    return filteredClasses.map(c => ({
        label: `${c.classCode} - ${c.className}`,
        value: c._id
    }))
})

const importClassOptions = computed(() => {
    let filteredClasses = classes.value
    if (importFormValue.value.faculty) {
        filteredClasses = filteredClasses.filter(c => c.faculty?._id === importFormValue.value.faculty)
    }
    return filteredClasses.map(c => ({
        label: `${c.classCode} - ${c.className}`,
        value: c._id
    }))
})

const handleDeleteAllStudents = async () => {
    if (!filterClass.value) return
    
    try {
        loading.value = true
        const response = await studentAPI.deleteByClass(filterClass.value)
        message.success(response.message)
        fetchStudents()
    } catch (error) {
        message.error('Lỗi khi xóa: ' + error.message)
    } finally {
        loading.value = false
    }
}

const facultyOptions = computed(() => {
    return faculties.value.map(f => ({
        label: `${f.facultyCode} - ${f.facultyName}`,
        value: f._id
    }))
})

// Filtered students
const filteredStudents = computed(() => {
    let result = students.value

    // Filter by faculty
    if (filterFaculty.value) {
        result = result.filter(s => s.faculty?._id === filterFaculty.value)
    }

    // Filter by class
    if (filterClass.value) {
        result = result.filter(s => s.class?._id === filterClass.value)
    }

    // Filter by gender
    if (filterGender.value) {
        result = result.filter(s => s.gender === filterGender.value)
    }

    // Search by name or student code
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        result = result.filter(s => {
            const fullName = `${s.lastName} ${s.firstName}`.toLowerCase()
            const studentCode = s.studentCode.toLowerCase()
            return fullName.includes(query) || studentCode.includes(query)
        })
    }

    // Sort by date of birth
    if (sortDateOfBirth.value) {
        result = [...result].sort((a, b) => {
            const dateA = new Date(a.dateOfBirth).getTime()
            const dateB = new Date(b.dateOfBirth).getTime()
            return sortDateOfBirth.value === 'asc' ? dateA - dateB : dateB - dateA
        })
    }

    // Sort: Bí thư lên đầu
    result = [...result].sort((a, b) => {
        if (a.isSecretary && !b.isSecretary) return -1
        if (!a.isSecretary && b.isSecretary) return 1
        return 0
    })

    return result
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
        title: 'MSSV',
        key: 'studentCode',
        width: 130,
        render: (row) => h(
            NTag,
            { type: 'warning', size: 'small' },
            { default: () => row.studentCode }
        )
    },
    {
        title: 'Họ tên',
        key: 'fullName',
        minWidth: 180,
        render: (row) => {
            if (row.isSecretary) {
                return h(
                    NSpace,
                    { size: 8, align: 'center' },
                    {
                        default: () => [
                            `${row.lastName} ${row.firstName}`,
                            h(NTag, { type: 'warning', size: 'small' }, { default: () => 'Bí thư' })
                        ]
                    }
                );
            }
            return `${row.lastName} ${row.firstName}`;
        }
    },
    {
        title: 'Giới tính',
        key: 'gender',
        width: 100,
        align: 'center'
    },
    {
        title: 'Email',
        key: 'email',
        minWidth: 200,
        ellipsis: {
            tooltip: true
        },
        render: (row) => h(
            'a',
            {
                href: `mailto:${row.email}`,
                class: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline',
                onClick: (e) => {
                    e.stopPropagation()
                }
            },
            row.email
        )
    },
    {
        title: 'Ngày sinh',
        key: 'dateOfBirth',
        width: 120,
        render: (row) => new Date(row.dateOfBirth).toLocaleDateString('vi-VN')
    },
    {
        title: 'Lớp',
        key: 'class',
        width: 120,
        render: (row) => row.class?.classCode || 'N/A'
    },
    {
        title: 'Khoa',
        key: 'faculty',
        width: 100,
        render: (row) => row.faculty?.facultyCode || 'N/A'
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
                            onPositiveClick: () => handleDelete(row._id)
                        },
                        {
                            default: () => 'Bạn có chắc muốn xóa sinh viên này?',
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
const fetchStudents = async (showLoading = true) => {
    if (showLoading) loading.value = true
    try {
        const response = await studentAPI.getAll()
        students.value = response.data || []
        if (showLoading) message.success(`Đã tải ${response.count} sinh viên`)
    } catch (error) {
        message.error('Lỗi khi tải dữ liệu: ' + error.message)
    } finally {
        if (showLoading) loading.value = false
    }
}

const fetchClasses = async () => {
    try {
        const response = await classAPI.getAll()
        classes.value = response.data || []
    } catch (error) {
        message.error('Lỗi khi tải danh sách lớp: ' + error.message)
    }
}

const fetchFaculties = async () => {
    try {
        const response = await facultyAPI.getAll()
        faculties.value = response.data || []
    } catch (error) {
        message.error('Lỗi khi tải danh sách khoa: ' + error.message)
    }
}

// CRUD operations
const handleCreate = () => {
    isEdit.value = false
    currentStudent.value = null
    formValue.value = {
        lastName: '',
        firstName: '',
        gender: null,
        email: '',
        dateOfBirth: null,
        class: null,
        faculty: null,
        isSecretary: false
    }
    showModal.value = true
}

const handleEdit = (student) => {
    isEdit.value = true
    currentStudent.value = student
    formValue.value = {
        lastName: student.lastName,
        firstName: student.firstName,
        gender: student.gender,
        email: student.email,
        dateOfBirth: new Date(student.dateOfBirth).getTime(),
        class: student.class._id,
        faculty: student.faculty._id,
        isSecretary: student.isSecretary || false
    }
    showModal.value = true
}

const handleClassChange = (classId) => {
    if (!classId) return
    const selectedClass = classes.value.find(c => c._id === classId)
    if (selectedClass && selectedClass.faculty) {
        // Auto select faculty if not selected or different
        const facultyId = selectedClass.faculty._id || selectedClass.faculty
        if (formValue.value.faculty !== facultyId) {
            formValue.value.faculty = facultyId
        }
    }
}

const handleSubmit = async () => {
    // Validation
    if (!formValue.value.lastName || 
        !formValue.value.firstName || !formValue.value.gender ||
        !formValue.value.dateOfBirth || !formValue.value.class || 
        !formValue.value.faculty) {
        message.error('Vui lòng nhập đầy đủ thông tin')
        return
    }

    formLoading.value = true
    try {
        // Tách isSecretary ra khỏi data chính
        const { isSecretary, ...studentData } = formValue.value
        const data = {
            ...studentData,
            dateOfBirth: new Date(formValue.value.dateOfBirth).toISOString()
        }

        if (isEdit.value) {
            // Cập nhật thông tin sinh viên
            await studentAPI.update(currentStudent.value._id, data)
            
            // Nếu trạng thái bí thư thay đổi, gọi API riêng
            if (isSecretary !== currentStudent.value.isSecretary) {
                const secretaryResult = await studentAPI.updateSecretary(currentStudent.value._id, isSecretary)
                if (secretaryResult.success) {
                    message.success('Cập nhật sinh viên và quyền Bí thư thành công')
                } else {
                    message.warning('Cập nhật sinh viên thành công nhưng không thể cập nhật quyền Bí thư')
                }
            } else {
                message.success('Cập nhật sinh viên thành công')
            }
        } else {
            await studentAPI.create(data)
            message.success('Tạo sinh viên mới thành công')
        }
        
        showModal.value = false
        fetchStudents()
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    } finally {
        formLoading.value = false
    }
}

const handleDelete = async (id) => {
    try {
        await studentAPI.delete(id)
        message.success('Xóa sinh viên thành công')
        fetchStudents()
    } catch (error) {
        message.error('Lỗi khi xóa: ' + error.message)
    }
}

// Import JSON
const handleImportJSON = async () => {
    if (!importFormValue.value.faculty || !importFormValue.value.class) {
        message.error('Vui lòng chọn Khoa và Lớp trước khi import')
        return
    }

    if (!importData.value.trim()) {
        message.error('Vui lòng nhập dữ liệu JSON')
        return
    }

    try {
        const students = JSON.parse(importData.value)
        
        if (!Array.isArray(students)) {
            message.error('Dữ liệu phải là một mảng')
            return
        }

        // Clean and normalize student data
        const studentsWithRefs = students.map(student => {
            // Create a clean object with trimmed keys and normalized field names
            const cleanStudent = {}
            
            for (const [key, value] of Object.entries(student)) {
                const trimmedKey = key.trim()
                const normalizedKey = trimmedKey.toLowerCase()
                
                // Map common variations to correct field names
                if (normalizedKey === 'studentcode') cleanStudent.studentCode = value
                else if (normalizedKey === 'lastname') cleanStudent.lastName = value
                else if (normalizedKey === 'firstname') cleanStudent.firstName = value
                else if (normalizedKey === 'gender') cleanStudent.gender = value
                else if (normalizedKey === 'email') cleanStudent.email = value
                else if (normalizedKey === 'dateofbirth') cleanStudent.dateOfBirth = value
                else cleanStudent[trimmedKey] = value // Keep other fields as-is
            }
            
            // Add faculty and class
            cleanStudent.faculty = importFormValue.value.faculty
            cleanStudent.class = importFormValue.value.class
            
            return cleanStudent
        })

        formLoading.value = true
        const response = await studentAPI.createBulk(studentsWithRefs)
        
        importResult.value = response.data
        message.success(response.message)
        
        importData.value = ''
        fetchStudents()
    } catch (error) {
        if (error instanceof SyntaxError) {
            message.error('Lỗi định dạng JSON: ' + error.message)
        } else {
            message.error('Lỗi: ' + error.message)
        }
    } finally {
        formLoading.value = false
    }
}

// Clear filters
const clearFilters = () => {
    filterClass.value = classes.value.length > 0 ? classes.value[0]._id : null
    filterFaculty.value = faculties.value.length > 0 ? faculties.value[0]._id : null
    filterGender.value = null
    searchQuery.value = ''
    sortDateOfBirth.value = null
    currentPage.value = 1
}

// Reset page when filter changes
const handleFilterChange = () => {
    currentPage.value = 1
}

const smartSelectDefaults = () => {
    if (faculties.value.length === 0) return

    // 1. Ưu tiên: Tìm khoa có lớp VÀ lớp đó có sinh viên
    for (const faculty of faculties.value) {
        const facultyClasses = classes.value.filter(c => c.faculty?._id === faculty._id)
        for (const cls of facultyClasses) {
            const hasStudents = students.value.some(s => s.class?._id === cls._id)
            if (hasStudents) {
                filterFaculty.value = faculty._id
                filterClass.value = cls._id
                return
            }
        }
    }

    // 2. Fallback: Tìm khoa có bất kỳ lớp nào
    for (const faculty of faculties.value) {
        const facultyClasses = classes.value.filter(c => c.faculty?._id === faculty._id)
        if (facultyClasses.length > 0) {
            filterFaculty.value = faculty._id
            filterClass.value = facultyClasses[0]._id
            return
        }
    }

    // 3. Fallback cuối cùng: Chọn khoa đầu tiên
    filterFaculty.value = faculties.value[0]._id
    const firstFacultyClasses = classes.value.filter(c => c.faculty?._id === faculties.value[0]._id)
    if (firstFacultyClasses.length > 0) {
        filterClass.value = firstFacultyClasses[0]._id
    }
}

// Load data
onMounted(async () => {
    loading.value = true
    try {
        await Promise.all([
            fetchFaculties(),
            fetchClasses(),
            fetchStudents(false)
        ])
        smartSelectDefaults()
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
})
</script>

<template>
<NSpace vertical :size="24">
    <!-- Header -->
    <NCard :bordered="false">
        <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
                <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    <i class="fa-solid fa-user-graduate mr-2 text-purple-600"></i>
                    Quản lý Sinh viên
                </h2>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                    Quản lý thông tin sinh viên trong trường
                </p>
            </div>
            <NSpace>
                <NButton type="info" size="large" @click="showImportModal = true">
                    <template #icon>
                        <i class="fa-solid fa-file-import"></i>
                    </template>
                    Import JSON
                </NButton>
                <NButton type="primary" size="large" @click="handleCreate">
                    <template #icon>
                        <i class="fa-solid fa-plus"></i>
                    </template>
                    Thêm sinh viên
                </NButton>
            </NSpace>
        </div>
    </NCard>

    <!-- Search and Filters -->
    <NCard :bordered="false" title="Tìm kiếm & Bộ lọc">
        <NSpace vertical :size="16">
            <!-- Search Bar -->
            <NInput
                v-model:value="searchQuery"
                placeholder="Tìm kiếm theo tên hoặc mã sinh viên..."
                clearable
                @update:value="handleFilterChange"
            >
                <template #prefix>
                    <i class="fa-solid fa-magnifying-glass text-slate-400"></i>
                </template>
            </NInput>

            <!-- Filters -->
            <div class="flex flex-wrap gap-3 items-center">
                <NSelect
                    v-model:value="filterFaculty"
                    :options="facultyOptions"
                    placeholder="Lọc theo khoa"
                    clearable
                    style="min-width: 200px; flex: 1"
                    @update:value="() => { filterClass = null; handleFilterChange() }"
                />
                <NSelect
                    v-model:value="filterClass"
                    :options="filterClassOptions"
                    placeholder="Lọc theo lớp"
                    clearable
                    style="min-width: 200px; flex: 1"
                    @update:value="handleFilterChange"
                />
                <NSelect
                    v-model:value="filterGender"
                    :options="genderOptions"
                    placeholder="Lọc theo giới tính"
                    clearable
                    style="min-width: 150px"
                    @update:value="handleFilterChange"
                />
                <NSelect
                    v-model:value="sortDateOfBirth"
                    :options="sortOptions"
                    placeholder="Sắp xếp ngày sinh"
                    clearable
                    style="min-width: 180px"
                    @update:value="handleFilterChange"
                />
                <NButton @click="clearFilters" secondary>
                    <template #icon>
                        <i class="fa-solid fa-rotate-right"></i>
                    </template>
                    Đặt lại
                </NButton>

                <NPopconfirm
                    v-if="filterClass"
                    @positive-click="handleDeleteAllStudents"
                    negative-text="Hủy"
                    positive-text="Xóa"
                >
                    <template #trigger>
                        <NButton type="error" secondary>
                            <template #icon>
                                <i class="fa-solid fa-trash-can"></i>
                            </template>
                            Xóa tất cả SV lớp này
                        </NButton>
                    </template>
                    Bạn có chắc chắn muốn xóa tất cả sinh viên của lớp này không?
                </NPopconfirm>
            </div>
        </NSpace>
    </NCard>

    <!-- Table -->
    <NCard :bordered="false">
        <template #header>
            <div class="flex items-center justify-between">
                <span>Danh sách sinh viên</span>
                <NTag type="info" size="small">
                    Tổng: {{ filteredStudents.length }} sinh viên
                </NTag>
            </div>
        </template>
        <NSpin :show="loading">
            <NDataTable
                :columns="columns"
                :data="paginatedStudents"
                :bordered="false"
                :single-line="false"
                striped
                size="small"
                :scroll-x="1400"
            />
            
            <NEmpty 
                v-if="!loading && filteredStudents.length === 0"
                description="Chưa có sinh viên nào"
                class="py-8"
            />

            <!-- Pagination -->
            <div v-if="filteredStudents.length > 0" class="flex justify-center mt-4">
                <NPagination
                    v-model:page="currentPage"
                    :page-count="totalPages"
                    :page-size="pageSize"
                    show-size-picker
                    :page-sizes="[10, 20, 50, 100]"
                    @update:page-size="(size) => { pageSize = size; currentPage = 1 }"
                >
                    <template #prefix="{ itemCount }">
                        Hiển thị {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, itemCount) }} / {{ itemCount }}
                    </template>
                </NPagination>
            </div>
        </NSpin>
    </NCard>

    <!-- Form Modal -->
    <NModal
        v-model:show="showModal"
        preset="card"
        :title="isEdit ? 'Chỉnh sửa sinh viên' : 'Thêm sinh viên mới'"
        style="width: 700px"
        :bordered="false"
        :segmented="{ content: true, footer: 'soft' }"
    >
        <NForm
            :model="formValue"
            label-placement="left"
            label-width="120"
            require-mark-placement="left"
        >
            <div class="grid grid-cols-2 gap-4">
                <NFormItem label="Họ" path="lastName" required>
                    <NInput
                        v-model:value="formValue.lastName"
                        placeholder="VD: Trần Bình"
                        maxlength="50"
                    />
                </NFormItem>

                <NFormItem label="Tên" path="firstName" required>
                    <NInput
                        v-model:value="formValue.firstName"
                        placeholder="VD: An"
                        maxlength="50"
                    />
                </NFormItem>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <NFormItem label="Giới tính" path="gender" required>
                    <NSelect
                        v-model:value="formValue.gender"
                        :options="genderOptions"
                        placeholder="Chọn giới tính"
                    />
                </NFormItem>

                <NFormItem label="Ngày sinh" path="dateOfBirth" required>
                    <NDatePicker
                        v-model:value="formValue.dateOfBirth"
                        type="date"
                        placeholder="Chọn ngày sinh"
                        style="width: 100%"
                    />
                </NFormItem>
            </div>

            <NFormItem label="Email" path="email">
                <NInput
                    v-model:value="formValue.email"
                    placeholder="Tự động tạo nếu để trống"
                    type="email"
                />
            </NFormItem>

            <div class="grid grid-cols-2 gap-4">
                <NFormItem label="Khoa" path="faculty" required>
                    <NSelect
                        v-model:value="formValue.faculty"
                        :options="facultyOptions"
                        placeholder="Chọn khoa"
                        filterable
                        @update:value="formValue.class = null"
                    />
                </NFormItem>

                <NFormItem label="Lớp" path="class" required>
                    <NSelect
                        v-model:value="formValue.class"
                        :options="formClassOptions"
                        placeholder="Chọn lớp"
                        filterable
                        @update:value="handleClassChange"
                    />
                </NFormItem>

                <NFormItem label="Là Bí thư lớp" path="isSecretary">
                    <NSwitch v-model:value="formValue.isSecretary" />
                    <span class="ml-2 text-sm text-gray-500">
                        {{ formValue.isSecretary ? 'Có' : 'Không' }}
                    </span>
                </NFormItem>
            </div>
        </NForm>

        <template #footer>
            <div class="flex justify-end gap-2">
                <NButton @click="showModal = false">Hủy</NButton>
                <NButton type="primary" @click="handleSubmit" :loading="formLoading">
                    {{ isEdit ? 'Cập nhật' : 'Tạo mới' }}
                </NButton>
            </div>
        </template>
    </NModal>

    <!-- Import JSON Modal -->
    <NModal
        v-model:show="showImportModal"
        preset="card"
        title="Import danh sách sinh viên từ JSON"
        style="width: 800px"
        :bordered="false"
        :segmented="{ content: true, footer: 'soft' }"
    >
        <NSpace vertical :size="16">
            <NAlert type="info" title="Hướng dẫn">
                <p class="mb-2">Chọn Khoa và Lớp cho tất cả sinh viên, sau đó dán dữ liệu JSON vào ô bên dưới.</p>
                <p>Mỗi sinh viên cần có:</p>
                <ul class="list-disc ml-6 mt-2">
                    <li>studentCode (Mã sinh viên)</li>
                    <li>lastName (Họ)</li>
                    <li>firstName (Tên)</li>
                    <li>gender (Giới tính: Nam/Nữ)</li>
                    <li>dateOfBirth (Ngày sinh: dd/mm/yyyy)</li>
                </ul>
                <p class="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                    <i class="fa-solid fa-info-circle mr-1"></i>
                    Email sẽ được hệ thống tự động tạo, không cần thêm vào JSON.
                </p>
            </NAlert>

            <!-- Faculty and Class Selection -->
            <NCard :bordered="false" size="small" class="bg-slate-50 dark:bg-slate-800">
                <div class="grid grid-cols-2 gap-4">
                    <NFormItem label="Khoa" required>
                        <NSelect
                            v-model:value="importFormValue.faculty"
                            :options="facultyOptions"
                            placeholder="Chọn khoa"
                            filterable
                            @update:value="importFormValue.class = null"
                        />
                    </NFormItem>
                    <NFormItem label="Lớp" required>
                        <NSelect
                            v-model:value="importFormValue.class"
                            :options="importClassOptions"
                            placeholder="Chọn lớp"
                            filterable
                        />
                    </NFormItem>
                </div>
            </NCard>

            <NCollapse>
                <NCollapseItem title="Xem ví dụ JSON" name="example">
                    <pre class="bg-slate-100 dark:bg-slate-800 p-4 rounded text-xs overflow-auto">{{ `[
  {
    "studentCode": "CNTT2211036",
    "lastName": "Trần Bình",
    "firstName": "An",
    "gender": "Nam",
    "dateOfBirth": "21/8/2004"
  },
  {
    "studentCode": "CNTT2211037",
    "lastName": "Nguyễn Thị",
    "firstName": "Bích",
    "gender": "Nữ",
    "dateOfBirth": "15/3/2004",
    "email": "bich.custom@example.com"
  }
]` }}</pre>
                </NCollapseItem>
            </NCollapse>

            <NInput
                v-model:value="importData"
                type="textarea"
                placeholder="Dán dữ liệu JSON vào đây..."
                :rows="12"
            />

            <NAlert v-if="importResult" :type="importResult.errors?.length > 0 ? 'warning' : 'success'">
                <template #header>
                    Kết quả import: {{ importResult.created }}/{{ importResult.total }} sinh viên
                </template>
                <div v-if="importResult.errors?.length > 0" class="mt-2">
                    <p class="font-semibold">Có {{ importResult.errors.length }} lỗi:</p>
                    <ul class="list-disc ml-6 mt-1 max-h-40 overflow-auto">
                        <li v-for="(err, idx) in importResult.errors" :key="idx" class="text-sm">
                            Dòng {{ err.index + 1 }}: {{ err.message }}
                        </li>
                    </ul>
                </div>
            </NAlert>
        </NSpace>

        <template #footer>
            <div class="flex justify-end gap-2">
                <NButton @click="showImportModal = false">Đóng</NButton>
                <NButton type="primary" @click="handleImportJSON" :loading="formLoading">
                    Import
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
</style>
