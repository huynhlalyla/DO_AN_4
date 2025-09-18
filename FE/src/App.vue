
<script setup>
import { darkTheme, NConfigProvider } from 'naive-ui'
import { isDark } from './hooks/useDark';

</script>


<template>
<n-config-provider :theme="isDark ? darkTheme : null">
    <router-view></router-view>
</n-config-provider>
</template>

<style scoped>

</style>