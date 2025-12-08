import { ref, watch, onMounted } from 'vue';

export function useDark() {
    const isDark = ref(false);

    // Khởi tạo từ localStorage hoặc system preference
    const initDarkMode = () => {
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            isDark.value = saved === 'true';
        } else {
            // Check system preference
            isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        applyDarkMode();
    };

    // Áp dụng dark mode
    const applyDarkMode = () => {
        if (isDark.value) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Toggle dark mode
    const toggleDark = () => {
        isDark.value = !isDark.value;
    };

    // Watch changes và lưu vào localStorage
    watch(isDark, (newValue) => {
        localStorage.setItem('darkMode', newValue.toString());
        applyDarkMode();
    });

    onMounted(() => {
        initDarkMode();
    });

    return {
        isDark,
        toggleDark
    };
}
