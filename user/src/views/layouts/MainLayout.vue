<template>
    <n-config-provider :theme="isDark ? darkTheme : null">
        <n-message-provider>
            <n-dialog-provider>
                <n-layout has-sider style="min-height: 100vh;">
                    <!-- Main Content Area -->
                    <n-layout>
                        <!-- Header -->
                        <n-layout-header bordered style="height: 64px; padding: 0;">
                            <div class="header-container">
                                <!-- Logo -->
                                <div class="logo-section" @click="$router.push('/')">
                                    <div class="logo-icon">
                                        <i class="fa-solid fa-graduation-cap"></i>
                                    </div>
                                    <span class="logo-text">Acties Student</span>
                                </div>

                                <!-- Navigation -->
                                <nav class="nav-desktop">
                                    <router-link to="/" class="nav-link" :class="{ 'active': $route.path === '/' }">
                                        <i class="fa-solid fa-house"></i>
                                        <span>Trang chủ</span>
                                    </router-link>
                                    <router-link to="/events" class="nav-link" :class="{ 'active': $route.path.startsWith('/events') }">
                                        <i class="fa-solid fa-calendar-days"></i>
                                        <span>Sự kiện</span>
                                    </router-link>
                                    <router-link to="/my-events" class="nav-link" :class="{ 'active': $route.path === '/my-events' }">
                                        <i class="fa-solid fa-bookmark"></i>
                                        <span>Sự kiện của tôi</span>
                                    </router-link>
                                    <router-link to="/scores" class="nav-link" :class="{ 'active': $route.path === '/scores' }">
                                        <i class="fa-solid fa-chart-line"></i>
                                        <span>Điểm rèn luyện</span>
                                    </router-link>
                                    <router-link 
                                        v-if="userData.isSecretary" 
                                        to="/class-management" 
                                        class="nav-link" 
                                        :class="{ 'active': $route.path === '/class-management' }"
                                    >
                                        <i class="fa-solid fa-users"></i>
                                        <span>Quản lý lớp</span>
                                    </router-link>
                                </nav>

                                <!-- Right Section -->
                                <div class="header-right">
                                    <!-- Dark Mode Toggle -->
                                    <n-button 
                                        text 
                                        @click="toggleDark" 
                                        class="dark-toggle-btn"
                                        :focusable="false"
                                    >
                                        <template #icon>
                                            <i v-if="isDark" class="fa-solid fa-sun icon-sun"></i>
                                            <i v-else class="fa-solid fa-moon icon-moon"></i>
                                        </template>
                                    </n-button>

                                    <!-- User Menu -->
                                    <n-dropdown :options="userMenuOptions" @select="handleMenuSelect">
                                        <div class="user-menu-trigger">
                                            <n-avatar 
                                                round 
                                                size="small" 
                                                :style="{ backgroundColor: '#2563eb' }"
                                            >
                                                {{ userInitials }}
                                            </n-avatar>
                                            <div class="user-info">
                                                <div class="user-name">{{ userData.fullName }}</div>
                                                <div class="user-code">{{ userData.studentCode }}</div>
                                            </div>
                                            <i class="fa-solid fa-chevron-down chevron-icon"></i>
                                        </div>
                                    </n-dropdown>

                                    <!-- Mobile Menu Button -->
                                    <n-button 
                                        text 
                                        class="mobile-menu-btn"
                                        @click="showMobileMenu = true"
                                        :focusable="false"
                                    >
                                        <template #icon>
                                            <i class="fa-solid fa-bars"></i>
                                        </template>
                                    </n-button>
                                </div>
                            </div>
                        </n-layout-header>

                        <!-- Content -->
                        <n-layout-content 
                            class="p-6!"
                            :native-scrollbar="false"
                        >
                            <div class="content-wrapper">
                                <router-view />
                            </div>
                        </n-layout-content>
                    </n-layout>

                    <!-- Mobile Menu Drawer -->
                    <n-drawer v-model:show="showMobileMenu" :width="280" placement="right">
                        <n-drawer-content title="Menu" :native-scrollbar="false">
                            <n-menu 
                                :options="mobileMenuOptions" 
                                @update:value="handleMobileMenuSelect"
                            />
                            
                            <!-- Dark Mode Toggle in Mobile -->
                            <n-divider />
                            <div style="padding: 12px;">
                                <n-button 
                                    block 
                                    @click="toggleDark"
                                    :type="isDark ? 'warning' : 'default'"
                                >
                                    <template #icon>
                                        <i v-if="isDark" class="fa-solid fa-sun"></i>
                                        <i v-else class="fa-solid fa-moon"></i>
                                    </template>
                                    {{ isDark ? 'Chế độ sáng' : 'Chế độ tối' }}
                                </n-button>
                            </div>
                        </n-drawer-content>
                    </n-drawer>
                </n-layout>
            </n-dialog-provider>
        </n-message-provider>
    </n-config-provider>
</template>

<script setup>
import { ref, h, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
    NLayout,
    NLayoutHeader,
    NLayoutContent,
    NConfigProvider, 
    NMessageProvider, 
    NDialogProvider, 
    NDropdown, 
    NDrawer, 
    NDrawerContent,
    NButton,
    NAvatar,
    NMenu,
    NDivider,
    darkTheme
} from 'naive-ui';
import { authAPI } from '../../services/api';
import { useDark } from '../../hooks/useDark';

const router = useRouter();
const showMobileMenu = ref(false);
const { isDark, toggleDark } = useDark();

const userData = computed(() => {
    return JSON.parse(localStorage.getItem('userData') || '{}');
});

const userInitials = computed(() => {
    const name = userData.value.fullName || '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
});

const userMenuOptions = [
    {
        label: 'Trang cá nhân',
        key: 'profile',
        icon: () => h('i', { class: 'fa-solid fa-user' })
    },
    {
        type: 'divider'
    },
    {
        label: 'Đăng xuất',
        key: 'logout',
        icon: () => h('i', { class: 'fa-solid fa-right-from-bracket' })
    }
];

const mobileMenuOptions = computed(() => {
    const options = [
        {
            label: 'Trang chủ',
            key: '/',
            icon: () => h('i', { class: 'fa-solid fa-house' })
        },
        {
            label: 'Sự kiện',
            key: '/events',
            icon: () => h('i', { class: 'fa-solid fa-calendar-days' })
        },
        {
            label: 'Sự kiện của tôi',
            key: '/my-events',
            icon: () => h('i', { class: 'fa-solid fa-bookmark' })
        },
        {
            label: 'Điểm rèn luyện',
            key: '/scores',
            icon: () => h('i', { class: 'fa-solid fa-chart-line' })
        }
    ];

    if (userData.value.isSecretary) {
        options.push({
            label: 'Quản lý lớp',
            key: '/class-management',
            icon: () => h('i', { class: 'fa-solid fa-users' })
        });
    }

    return options;
});

const handleMenuSelect = (key) => {
    if (key === 'profile') {
        router.push('/profile');
    } else if (key === 'logout') {
        authAPI.logout();
    }
};

const handleMobileMenuSelect = (key) => {
    router.push(key);
    showMobileMenu.value = false;
};
</script>

<style scoped>
/* Header Container */
.header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 24px;
    max-width: 1400px;
    margin: 0 auto;
}

/* Logo Section */
.logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    user-select: none;
}

.logo-icon {
    width: 40px;
    height: 40px;
    background: #2563eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
}

.logo-text {
    font-size: 20px;
    font-weight: 700;
}

/* Desktop Navigation */
.nav-desktop {
    display: none;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: center;
}

@media (min-width: 768px) {
    .nav-desktop {
        display: flex;
    }
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s;
    text-decoration: none;
}

.nav-link i {
    font-size: 16px;
}

.nav-link.active {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
}

/* Header Right */
.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.dark-toggle-btn {
    display: none;
}

@media (min-width: 768px) {
    .dark-toggle-btn {
        display: flex;
    }
}

.icon-sun {
    color: #fbbf24;
    font-size: 18px;
}

.icon-moon {
    font-size: 18px;
}

/* User Menu */
.user-menu-trigger {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.user-menu-trigger:hover {
    background: rgba(0, 0, 0, 0.05);
}

.user-info {
    display: none;
}

@media (min-width: 640px) {
    .user-info {
        display: block;
        text-align: left;
    }
}

.user-name {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
}

.user-code {
    font-size: 12px;
    opacity: 0.7;
    line-height: 1.2;
}

.chevron-icon {
    font-size: 12px;
    opacity: 0.5;
}

/* Mobile Menu Button */
.mobile-menu-btn {
    display: flex;
}

@media (min-width: 768px) {
    .mobile-menu-btn {
        display: none;
    }
}

.mobile-menu-btn i {
    font-size: 20px;
}

/* Content Wrapper */
.content-wrapper {
    max-width: 1400px;
    margin: 0 auto;
}
</style>
