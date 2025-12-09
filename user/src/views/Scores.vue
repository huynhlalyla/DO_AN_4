<template>
    <div class="p-4 md:p-6 max-w-full mx-auto">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
                    Điểm rèn luyện
                </h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1" v-if="semester">
                    Học kỳ {{ semester.semesterNumber }} - Năm học {{ semester.academicYear }}
                </p>
            </div>
            
            <!-- Grading Status -->
            <div v-if="semester" class="flex items-center gap-3">
                <n-tag :type="isGradingPeriod ? 'success' : 'error'" round size="large">
                    {{ isGradingPeriod ? 'Đang mở chấm điểm' : 'Đã đóng chấm điểm' }}
                </n-tag>
                <div v-if="isGradingPeriod" class="text-sm text-slate-600 dark:text-slate-300">
                    <i class="fa-regular fa-clock mr-1"></i>
                    Còn lại: {{ daysRemaining }} ngày
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-12">
            <n-spin size="large" />
        </div>

        <!-- Score Sheet -->
        <div v-else-if="scoreSheet.length > 0" class="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
            <n-table :bordered="false" :single-line="false">
                <thead>
                    <tr>
                        <th class="w-16 text-center bg-slate-50 dark:bg-slate-900">STT</th>
                        <th class="bg-slate-50 dark:bg-slate-900">Nội dung đánh giá</th>
                        <th class="w-24 text-center bg-slate-50 dark:bg-slate-900">Điểm tối đa</th>
                        <th class="w-32 text-center bg-slate-50 dark:bg-slate-900">Điểm tự chấm</th>
                        <th class="w-24 text-center bg-slate-50 dark:bg-slate-900">Điểm đạt</th>
                        <th class="w-48 bg-slate-50 dark:bg-slate-900">Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="(category, catIndex) in scoreSheet" :key="category._id">
                        <!-- Category Header -->
                        <tr class="bg-blue-50/50 dark:bg-blue-900/20 font-semibold">
                            <td class="text-center">{{ toRoman(catIndex + 1) }}</td>
                            <td colspan="5" class="text-blue-700 dark:text-blue-300">
                                {{ category.categoryName }}
                            </td>
                        </tr>

                        <!-- Criteria Rows -->
                        <tr v-for="(crit, critIndex) in category.criteria" :key="crit._id" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td class="text-center text-slate-500">{{ critIndex + 1 }}</td>
                            <td>
                                <div class="font-medium">{{ crit.content }}</div>
                                <div class="text-xs text-slate-500 mt-1" v-if="crit.scoringType === 'auto'">
                                    <n-tag size="small" :bordered="false" type="info" class="mr-2">Tự động</n-tag>
                                    Được tính từ các sự kiện đã tham gia
                                </div>
                                <div class="text-xs text-slate-500 mt-1" v-else>
                                    <n-tag size="small" :bordered="false" type="warning" class="mr-2">Thủ công</n-tag>
                                    {{ crit.requireEvidence ? 'Yêu cầu minh chứng' : 'Tự đánh giá' }}
                                </div>
                            </td>
                            <td class="text-center font-medium">{{ crit.maxScore }}</td>
                            
                            <!-- Self Score Cell -->
                            <td class="text-center">
                                <div v-if="crit.scoringType === 'manual'">
                                    <n-button
                                        v-if="!crit.isLocked"
                                        size="small"
                                        :type="crit.selfScore > 0 ? 'primary' : 'default'"
                                        ghost
                                        @click="openGradeModal(crit)"
                                    >
                                        {{ crit.selfScore > 0 ? crit.selfScore : 'Chấm điểm' }}
                                        <template #icon>
                                            <i class="fa-solid fa-pen"></i>
                                        </template>
                                    </n-button>
                                    <span v-else class="font-medium">{{ crit.selfScore }}</span>
                                </div>
                                <div v-else class="text-slate-400">
                                    {{ crit.selfScore }}
                                </div>
                            </td>

                            <!-- Achieved Score Cell -->
                            <td class="text-center font-bold text-blue-600 dark:text-blue-400">
                                {{ crit.achievedScore }}
                            </td>

                            <!-- Note Cell -->
                            <td class="text-sm text-slate-500">
                                <div v-if="crit.note" :class="{'text-red-500': crit.note.includes('rejected')}">
                                    {{ handleNote(crit.note) }}
                                      <!-- haha -->
                                </div>
                                <div v-if="crit.evidence && crit.evidence.length > 0" class="mt-1">
                                    <n-popover trigger="hover">
                                        <template #trigger>
                                            <n-tag size="small" checkable>
                                                {{ crit.evidence.length }} minh chứng
                                            </n-tag>
                                        </template>
                                        <div class="flex flex-col gap-1">
                                            <a 
                                                v-for="(file, idx) in crit.evidence" 
                                                :key="idx"
                                                :href="`http://localhost:3000${file.url}`" 
                                                target="_blank"
                                                class="text-blue-500 hover:underline text-xs"
                                            >
                                                {{ file.fileName }}
                                            </a>
                                        </div>
                                    </n-popover>
                                </div>
                            </td>
                        </tr>

                        <!-- Category Summary -->
                        <tr class="bg-slate-100 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-700">
                            <td colspan="2" class="text-right pr-4">Tổng điểm {{ category.categoryName }}:</td>
                            <td class="text-center">{{ category.maxScore }}</td>
                            <td class="text-center text-slate-700 dark:text-slate-300">
                                {{ calculateCategorySelfScore(category) }}
                            </td>
                            <td class="text-center text-blue-700 dark:text-blue-300 text-lg">
                                {{ category.totalScore }}
                            </td>
                            <td></td>
                        </tr>
                    </template>
                </tbody>
                <!-- Grand Total -->
                <tfoot>
                    <tr class="bg-blue-600 text-white font-bold text-lg">
                        <td colspan="3" class="text-right pr-4 py-4">TỔNG ĐIỂM RÈN LUYỆN:</td>
                        <td class="text-center py-4">{{ totalSelfScore }}</td>
                        <td class="text-center py-4">{{ grandTotal }}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </n-table>
        </div>

        <n-empty v-else description="Không có dữ liệu bảng điểm" class="mt-12" />

        <!-- Grading Modal -->
        <n-modal v-model:show="showModal" preset="card" title="Tự đánh giá điểm" class="w-full max-w-lg">
            <div v-if="selectedCriteria">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tiêu chí
                    </label>
                    <p class="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        {{ selectedCriteria.content }}
                    </p>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Điểm tự chấm (Tối đa: {{ selectedCriteria.maxScore }})
                    </label>
                    <n-input-number 
                        v-model:value="form.selfScore" 
                        :min="0" 
                        :max="selectedCriteria.maxScore"
                        class="w-full"
                    />
                </div>

                <div class="mb-6" v-if="selectedCriteria.requireEvidence">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Minh chứng <span class="text-red-500">*</span>
                    </label>
                    <n-upload
                        action="http://localhost:3000/api/upload"
                        :default-file-list="fileList"
                        list-type="image-card"
                        @finish="handleUploadFinish"
                        @remove="handleRemove"
                    >
                        Click to Upload
                    </n-upload>
                </div>

                <div class="flex justify-end gap-3">
                    <n-button @click="showModal = false">Hủy</n-button>
                    <n-button type="primary" @click="submitScore" :loading="submitting">
                        Lưu điểm
                    </n-button>
                </div>
            </div>
        </n-modal>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
    NTable, NTag, NButton, NSpin, NEmpty, NModal, NInputNumber, NUpload, NPopover, useMessage 
} from 'naive-ui';
import { assessmentAPI } from '../services/api';

const message = useMessage();
const loading = ref(false);
const scoreSheet = ref([]);
const semester = ref(null);
const grandTotal = ref(0);
const isGradingPeriod = ref(false);

// Modal state
const showModal = ref(false);
const selectedCriteria = ref(null);
const submitting = ref(false);
const form = ref({
    selfScore: 0,
    evidence: []
});
const fileList = ref([]);

const daysRemaining = computed(() => {
    if (!semester.value || !semester.value.gradingStartDate) return 0;
    const start = new Date(semester.value.gradingStartDate);
    const deadline = new Date(start);
    deadline.setDate(start.getDate() + 7);
    const now = new Date();
    const diff = deadline - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

const calculateCategorySelfScore = (category) => {
    if (!category || !Array.isArray(category.criteria)) return 0;
    return category.criteria.reduce((sum, crit) => sum + (Number(crit.selfScore) || 0), 0);
};

const totalSelfScore = computed(() => {
    if (!Array.isArray(scoreSheet.value)) return 0;
    return scoreSheet.value.reduce((total, category) => {
        return total + calculateCategorySelfScore(category);
    }, 0);
});

const toRoman = (num) => {
    const roman = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let str = '';
    for (let i of Object.keys(roman)) {
        let q = Math.floor(num / roman[i]);
        num -= q * roman[i];
        str += i.repeat(q);
    }
    return str;
};

const fetchData = async () => {
    loading.value = true;
    try {
        const response = await assessmentAPI.getScoreSheet();
        if (response.success) {
            scoreSheet.value = response.data.scoreSheet;
            semester.value = response.data.semester;
            grandTotal.value = response.data.grandTotal;
            isGradingPeriod.value = response.data.isGradingPeriod;
        }
    } catch (error) {
        console.error(error);
        message.error('Không thể tải bảng điểm');
    } finally {
        loading.value = false;
    }
};

const openGradeModal = (criteria) => {
    selectedCriteria.value = criteria;
    form.value.selfScore = criteria.selfScore || 0;
    form.value.evidence = criteria.evidence || [];
    
    // Map evidence to fileList for NUpload
    fileList.value = (criteria.evidence || []).map((e, i) => ({
        id: i.toString(),
        name: e.fileName,
        status: 'finished',
        url: `http://localhost:3000${e.url}`
    }));
    
    showModal.value = true;
};

const handleUploadFinish = ({ file, event }) => {
    const response = JSON.parse(event.target.response);
    if (response.success) {
        form.value.evidence.push({
            url: response.data.url,
            fileName: response.data.fileName
        });
        file.url = `http://localhost:3000${response.data.url}`; // Update preview
        message.success('Tải lên thành công');
    } else {
        message.error('Tải lên thất bại');
    }
};

const handleRemove = ({ file }) => {
    // Remove from form.evidence
    // Note: This is a simple implementation. In real app, might want to delete from server too.
    form.value.evidence = form.value.evidence.filter(e => !file.url.includes(e.url));
};

const submitScore = async () => {
    if (selectedCriteria.value.requireEvidence && form.value.evidence.length === 0) {
        message.warning('Vui lòng tải lên minh chứng');
        return;
    }

    submitting.value = true;
    try {
        const response = await assessmentAPI.submitScore({
            semesterId: semester.value._id,
            criteriaId: selectedCriteria.value._id,
            selfScore: form.value.selfScore,
            evidence: form.value.evidence
        });

        if (response.success) {
            message.success('Lưu điểm thành công');
            showModal.value = false;
            fetchData(); // Refresh data
        }
    } catch (error) {
        console.error(error);
        message.error(error.message || 'Lỗi lưu điểm');
    } finally {
        submitting.value = false;
    }
};

const handleNote = (note) => {
    if (note.includes('rejected')) {
        return 'Từ chối';
    } else if (note.includes('approved')) {
        return 'Được duyệt';
    } else {
        return "Đợi duyệt"
    }
}

onMounted(() => {
    fetchData();
});
</script>
