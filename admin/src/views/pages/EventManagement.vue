<script setup>
import { ref, h, onMounted, computed, watch } from 'vue'
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
    NTimePicker,
    NPopconfirm,
    NTag,
    NSpin,
    NEmpty,
    NPagination,
    NInputNumber,
    NAlert,
    NUpload,
    NTabs,
    NTabPane,
    useMessage
} from 'naive-ui'
import { eventAPI, criteriaAPI, facultyAPI, classAPI, authAPI, semesterAPI } from '../../services/api'
import Chart from 'chart.js/auto'

const message = useMessage()

// Lấy thông tin admin đăng nhập
const adminData = computed(() => {
    const data = localStorage.getItem('userData')
    return data ? JSON.parse(data) : null
})

// Refresh thông tin admin từ server
const refreshAdminData = async () => {
    if (adminData.value?._id) {
        try {
            const result = await authAPI.getAdminProfile(adminData.value._id)
            if (result.success && result.data) {
                localStorage.setItem('userData', JSON.stringify(result.data))
            }
        } catch (error) {
            console.error('Error refreshing admin data:', error)
        }
    }
}

// Kiểm tra quyền admin
const isUniversityLevel = computed(() => adminData.value?.level === 'University')
const isDepartmentLevel = computed(() => adminData.value?.level === 'Department')
const adminFacultyId = computed(() => {
    const faculty = adminData.value?.faculty
    if (!faculty) return null
    // Nếu faculty là object (đã populate), lấy _id
    if (typeof faculty === 'object' && faculty._id) {
        return faculty._id
    }
    // Nếu faculty là string (ID)
    return faculty
})

// Cảnh báo nếu bí thư khoa chưa được gán khoa
const hasFacultyAssigned = computed(() => {
    if (isDepartmentLevel.value && !adminFacultyId.value) {
        console.warn('Bí thư khoa chưa được gán khoa trong hệ thống!')
        return false
    }
    return true
})

// State
const events = ref([])
const criteria = ref([])
const faculties = ref([])
const classes = ref([])
const semesters = ref([])
const loading = ref(false)
const showModal = ref(false)
const formLoading = ref(false)
const isEdit = ref(false)
const currentEvent = ref(null)

// Tabs & Chart
const activeTab = ref('active')
const chartInstance = ref(null)
const chartCanvas = ref(null)

// Stats Modal
const showStatsModal = ref(false)
const eventParticipants = ref([])
const statsLoading = ref(false)
const selectedEventForStats = ref(null)
const attendancePassword = ref('') // New

// Filters
const filterStatus = ref(null)
const filterSemester = ref(null)
const filterScope = ref(null)
const searchQuery = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)

// Form data
const formValue = ref({
    eventName: '',
    description: '',
    criteria: null,
    score: null,
    eventDate: null,
    startTime: null,
    endTime: null,
    semester: null,
    // academicYear: '', // Removed
    organizerType: 'school',
    organizer: null,
    targetClass: null,
    targetFaculty: null,
    maxParticipants: null,
    location: '',
    note: '',
    image: null,
    fileList: []
})

// Options
const statusOptions = [
    { label: 'Chờ duyệt', value: 'pending' },
    { label: 'Đã duyệt', value: 'approved' },
    { label: 'Bị từ chối', value: 'rejected' }
]

const semesterOptions = computed(() => {
    return semesters.value.map(s => ({
        label: `Học kỳ ${s.semesterNumber} - Năm học ${s.academicYear}`,
        value: s._id
    }))
})

const scopeOptions = [
    { label: 'Toàn trường', value: 'university' },
    { label: 'Cấp khoa', value: 'faculty' },
    { label: 'Cấp lớp', value: 'class' }
]

// Tùy chọn loại sự kiện dựa theo quyền admin
const organizerTypeOptions = computed(() => {
    const options = []
    
    // Bí thư trường được tạo tất cả loại sự kiện
    if (isUniversityLevel.value) {
        options.push({ label: 'Trường', value: 'school' })
    }
    
    // Tất cả admin đều có thể tạo sự kiện khoa và lớp
    options.push({ label: 'Khoa', value: 'faculty' })
    options.push({ label: 'Lớp', value: 'class' })
    
    return options
})

const criteriaOptions = computed(() => {
    return criteria.value.map(c => ({
        label: `[+${c.plusScore}đ] ${c.content}`,
        value: c._id,
        maxScore: c.plusScore
    }))
})

// Tùy chọn khoa dựa theo quyền admin
const facultyOptions = computed(() => {
    let filteredFaculties = faculties.value
    
    // Bí thư khoa chỉ thấy khoa của mình
    if (isDepartmentLevel.value && adminFacultyId.value) {
        filteredFaculties = faculties.value.filter(f => f._id === adminFacultyId.value)
    }
    
    return filteredFaculties.map(f => ({
        label: `${f.facultyCode} - ${f.facultyName}`,
        value: f._id
    }))
})

// Lọc lớp theo khoa đã chọn (nếu có)
const filteredClassOptions = computed(() => {
    let filteredClasses = classes.value
    if (formValue.value.targetFaculty) {
        filteredClasses = classes.value.filter(c => 
            c.faculty?._id === formValue.value.targetFaculty || 
            c.faculty === formValue.value.targetFaculty
        )
    }
    return filteredClasses.map(c => ({
        label: `${c.classCode} - ${c.className}`,
        value: c._id
    }))
})

const classOptions = computed(() => {
    return classes.value.map(c => ({
        label: `${c.classCode} - ${c.className}`,
        value: c._id
    }))
})

// Filtered and paginated events
const filteredEvents = computed(() => {
    let result = events.value

    if (filterStatus.value) {
        result = result.filter(e => e.approvalStatus === filterStatus.value)
    }

    if (filterSemester.value) {
        result = result.filter(e => (e.semester?._id || e.semester) === filterSemester.value)
    }

    if (filterScope.value) {
        result = result.filter(e => e.scope === filterScope.value)
    }

    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(e => {
            return e.eventCode.toLowerCase().includes(query) ||
                   e.eventName.toLowerCase().includes(query)
        })
    }

    return result
})

const paginatedEvents = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredEvents.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.ceil(filteredEvents.value.length / pageSize.value))

// Table columns
const columns = [
    {
        title: 'STT',
        key: 'index',
        width: 60,
        render: (_, index) => (currentPage.value - 1) * pageSize.value + index + 1
    },
    {
        title: 'Mã sự kiện',
        key: 'eventCode',
        width: 120,
        render: (row) => h(NTag, { type: 'info', size: 'small' }, { default: () => row.eventCode })
    },
    {
        title: 'Tên sự kiện',
        key: 'eventName',
        minWidth: 200
    },
    {
        title: 'Phạm vi',
        key: 'scope',
        width: 140,
        render: (row) => {
            const scopeMap = {
                university: { type: 'success', text: 'Toàn trường' },
                faculty: { type: 'info', text: 'Cấp khoa' },
                class: { type: 'warning', text: 'Cấp lớp' }
            }
            const scope = scopeMap[row.scope] || { type: 'default', text: row.scope || 'N/A' }
            
            // Thêm thông tin chi tiết
            let detail = ''
            if (row.scope === 'faculty' && row.targetFaculty) {
                detail = row.targetFaculty.facultyCode || ''
            } else if (row.scope === 'class' && row.targetClass) {
                detail = row.targetClass.classCode || ''
            }
            
            return h('div', {}, [
                h(NTag, { type: scope.type, size: 'small' }, { default: () => scope.text }),
                detail ? h('div', { style: 'font-size: 11px; color: #666; margin-top: 2px;' }, detail) : null
            ])
        }
    },
    {
        title: 'Tiêu chí',
        key: 'criteria',
        width: 180,
        ellipsis: { tooltip: true },
        render: (row) => row.criteria?.content || 'N/A'
    },
    {
        title: 'Điểm',
        key: 'score',
        width: 70,
        align: 'center',
        render: (row) => `${row.score}đ`
    },
    {
        title: 'Thời gian',
        key: 'eventDate',
        width: 150,
        render: (row) => {
            const start = new Date(row.eventDate).toLocaleDateString('vi-VN')
            if (row.endDate) {
                const end = new Date(row.endDate).toLocaleDateString('vi-VN')
                return `${start} - ${end}`
            }
            return start
        }
    },
    {
        title: 'HK',
        key: 'semester',
        width: 60,
        align: 'center',
        render: (row) => row.semester?.semesterNumber || row.semester
    },
    {
        title: 'Trạng thái',
        key: 'approvalStatus',
        width: 100,
        align: 'center',
        render: (row) => {
            if (!row.isActive) {
                return h(NTag, { type: 'error', size: 'small' }, { default: () => 'Đã hủy' })
            }
            const statusMap = {
                pending: { type: 'warning', text: 'Chờ duyệt' },
                approved: { type: 'success', text: 'Đã duyệt' },
                rejected: { type: 'error', text: 'Từ chối' }
            }
            const status = statusMap[row.approvalStatus] || { type: 'default', text: 'N/A' }
            return h(NTag, { type: status.type, size: 'small' }, { default: () => status.text })
        }
    },
    {
        title: 'Thao tác',
        key: 'actions',
        width: 250,
        fixed: 'right',
        render: (row) => {
            const canApprove = () => {
                if (row.approvalStatus !== 'pending') return false
                if (isUniversityLevel.value) return true
                if (isDepartmentLevel.value) {
                    if (row.scope === 'class') return true
                    return false
                }
                return false
            }

            const canRestore = () => {
                if (activeTab.value !== 'cancelled') return false;
                // Check if event date is at least 1 day from now
                const now = new Date();
                const eventDate = new Date(row.eventDate);
                const oneDayBefore = new Date(eventDate);
                oneDayBefore.setDate(eventDate.getDate() - 1);
                return now <= oneDayBefore;
            }

            return h(
                NSpace,
                { size: 8 },
                {
                    default: () => [
                        canApprove() && h(
                            NButton,
                            {
                                size: 'small',
                                type: 'success',
                                ghost: true,
                                onClick: () => handleApprove(row._id)
                            },
                            { default: () => 'Duyệt' }
                        ),
                        row.approvalStatus === 'pending' && !canApprove() && h(
                            NTag,
                            { type: 'warning', size: 'small' },
                            { default: () => 'Chờ trường duyệt' }
                        ),
                    row.approvalStatus === 'pending' && canApprove() && h(
                        NButton,
                        {
                            size: 'small',
                            type: 'error',
                            ghost: true,
                            onClick: () => handleReject(row._id)
                        },
                        { default: () => 'Từ chối' }
                    ),
                    activeTab.value === 'active' && h(
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
                        NButton,
                        {
                            size: 'small',
                            type: 'info',
                            ghost: true,
                            onClick: () => handleViewStats(row)
                        },
                        { default: () => 'Thống kê' }
                    ),
                    row.approvalStatus === 'approved' && row.isActive && h(
                        NPopconfirm,
                        {
                            onPositiveClick: () => handleCancel(row),
                            'positive-text': 'Chấp nhận',
                            'negative-text': 'Huỷ'
                        },
                        {
                            default: () => 'Bạn có chắc muốn hủy sự kiện này? Email thông báo sẽ được gửi đến sinh viên.',
                            trigger: () => h(
                                NButton,
                                {
                                    size: 'small',
                                    type: 'warning',
                                    ghost: true
                                },
                                { default: () => 'Hủy' }
                            )
                        }
                    ),
                    canRestore() && h(
                        NPopconfirm,
                        {
                            onPositiveClick: () => handleRestore(row._id),
                            'positive-text': 'Khôi phục',
                            'negative-text': 'Hủy'
                        },
                        {
                            default: () => 'Bạn có chắc muốn khôi phục sự kiện này?',
                            trigger: () => h(
                                NButton,
                                {
                                    size: 'small',
                                    type: 'success',
                                    ghost: true
                                },
                                { default: () => 'Khôi phục' }
                            )
                        }
                    ),
                    h(
                        NPopconfirm,
                        {
                            onPositiveClick: () => handleDelete(row._id),
                            'positive-text': 'Chấp nhận',
                            'negative-text': 'Huỷ'
                        },
                        {
                            default: () => 'Bạn có chắc muốn xóa sự kiện này?',
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
                ].filter(Boolean)
            }
        )
    }
    }
]

// Fetch data
const fetchEvents = async () => {
    loading.value = true
    try {
        const params = {
            status: activeTab.value === 'cancelled' ? 'cancelled' : 'active'
        }
        
        if (isDepartmentLevel.value && adminFacultyId.value) {
            params.level = 'Department'
            params.facultyId = adminFacultyId.value
        }

        const response = await eventAPI.getAll(params)
        events.value = response.data || []
        // message.success(`Đã tải ${response.count} sự kiện`)
    } catch (error) {
        message.error('Lỗi khi tải dữ liệu: ' + error.message)
    } finally {
        loading.value = false
    }
}

const renderChart = () => {
    if (!chartCanvas.value) return
    
    if (chartInstance.value) {
        chartInstance.value.destroy()
    }
    
    // Group events by month
    const stats = {}
    events.value.forEach(e => {
        const date = new Date(e.eventDate)
        const key = `${date.getMonth() + 1}/${date.getFullYear()}`
        stats[key] = (stats[key] || 0) + 1
    })
    
    const labels = Object.keys(stats).sort((a, b) => {
        const [m1, y1] = a.split('/').map(Number)
        const [m2, y2] = b.split('/').map(Number)
        return y1 - y2 || m1 - m2
    })
    
    const data = labels.map(l => stats[l])
    
    chartInstance.value = new Chart(chartCanvas.value, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Số lượng sự kiện',
                data,
                backgroundColor: '#18a058',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Thống kê sự kiện theo tháng' }
            }
        }
    })
}

watch(activeTab, async (newTab) => {
    if (newTab === 'stats') {
        // Fetch active events for stats if needed, or just use current
        if (events.value.length === 0) await fetchEvents()
        setTimeout(renderChart, 100)
    } else {
        fetchEvents()
    }
})

const fetchCriteria = async () => {
    try {
        const response = await criteriaAPI.getAll()
        criteria.value = response.data || []
    } catch (error) {
        message.error('Lỗi khi tải danh sách tiêu chí: ' + error.message)
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

const fetchClasses = async () => {
    try {
        const response = await classAPI.getAll()
        classes.value = response.data || []
    } catch (error) {
        message.error('Lỗi khi tải danh sách lớp: ' + error.message)
    }
}

const fetchSemesters = async () => {
    try {
        const response = await semesterAPI.getAll()
        semesters.value = response.data || []
    } catch (error) {
        message.error('Lỗi khi tải danh sách học kỳ: ' + error.message)
    }
}

// CRUD operations
const handleCreate = () => {
    // Kiểm tra nếu bí thư khoa chưa được gán khoa
    if (isDepartmentLevel.value && !adminFacultyId.value) {
        message.error('Tài khoản của bạn chưa được gán khoa. Vui lòng liên hệ quản trị viên!')
        return
    }
    
    isEdit.value = false
    currentEvent.value = null
    
    // Xác định organizerType mặc định dựa theo quyền
    let defaultOrganizerType = 'school'
    if (isDepartmentLevel.value) {
        defaultOrganizerType = 'faculty' // Bí thư khoa mặc định tạo sự kiện khoa
    }
    
    formValue.value = {
        eventName: '',
        description: '',
        criteria: null,
        score: null,
        eventDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        semester: null,
        // academicYear: '',
        organizerType: defaultOrganizerType,
        organizer: null,
        targetClass: null,
        // Bí thư khoa tự động chọn khoa của mình
        targetFaculty: isDepartmentLevel.value ? adminFacultyId.value : null,
        maxParticipants: null,
        location: '',
        note: '',
        image: null,
        fileList: []
    }
    showModal.value = true
}

const handleEdit = (event) => {
    isEdit.value = true
    currentEvent.value = event
    formValue.value = {
        eventName: event.eventName,
        description: event.description,
        criteria: event.criteria?._id || null,
        score: event.score,
        eventDate: new Date(event.eventDate).getTime(),
        endDate: event.endDate ? new Date(event.endDate).getTime() : null,
        startTime: event.startTime,
        endTime: event.endTime,
        semester: event.semester?._id || event.semester,
        // academicYear: event.academicYear,
        organizerType: event.organizerType,
        organizer: event.organizer?._id || null,
        targetClass: event.targetClass?._id || null,
        targetFaculty: event.targetFaculty?._id || null,
        maxParticipants: event.maxParticipants,
        location: event.location,
        note: event.note,
        image: event.image,
        fileList: event.image ? [{
            id: 'existing',
            name: 'Ảnh hiện tại',
            status: 'finished',
            url: `http://localhost:3000/${event.image}`
        }] : []
    }
    showModal.value = true
}



const handleCancel = async (event) => {
    try {
        await eventAPI.cancel(event._id)
        message.success('Đã hủy sự kiện và gửi email thông báo')
        fetchEvents()
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    }
}

const handleRestore = async (id) => {
    try {
        await eventAPI.restore(id)
        message.success('Khôi phục sự kiện thành công')
        fetchEvents()
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    }
}

const handleSubmit = async () => {
    // Validate các trường cơ bản
    if (!formValue.value.eventName ||
        !formValue.value.criteria || !formValue.value.score ||
        !formValue.value.eventDate || !formValue.value.endDate || !formValue.value.semester) {
        message.error('Vui lòng nhập đầy đủ thông tin bắt buộc')
        return
    }

    // Validate theo loại sự kiện
    if (formValue.value.organizerType === 'faculty') {
        if (!formValue.value.targetFaculty) {
            message.error('Vui lòng chọn khoa mục tiêu cho sự kiện cấp khoa')
            return
        }
    }

    if (formValue.value.organizerType === 'class') {
        if (!formValue.value.targetFaculty || !formValue.value.targetClass) {
            message.error('Vui lòng chọn khoa và lớp mục tiêu cho sự kiện cấp lớp')
            return
        }
    }

    // Kiểm tra quyền bí thư khoa
    if (isDepartmentLevel.value) {
        // Không được tạo sự kiện cấp trường
        if (formValue.value.organizerType === 'school') {
            message.error('Bí thư khoa không được tạo sự kiện cấp trường')
            return
        }
        // Chỉ được tạo sự kiện cho khoa của mình
        if (formValue.value.targetFaculty !== adminFacultyId.value) {
            message.error('Bạn chỉ được tạo sự kiện cho khoa của mình')
            return
        }
    }

    formLoading.value = true
    try {
        // Chuẩn bị dữ liệu gửi đi (FormData)
        const formData = new FormData()
        formData.append('eventName', formValue.value.eventName)
        if (formValue.value.description) formData.append('description', formValue.value.description)
        formData.append('criteria', formValue.value.criteria)
        formData.append('score', formValue.value.score)
        formData.append('eventDate', new Date(formValue.value.eventDate).toISOString())
        if (formValue.value.endDate) formData.append('endDate', new Date(formValue.value.endDate).toISOString())
        if (formValue.value.startTime) formData.append('startTime', formValue.value.startTime)
        if (formValue.value.endTime) formData.append('endTime', formValue.value.endTime)
        formData.append('semester', formValue.value.semester)
        formData.append('organizerType', formValue.value.organizerType)
        if (formValue.value.maxParticipants) formData.append('maxParticipants', formValue.value.maxParticipants)
        if (formValue.value.location) formData.append('location', formValue.value.location)
        if (formValue.value.note) formData.append('note', formValue.value.note)
        if (adminData.value?._id) formData.append('createdBy', adminData.value._id)

        // Set organizer và target dựa vào organizerType
        if (formValue.value.organizerType === 'faculty') {
            formData.append('organizer', formValue.value.targetFaculty)
            formData.append('targetFaculty', formValue.value.targetFaculty)
        } else if (formValue.value.organizerType === 'class') {
            formData.append('organizer', formValue.value.targetClass)
            formData.append('targetClass', formValue.value.targetClass)
            formData.append('targetFaculty', formValue.value.targetFaculty)
        }

        // Append image if exists
        if (formValue.value.fileList.length > 0 && formValue.value.fileList[0].file) {
            formData.append('image', formValue.value.fileList[0].file)
        }

        if (isEdit.value) {
            await eventAPI.update(currentEvent.value._id, formData)
            message.success('Cập nhật sự kiện thành công')
        } else {
            await eventAPI.create(formData)
            message.success('Tạo sự kiện mới thành công')
        }
        
        showModal.value = false
        fetchEvents()
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    } finally {
        formLoading.value = false
    }
}

const handleApprove = async (id) => {
    try {
        // TODO: Replace with actual logged-in user ID
        await eventAPI.approve(id)
        message.success('Phê duyệt sự kiện thành công')
        fetchEvents()
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    }
}

const handleReject = async (id) => {
    // TODO: Show modal to input rejection reason
    const reason = 'Không đủ điều kiện' // Temporary
    try {
        // TODO: Replace with actual logged-in user ID
        await eventAPI.reject(id, reason)
        message.success('Từ chối sự kiện thành công')
        fetchEvents()
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    }
}

const handleDelete = async (id) => {
    try {
        await eventAPI.delete(id)
        message.success('Xóa sự kiện thành công')
        fetchEvents()
    } catch (error) {
        message.error('Lỗi khi xóa: ' + error.message)
    }
}

const handleViewStats = async (event) => {
    selectedEventForStats.value = event
    showStatsModal.value = true
    statsLoading.value = true
    attendancePassword.value = '' // Reset password

    try {
        // Fetch participants
        const result = await eventAPI.getParticipants(event._id)
        if (result.success) {
            eventParticipants.value = result.data
        }
        
        // Fetch attendance password
        const passResult = await eventAPI.getAttendanceInfo(event._id)
        if (passResult.success) {
            attendancePassword.value = passResult.data.attendancePassword
        }
    } catch (error) {
        message.error('Lỗi khi tải thông tin thống kê')
    } finally {
        statsLoading.value = false
    }
}

const handleExportAttendance = async (eventId) => {
    try {
        const blob = await eventAPI.exportAttendance(eventId)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `DanhSach_ThamGia_${selectedEventForStats.value.eventCode}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        message.success('Tải xuống thành công')
    } catch (error) {
        message.error('Lỗi khi tải xuống file Excel')
    }
}

const handleImportAttendance = async (eventId, { file }) => {
    try {
        const result = await eventAPI.importAttendance(eventId, file.file)
        if (result.success) {
            message.success(result.message)
            // Refresh list
            handleViewStats(selectedEventForStats.value)
        } else {
            message.error(result.message || 'Lỗi khi nhập file Excel')
        }
    } catch (error) {
        message.error('Lỗi khi nhập file Excel')
    }
}

// Xử lý khi thay đổi loại đơn vị tổ chức
const handleOrganizerTypeChange = (value) => {
    formValue.value.organizer = null
    formValue.value.targetClass = null
    // Bí thư khoa: giữ lại khoa của mình khi thay đổi loại sự kiện
    if (isDepartmentLevel.value) {
        formValue.value.targetFaculty = adminFacultyId.value
    } else {
        formValue.value.targetFaculty = null
    }
}

// Xử lý khi thay đổi khoa mục tiêu - reset lớp
const handleTargetFacultyChange = (value) => {
    formValue.value.targetClass = null
}

// Tự động điền khoa khi chọn lớp
const handleTargetClassChange = (classId) => {
    const selectedClass = classes.value.find(c => c._id === classId)
    if (selectedClass && selectedClass.faculty) {
        formValue.value.targetFaculty = selectedClass.faculty._id || selectedClass.faculty
    }
}

const clearFilters = () => {
    filterStatus.value = null
    filterSemester.value = null
    filterScope.value = null
    searchQuery.value = ''
    currentPage.value = 1
}

const handleFilterChange = () => {
    currentPage.value = 1
}

// Auto-fill endDate when eventDate is selected
watch(() => formValue.value.eventDate, (newVal) => {
    if (newVal && !formValue.value.endDate) {
        formValue.value.endDate = newVal
    }
})

// Load data
onMounted(async () => {
    // Refresh admin data để đảm bảo có thông tin khoa mới nhất
    await refreshAdminData()
    
    fetchCriteria()
    fetchFaculties()
    fetchClasses()
    fetchSemesters()
    fetchEvents()
})
</script>

<template>
<NSpace vertical :size="24">
    <!-- Cảnh báo nếu bí thư khoa chưa được gán khoa -->
    <NAlert 
        v-if="isDepartmentLevel && !adminFacultyId" 
        type="warning" 
        title="Chưa được gán khoa"
        closable
    >
        Tài khoản của bạn chưa được gán vào khoa nào. Bạn sẽ không thể tạo hoặc quản lý sự kiện. 
        Vui lòng liên hệ quản trị viên để được phân công.
    </NAlert>

    <!-- Header -->
    <NCard :bordered="false">
        <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
                <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    <i class="fa-solid fa-calendar-days mr-2 text-blue-600"></i>
                    Quản lý Sự kiện
                </h2>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                    Quản lý các sự kiện chấm điểm rèn luyện
                </p>
            </div>
            <NButton type="primary" size="large" @click="handleCreate">
                <template #icon>
                    <i class="fa-solid fa-plus"></i>
                </template>
                Tạo sự kiện mới
            </NButton>
        </div>
    </NCard>

    <!-- Search & Filters -->
    <NCard :bordered="false" title="Tìm kiếm & Bộ lọc">
        <NSpace vertical :size="16">
            <NInput
                v-model:value="searchQuery"
                placeholder="Tìm kiếm theo mã hoặc tên sự kiện..."
                clearable
                @update:value="handleFilterChange"
            >
                <template #prefix>
                    <i class="fa-solid fa-magnifying-glass text-slate-400"></i>
                </template>
            </NInput>

            <div class="flex flex-wrap gap-3 items-center">
                <NSelect
                    v-model:value="filterStatus"
                    :options="statusOptions"
                    placeholder="Lọc theo trạng thái"
                    clearable
                    style="min-width: 180px"
                    @update:value="handleFilterChange"
                />
                <NSelect
                    v-model:value="filterSemester"
                    :options="semesterOptions"
                    placeholder="Lọc theo học kỳ"
                    clearable
                    style="min-width: 150px"
                    @update:value="handleFilterChange"
                />
                <NSelect
                    v-model:value="filterScope"
                    :options="scopeOptions"
                    placeholder="Lọc theo phạm vi"
                    clearable
                    style="min-width: 150px"
                    @update:value="handleFilterChange"
                />
                <NButton @click="clearFilters" secondary>
                    <template #icon>
                        <i class="fa-solid fa-rotate-right"></i>
                    </template>
                    Đặt lại
                </NButton>
            </div>
        </NSpace>
    </NCard>

    <!-- Table -->
    <NCard :bordered="false">
        <template #header>
            <div class="flex items-center justify-between">
                <span>Danh sách sự kiện</span>
                <NTag type="info" size="small">
                    Tổng: {{ filteredEvents.length }} sự kiện
                </NTag>
            </div>
        </template>

        <NTabs type="line" v-model:value="activeTab" class="mb-4">
            <NTabPane name="active" tab="Đang hoạt động" />
            <NTabPane name="cancelled" tab="Đã hủy" />
        </NTabs>

        <NSpin :show="loading">
            <NDataTable
                :columns="columns"
                :data="paginatedEvents"
                :bordered="false"
                :single-line="false"
                striped
                size="small"
                :scroll-x="1600"
            />
            
            <NEmpty 
                v-if="!loading && filteredEvents.length === 0"
                description="Chưa có sự kiện nào"
                class="py-8"
            />

            <div v-if="filteredEvents.length > 0" class="flex justify-center mt-4">
                <NPagination
                    v-model:page="currentPage"
                    :page-count="totalPages"
                    :page-size="pageSize"
                    show-size-picker
                    :page-sizes="[10, 20, 50, 100]"
                    @update:page-size="(size) => { pageSize = size; currentPage = 1 }"
                />
            </div>
        </NSpin>
    </NCard>

    <!-- Form Modal -->
    <NModal
        v-model:show="showModal"
        preset="card"
        :title="isEdit ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'"
        style="width: 900px"
        :bordered="false"
        :segmented="{ content: true, footer: 'soft' }"
    >
        <NForm
            :model="formValue"
            label-placement="left"
            label-width="140"
            require-mark-placement="left"
        >
            <NFormItem label="Tên sự kiện" path="eventName" required>
                <NInput
                    v-model:value="formValue.eventName"
                    placeholder="VD: Hội thảo khoa học sinh viên"
                    maxlength="200"
                />
            </NFormItem>

            <NFormItem label="Mô tả" path="description">
                <NInput
                    v-model:value="formValue.description"
                    type="textarea"
                    placeholder="Mô tả chi tiết về sự kiện"
                    :rows="3"
                />
            </NFormItem>

            <NFormItem label="Hình ảnh" path="image">
                <NUpload
                    v-model:file-list="formValue.fileList"
                    list-type="image-card"
                    :max="1"
                    accept="image/*"
                >
                    <div>+ Tải ảnh</div>
                </NUpload>
            </NFormItem>

            <div class="grid grid-cols-2 gap-4">
                <NFormItem label="Tiêu chí" path="criteria" required>
                    <NSelect
                        v-model:value="formValue.criteria"
                        :options="criteriaOptions"
                        placeholder="Chọn tiêu chí chấm điểm"
                        filterable
                    />
                </NFormItem>

                <NFormItem label="Điểm" path="score" required>
                    <NInputNumber
                        v-model:value="formValue.score"
                        placeholder="Nhập điểm"
                        :min="0"
                        :max="100"
                        style="width: 100%"
                    />
                </NFormItem>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <NFormItem label="Ngày bắt đầu" path="eventDate" required>
                    <NDatePicker
                        v-model:value="formValue.eventDate"
                        type="date"
                        placeholder="Chọn ngày bắt đầu"
                        style="width: 100%"
                    />
                </NFormItem>

                <NFormItem label="Ngày kết thúc" path="endDate" required>
                    <NDatePicker
                        v-model:value="formValue.endDate"
                        type="date"
                        placeholder="Chọn ngày kết thúc"
                        style="width: 100%"
                    />
                </NFormItem>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <NFormItem label="Giờ bắt đầu" path="startTime">
                    <NTimePicker
                        v-model:formatted-value="formValue.startTime"
                        value-format="HH:mm"
                        format="HH:mm"
                        placeholder="Chọn giờ bắt đầu"
                        style="width: 100%"
                    />
                </NFormItem>

                <NFormItem label="Giờ kết thúc" path="endTime">
                    <NTimePicker
                        v-model:formatted-value="formValue.endTime"
                        value-format="HH:mm"
                        format="HH:mm"
                        placeholder="Chọn giờ kết thúc"
                        style="width: 100%"
                    />
                </NFormItem>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <NFormItem label="Học kỳ" path="semester" required>
                    <NSelect
                        v-model:value="formValue.semester"
                        :options="semesterOptions"
                        placeholder="Chọn học kỳ"
                    />
                </NFormItem>

                <NFormItem label="Đơn vị tổ chức" path="organizerType" required>
                    <NSelect
                        v-model:value="formValue.organizerType"
                        :options="organizerTypeOptions"
                        placeholder="Chọn đơn vị"
                        @update:value="handleOrganizerTypeChange"
                    />
                </NFormItem>
            </div>

            <!-- Phạm vi sự kiện dựa theo đơn vị tổ chức -->
            <!-- Sự kiện cấp Khoa: cần chọn khoa mục tiêu -->
            <NFormItem 
                v-if="formValue.organizerType === 'faculty'" 
                label="Khoa mục tiêu" 
                path="targetFaculty"
                required
            >
                <NSelect
                    v-model:value="formValue.targetFaculty"
                    :options="facultyOptions"
                    placeholder="Chọn khoa (sinh viên khoa này mới tham gia được)"
                    filterable
                    :disabled="isDepartmentLevel"
                />
                <template v-if="isDepartmentLevel">
                    <span class="text-xs text-gray-500 mt-1">Bí thư khoa chỉ được tạo sự kiện cho khoa của mình</span>
                </template>
            </NFormItem>

            <!-- Sự kiện cấp Lớp: cần chọn khoa và lớp mục tiêu -->
            <div v-if="formValue.organizerType === 'class'" class="grid grid-cols-2 gap-4">
                <NFormItem 
                    label="Khoa mục tiêu" 
                    path="targetFaculty"
                    required
                >
                    <NSelect
                        v-model:value="formValue.targetFaculty"
                        :options="facultyOptions"
                        placeholder="Chọn khoa"
                        filterable
                        :disabled="isDepartmentLevel"
                        @update:value="handleTargetFacultyChange"
                    />
                </NFormItem>

                <NFormItem 
                    label="Lớp mục tiêu" 
                    path="targetClass"
                    required
                >
                    <NSelect
                        v-model:value="formValue.targetClass"
                        :options="filteredClassOptions"
                        placeholder="Chọn lớp (sinh viên lớp này mới tham gia được)"
                        filterable
                        :disabled="!formValue.targetFaculty"
                        @update:value="handleTargetClassChange"
                    />
                </NFormItem>
            </div>

            <!-- Đơn vị tổ chức (organizer) - có thể khác với phạm vi mục tiêu -->
            <NFormItem 
                v-if="formValue.organizerType === 'faculty'" 
                label="Khoa tổ chức" 
                path="organizer"
            >
                <NSelect
                    v-model:value="formValue.organizer"
                    :options="facultyOptions"
                    placeholder="Chọn khoa tổ chức (thường trùng với khoa mục tiêu)"
                    filterable
                />
            </NFormItem>

            <NFormItem 
                v-if="formValue.organizerType === 'class'" 
                label="Lớp tổ chức" 
                path="organizer"
            >
                <NSelect
                    v-model:value="formValue.organizer"
                    :options="filteredClassOptions"
                    placeholder="Chọn lớp tổ chức (thường trùng với lớp mục tiêu)"
                    filterable
                    :disabled="!formValue.targetFaculty"
                />
            </NFormItem>

            <div class="grid grid-cols-2 gap-4">
                <NFormItem label="Số lượng tối đa" path="maxParticipants">
                    <NInputNumber
                        v-model:value="formValue.maxParticipants"
                        placeholder="Không giới hạn"
                        :min="1"
                        style="width: 100%"
                    />
                </NFormItem>

                <NFormItem label="Địa điểm" path="location">
                    <NInput
                        v-model:value="formValue.location"
                        placeholder="VD: Hội trường A"
                        maxlength="200"
                    />
                </NFormItem>
            </div>

            <NFormItem label="Ghi chú" path="note">
                <NInput
                    v-model:value="formValue.note"
                    type="textarea"
                    placeholder="Ghi chú thêm"
                    :rows="2"
                />
            </NFormItem>
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

    <!-- Statistics Modal -->
    <NModal
        v-model:show="showStatsModal"
        preset="card"
        title="Thống kê sự kiện"
        style="width: 800px; max-width: 90%"
    >
        <div v-if="selectedEventForStats">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <NCard size="small" class="bg-blue-50 dark:bg-blue-900/20">
                    <div class="text-center">
                        <div class="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">Tổng tham gia</div>
                        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {{ eventParticipants.length }}
                        </div>
                    </div>
                </NCard>
                <NCard size="small" class="bg-green-50 dark:bg-green-900/20">
                    <div class="text-center">
                        <div class="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">Điểm rèn luyện</div>
                        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                            {{ selectedEventForStats.score }}
                        </div>
                    </div>
                </NCard>
                <NCard size="small" class="bg-purple-50 dark:bg-purple-900/20">
                    <div class="text-center">
                        <div class="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">Trạng thái</div>
                        <div class="text-lg font-bold mt-1">
                            <NTag :type="selectedEventForStats.isActive ? 'success' : 'error'" size="small">
                                {{ selectedEventForStats.isActive ? 'Đang hoạt động' : 'Đã hủy' }}
                            </NTag>
                        </div>
                    </div>
                </NCard>
            </div>

            <div class="flex justify-between items-center mb-3">
                <h3 class="font-bold">Danh sách sinh viên tham gia</h3>
                <div class="flex gap-2">
                    <NButton size="small" type="primary" @click="handleExportAttendance(selectedEventForStats._id)">
                        <template #icon><i class="fa-solid fa-download"></i></template>
                        Xuất Excel
                    </NButton>
                    <NUpload
                        :show-file-list="false"
                        @change="(options) => handleImportAttendance(selectedEventForStats._id, options)"
                        accept=".xlsx, .xls"
                    >
                        <NButton size="small" type="info">
                            <template #icon><i class="fa-solid fa-upload"></i></template>
                            Nhập Excel
                        </NButton>
                    </NUpload>
                </div>
            </div>
            
            <div v-if="attendancePassword" class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-yellow-800 dark:text-yellow-200">Mật khẩu điểm danh:</span>
                    <span class="font-mono text-lg bg-white dark:bg-black px-2 py-0.5 rounded border">{{ attendancePassword }}</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">Cung cấp mật khẩu này cho người phụ trách điểm danh.</div>
            </div>

            <NDataTable
                :columns="[
                    { title: 'STT', key: 'index', width: 60, render: (_, index) => index + 1 },
                    { title: 'MSSV', key: 'student.studentCode' },
                    { title: 'Họ tên', key: 'student.fullName', render: (row) => `${row.student?.lastName} ${row.student?.firstName}` },
                    { title: 'Lớp', key: 'student.class.classCode' },
                    { title: 'Khoa', key: 'student.faculty.facultyCode' },
                    { title: 'Điểm danh', key: 'status', align: 'center', render: (row) => {
                        if (row.status === 'attended') return h(NTag, { type: 'success', size: 'small' }, { default: () => 'Đã tham gia' })
                        return h(NTag, { type: 'error', size: 'small' }, { default: () => 'Chưa tham gia' })
                    }},
                    { title: 'Thời gian', key: 'attendedAt', render: (row) => row.attendedAt ? new Date(row.attendedAt).toLocaleString('vi-VN') : '-' }
                ]"
                :data="eventParticipants"
                :loading="statsLoading"
                :pagination="{ pageSize: 10 }"
                size="small"
                max-height="400"
            />
        </div>
    </NModal>
</NSpace>
</template>

<style scoped>
@reference "../../style.css";

:deep(.n-data-table-th) {
    @apply font-semibold bg-slate-50 dark:bg-slate-800;
}
</style>
