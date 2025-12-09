<template>
    <div class="max-w-4xl mx-auto p-6">
        <n-card title="Thông tin cá nhân" :bordered="false" class="shadow-sm rounded-xl">
            <n-spin :show="loading">
                <n-form
                    ref="formRef"
                    :model="formValue"
                    :rules="rules"
                    label-placement="left"
                    label-width="160"
                    require-mark-placement="right-hanging"
                    size="medium"
                >
                    <!-- Read-only Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <n-form-item label="Mã cán bộ">
                            <n-input :value="formValue.adminCode" disabled placeholder="Mã cán bộ" />
                        </n-form-item>
                        <n-form-item label="Cấp quản lý">
                            <n-tag :type="formValue.level === 'University' ? 'error' : 'info'">
                                {{ formValue.level === 'University' ? 'Cấp Trường' : 'Cấp Khoa' }}
                            </n-tag>
                        </n-form-item>
                        <n-form-item label="Khoa" v-if="formValue.facultyName">
                            <n-input :value="formValue.facultyName" disabled placeholder="Khoa" />
                        </n-form-item>
                    </div>

                    <n-divider />

                    <!-- Editable Info -->
                    <n-form-item label="Họ đệm" path="lastName">
                        <n-input v-model:value="formValue.lastName" placeholder="Nhập họ đệm" />
                    </n-form-item>
                    
                    <n-form-item label="Tên" path="firstName">
                        <n-input v-model:value="formValue.firstName" placeholder="Nhập tên" />
                    </n-form-item>

                    <n-form-item label="Email" path="email">
                        <n-input v-model:value="formValue.email" placeholder="example@edu.vn" disabled />
                    </n-form-item>

                    <n-form-item label="Số điện thoại" path="phone">
                        <n-input v-model:value="formValue.phone" placeholder="Nhập số điện thoại" />
                    </n-form-item>

                    <div class="flex justify-end mt-6">
                        <n-button type="primary" @click="handleSave" :loading="submitting">
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
                label-width="160"
                require-mark-placement="right-hanging"
                size="medium"
            >
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

                <div class="flex justify-end mt-6">
                    <n-button type="warning" @click="handleChangePassword" :loading="passwordSubmitting">
                        <template #icon>
                            <i class="fa-solid fa-key"></i>
                        </template>
                        Đổi mật khẩu
                    </n-button>
                </div>
            </n-form>
        </n-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { authAPI, adminAPI } from '../../services/api';
import { 
    NCard, NForm, NFormItem, NInput, NButton, NSpin, NDivider, NTag 
} from 'naive-ui';

const message = useMessage();
const formRef = ref(null);
const passwordFormRef = ref(null);
const loading = ref(false);
const submitting = ref(false);
const passwordSubmitting = ref(false);

const userData = JSON.parse(localStorage.getItem('userData') || '{}');

const formValue = ref({
    adminCode: '',
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    level: '',
    facultyName: ''
});

const passwordForm = ref({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const rules = {
    lastName: { required: true, message: 'Vui lòng nhập họ đệm', trigger: 'blur' },
    firstName: { required: true, message: 'Vui lòng nhập tên', trigger: 'blur' },
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
        const response = await authAPI.getAdminProfile(userData._id);
        const admin = response.data;
        
        formValue.value = {
            adminCode: admin.adminCode,
            lastName: admin.lastName,
            firstName: admin.firstName,
            email: admin.email,
            phone: admin.phone,
            level: admin.level,
            facultyName: admin.faculty?.facultyName || ''
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
                    email: formValue.value.email,
                    phone: formValue.value.phone
                };
                
                await adminAPI.update(userData._id, updateData);
                message.success('Cập nhật thông tin thành công');
                
                // Update local storage
                const newFullName = `${updateData.lastName} ${updateData.firstName}`;
                const updatedUser = { ...userData, fullName: newFullName, email: updateData.email };
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
                message.error('Lỗi đổi mật khẩu: ' + (error.message || error));
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
