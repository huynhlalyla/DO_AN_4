<template>
    <div class="attendance-login-container">
        <n-card class="login-card" title="Đăng nhập điểm danh">
            <n-form ref="formRef" :model="formValue" :rules="rules">
                <n-form-item label="Mã sự kiện" path="eventCode">
                    <n-input v-model:value="formValue.eventCode" placeholder="Nhập mã sự kiện (VD: EVT001)" />
                </n-form-item>
                <n-form-item label="Mật khẩu điểm danh" path="password">
                    <n-input
                        v-model:value="formValue.password"
                        type="password"
                        show-password-on="click"
                        placeholder="Nhập mật khẩu 6 số"
                    />
                </n-form-item>
                <n-button type="primary" block @click="handleLogin" :loading="loading">
                    Vào điểm danh
                </n-button>
            </n-form>
        </n-card>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { eventAPI } from '../../services/api'

const router = useRouter()
const message = useMessage()
const loading = ref(false)

const formValue = ref({
    eventCode: '',
    password: ''
})

const rules = {
    eventCode: {
        required: true,
        message: 'Vui lòng nhập mã sự kiện',
        trigger: 'blur'
    },
    password: {
        required: true,
        message: 'Vui lòng nhập mật khẩu',
        trigger: 'blur'
    }
}

const handleLogin = async () => {
    if (!formValue.value.eventCode || !formValue.value.password) {
        message.error('Vui lòng nhập đầy đủ thông tin')
        return
    }

    loading.value = true
    try {
        const result = await eventAPI.loginAttendance(formValue.value.eventCode, formValue.value.password)
        if (result.success) {
            message.success('Đăng nhập thành công')
            // Store session info if needed, or just pass ID via route
            // For security, we might want to store a token, but here we rely on the password being correct for the session
            // In a real app, the backend should return a temporary token for this session.
            // For now, we just redirect to the checklist page.
            router.push({ 
                name: 'AttendanceCheck', 
                params: { id: result.data.eventId },
                query: { eventName: result.data.eventName }
            })
        } else {
            message.error(result.message || 'Đăng nhập thất bại')
        }
    } catch (error) {
        message.error('Lỗi: ' + error.message)
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.attendance-login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    background-color: #f0f2f5;
}

.login-card {
    width: 100%;
    max-width: 400px;
}
</style>