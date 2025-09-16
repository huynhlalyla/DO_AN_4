<script setup>
import { NInput } from 'naive-ui'
</script>


<template>
<header class="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <!-- Left: Logo / Brand -->
                    <div class="order-1 flex items-center gap-2">
                <router-link to="/" class="inline-flex items-center gap-2">
                            <img src="/logo.png" alt="App logo" class="h-12 w-auto sm:h-14 md:h-16" />
                            <span class="text-lg sm:text-xl font-semibold text-slate-800"></span>
                </router-link>
            </div>

            <!-- Right: Search -->
            <div class="order-2 ml-auto sm:order-3">
                <n-input placeholder="Search..." class="w-44 sm:w-56 md:w-64" />
            </div>

            <!-- Center: Navigation -->
            <nav class="order-3 flex w-full items-center justify-center gap-1 sm:order-2 sm:w-auto sm:justify-start">
                <router-link
                    to="/"
                    class="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    active-class="text-blue-600 bg-blue-50 hover:bg-blue-50"
                    exact-active-class="text-blue-700 bg-blue-100"
                >Home</router-link>
                <router-link
                    to="/about"
                    class="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    active-class="text-blue-600 bg-blue-50 hover:bg-blue-50"
                    exact-active-class="text-blue-700 bg-blue-100"
                >About</router-link>
                <router-link
                    to="/about/more"
                    class="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    active-class="text-blue-600 bg-blue-50 hover:bg-blue-50"
                    exact-active-class="text-blue-700 bg-blue-100"
                >More</router-link>
            </nav>
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