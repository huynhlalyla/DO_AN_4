<template>
<div 
    class="min-h-screen w-full flex items-center justify-center p-4 transition-all duration-500"
    :style="{ background: currentGradient }"
>
    <!-- Dark mode toggle -->
    <div class="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <n-space align="center" :size="12">
            <span class="text-white text-sm hidden sm:inline">{{ isDark ? 'Chế độ tối' : 'Chế độ sáng' }}</span>
            <n-switch v-model:value="isDark" size="large">
                <template #checked-icon>
                    <i class="fa-solid fa-moon"></i>
                </template>
                <template #unchecked-icon>
                    <i class="fa-solid fa-sun"></i>
                </template>
            </n-switch>
        </n-space>
    </div>

    <!-- Login Card -->
    <div class="w-full max-w-md animate__animated animate__fadeIn">
        <n-card class="backdrop-blur-sm shadow-2xl" :bordered="false" size="large">
            <template #header>
                <div class="text-center space-y-2">
                    <div class="flex justify-center mb-4">
                        <img 
                            src="/logo.png" 
                            alt="Logo" 
                            class="h-20 w-20 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-slate-700"
                        />
                    </div>
                    <h1 class="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
                        Đăng nhập Quản trị
                    </h1>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        Hệ thống quản lý sự kiện - Acties
                    </p>
                </div>
            </template>

            <n-space vertical :size="20">
                <!-- Error/Success Alert -->
                <n-alert v-if="alertMessage" :type="alertType" closable @close="alertMessage = ''">
                    {{ alertMessage }}
                </n-alert>

                <!-- Step 1: Nhập mã cán bộ -->
                <div v-if="step === 1">
                    <n-form ref="step1FormRef" :model="formData" size="large">
                        <n-form-item 
                            label="Mã số cán bộ (MSCB)" 
                            path="adminCode"
                            :show-require-mark="false"
                        >
                            <n-input
                                v-model:value="formData.adminCode"
                                placeholder="Nhập mã số cán bộ (VD: CB20240001)"
                                :disabled="loading"
                                @keypress.enter="handleCheckAdmin"
                            >
                                <template #prefix>
                                    <i class="fa-solid fa-id-card text-slate-400"></i>
                                </template>
                            </n-input>
                        </n-form-item>

                        <n-form-item :show-label="false">
                            <n-button
                                type="primary"
                                block
                                size="large"
                                :loading="loading"
                                @click="handleCheckAdmin"
                                class="font-semibold"
                            >
                                {{ loading ? 'Đang kiểm tra...' : 'Tiếp tục' }}
                            </n-button>
                        </n-form-item>
                    </n-form>
                </div>

                <!-- Step 2A: Lần đầu đăng nhập - Nhập OTP -->
                <div v-else-if="step === 2 && isFirstLogin">
                    <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p class="text-sm text-blue-800 dark:text-blue-200">
                            <i class="fa-solid fa-info-circle mr-2"></i>
                            Đây là lần đầu bạn đăng nhập. Mã OTP đã được gửi đến email: <strong>{{ adminEmail }}</strong>
                        </p>
                    </div>

                    <n-form ref="otpFormRef" :model="formData" size="large">
                        <n-form-item label="Mã OTP (6 chữ số)" :show-require-mark="false">
                            <n-input
                                v-model:value="formData.otpCode"
                                placeholder="Nhập mã OTP"
                                maxlength="6"
                                :disabled="loading"
                                @keypress.enter="focusPasswordInput"
                            >
                                <template #prefix>
                                    <i class="fa-solid fa-key text-slate-400"></i>
                                </template>
                            </n-input>
                        </n-form-item>

                        <n-form-item label="Mật khẩu mới" :show-require-mark="false">
                            <n-input
                                ref="passwordInputRef"
                                v-model:value="formData.newPassword"
                                type="password"
                                show-password-on="click"
                                placeholder="Tối thiểu 6 ký tự"
                                :disabled="loading"
                                @keypress.enter="focusConfirmPasswordInput"
                            >
                                <template #prefix>
                                    <i class="fa-solid fa-lock text-slate-400"></i>
                                </template>
                            </n-input>
                        </n-form-item>

                        <n-form-item label="Xác nhận mật khẩu" :show-require-mark="false">
                            <n-input
                                ref="confirmPasswordInputRef"
                                v-model:value="formData.confirmPassword"
                                type="password"
                                show-password-on="click"
                                placeholder="Nhập lại mật khẩu"
                                :disabled="loading"
                                @keypress.enter="handleVerifyOTP"
                            >
                                <template #prefix>
                                    <i class="fa-solid fa-lock text-slate-400"></i>
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
                                class="font-semibold"
                            >
                                {{ loading ? 'Đang xác thực...' : 'Xác nhận và đăng nhập' }}
                            </n-button>

                            <n-button
                                text
                                block
                                size="small"
                                :disabled="loading || resendCooldown > 0"
                                @click="handleResendOTP"
                            >
                                {{ resendCooldown > 0 ? `Gửi lại OTP (${resendCooldown}s)` : 'Gửi lại mã OTP' }}
                            </n-button>
                        </n-space>
                    </n-form>

                    <n-button text block class="mt-3" @click="resetToStep1">
                        <i class="fa-solid fa-arrow-left mr-2"></i>Quay lại
                    </n-button>
                </div>

                <!-- Step 2B: Đăng nhập bình thường -->
                <div v-else-if="step === 2 && !isFirstLogin">
                    <div class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p class="text-sm text-green-800 dark:text-green-200">
                            <i class="fa-solid fa-user-circle mr-2"></i>
                            Xin chào, <strong>{{ adminFullName }}</strong>
                        </p>
                    </div>

                    <n-form ref="loginFormRef" :model="formData" size="large">
                        <n-form-item label="Mật khẩu" :show-require-mark="false">
                            <n-input
                                v-model:value="formData.password"
                                type="password"
                                show-password-on="click"
                                placeholder="Nhập mật khẩu"
                                :disabled="loading"
                                @keypress.enter="handleLogin"
                            >
                                <template #prefix>
                                    <i class="fa-solid fa-lock text-slate-400"></i>
                                </template>
                            </n-input>
                        </n-form-item>

                        <n-form-item :show-label="false">
                            <n-button
                                type="primary"
                                block
                                size="large"
                                :loading="loading"
                                @click="handleLogin"
                                class="font-semibold"
                            >
                                {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
                            </n-button>
                        </n-form-item>
                    </n-form>

                    <n-button text block class="mt-3" @click="resetToStep1">
                        <i class="fa-solid fa-arrow-left mr-2"></i>Quay lại
                    </n-button>
                </div>
            </n-space>

            <template #footer>
                <div class="text-center text-xs text-slate-400 dark:text-slate-500">
                    <p>© 2025 Acties. Hệ thống quản lý sự kiện.</p>
                </div>
            </template>
        </n-card>
    </div>
</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { NForm, NFormItem, NInput, NButton, NCard, NSpace, NSwitch, NAlert, useMessage } from 'naive-ui';
import { isDark } from '../../hooks/useDark';
import { authAPI } from '../../services/api';

const router = useRouter();
const message = useMessage();

// Gradient backgrounds
const lightGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const darkGradient = 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)';
const currentGradient = computed(() => isDark.value ? darkGradient : lightGradient);

// State
const step = ref(1); // 1: nhập MSCB, 2: OTP hoặc password
const isFirstLogin = ref(false);
const loading = ref(false);
const alertMessage = ref('');
const alertType = ref('error');
const resendCooldown = ref(0);

// Admin info
const adminEmail = ref('');
const adminFullName = ref('');

// Form data
const formData = ref({
    adminCode: '',
    otpCode: '',
    newPassword: '',
    confirmPassword: '',
    password: '',
});

// Refs
const passwordInputRef = ref(null);
const confirmPasswordInputRef = ref(null);

// Step 1: Kiểm tra mã cán bộ
const handleCheckAdmin = async () => {
    if (!formData.value.adminCode.trim()) {
        showAlert('error', 'Vui lòng nhập mã số cán bộ');
        return;
    }

    loading.value = true;
    try {
        const result = await authAPI.checkAdmin(formData.value.adminCode);
        
        if (result.success) {
            adminEmail.value = result.email;
            adminFullName.value = result.fullName;
            isFirstLogin.value = result.isFirstLogin;
            step.value = 2;

            // Nếu là lần đầu, tự động gửi OTP
            if (result.isFirstLogin) {
                await sendOTP();
            }
        } else {
            showAlert('error', result.message || 'Mã cán bộ không tồn tại');
        }
    } catch (error) {
        showAlert('error', 'Lỗi khi kiểm tra mã cán bộ');
    } finally {
        loading.value = false;
    }
};

// Gửi OTP
const sendOTP = async () => {
    loading.value = true;
    try {
        const result = await authAPI.requestOTP(null, formData.value.adminCode, 'first-login');
        
        if (result.success) {
            showAlert('success', 'Mã OTP đã được gửi đến email của bạn');
            startResendCooldown();
        } else {
            showAlert('error', result.message || 'Không thể gửi OTP');
        }
    } catch (error) {
        showAlert('error', 'Lỗi khi gửi OTP');
    } finally {
        loading.value = false;
    }
};

// Gửi lại OTP
const handleResendOTP = async () => {
    await sendOTP();
};

// Countdown cho nút gửi lại OTP
const startResendCooldown = () => {
    resendCooldown.value = 60;
    const interval = setInterval(() => {
        resendCooldown.value--;
        if (resendCooldown.value <= 0) {
            clearInterval(interval);
        }
    }, 1000);
};

// Xác thực OTP và đặt mật khẩu
const handleVerifyOTP = async () => {
    // Validate
    if (!formData.value.otpCode || !formData.value.newPassword || !formData.value.confirmPassword) {
        showAlert('error', 'Vui lòng nhập đầy đủ thông tin');
        return;
    }

    if (formData.value.newPassword.length < 6) {
        showAlert('error', 'Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }

    if (formData.value.newPassword !== formData.value.confirmPassword) {
        showAlert('error', 'Mật khẩu xác nhận không khớp');
        return;
    }

    loading.value = true;
    try {
        const result = await authAPI.verifyOTP(
            adminEmail.value,
            formData.value.otpCode,
            formData.value.newPassword
        );
        
        if (result.success) {
            showAlert('success', 'Đặt mật khẩu thành công! Đang đăng nhập...');
            
            // Tự động đăng nhập sau khi đặt mật khẩu
            setTimeout(async () => {
                formData.value.password = formData.value.newPassword;
                await performLogin();
            }, 1000);
        } else {
            showAlert('error', result.message || 'Mã OTP không đúng');
        }
    } catch (error) {
        showAlert('error', 'Lỗi khi xác thực OTP');
    } finally {
        loading.value = false;
    }
};

// Đăng nhập bình thường
const handleLogin = async () => {
    if (!formData.value.password) {
        showAlert('error', 'Vui lòng nhập mật khẩu');
        return;
    }

    await performLogin();
};

// Thực hiện đăng nhập
const performLogin = async () => {
    loading.value = true;
    try {
        const result = await authAPI.login(null, formData.value.adminCode, formData.value.password);
        
        if (result.success) {
            // Lưu thông tin vào localStorage
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('adminCode', formData.value.adminCode);
            localStorage.setItem('userData', JSON.stringify(result.data.user));
            if (result.data.token) {
                localStorage.setItem('adminToken', result.data.token);
            }
            
            message.success('Đăng nhập thành công!');
            
            // Redirect to admin dashboard
            router.push('/');
        } else {
            showAlert('error', result.message || 'Mật khẩu không đúng');
        }
    } catch (error) {
        showAlert('error', 'Lỗi khi đăng nhập');
    } finally {
        loading.value = false;
    }
};

// Reset về bước 1
const resetToStep1 = () => {
    step.value = 1;
    isFirstLogin.value = false;
    formData.value = {
        adminCode: formData.value.adminCode,
        otpCode: '',
        newPassword: '',
        confirmPassword: '',
        password: '',
    };
    alertMessage.value = '';
};

// Hiển thị alert
const showAlert = (type, msg) => {
    alertType.value = type;
    alertMessage.value = msg;
};

// Focus helpers
const focusPasswordInput = () => {
    passwordInputRef.value?.focus();
};

const focusConfirmPasswordInput = () => {
    confirmPasswordInputRef.value?.focus();
};
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate__animated {
  animation-duration: 0.5s;
}

.animate__fadeIn {
  animation-name: fadeIn;
}

:deep(.n-card) {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
}

:deep(.dark .n-card) {
  background: rgba(30, 41, 59, 0.95);
}

:deep(.n-input:focus-within) {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
</style>
