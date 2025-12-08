<script setup>
import { ref, h, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
    NLayout,
    NLayoutHeader,
    NLayoutSider,
    NLayoutContent,
    NLayoutFooter,
    NMenu,
    NAvatar,
    NDropdown,
    NSpace,
    NSwitch,
    NIcon,
    NBreadcrumb,
    NBreadcrumbItem,
    NButton,
    NDrawer,
    NDrawerContent
} from 'naive-ui'
import { isDark, toggleDark } from '../../hooks/useDark'

const router = useRouter()
const route = useRoute()

// Sidebar state
const collapsed = ref(false)
const mobileDrawerActive = ref(false)

// User info (from localStorage)
const userData = computed(() => {
    const userDataStr = localStorage.getItem('userData')
    if (userDataStr) {
        return JSON.parse(userDataStr)
    }
    return null
})

const userInfo = computed(() => ({
    name: userData.value?.fullName || localStorage.getItem('adminCode') || 'Admin',
    role: userData.value?.level === 'University' ? 'Bí thư Trường' : 'Bí thư Khoa',
    level: userData.value?.level || 'University'
}))

// Menu items với điều kiện hiển thị dựa trên level
const menuOptions = computed(() => {
    const isUniversity = userInfo.value.level === 'University'
    
    const baseMenus = [
        {
            label: 'Trang chủ',
            key: 'dashboard',
            icon: () => h('i', { class: 'fa-solid fa-house' }),
            path: '/'
        }
    ]

    // Menu Quản lý dữ liệu
    const dataManagementChildren = []

    // University level - Hiển thị tất cả
    if (isUniversity) {
        dataManagementChildren.push({
            label: 'Quản lý Bí thư Đoàn',
            key: 'secretaries',
            icon: () => h('i', { class: 'fa-solid fa-user-tie' }),
            path: '/secretaries'
        })
        dataManagementChildren.push({
            label: 'Quản lý các Khoa',
            key: 'faculties-overview',
            icon: () => h('i', { class: 'fa-solid fa-building-columns' }),
            path: '/faculties-overview'
        })
    } else {
        // Department level - Hiển thị Dashboard khoa và Bí thư Đoàn (chỉ Bí thư Lớp)
        dataManagementChildren.push({
            label: 'Quản lý Bí thư Đoàn',
            key: 'secretaries',
            icon: () => h('i', { class: 'fa-solid fa-user-tie' }),
            path: '/secretaries'
        })
        dataManagementChildren.push({
            label: 'Thống kê Khoa',
            key: 'faculty-dashboard',
            icon: () => h('i', { class: 'fa-solid fa-chart-line' }),
            path: '/faculty-dashboard'
        })
    }

    // Cả 2 level đều thấy Lớp và Sinh viên
    dataManagementChildren.push(
        {
            label: 'Quản lý Lớp',
            key: 'classes',
            icon: () => h('i', { class: 'fa-solid fa-chalkboard-user' }),
            path: '/classes'
        },
        {
            label: 'Quản lý Sinh viên',
            key: 'students-data',
            icon: () => h('i', { class: 'fa-solid fa-user-graduate' }),
            path: '/students'
        }
    )

    baseMenus.push({
        label: 'Quản lý dữ liệu',
        key: 'data-management',
        icon: () => h('i', { class: 'fa-solid fa-database' }),
        children: dataManagementChildren
    })

    // Menu Quản lý sự kiện (cả 2 level)
    baseMenus.push({
        label: 'Quản lý sự kiện',
        key: 'events',
        icon: () => h('i', { class: 'fa-solid fa-calendar-days' }),
        children: [
            {
                label: 'Danh sách sự kiện',
                key: 'events-list',
                icon: () => h('i', { class: 'fa-solid fa-list' }),
                path: '/events'
            },
            {
                label: 'Quản lý Học kỳ',
                key: 'semesters',
                icon: () => h('i', { class: 'fa-solid fa-calendar-check' }),
                path: '/semesters'
            },
            {
                label: 'Cấu hình bảng điểm',
                key: 'assessment-config',
                icon: () => h('i', { class: 'fa-solid fa-table-list' }),
                path: '/assessment-config'
            }
        ]
    })

    return baseMenus
})

// Active menu key based on current route
const activeKey = computed(() => {
    const path = route.path
    const findKey = (items) => {
        for (const item of items) {
            if (item.path === path) return item.key
            if (item.children) {
                const childKey = findKey(item.children)
                if (childKey) return childKey
            }
        }
        return null
    }
    return findKey(menuOptions.value) || 'dashboard'
})

// Handle menu click
const handleMenuClick = (key, item) => {
    if (item.path) {
        router.push(item.path)
        mobileDrawerActive.value = false
    }
}

// User dropdown options
const userDropdownOptions = [
    {
        label: 'Thông tin cá nhân',
        key: 'profile',
        icon: () => h('i', { class: 'fa-solid fa-user' })
    },
    {
        label: 'Đổi mật khẩu',
        key: 'change-password',
        icon: () => h('i', { class: 'fa-solid fa-key' })
    },
    {
        type: 'divider'
    },
    {
        label: 'Đăng xuất',
        key: 'logout',
        icon: () => h('i', { class: 'fa-solid fa-right-from-bracket' })
    }
]

// Handle user dropdown
const handleUserDropdown = (key) => {
    if (key === 'logout') {
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('userRole')
        localStorage.removeItem('adminCode')
        localStorage.removeItem('userData')
        router.push('/login')
    }
    // TODO: Handle other dropdown actions
}

// Breadcrumb items
const breadcrumbItems = computed(() => {
    const items = []
    const segments = route.path.split('/').filter(Boolean)
    
    let path = ''
    for (const segment of segments) {
        path += `/${segment}`
        const label = segment.charAt(0).toUpperCase() + segment.slice(1)
        items.push({ label, path })
    }
    
    return items
})
</script>

<template>
<NLayout has-sider class="min-h-screen">
    <!-- Desktop Sidebar -->
    <NLayoutSider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
        class="hidden lg:block"
        :native-scrollbar="false"
    >
        <!-- Logo Section -->
        <div class="flex items-center justify-center py-4 border-b border-slate-200 dark:border-slate-700">
            <router-link to="/" class="flex items-center gap-2">
                <img 
                    src="/logo.png" 
                    alt="Logo" 
                    :class="collapsed ? 'h-8 w-8' : 'h-10 w-10'"
                    class="rounded-full object-cover transition-all duration-300"
                />
                <span 
                    v-show="!collapsed" 
                    class="text-lg font-bold text-slate-800 dark:text-slate-200"
                >
                    Acties Admin
                </span>
            </router-link>
        </div>

        <!-- Menu -->
        <NMenu
            :collapsed="collapsed"
            :collapsed-width="64"
            :collapsed-icon-size="20"
            :options="menuOptions"
            :value="activeKey"
            @update:value="handleMenuClick"
            class="py-4"
        />
    </NLayoutSider>

    <!-- Mobile Drawer -->
    <NDrawer 
        v-model:show="mobileDrawerActive" 
        :width="280"
        placement="left"
        class="lg:hidden"
    >
        <NDrawerContent title="Menu" :native-scrollbar="false">
            <!-- Logo -->
            <div class="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <img src="/logo.png" alt="Logo" class="h-10 w-10 rounded-full object-cover" />
                <span class="text-lg font-bold text-slate-800 dark:text-slate-200">Acties Admin</span>
            </div>

            <!-- Mobile Menu -->
            <NMenu
                :options="menuOptions"
                :value="activeKey"
                @update:value="handleMenuClick"
            />
        </NDrawerContent>
    </NDrawer>

    <!-- Main Layout -->
    <NLayout>
        <!-- Header -->
        <NLayoutHeader bordered class="px-4 py-3">
            <div class="flex items-center justify-between">
                <!-- Left: Mobile menu + Breadcrumb -->
                <div class="flex items-center gap-3">
                    <!-- Mobile Menu Button -->
                    <NButton 
                        text 
                        @click="mobileDrawerActive = true"
                        class="lg:hidden"
                    >
                        <template #icon>
                            <i class="fa-solid fa-bars text-xl"></i>
                        </template>
                    </NButton>

                    <!-- Breadcrumb -->
                    <NBreadcrumb>
                        <NBreadcrumbItem 
                            v-for="item in breadcrumbItems" 
                            :key="item.path"
                        >
                            <router-link :to="item.path" class="hover:text-blue-600">
                                {{ item.label }}
                            </router-link>
                        </NBreadcrumbItem>
                    </NBreadcrumb>
                </div>

                <!-- Right: Dark mode + User -->
                <NSpace align="center" :size="16">
                    <!-- Dark Mode Switch -->
                    <NSwitch v-model:value="isDark" size="medium">
                        <template #checked-icon>
                            <i class="fa-solid fa-moon"></i>
                        </template>
                        <template #unchecked-icon>
                            <i class="fa-solid fa-sun"></i>
                        </template>
                    </NSwitch>

                    <!-- User Dropdown -->
                    <NDropdown 
                        :options="userDropdownOptions" 
                        @select="handleUserDropdown"
                        trigger="click"
                    >
                        <div class="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors">
                            <NAvatar
                                round
                                size="small"
                                src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg"
                            />
                            <div class="hidden sm:block">
                                <div class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {{ userInfo.name }}
                                </div>
                                <div class="text-xs text-slate-500 dark:text-slate-400">
                                    {{ userInfo.role }}
                                </div>
                            </div>
                            <i class="fa-solid fa-chevron-down text-xs text-slate-400"></i>
                        </div>
                    </NDropdown>
                </NSpace>
            </div>
        </NLayoutHeader>

        <!-- Content -->
        <NLayoutContent 
            class="p-4 sm:p-6"
            :native-scrollbar="false"
            content-style="min-height: calc(100vh - 120px);"
        >
            <router-view></router-view>
        </NLayoutContent>

        <!-- Footer -->
        <NLayoutFooter 
            bordered 
            class="px-6 py-4"
        >
            <div class="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
                <div>© 2025 Acties - Hệ thống quản lý sự kiện & điểm rèn luyện</div>
                <div>Phiên bản 1.0.0</div>
            </div>
        </NLayoutFooter>
    </NLayout>
</NLayout>
</template>

<style scoped>
/* Smooth transitions */
:deep(.n-layout-sider) {
    transition: all 0.3s ease;
}

/* Menu styling */
:deep(.n-menu-item-content) {
    transition: all 0.2s ease;
}

:deep(.n-menu-item-content:hover) {
    transform: translateX(2px);
}

/* Breadcrumb links */
:deep(.n-breadcrumb-item a) {
    transition: color 0.2s ease;
}
</style>
