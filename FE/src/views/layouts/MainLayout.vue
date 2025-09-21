<script setup>
import { 
    NInput, 
    NAvatar, 
    NSwitch, 
    NSpace, 
    NLayout, 
    NLayoutHeader, 
    NLayoutFooter,
    NLayoutContent,
    
}                           from    'naive-ui'
import { 
    ref 
}                           from    'vue'
import { 
    isDark, 
    toggleDark 
}                           from    '../../hooks/useDark'
</script>


<template>
<NLayout>
    <NLayoutHeader class="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 backdrop-blur">
        <div class="w-full px-2 sm:px-4 lg:px-6">
            <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-x-4 py-2 sm:py-3 lg:py-4">
                <!-- Mobile Layout: Logo + Avatar + Switch in one row -->
                <div class="flex sm:hidden w-full items-center justify-between mb-2">
                    <router-link to="/" class="inline-flex items-center gap-1.5">
                        <img src="/logo.png" alt="App logo" class="h-8 w-8 rounded-full object-cover bg-white dark:bg-slate-700 p-0.5 shadow-sm" />
                        <span class="text-sm font-semibold text-slate-800 dark:text-slate-200">Acties</span>
                    </router-link>
                    <div class="flex items-center gap-2">
                        <n-avatar round size="small" src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg" />
                        <n-switch v-model:value="isDark" size="small">
                            <template #icon>
                                <i class="fa-solid fa-sun text-xs" v-if="!isDark"></i>
                                <i class="fa-solid fa-moon text-xs" v-else></i>
                            </template>
                        </n-switch>
                    </div>
                </div>

                <!-- Mobile Layout: Search (full width) -->
                <div class="flex sm:hidden w-full mb-2">
                    <n-input placeholder="Search..." class="w-full" size="small" />
                </div>

                <!-- Mobile Layout: Navigation (horizontal scroll) -->
                <nav class="flex sm:hidden w-full overflow-x-auto pb-1">
                    <div class="flex items-center gap-1 min-w-max">
                        <router-link
                            to="/"
                            class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
                            active-class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                            exact-active-class="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50"
                        >Home</router-link>
                        <router-link
                            to="/about"
                            class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
                            active-class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                            exact-active-class="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50"
                        >About</router-link>
                        <router-link
                            to="/about/more"
                            class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
                            active-class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                            exact-active-class="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50"
                        >More</router-link>
                    </div>
                </nav>

                <!-- Desktop Layout: Left - Logo + Navigation -->
                <div class="hidden sm:flex items-center gap-2 flex-1 min-w-0">
                    <router-link to="/" class="inline-flex items-center gap-1.5 sm:gap-2">
                        <img src="/logo.png" alt="App logo" class="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-full object-cover bg-white dark:bg-slate-700 p-0.5 sm:p-1 shadow-sm" />
                        <span class="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-slate-800 dark:text-slate-200">Acties</span>
                    </router-link>
                    <nav class="flex items-center gap-0.5 sm:gap-1 ml-1 sm:ml-2 lg:ml-4">
                        <router-link
                            to="/"
                            class="inline-flex items-center rounded-md px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                            active-class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                            exact-active-class="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50"
                        >Home</router-link>
                        <router-link
                            to="/about"
                            class="inline-flex items-center rounded-md px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                            active-class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                            exact-active-class="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50"
                        >About</router-link>
                        <router-link
                            to="/about/more"
                            class="inline-flex items-center rounded-md px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                            active-class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                            exact-active-class="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50"
                        >More</router-link>
                    </nav>
                </div>

                <!-- Desktop Layout: Center - Search -->
                <div class="hidden sm:flex flex-1 justify-center">
                    <n-input 
                        placeholder="Search..." 
                        class="w-32 sm:w-40 md:w-48 lg:w-56 xl:w-64" 
                        size="small"
                    />
                </div>

                <!-- Desktop Layout: Right - Avatar + Switch -->
                <div class="hidden sm:flex flex-1 justify-end items-center pr-2 sm:pr-4">
                    <div class="flex items-center gap-2 sm:gap-3">
                        <!-- Avatar with username below -->
                        <div class="flex flex-col items-center">
                            <n-avatar
                                round
                                class="sm:!w-8 sm:!h-8 md:!w-10 md:!h-10 lg:!w-12 lg:!h-12 "
                                src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg"
                            />
                            <span class="text-xs sm:text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">Username</span>
                        </div>
                        <!-- Dark Theme Switch -->
                        <n-switch v-model:value="isDark" size="small" class="sm:scale-100 md:scale-110 lg:scale-125">
                            <template #icon>
                                <i class="fa-solid fa-sun text-xs" v-if="!isDark"></i>
                                <i class="fa-solid fa-moon text-xs" v-else></i>
                            </template>
                        </n-switch>
                    </div>
                </div>
            </div>
        </div>
    </NLayoutHeader>
    <NLayoutContent>
        <router-view></router-view>
    </NLayoutContent>
    <NLayoutFooter class="p-4">
        <router-link to="/" class="inline-flex items-center gap-1.5 sm:gap-2">
            <img src="/logo.png" alt="App logo" class="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-full object-cover bg-white dark:bg-slate-700 p-0.5 sm:p-1 shadow-sm" />
            <span class="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-slate-800 dark:text-slate-200">Acties</span>
        </router-link>
        
    </NLayoutFooter>
</NLayout>

</template>

<style scoped>
/* Hide scrollbar for mobile navigation */
nav::-webkit-scrollbar {
  display: none;
}
nav {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Ensure avatar sizes work properly */
.n-avatar {
  transition: all 0.2s ease;
}
</style>