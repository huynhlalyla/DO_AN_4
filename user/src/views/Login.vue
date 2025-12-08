<template>
    <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4!">
        <div class="max-w-md w-full">
            <!-- Logo & Title -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                    <i class="fa-solid fa-graduation-cap text-white text-2xl"></i>
                </div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Hệ thống Đánh giá Rèn luyện
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-2">
                    {{ stepTitle }}
                </p>
            </div>

            <!-- Login Form -->
            <n-card :bordered="false" class="shadow-xl">
                <!-- Step 1: Enter Student Code or Email -->
                <n-form
                    v-if="currentStep === 1"
                    ref="emailFormRef"
                    :model="emailForm"
                    :rules="emailRules"
                    size="large"
                >
                    <n-form-item path="identifier" label="Mã số sinh viên">
                        <n-input
                            v-model:value="emailForm.identifier"
                            placeholder="VD: 2024000001 hoặc CNTT2211017"
                            @keyup.enter="handleCheckEmail"
                        >
                            <template #prefix>
                                <i class="fa-solid fa-user text-gray-400"></i>
                            </template>
                        </n-input>
                    </n-form-item>

                    <!-- Error Alert -->
                    <n-alert v-if="loginError" type="error" :title="loginError.title" closable @close="loginError = null" style="margin-bottom: 16px;">
                        {{ loginError.message }}
                    </n-alert>

                    <n-button
                        type="primary"
                        block
                        size="large"
                        :loading="loading"
                        @click="handleCheckEmail"
                    >
                        Tiếp tục
                    </n-button>
                </n-form>

                <!-- Step 2a: Enter Password (returning user) -->
                <n-form
                    v-else-if="currentStep === 2 && !isFirstLogin"
                    ref="passwordFormRef"
                    :model="passwordForm"
                    :rules="passwordRules"
                    size="large"
                >
    <n-alert type="info" class="mb-4">
        Đăng nhập với MSSV: <strong>{{ emailForm.identifier }}</strong>
        <n-button text type="primary" size="small" @click="resetForm" class="ml-2">
            Đổi tài khoản
        </n-button>
    </n-alert>                    <n-form-item path="password" label="Mật khẩu">
                        <n-input
                            v-model:value="passwordForm.password"
                            type="password"
                            show-password-on="click"
                            placeholder="Nhập mật khẩu"
                            @keyup.enter="handleLogin"
                        >
                            <template #prefix>
                                <i class="fa-solid fa-lock text-gray-400"></i>
                            </template>
                        </n-input>
                    </n-form-item>

                    <div class="flex items-center justify-between mb-6">
                        <n-checkbox v-model:checked="rememberMe">
                            Ghi nhớ đăng nhập
                        </n-checkbox>
                        <n-button text type="primary" @click="handleForgotPassword">
                            Quên mật khẩu?
                        </n-button>
                    </div>

                    <n-space vertical :size="12">
                        <n-button
                            type="primary"
                            block
                            size="large"
                            :loading="loading"
                            @click="handleLogin"
                        >
                            <template #icon>
                                <i class="fa-solid fa-right-to-bracket"></i>
                            </template>
                            Đăng nhập
                        </n-button>

                        <n-button block size="large" @click="resetForm">
                            Quay lại
                        </n-button>
                    </n-space>
                </n-form>

                <!-- Step 2b: Request OTP (first time login) -->
                <div v-else-if="currentStep === 2 && isFirstLogin">
                    <n-alert type="success" class="mb-4">
                        Chào mừng <strong>{{ studentInfo.fullName }}</strong>!
                        <br />
                        <span class="text-sm">{{ studentInfo.email }}</span>
                    </n-alert>

                    <n-alert type="info" class="mb-4">
                        Đây là lần đầu bạn đăng nhập. Vui lòng nhận mã OTP để đặt mật khẩu.
                    </n-alert>

                    <n-space vertical :size="12">
                        <n-button
                            type="primary"
                            block
                            size="large"
                            :loading="loading"
                            @click="handleRequestOTP"
                        >
                            <template #icon>
                                <i class="fa-solid fa-envelope"></i>
                            </template>
                            Gửi mã OTP
                        </n-button>

                        <n-button block size="large" @click="resetForm">
                            Quay lại
                        </n-button>
                    </n-space>
                </div>

                <!-- Step 3: Verify OTP -->
                <n-form
                    v-else-if="currentStep === 3"
                    ref="otpFormRef"
                    :model="otpForm"
                    :rules="otpRules"
                    size="large"
                >
                    <n-alert type="info" class="mb-4">
                        Mã OTP đã được gửi đến email: <strong>{{ studentInfo.email }}</strong>
                    </n-alert>

                    <n-form-item path="otpCode" label="Mã OTP">
                        <n-input
                            v-model:value="otpForm.otpCode"
                            placeholder="Nhập 6 chữ số"
                            maxlength="6"
                            @keyup.enter="handleVerifyOTP"
                        >
                            <template #prefix>
                                <i class="fa-solid fa-key text-gray-400"></i>
                            </template>
                        </n-input>
                    </n-form-item>

                    <n-space vertical :size="12">
                        <n-button
                            type="primary"
                            block
                            size="large"
                            :loading="loading"
                            @click="handleVerifyOTP"
                        >
                            Xác thực OTP
                        </n-button>

                        <n-button block size="large" :loading="loading" @click="handleRequestOTP">
                            <template #icon>
                                <i class="fa-solid fa-rotate"></i>
                            </template>
                            Gửi lại mã OTP
                        </n-button>

                        <n-button block size="large" @click="resetForm">
                            Quay lại
                        </n-button>
                    </n-space>
                </n-form>

                <!-- Step 4: Set New Password -->
                <n-form
                    v-else-if="currentStep === 4"
                    ref="newPasswordFormRef"
                    :model="newPasswordForm"
                    :rules="newPasswordRules"
                    size="large"
                >
                    <n-alert type="success" class="mb-4">
                        Mã OTP hợp lệ! Vui lòng đặt mật khẩu mới.
                    </n-alert>

                    <n-form-item path="newPassword" label="Mật khẩu mới">
                        <n-input
                            v-model:value="newPasswordForm.newPassword"
                            type="password"
                            show-password-on="click"
                            placeholder="Tối thiểu 6 ký tự"
                        >
                            <template #prefix>
                                <i class="fa-solid fa-lock text-gray-400"></i>
                            </template>
                        </n-input>
                    </n-form-item>

                    <n-form-item path="confirmPassword" label="Xác nhận mật khẩu">
                        <n-input
                            v-model:value="newPasswordForm.confirmPassword"
                            type="password"
                            show-password-on="click"
                            placeholder="Nhập lại mật khẩu"
                            @keyup.enter="handleSetPassword"
                        >
                            <template #prefix>
                                <i class="fa-solid fa-lock text-gray-400"></i>
                            </template>
                        </n-input>
                    </n-form-item>

                    <n-button
                        type="primary"
                        block
                        size="large"
                        :loading="loading"
                        @click="handleSetPassword"
                    >
                        Đặt mật khẩu và Đăng nhập
                    </n-button>
                </n-form>
            </n-card>

            <!-- Footer -->
            <div class="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                <p>© 2025 Acties System. All rights reserved.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NForm, NFormItem, NInput, NButton, NCheckbox, NSpace, NAlert, useMessage } from 'naive-ui';
import { authAPI } from '../services/api';

const router = useRouter();
const message = useMessage();

const emailFormRef = ref(null);
const passwordFormRef = ref(null);
const otpFormRef = ref(null);
const newPasswordFormRef = ref(null);

const loading = ref(false);
const currentStep = ref(1);
const isFirstLogin = ref(false);
const rememberMe = ref(false);

const studentInfo = ref({
    email: '',
    fullName: '',
    studentCode: ''
});

const loginError = ref(null);

const emailForm = ref({
    identifier: '' // Có thể là email hoặc mã sinh viên
});

const passwordForm = ref({
    password: ''
});

const otpForm = ref({
    otpCode: ''
});

const newPasswordForm = ref({
    newPassword: '',
    confirmPassword: ''
});

const stepTitle = computed(() => {
    switch (currentStep.value) {
        case 1: return 'Đăng nhập để tiếp tục';
        case 2: return isFirstLogin.value ? 'Kích hoạt tài khoản' : 'Nhập mật khẩu';
        case 3: return 'Xác thực OTP';
        case 4: return 'Đặt mật khẩu mới';
        default: return 'Đăng nhập';
    }
});

const emailRules = {
    identifier: [
        { required: true, message: 'Vui lòng nhập mã sinh viên', trigger: 'blur' },
        { 
            validator: (rule, value) => {
                if (!value) return true;
                // Chấp nhận chữ và số, độ dài từ 5-20 ký tự
                const isStudentCode = /^[a-zA-Z0-9]{5,20}$/.test(value);
                return isStudentCode;
            },
            message: 'Mã sinh viên chỉ bao gồm chữ và số (5-20 ký tự)',
            trigger: 'blur'
        }
    ]
};

const passwordRules = {
    password: [
        { required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' },
        { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự', trigger: 'blur' }
    ]
};

const otpRules = {
    otpCode: [
        { required: true, message: 'Vui lòng nhập mã OTP', trigger: 'blur' },
        { len: 6, message: 'Mã OTP phải có 6 ký tự', trigger: 'blur' }
    ]
};

const newPasswordRules = {
    newPassword: [
        { required: true, message: 'Vui lòng nhập mật khẩu mới', trigger: 'blur' },
        { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: 'Vui lòng xác nhận mật khẩu', trigger: 'blur' },
        {
            validator: (rule, value) => {
                return value === newPasswordForm.value.newPassword;
            },
            message: 'Mật khẩu xác nhận không khớp',
            trigger: 'blur'
        }
    ]
};

// Step 1: Check email/studentCode exists
const handleCheckEmail = async () => {
    try {
        await emailFormRef.value?.validate();
        loading.value = true;
        loginError.value = null;

        const identifier = emailForm.value.identifier.trim();
        
        // Gọi API check student - dùng login với password tạm để check
        const result = await authAPI.checkStudent(identifier);

        if (result.success) {
            studentInfo.value.email = result.data.email;
            studentInfo.value.fullName = result.data.fullName;
            studentInfo.value.studentCode = result.data.studentCode;
            
            if (result.data.isFirstLogin) {
                isFirstLogin.value = true;
                currentStep.value = 2;
            } else {
                isFirstLogin.value = false;
                currentStep.value = 2;
            }
        }
    } catch (error) {
        console.error('Check student error:', error);
        
        // Hiển thị lỗi chi tiết
        const errorMsg = error.message || 'Có lỗi xảy ra';
        const errorDetail = error.details || '';
        
        loginError.value = {
            title: 'Không thể xác thực',
            message: `${errorMsg}${errorDetail ? '. ' + errorDetail : ''}`
        };
        
        // Log chi tiết lỗi ra console
        console.error('Chi tiết lỗi:', {
            message: error.message,
            status: error.status,
            details: error.details,
            fullError: error
        });
    } finally {
        loading.value = false;
    }
};

// Step 2a: Login with password (returning user)
const handleLogin = async () => {
    try {
        await passwordFormRef.value?.validate();
        loading.value = true;

        const result = await authAPI.login(emailForm.value.identifier, passwordForm.value.password);

        if (result.success) {
            const userData = result.data.user;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            const token = result.data.token || 'temp-token';
            localStorage.setItem('userToken', token);
            
            if (rememberMe.value) {
                localStorage.setItem('rememberMe', 'true');
            }

            message.success('Đăng nhập thành công!');
            
            setTimeout(() => {
                router.push('/');
            }, 500);
        }
    } catch (error) {
        console.error('Login error:', error);
        message.error(error.message || 'Mật khẩu không đúng');
    } finally {
        loading.value = false;
    }
};

// Step 2b: Request OTP (first time login)
const handleRequestOTP = async () => {
    loading.value = true;
    try {
        const result = await authAPI.requestOTP(studentInfo.value.email, 'first-login');

        if (result.success) {
            message.success('Mã OTP đã được gửi đến email của bạn!');
            currentStep.value = 3;
        }
    } catch (error) {
        console.error('Request OTP error:', error);
        message.error(error.message || 'Lỗi khi gửi OTP');
    } finally {
        loading.value = false;
    }
};

// Step 3: Verify OTP
const handleVerifyOTP = async () => {
    try {
        await otpFormRef.value?.validate();
        loading.value = true;

        // Tạm thời chuyển sang bước đặt mật khẩu
        // TODO: Backend cần endpoint verify OTP riêng
        message.success('Mã OTP hợp lệ!');
        currentStep.value = 4;
    } catch (error) {
        console.error('Verify OTP error:', error);
        message.error(error.message || 'Mã OTP không đúng');
    } finally {
        loading.value = false;
    }
};

// Step 4: Set new password
const handleSetPassword = async () => {
    try {
        await newPasswordFormRef.value?.validate();
        loading.value = true;

        const result = await authAPI.resetPassword(
            studentInfo.value.email,
            otpForm.value.otpCode,
            newPasswordForm.value.newPassword
        );

        if (result.success) {
            message.success('Đặt mật khẩu thành công! Đang đăng nhập...');
            
            // Auto login after setting password
            setTimeout(async () => {
                try {
                    const loginResult = await authAPI.login(
                        studentInfo.value.email,
                        newPasswordForm.value.newPassword
                    );

                    if (loginResult.success) {
                        const userData = loginResult.data.user;
                        localStorage.setItem('userData', JSON.stringify(userData));
                        localStorage.setItem('userToken', loginResult.data.token || 'temp-token');
                        
                        router.push('/');
                    }
                } catch (err) {
                    console.error('Auto login error:', err);
                    message.warning('Vui lòng đăng nhập lại');
                    resetForm();
                }
            }, 1000);
        }
    } catch (error) {
        console.error('Set password error:', error);
        message.error(error.message || 'Lỗi khi đặt mật khẩu');
    } finally {
        loading.value = false;
    }
};

// Forgot password handler
const handleForgotPassword = () => {
    router.push('/forgot-password');
};

// Reset form
const resetForm = () => {
    currentStep.value = 1;
    isFirstLogin.value = false;
    emailForm.value.identifier = '';
    passwordForm.value.password = '';
    otpForm.value.otpCode = '';
    newPasswordForm.value.newPassword = '';
    newPasswordForm.value.confirmPassword = '';
    studentInfo.value = { email: '', fullName: '', studentCode: '' };
    loginError.value = null;
};
</script>

<style scoped>
/* Additional styles if needed */
</style>
