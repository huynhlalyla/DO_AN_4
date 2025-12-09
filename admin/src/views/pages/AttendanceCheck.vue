<template>
    <div class="attendance-check-page">
        <n-card :title="`Điểm danh: ${eventName}`">
            <template #header-extra>
                <n-button @click="$router.push({ name: 'Login' })">Thoát</n-button>
            </template>

            <div class="search-bar">
                <n-input-group>
                    <n-input v-model:value="searchText" placeholder="Tìm theo tên hoặc MSSV" @keyup.enter="fetchData" />
                    <n-button type="primary" @click="fetchData">Tìm kiếm</n-button>
                </n-input-group>
            </div>

            <n-data-table
                :columns="columns"
                :data="participants"
                :loading="loading"
                :pagination="pagination"
                class="mt-4"
            />
        </n-card>
    </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, NCheckbox, NCard, NButton, NInput, NInputGroup, NDataTable } from 'naive-ui'
import { eventAPI } from '../../services/api'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const eventId = route.params.id
const eventName = route.query.eventName || 'Sự kiện'

const loading = ref(false)
const participants = ref([])
const searchText = ref('')

const pagination = {
    pageSize: 20
}

const handleCheck = async (row, checked) => {
    try {
        const status = checked ? 'attended' : 'registered'
        const result = await eventAPI.markAttendance(eventId, row.student._id, status)
        if (result.success) {
            row.status = status
            row.attendedAt = result.data.attendedAt
            message.success(`Đã ${checked ? 'điểm danh' : 'hủy điểm danh'} cho ${row.student.lastName} ${row.student.firstName}`)
        }
    } catch (error) {
        message.error('Lỗi cập nhật: ' + error.message)
        // Revert checkbox state visually if needed, but here we rely on reactivity
        // Ideally we should revert the local state if API fails
    }
}

const columns = [
    {
        title: 'MSSV',
        key: 'student.studentCode',
        width: 120
    },
    {
        title: 'Họ tên',
        key: 'student.fullName',
        render(row) {
            return `${row.student.lastName} ${row.student.firstName}`
        }
    },
    {
        title: 'Lớp',
        key: 'student.class.classCode',
        width: 100
    },
    {
        title: 'Trạng thái',
        key: 'status',
        width: 150,
        render(row) {
            return h(
                NCheckbox,
                {
                    checked: row.status === 'attended',
                    'onUpdate:checked': (checked) => handleCheck(row, checked)
                },
                { default: () => row.status === 'attended' ? 'Đã tham gia' : 'Chưa tham gia' }
            )
        }
    },
    {
        title: 'Thời gian',
        key: 'attendedAt',
        render(row) {
            return row.attendedAt ? new Date(row.attendedAt).toLocaleString('vi-VN') : '-'
        }
    }
]

const fetchData = async () => {
    loading.value = true
    try {
        const result = await eventAPI.getAttendanceList(eventId, searchText.value)
        if (result.success) {
            participants.value = result.data
        }
    } catch (error) {
        message.error('Lỗi tải danh sách: ' + error.message)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    if (!eventId) {
        message.error('Không tìm thấy ID sự kiện')
        router.push({ name: 'Login' })
        return
    }
    fetchData()
})
</script>

<style scoped>
.attendance-check-page {
    padding: 20px;
    max-width: 1000px;
    margin: 0 auto;
}
.search-bar {
    margin-bottom: 16px;
    max-width: 400px;
}
.mt-4 {
    margin-top: 16px;
}
</style>