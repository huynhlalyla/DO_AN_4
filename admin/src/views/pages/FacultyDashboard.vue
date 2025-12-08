<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Thống kê Khoa
                </h1>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Tổng quan dữ liệu khoa {{ facultyData?.facultyName }}
                </p>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center items-center py-20">
            <n-spin size="large" />
        </div>

        <!-- Content -->
        <div v-else-if="facultyData">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <!-- Số lớp -->
                <n-card :bordered="false" class="shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Tổng số lớp</p>
                            <p class="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                {{ stats.totalClasses }}
                            </p>
                        </div>
                        <div class="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <i class="fa-solid fa-chalkboard-user text-2xl text-blue-600 dark:text-blue-400"></i>
                        </div>
                    </div>
                </n-card>

                <!-- Số sinh viên -->
                <n-card :bordered="false" class="shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Tổng sinh viên</p>
                            <p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                                {{ stats.totalStudents }}
                            </p>
                        </div>
                        <div class="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <i class="fa-solid fa-user-graduate text-2xl text-green-600 dark:text-green-400"></i>
                        </div>
                    </div>
                </n-card>

                <!-- Bình quân sinh viên/lớp -->
                <n-card :bordered="false" class="shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Bình quân SV/Lớp</p>
                            <p class="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                                {{ stats.avgStudentsPerClass }}
                            </p>
                        </div>
                        <div class="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                            <i class="fa-solid fa-chart-simple text-2xl text-purple-600 dark:text-purple-400"></i>
                        </div>
                    </div>
                </n-card>
            </div>

            <!-- Faculty Info Card -->
            <n-card title="Thông tin Khoa" :bordered="false" class="shadow-sm mb-6">
                <n-descriptions :column="2" bordered>
                    <n-descriptions-item label="Mã khoa">
                        {{ facultyData.facultyCode }}
                    </n-descriptions-item>
                    <n-descriptions-item label="Tên khoa">
                        {{ facultyData.facultyName }}
                    </n-descriptions-item>
                    <n-descriptions-item label="Mô tả" :span="2">
                        {{ facultyData.description || 'Chưa có mô tả' }}
                    </n-descriptions-item>
                </n-descriptions>
            </n-card>

            <!-- Classes Chart -->
            <n-card title="Biểu đồ Sinh viên theo Lớp" :bordered="false" class="shadow-sm">
                <div class="h-80">
                    <canvas ref="chartCanvas"></canvas>
                </div>
            </n-card>

            <!-- Classes Table -->
            <n-card title="Danh sách Lớp" :bordered="false" class="shadow-sm">
                <n-data-table
                    :columns="classColumns"
                    :data="classes"
                    :pagination="{ pageSize: 10 }"
                    :bordered="false"
                />
            </n-card>
        </div>

        <!-- No data -->
        <n-empty v-else description="Không tìm thấy dữ liệu khoa" class="py-20">
            <template #icon>
                <i class="fa-solid fa-folder-open text-6xl text-slate-300"></i>
            </template>
        </n-empty>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { NCard, NDataTable, NDescriptions, NDescriptionsItem, NSpin, NEmpty, useMessage } from 'naive-ui';
import { facultyAPI, classAPI, studentAPI } from '../../services/api';
import Chart from 'chart.js/auto';

const message = useMessage();

// State
const loading = ref(false);
const facultyData = ref(null);
const classes = ref([]);
const students = ref([]);
const chartCanvas = ref(null);
let chartInstance = null;

// Get user's faculty from localStorage
const userData = computed(() => {
    const userDataStr = localStorage.getItem('userData');
    return userDataStr ? JSON.parse(userDataStr) : null;
});

const userFacultyId = computed(() => userData.value?.faculty?._id || userData.value?.faculty);

// Computed stats
const stats = computed(() => {
    const totalClasses = classes.value.length;
    const totalStudents = students.value.length;
    const avgStudentsPerClass = totalClasses > 0 
        ? Math.round(totalStudents / totalClasses) 
        : 0;

    return {
        totalClasses,
        totalStudents,
        avgStudentsPerClass
    };
});

// Table columns
const classColumns = [
    {
        title: 'Mã lớp',
        key: 'classCode',
        width: 120
    },
    {
        title: 'Tên lớp',
        key: 'className',
        width: 200
    },
    {
        title: 'Khóa học',
        key: 'course',
        width: 100
    },
    {
        title: 'Số sinh viên',
        key: 'studentCount',
        width: 120,
        render: (row) => {
            const count = students.value.filter(s => s.class?._id === row._id).length;
            return count;
        }
    }
];

// Load data
const loadFacultyData = async () => {
    if (!userFacultyId.value) {
        message.error('Không tìm thấy thông tin khoa của bạn');
        return;
    }

    loading.value = true;
    try {
        // Load faculty info
        const facultyResult = await facultyAPI.getById(userFacultyId.value);
        if (facultyResult.success) {
            facultyData.value = facultyResult.data;
        }

        // Load classes of this faculty
        const classResult = await classAPI.getByFaculty(userFacultyId.value);
        if (classResult.success) {
            classes.value = classResult.data;
        }

        // Load students of this faculty
        const studentResult = await studentAPI.getByFaculty(userFacultyId.value);
        if (studentResult.success) {
            students.value = studentResult.data;
        }

        // Render chart after data loaded
        await nextTick();
        renderChart();

    } catch (error) {
        console.error('Error loading faculty data:', error);
        message.error('Lỗi khi tải dữ liệu khoa');
    } finally {
        loading.value = false;
    }
};

// Render chart
const renderChart = () => {
    if (!chartCanvas.value) return;

    // Destroy existing chart
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Prepare data: Count students per class
    const classLabels = classes.value.map(c => c.className);
    const studentCounts = classes.value.map(c => {
        return students.value.filter(s => s.class?._id === c._id).length;
    });

    const ctx = chartCanvas.value.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: classLabels,
            datasets: [{
                label: 'Số sinh viên',
                data: studentCounts,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
};

onMounted(() => {
    loadFacultyData();
});
</script>

<style scoped>
/* Custom card styling */
:deep(.n-card) {
    transition: all 0.3s ease;
}

:deep(.n-card:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
