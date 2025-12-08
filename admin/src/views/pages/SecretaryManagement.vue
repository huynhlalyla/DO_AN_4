<template>
    <div class="p-6">
        <n-card title="Quản lý Bí thư Đoàn" :bordered="false">
            <!-- Filters -->
            <div class="flex gap-3 mb-4">
                <n-select
                    v-model:value="filterType"
                    :options="typeOptions"
                    placeholder="Lọc theo cấp"
                    style="width: 200px"
                    clearable
                />
                <n-select
                    v-if="isUniversity && filterType === 'class'"
                    v-model:value="filterFaculty"
                    :options="facultyOptions"
                    placeholder="Lọc theo khoa"
                    style="width: 200px"
                    clearable
                />
            </div>

            <!-- Table -->
            <n-data-table
                :columns="columns"
                :data="filteredSecretaries"
                :pagination="pagination"
                :loading="loading"
            />
        </n-card>

        <!-- Detail Modal -->
        <n-modal
            v-model:show="showDetailModal"
            title="Chi tiết Bí thư"
            preset="card"
            style="width: 600px"
        >
            <n-descriptions bordered :column="1" v-if="selectedSecretary">
                <n-descriptions-item :label="selectedSecretary.type === 'faculty' ? 'Mã Bí thư' : 'Mã sinh viên'">
                    {{ selectedSecretary.code }}
                </n-descriptions-item>
                <n-descriptions-item label="Họ và tên">
                    {{ selectedSecretary.name }}
                </n-descriptions-item>
                <n-descriptions-item label="Email">
                    {{ selectedSecretary.email }}
                </n-descriptions-item>
                <n-descriptions-item label="Số điện thoại">
                    {{ selectedSecretary.phone }}
                </n-descriptions-item>
                <n-descriptions-item label="Cấp">
                    <n-tag :type="selectedSecretary.type === 'faculty' ? 'success' : 'info'">
                        {{ selectedSecretary.type === 'faculty' ? 'Bí thư Khoa' : 'Bí thư Lớp' }}
                    </n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="Khoa">
                    {{ selectedSecretary.facultyName }}
                </n-descriptions-item>
                <n-descriptions-item v-if="selectedSecretary.type === 'class'" label="Lớp">
                    {{ selectedSecretary.className }}
                </n-descriptions-item>
            </n-descriptions>
        </n-modal>
    </div>
</template>

<script setup>
import { ref, h, onMounted, computed } from 'vue';
import { 
    NCard, NButton, NSpace, NTag, NDataTable, NModal, NDescriptions, NDescriptionsItem, 
    NSelect, NPopconfirm, useMessage, useDialog 
} from 'naive-ui';
import { adminAPI, studentAPI, facultyAPI } from '../../services/api';

const message = useMessage();
const dialog = useDialog();

// State
const loading = ref(false);
const admins = ref([]);
const students = ref([]);
const faculties = ref([]);
const showDetailModal = ref(false);
const selectedSecretary = ref(null);
const filterType = ref(null);
const filterFaculty = ref(null);

// User info
const userInfo = computed(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    return userData;
});

const isUniversity = computed(() => userInfo.value.level === 'University');
const userFacultyId = computed(() => {
    // Handle both object and string faculty ID
    const faculty = userInfo.value.faculty;
    return faculty?._id || faculty;
});

// Type options
const typeOptions = computed(() => {
    const options = [];
    if (isUniversity.value) {
        options.push({ label: 'Bí thư Khoa', value: 'faculty' });
    }
    options.push({ label: 'Bí thư Lớp', value: 'class' });
    return options;
});

// Faculty options
const facultyOptions = computed(() => {
    return faculties.value.map(f => ({
        label: f.facultyName || f.name,
        value: f._id,
    }));
});

// Pagination
const pagination = {
    pageSize: 10,
};

// Prepare data for display
const secretaries = computed(() => {
    const result = [];

    // Add faculty secretaries (Admin Department) - only for University admin
    if (isUniversity.value) {
        admins.value.forEach(admin => {
            if (admin.level === 'Department') {
                result.push({
                    type: 'faculty',
                    _id: admin._id,
                    code: admin.adminCode,
                    name: admin.fullName,
                    email: admin.email,
                    phone: admin.phoneNumber,
                    facultyId: admin.faculty?._id || admin.faculty,
                    facultyName: admin.faculty?.facultyName || admin.faculty?.name || 'N/A',
                    className: '-'
                });
            }
        });
    }

    // Add class secretaries (Student isSecretary)
    students.value.forEach(student => {
        if (student.isSecretary) {
            // Filter by faculty for Department admin
            if (!isUniversity.value) {
                const studentFacultyId = student.faculty?._id || student.faculty;
                console.log('Checking student:', {
                    name: student.fullName,
                    studentFacultyId,
                    userFacultyId: userFacultyId.value,
                    match: studentFacultyId === userFacultyId.value
                });
                if (studentFacultyId !== userFacultyId.value) {
                    return;
                }
            }
            
            result.push({
                type: 'class',
                _id: student._id,
                code: student.studentCode,
                name: student.fullName,
                email: student.email,
                phone: student.phoneNumber,
                facultyId: student.faculty?._id || student.faculty,
                facultyName: student.faculty?.facultyName || student.faculty?.name || 'N/A',
                className: student.class?.className || student.class?.name || 'N/A'
            });
        }
    });

    return result;
});

// Filtered secretaries
const filteredSecretaries = computed(() => {
    let result = secretaries.value;

    if (filterType.value) {
        result = result.filter(s => s.type === filterType.value);
    }

    if (filterFaculty.value) {
        result = result.filter(s => s.facultyId === filterFaculty.value);
    }

    return result;
});

// Table Columns
const columns = [
    {
        title: 'Mã số',
        key: 'code',
        width: 120,
    },
    {
        title: 'Họ và tên',
        key: 'name',
        ellipsis: {
            tooltip: true,
        },
    },
    {
        title: 'Email',
        key: 'email',
        ellipsis: {
            tooltip: true,
        },
    },
    {
        title: 'Cấp',
        key: 'type',
        width: 130,
        render(row) {
            return h(
                NTag,
                { type: row.type === 'faculty' ? 'success' : 'info' },
                { default: () => row.type === 'faculty' ? 'Bí thư Khoa' : 'Bí thư Lớp' }
            );
        },
    },
    {
        title: 'Khoa',
        key: 'facultyName',
        ellipsis: {
            tooltip: true,
        },
    },
    {
        title: 'Lớp',
        key: 'className',
        width: 120,
    },
    {
        title: 'Thao tác',
        key: 'actions',
        width: 150,
        render(row) {
            return h(
                NSpace,
                { size: 8 },
                {
                    default: () => [
                        h(
                            NButton,
                            {
                                size: 'small',
                                onClick: () => viewDetail(row),
                            },
                            { default: () => 'Xem' }
                        ),
                        h(
                            NPopconfirm,
                            {
                                onPositiveClick: () => deleteSecretary(row),
                            },
                            {
                                trigger: () => h(
                                    NButton,
                                    {
                                        size: 'small',
                                        type: 'error',
                                    },
                                    { default: () => 'Xóa' }
                                ),
                                default: () => `Bạn có chắc muốn xóa Bí thư "${row.name}"?`
                            }
                        )
                    ]
                }
            );
        },
    },
];

// Load data
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

const loadFaculties = async () => {
    try {
        const result = await facultyAPI.getAll();
        if (result.success) {
            faculties.value = result.data;
        }
    } catch (error) {
        console.error('Error loading faculties:', error);
    }
};

const loadData = async () => {
    loading.value = true;
    await Promise.all([
        isUniversity.value ? loadAdmins() : Promise.resolve(),
        loadStudents(),
        loadFaculties()
    ]);
    loading.value = false;
};

// View detail
const viewDetail = (secretary) => {
    selectedSecretary.value = secretary;
    showDetailModal.value = true;
};

// Delete secretary
const deleteSecretary = async (secretary) => {
    try {
        let result;
        if (secretary.type === 'faculty') {
            // Xóa Admin (Bí thư Khoa)
            result = await adminAPI.delete(secretary._id);
        } else {
            // Xóa Student isSecretary (Bí thư Lớp) - chỉ bỏ quyền bí thư
            result = await studentAPI.updateSecretary(secretary._id, false);
        }

        if (result.success) {
            message.success('Đã xóa Bí thư thành công');
            await loadData();
        } else {
            message.error(result.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        message.error('Lỗi khi xóa: ' + error.message);
    }
};

onMounted(() => {
    loadData();
});
</script>
