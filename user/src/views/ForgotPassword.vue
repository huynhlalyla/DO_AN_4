<template>
    <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4!">
        <div class="max-w-md w-full">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                    <i class="fa-solid fa-key text-white text-2xl"></i>
                </div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Quên mật khẩu
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-2">
                    Nhập email để nhận link đặt lại mật khẩu
                </p>
            </div>

            <!-- Form -->
            <n-card :bordered="false" class="shadow-xl">
                <n-form
                    v-if="!emailSent"
                    ref="formRef"
                    :model="formValue"
                    :rules="rules"
                    size="large"
                >
                    <n-form-item path="email" label="Email">
                        <n-input
                            v-model:value="formValue.email"
                            placeholder="email@student.edu.vn"
                            type="email"
                            @keyup.enter="handleSubmit"
                        >
                            <template #prefix>
                                <i class="fa-solid fa-envelope text-gray-400"></i>
                            </template>
                        </n-input>
                    </n-form-item>

                    <n-space vertical :size="12">
                        <n-button
                            type="primary"
                            block
                            size="large"
                            :loading="loading"
                            @click="handleSubmit"
                        >
                            Gửi link đặt lại mật khẩu
                        </n-button>

                        <n-button
                            block
                            size="large"
                            @click="$router.push('/login')"
                        >
                            <template #icon>
                                <i class="fa-solid fa-arrow-left"></i>
                            </template>
                            Quay lại đăng nhập
                        </n-button>
                    </n-space>
                </n-form>

                <!-- Success Message -->
                <div v-else class="text-center py-8!">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <i class="fa-solid fa-check text-green-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Email đã được gửi!
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        Vui lòng kiểm tra email để nhận link đặt lại mật khẩu.
                    </p>
                    <n-button type="primary" @click="$router.push('/login')">
                        Quay lại đăng nhập
                    </n-button>
                </div>
            </n-card>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, useMessage } from 'naive-ui';
import { authAPI } from '../services/api';

const router = useRouter();
const message = useMessage();

const formRef = ref(null);
const loading = ref(false);
const emailSent = ref(false);

const formValue = ref({
    email: ''
});

const rules = {
    email: [
        { required: true, message: 'Vui lòng nhập email', trigger: 'blur' },
        { type: 'email', message: 'Email không hợp lệ', trigger: 'blur' }
    ]
};

const handleSubmit = async () => {
    try {
        await formRef.value?.validate();
        loading.value = true;

        const result = await authAPI.forgotPassword(formValue.value.email);

        if (result.success) {
            emailSent.value = true;
            message.success('Email đã được gửi!');
        } else {
            message.error(result.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        message.error(error.message || 'Không tìm thấy email này trong hệ thống');
    } finally {
        loading.value = false;
    }
};
</script>
