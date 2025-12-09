<template>
    <div class="max-w-full flex justify-center items-center mx-auto p-6">
        <div>
            <n-card :bordered="false" class="shadow-sm rounded-xl">
                <template #header>
                    <div class="flex items-center gap-4">
                        <n-avatar 
                            round 
                            :size="64" 
                            :style="{ backgroundColor: '#2563eb', fontSize: '24px' }"
                        >
                            {{ userInitials }}
                        </n-avatar>
                        <div>
                            <h2 class="text-xl font-bold">Thông tin cá nhân</h2>
                            <p class="text-gray-500 text-sm">Quản lý thông tin và bảo mật tài khoản</p>
                        </div>
                    </div>
                </template>

                <n-spin :show="loading">
                    <n-form
                        ref="formRef"
                        :model="formValue"
                        :rules="rules"
                        label-placement="left"
                        label-width="140"
                        require-mark-placement="right-hanging"
                        size="medium"
                    >
                        <!-- Read-only Info -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <n-form-item label="Mã sinh viên" :show-feedback="false">
                                <span class="font-semibold">{{ formValue.studentCode }}</span>
                            </n-form-item>
                            <n-form-item label="Lớp" :show-feedback="false">
                                <span class="font-semibold">{{ formValue.className }}</span>
                            </n-form-item>
                            <n-form-item label="Khoa" :show-feedback="false">
                                <span class="font-semibold">{{ formValue.facultyName }}</span>
                            </n-form-item>
                            <n-form-item label="Chức vụ" :show-feedback="false">
                                <n-tag :type="formValue.isSecretary ? 'warning' : 'default'" size="small">
                                    {{ formValue.isSecretary ? 'Bí thư lớp' : 'Sinh viên' }}
                                </n-tag>
                            </n-form-item>
                        </div>

                        <n-divider title-placement="left">Thông tin cơ bản</n-divider>

                        <!-- Editable Info -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                            <n-form-item label="Họ đệm" path="lastName">
                                <n-input v-model:value="formValue.lastName" placeholder="Nhập họ đệm" />
                            </n-form-item>
                            
                            <n-form-item label="Tên" path="firstName">
                                <n-input v-model:value="formValue.firstName" placeholder="Nhập tên" />
                            </n-form-item>

                            <n-form-item label="Giới tính" path="gender">
                                <n-radio-group v-model:value="formValue.gender" name="gender">
                                    <n-space>
                                        <n-radio value="Nam">Nam</n-radio>
                                        <n-radio value="Nữ">Nữ</n-radio>
                                        <n-radio value="Khác">Khác</n-radio>
                                    </n-space>
                                </n-radio-group>
                            </n-form-item>

                            <n-form-item label="Ngày sinh" path="dateOfBirth">
                                <n-date-picker 
                                    v-model:value="formValue.dateOfBirth" 
                                    type="date" 
                                    format="dd/MM/yyyy"
                                    class="w-full"
                                />
                            </n-form-item>
                        </div>

                        <n-form-item label="Email" path="email" class="mt-2">
                            <n-input v-model:value="formValue.email" placeholder="example@student.edu.vn" disabled />
                        </n-form-item>

                        <div class="flex justify-center mt-6">
                            <n-button type="primary" @click="handleSave" :loading="submitting" class="px-8">
                                <template #icon>
                                    <i class="fa-solid fa-save"></i>
                                </template>
                                Lưu thay đổi
                            </n-button>
                        </div>
                    </n-form>
                </n-spin>
            </n-card>

            <!-- Change Password Card -->
            <n-card title="Đổi mật khẩu" :bordered="false" class="shadow-sm rounded-xl mt-6">
                <n-form
                    ref="passwordFormRef"
                    :model="passwordForm"
                    :rules="passwordRules"
                    label-placement="left"
                    label-width="140"
                    require-mark-placement="right-hanging"
                    size="medium"
                >
                    <div class="max-w-xl mx-auto">
                        <n-form-item label="Mật khẩu hiện tại" path="oldPassword">
                            <n-input
                                v-model:value="passwordForm.oldPassword"
                                type="password"
                                show-password-on="click"
                                placeholder="Nhập mật khẩu hiện tại"
                            />
                        </n-form-item>

                        <n-form-item label="Mật khẩu mới" path="newPassword">
                            <n-input
                                v-model:value="passwordForm.newPassword"
                                type="password"
                                show-password-on="click"
                                placeholder="Nhập mật khẩu mới"
                            />
                        </n-form-item>

                        <n-form-item label="Xác nhận mật khẩu" path="confirmPassword">
                            <n-input
                                v-model:value="passwordForm.confirmPassword"
                                type="password"
                                show-password-on="click"
                                placeholder="Nhập lại mật khẩu mới"
                            />
                        </n-form-item>

                        <div class="flex justify-end mt-4">
                            <n-button type="warning" @click="handleChangePassword" :loading="passwordSubmitting">
                                <template #icon>
                                    <i class="fa-solid fa-key"></i>
                                </template>
                                Đổi mật khẩu
                            </n-button>
                        </div>
                    </div>
                </n-form>
            </n-card>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useMessage } from 'naive-ui';
import { studentAPI, authAPI } from '../services/api';
import { 
    NCard, NForm, NFormItem, NInput, NButton, NSpin, NDivider, 
    NRadioGroup, NRadio, NSpace, NDatePicker, NTag, NAvatar 
} from 'naive-ui';

const message = useMessage();
const formRef = ref(null);
const passwordFormRef = ref(null);
const loading = ref(false);
const submitting = ref(false);
const passwordSubmitting = ref(false);

const userData = JSON.parse(localStorage.getItem('userData') || '{}');

const formValue = ref({
    studentCode: '',
    lastName: '',
    firstName: '',
    gender: 'Nam',
    dateOfBirth: null,
    email: '',
    className: '',
    facultyName: '',
    isSecretary: false
});

const userInitials = computed(() => {
    const name = `${formValue.value.lastName} ${formValue.value.firstName}`.trim();
    if (!name) return 'SV';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
});

const passwordForm = ref({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const rules = {
    lastName: { required: true, message: 'Vui lòng nhập họ đệm', trigger: 'blur' },
    firstName: { required: true, message: 'Vui lòng nhập tên', trigger: 'blur' },
    gender: { required: true, message: 'Vui lòng chọn giới tính', trigger: 'change' },
    dateOfBirth: { required: true, type: 'number', message: 'Vui lòng chọn ngày sinh', trigger: 'change' },
    email: { required: true, message: 'Vui lòng nhập email', trigger: 'blur' }
};

const passwordRules = {
    oldPassword: { required: true, message: 'Vui lòng nhập mật khẩu hiện tại', trigger: 'blur' },
    newPassword: { required: true, message: 'Vui lòng nhập mật khẩu mới', trigger: 'blur' },
    confirmPassword: {
        required: true,
        validator: (rule, value) => {
            if (!value) return new Error('Vui lòng xác nhận mật khẩu');
            if (value !== passwordForm.value.newPassword) return new Error('Mật khẩu xác nhận không khớp');
            return true;
        },
        trigger: 'blur'
    }
};

const fetchProfile = async () => {
    if (!userData._id) return;
    
    loading.value = true;
    try {
        const response = await studentAPI.getById(userData._id);
        const student = response.data;
        
        formValue.value = {
            studentCode: student.studentCode,
            lastName: student.lastName,
            firstName: student.firstName,
            gender: student.gender,
            dateOfBirth: new Date(student.dateOfBirth).getTime(),
            email: student.email,
            className: student.class?.className || 'N/A',
            facultyName: student.faculty?.facultyName || 'N/A',
            isSecretary: student.isSecretary
        };
    } catch (error) {
        message.error('Lỗi tải thông tin: ' + (error.message || error));
    } finally {
        loading.value = false;
    }
};

const handleSave = (e) => {
    e.preventDefault();
    formRef.value?.validate(async (errors) => {
        if (!errors) {
            submitting.value = true;
            try {
                const updateData = {
                    lastName: formValue.value.lastName,
                    firstName: formValue.value.firstName,
                    gender: formValue.value.gender,
                    dateOfBirth: new Date(formValue.value.dateOfBirth)
                };
                
                await studentAPI.update(userData._id, updateData);
                message.success('Cập nhật thông tin thành công');
                
                // Update local storage if name changed
                const newFullName = `${updateData.lastName} ${updateData.firstName}`;
                const updatedUser = { ...userData, fullName: newFullName };
                localStorage.setItem('userData', JSON.stringify(updatedUser));
                
            } catch (error) {
                message.error('Lỗi cập nhật: ' + (error.message || error));
            } finally {
                submitting.value = false;
            }
        }
    });
};

const handleChangePassword = (e) => {
    e.preventDefault();
    passwordFormRef.value?.validate(async (errors) => {
        if (!errors) {
            passwordSubmitting.value = true;
            try {
                await authAPI.changePassword({
                    oldPassword: passwordForm.value.oldPassword,
                    newPassword: passwordForm.value.newPassword
                });
                message.success('Đổi mật khẩu thành công');
                passwordForm.value = {
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                };
            } catch (error) {
                message.error(error.response?.data?.message || 'Lỗi đổi mật khẩu');
            } finally {
                passwordSubmitting.value = false;
            }
        }
    });
};

onMounted(() => {
    fetchProfile();
});
</script>
