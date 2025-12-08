<template>
    <div class="admin-management">
        <n-card title="Quản lý Bí thư Đoàn">
            <template #header-extra>
                <n-space>
                    <n-button type="primary" @click="showAddModal">
                        + Thêm Bí thư
                    </n-button>
                </n-space>
            </template>

            <!-- Filters -->
            <n-space class="mb-4" align="center">
                <n-select
                    v-model:value="filterLevel"
                    :options="levelOptions"
                    placeholder="Lọc theo cấp"
                    clearable
                    style="width: 200px"
                    @update:value="loadAdmins"
                />
                <n-select
                    v-model:value="filterFaculty"
                    :options="facultyOptions"
                    placeholder="Lọc theo khoa"
                    clearable
                    style="width: 250px"
                    @update:value="loadAdmins"
                    :disabled="filterLevel === 'University'"
                />
            </n-space>

            <!-- Admin Table -->
            <n-data-table
                :columns="columns"
                :data="admins"
                :loading="loading"
                :pagination="pagination"
                :row-key="row => row._id"
            />
        </n-card>

        <!-- Add/Edit Modal -->
        <n-modal
            v-model:show="showModal"
            :title="isEditing ? 'Chỉnh sửa Bí thư' : 'Thêm Bí thư mới'"
            preset="card"
            style="width: 600px"
            :mask-closable="false"
        >
            <n-form
                ref="formRef"
                :model="adminForm"
                :rules="formRules"
                label-placement="left"
                label-width="140"
            >

                <n-form-item label="Họ và tên" path="fullName">
                    <n-input v-model:value="adminForm.fullName" placeholder="Nhập họ và tên" />
                </n-form-item>

                <n-form-item label="Email" path="email">
                    <n-input v-model:value="adminForm.email" placeholder="Nhập email" />
                </n-form-item>

                <n-form-item label="Số điện thoại" path="phone">
                    <n-input v-model:value="adminForm.phone" placeholder="Nhập số điện thoại" />
                </n-form-item>

                <n-form-item label="Cấp quản lý" path="level">
                    <n-select
                        v-model:value="adminForm.level"
                        :options="levelOptions"
                        placeholder="Chọn cấp"
                        @update:value="onLevelChange"
                    />
                </n-form-item>

                <n-form-item 
                    v-if="adminForm.level === 'Department'" 
                    label="Khoa" 
                    path="faculty"
                >
                    <n-select
                        v-model:value="adminForm.faculty"
                        :options="facultyOptions"
                        placeholder="Chọn khoa"
                    />
                </n-form-item>
            </n-form>

            <template #footer>
                <n-space justify="end">
                    <n-button @click="showModal = false">Hủy</n-button>
                    <n-button type="primary" @click="handleSubmit" :loading="submitting">
                        {{ isEditing ? 'Cập nhật' : 'Thêm mới' }}
                    </n-button>
                </n-space>
            </template>
        </n-modal>

        <!-- View Details Modal -->
        <n-modal
            v-model:show="showDetailModal"
            title="Chi tiết Bí thư"
            preset="card"
            style="width: 600px"
        >
            <n-descriptions bordered :column="1" v-if="selectedAdmin">
                <n-descriptions-item label="Mã Bí thư">
                    {{ selectedAdmin.adminCode }}
                </n-descriptions-item>
                <n-descriptions-item label="Họ và tên">
                    {{ selectedAdmin.fullName }}
                </n-descriptions-item>
                <n-descriptions-item label="Email">
                    {{ selectedAdmin.email }}
                </n-descriptions-item>
                <n-descriptions-item label="Số điện thoại">
                    {{ selectedAdmin.phoneNumber }}
                </n-descriptions-item>
                <n-descriptions-item label="Cấp quản lý">
                    <n-tag :type="selectedAdmin.level === 'University' ? 'success' : 'info'">
                        {{ selectedAdmin.level === 'University' ? 'Cấp Trường' : 'Cấp Khoa' }}
                    </n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="Khoa" v-if="selectedAdmin.level === 'Department'">
                    {{ selectedAdmin.faculty?.facultyName || selectedAdmin.faculty?.name || 'N/A' }}
                </n-descriptions-item>
                <n-descriptions-item label="Trạng thái">
                    <n-tag :type="selectedAdmin.isActive ? 'success' : 'error'">
                        {{ selectedAdmin.isActive ? 'Hoạt động' : 'Không hoạt động' }}
                    </n-tag>
                </n-descriptions-item>
            </n-descriptions>
        </n-modal>
    </div>
</template>

<script setup>
import { ref, h, onMounted, computed } from 'vue';
import { 
    NButton, NSpace, NTag, NIcon, NCard, NDataTable, NModal, NForm, NFormItem, 
    NInput, NSelect, NDescriptions, NDescriptionsItem,
    useMessage, useDialog 
} from 'naive-ui';
import { adminAPI, facultyAPI } from '../../services/api';

const message = useMessage();
const dialog = useDialog();

// State
const loading = ref(false);
const submitting = ref(false);
const admins = ref([]);
const faculties = ref([]);
const showModal = ref(false);
const showDetailModal = ref(false);
const isEditing = ref(false);
const selectedAdmin = ref(null);
const formRef = ref(null);

// Filters
const filterLevel = ref(null);
const filterFaculty = ref(null);

// Form
const adminForm = ref({
    fullName: '',
    email: '',
    phone: '',
    level: 'Department',
    faculty: null,
});

const defaultForm = {
    fullName: '',
    email: '',
    phone: '',
    level: 'Department',
    faculty: null,
};

// Options
const levelOptions = [
    { label: 'Cấp Khoa', value: 'Department' },
    { label: 'Cấp Trường', value: 'University' },
];

const facultyOptions = computed(() => {
    return faculties.value.map(f => ({
        label: f.facultyName || f.name,
        value: f._id,
    }));
});

// Form Rules
const formRules = {
    fullName: [
        { required: true, message: 'Vui lòng nhập họ và tên', trigger: 'blur' },
    ],
    email: [
        { required: true, message: 'Vui lòng nhập email', trigger: 'blur' },
        { type: 'email', message: 'Email không hợp lệ', trigger: 'blur' },
    ],
    phone: [
        { required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' },
        { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số', trigger: 'blur' },
    ],
    level: [
        { required: true, message: 'Vui lòng chọn cấp quản lý', trigger: 'change' },
    ],
    faculty: [
        { 
            required: true, 
            message: 'Vui lòng chọn khoa', 
            trigger: 'change',
            validator: (rule, value) => {
                if (adminForm.value.level === 'Department' && !value) {
                    return new Error('Bí thư cấp khoa phải chọn khoa');
                }
                return true;
            }
        },
    ],
};

// Pagination
const pagination = {
    pageSize: 10,
};

// Table Columns
const columns = [
    {
        title: 'MSCB',
        key: 'adminCode',
        width: 120,
    },
    {
        title: 'Họ và tên',
        key: 'fullName',
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
        key: 'level',
        width: 120,
        render: (row) => {
            return h(
                NTag,
                { type: row.level === 'University' ? 'success' : 'info', size: 'small' },
                { default: () => row.level === 'University' ? 'Trường' : 'Khoa' }
            );
        },
    },
    {
        title: 'Khoa',
        key: 'faculty',
        width: 180,
        render: (row) => {
            if (row.level === 'Department' && !row.faculty) {
                return h(
                    NTag,
                    { type: 'error', size: 'small' },
                    { default: () => 'Chưa gán khoa!' }
                );
            }
            return row.faculty?.facultyName || row.faculty?.name || 'N/A';
        },
    },
    {
        title: 'Trạng thái',
        key: 'isActive',
        width: 120,
        render: (row) => {
            return h(
                NTag,
                { type: row.isActive ? 'success' : 'error', size: 'small' },
                { default: () => row.isActive ? 'Hoạt động' : 'Vô hiệu' }
            );
        },
    },
    {
        title: 'Thao tác',
        key: 'actions',
        width: 180,
        render: (row) => {
            return h(
                NSpace,
                {},
                {
                    default: () => [
                        h(
                            NButton,
                            {
                                size: 'small',
                                type: 'info',
                                onClick: () => viewDetail(row),
                            },
                            { default: () => 'Xem' }
                        ),
                        h(
                            NButton,
                            {
                                size: 'small',
                                type: 'warning',
                                onClick: () => editAdmin(row),
                            },
                            { default: () => 'Sửa' }
                        ),
                        h(
                            NButton,
                            {
                                size: 'small',
                                type: 'error',
                                onClick: () => deleteAdmin(row),
                            },
                            { default: () => 'Xóa' }
                        ),
                    ],
                }
            );
        },
    },
];

// Methods
const loadAdmins = async () => {
    loading.value = true;
    try {
        let result;
        
        if (filterLevel.value && filterFaculty.value) {
            // Lọc theo cả level và faculty
            result = await adminAPI.getByFaculty(filterFaculty.value);
        } else if (filterLevel.value) {
            // Chỉ lọc theo level
            result = await adminAPI.getByLevel(filterLevel.value);
        } else if (filterFaculty.value) {
            // Chỉ lọc theo faculty
            result = await adminAPI.getByFaculty(filterFaculty.value);
        } else {
            // Không lọc
            result = await adminAPI.getAll();
        }
        
        if (result.success) {
            // Lọc chỉ hiển thị Bí thư Khoa (Department), không hiển thị Bí thư Trường
            admins.value = result.data.filter(admin => admin.level === 'Department');
        } else {
            message.error(result.message || 'Không thể tải danh sách bí thư');
        }
    } catch (error) {
        message.error('Lỗi khi tải danh sách bí thư');
        console.error(error);
    } finally {
        loading.value = false;
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

const onLevelChange = (value) => {
    if (value === 'University') {
        adminForm.value.faculty = null;
    }
};

const showAddModal = () => {
    isEditing.value = false;
    adminForm.value = { ...defaultForm };
    showModal.value = true;
};

const viewDetail = (admin) => {
    selectedAdmin.value = admin;
    showDetailModal.value = true;
};

const editAdmin = (admin) => {
    isEditing.value = true;
    adminForm.value = {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        level: admin.level,
        faculty: admin.faculty?._id || null,
    };
    showModal.value = true;
};

const handleSubmit = async () => {
    try {
        await formRef.value?.validate();
        
        submitting.value = true;
        
        // Split fullName into lastName and firstName
        const nameParts = adminForm.value.fullName.trim().split(' ');
        const firstName = nameParts.pop(); // Last word is firstName
        const lastName = nameParts.join(' '); // Everything else is lastName
        
        const data = {
            lastName: lastName || firstName, // If only one word, use it as lastName
            firstName: lastName ? firstName : '', // If only one word, firstName is empty
            email: adminForm.value.email,
            phone: adminForm.value.phone,
            level: adminForm.value.level,
            faculty: adminForm.value.level === 'Department' ? adminForm.value.faculty : undefined,
        };
        
        
        let result;
        if (isEditing.value) {
            result = await adminAPI.update(adminForm.value._id, data);
        } else {
            result = await adminAPI.create(data);
        }
        
        if (result.success) {
            message.success(isEditing.value ? 'Cập nhật thành công' : 'Thêm mới thành công');
            showModal.value = false;
            await loadAdmins();
        } else {
            message.error(result.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Validation error:', error);
    } finally {
        submitting.value = false;
    }
};

const deleteAdmin = (admin) => {
    dialog.warning({
        title: 'Xác nhận xóa',
        content: `Bạn có chắc chắn muốn xóa bí thư "${admin.fullName}"?`,
        positiveText: 'Xóa',
        negativeText: 'Hủy',
        onPositiveClick: async () => {
            try {
                const result = await adminAPI.delete(admin._id);
                if (result.success) {
                    message.success('Xóa thành công');
                    await loadAdmins();
                } else {
                    message.error(result.message || 'Không thể xóa');
                }
            } catch (error) {
                message.error('Lỗi khi xóa');
                console.error(error);
            }
        },
    });
};

// Lifecycle
onMounted(() => {
    loadFaculties();
    loadAdmins();
});
</script>

<style scoped>
.admin-management {
    padding: 20px;
}

.mb-4 {
    margin-bottom: 16px;
}
</style>
