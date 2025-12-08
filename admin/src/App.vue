
<script setup>
import { darkTheme, NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import { isDark } from './hooks/useDark';

</script>


<template>
<n-config-provider :theme="isDark ? darkTheme : null">
    <n-message-provider>
        <n-dialog-provider>
            <router-view></router-view>
        </n-dialog-provider>
    </n-message-provider>
</n-config-provider>
</template>

<style scoped>

</style>