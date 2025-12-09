import { createWebHistory, createRouter } from 'vue-router'

// Layouts
import AdminLayout from '../views/layouts/AdminLayout.vue'

// Pages
import LoginView from '../views/pages/LoginView.vue'
import AdminDashboard from '../views/pages/AdminDashboard.vue'
import FacultyManagement from '../views/pages/FacultyManagement.vue'
import FacultyDashboard from '../views/pages/FacultyDashboard.vue'
import FacultyOverview from '../views/pages/FacultyOverview.vue'
import ClassManagement from '../views/pages/ClassManagement.vue'
import StudentManagement from '../views/pages/StudentManagement.vue'
import EventManagement from '../views/pages/EventManagement.vue'
import SemesterManagement from '../views/pages/SemesterManagement.vue'
import AssessmentConfig from '../views/pages/AssessmentConfig.vue'
import AttendanceCheck from '../views/pages/AttendanceCheck.vue'
// import UserManagement from '../views/pages/UserManagement.vue' // DEPRECATED
import AdminManagement from '../views/pages/AdminManagement.vue'
import SecretaryManagement from '../views/pages/SecretaryManagement.vue'
import AdminProfile from '../views/pages/AdminProfile.vue'

// Auth guard helper
const isAuthenticated = () => {
  return localStorage.getItem('isAuthenticated') === 'true'
}

const routes = [
  // Login Route
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true }
  },

  // Attendance Routes (Public/Standalone)
  {
    path: '/attendance/:id',
    name: 'AttendanceCheck',
    component: AttendanceCheck
  },

  // Admin Routes (Protected) - Root is now admin dashboard
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: AdminProfile
      },
      // Data Management
      {
        path: 'faculties',
        name: 'FacultyManagement',
        component: FacultyManagement
      },
      {
        path: 'faculty-dashboard',
        name: 'FacultyDashboard',
        component: FacultyDashboard
      },
      {
        path: 'faculties-overview',
        name: 'FacultyOverview',
        component: FacultyOverview
      },
      {
        path: 'classes',
        name: 'ClassManagement',
        component: ClassManagement
      },
      {
        path: 'students',
        name: 'StudentManagement',
        component: StudentManagement
      },
      // {
      //   path: 'users',
      //   name: 'UserManagement',
      //   component: UserManagement
      // }, // DEPRECATED - không dùng User nữa
      {
        path: 'admins',
        name: 'AdminManagement',
        component: AdminManagement
      },
      {
        path: 'secretaries',
        name: 'SecretaryManagement',
        component: SecretaryManagement
      },
      // Event & Assessment
      {
        path: 'events',
        name: 'EventManagement',
        component: EventManagement
      },
      {
        path: 'semesters',
        name: 'SemesterManagement',
        component: SemesterManagement
      },
      {
        path: 'assessment-config',
        name: 'AssessmentConfig',
        component: AssessmentConfig
      }
      // Các route tạm thời loại bỏ: students/points, attendance, reports, settings
    ]
  },

  // 404 Not Found
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation Guards
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated()
  const userRole = localStorage.getItem('userRole')

  // If route requires authentication
  if (to.meta.requiresAuth) {
    if (!authenticated) {
      // Not authenticated, redirect to login
      next('/login')
    } else if (to.meta.role && to.meta.role !== userRole) {
      // Authenticated but wrong role
      next('/login')
    } else {
      // Authenticated and authorized
      next()
    }
  } 
  // If route requires guest (login page)
  else if (to.meta.requiresGuest) {
    if (authenticated) {
      // Already authenticated, redirect to root (admin dashboard)
      next('/')
    } else {
      next()
    }
  }
  // Public route
  else {
    next()
  }
})