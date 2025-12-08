import { ref, onMounted, watch } from "vue";

const isDark = ref(false);
onMounted(() => {
    const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDark.value = userPrefersDark;
})
watch(isDark, (newValue) => {
    if (newValue) {
        document.documentElement.classList.add('dark'); 
    } else {
        document.documentElement.classList.remove('dark');
    }
})
function toggleDark() {
    isDark.value = !isDark.value;
}
export { isDark, toggleDark };