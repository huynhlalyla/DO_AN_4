<script setup>
import { NInput, NAvatar, NSwitch, NSpace} from 'naive-ui'
import { ref } from 'vue'
import { isDark, toggleDark } from '../../hooks/useDark'
</script>


<template>
<header class="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
    <div class="w-full">
        <div class="flex items-center gap-x-4 py-3">
            <!-- Left: Logo / Brand + Navigation -->
            <div class="flex items-center gap-2 flex-1 min-w-0">
                <router-link to="/" class="inline-flex items-center gap-2">
                    <img src="/logo.png" alt="App logo" class="h-15 w-15 rounded-full object-cover shadow-md dark:bg-slate-200 mx-4 " />
                    <span class="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200">Acties</span>
                </router-link>
                <nav class="hidden sm:flex items-center gap-1 ml-2">
                    <router-link
                        to="/"
                        class="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                        active-class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        exact-active-class="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50"
                    >Home</router-link>
                    <router-link
                        to="/about"
                        class="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                        active-class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        exact-active-class="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50"
                    >About</router-link>
                    <router-link
                        to="/about/more"
                        class="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                        active-class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        exact-active-class="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50"
                    >More</router-link>
                </nav>
            </div>

            <!-- Center: Search -->
            <div class="flex-1 flex justify-center">
                <n-input placeholder="Search..." class="w-44 sm:w-56 md:w-64" />
            </div>

            <!-- Right: User avatar (kept as the right column to preserve centered search) -->
            <div class="flex-1 flex justify-end items-center pr-4">
                <div class="flex items-center gap-3">
                    <!-- Avatar with username below -->
                    <div class="flex flex-col items-center">
                        <n-avatar
                            round
                            size="medium"
                            src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg"
                        />
                        <span class="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">Username</span>
                    </div>
                    <!-- Dark Theme Switch -->
                    <n-switch v-model:value="isDark" >
                        <template #icon>
                            <i class="fa-solid fa-sun" v-if="!isDark"></i>
                            <i class="fa-solid fa-moon" v-else></i>
                        </template>
                    </n-switch>
                </div>
            </div>
        </div>
    </div>
</header>
<main>
    <router-view></router-view>
</main>
<footer></footer>
</template>

<style scoped>
/* Keep component-scoped styles here if needed */
</style>