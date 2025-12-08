import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { guest: true }
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('../views/ForgotPassword.vue'),
        meta: { guest: true }
    },
    {
        path: '/',
        component: () => import('../views/layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Home',
                component: () => import('../views/Home.vue')
            },
            {
                path: 'events',
                name: 'Events',
                component: () => import('../views/Events.vue')
            },
            {
                path: 'events/:id',
                name: 'EventDetail',
                component: () => import('../views/EventDetail.vue')
            },
            {
                path: 'my-events',
                name: 'MyEvents',
                component: () => import('../views/MyEvents.vue')
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('../views/Profile.vue')
            },
            {
                path: 'scores',
                name: 'Scores',
                component: () => import('../views/Scores.vue')
            },
            // Routes cho Bí thư lớp
            {
                path: 'class-management',
                name: 'ClassManagement',
                component: () => import('../views/ClassManagement.vue'),
                meta: { requiresSecretary: true }
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Navigation guard
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('userToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else if (to.meta.guest && token) {
        next('/');
    } else if (to.meta.requiresSecretary && !userData.isSecretary) {
        next('/');
    } else {
        next();
    }
});

export default router;
