import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// Shared state
const isAuthenticated = ref(false)
const userRole = ref(null)
const userInfo = ref(null)

// Initialize from localStorage
const initAuth = () => {
    const authStatus = localStorage.getItem('isAuthenticated')
    const role = localStorage.getItem('userRole')
    const mgv = localStorage.getItem('mgv')

    if (authStatus === 'true' && role) {
        isAuthenticated.value = true
        userRole.value = role
        userInfo.value = {
            mgv: mgv || 'Unknown',
            role: role
        }
    }
}

// Initialize on module load
initAuth()

export function useAuth() {
    const router = useRouter()

    // Computed properties
    const isAdmin = computed(() => userRole.value === 'admin')
    const isAuthor = computed(() => userRole.value === 'author')
    const isUser = computed(() => userRole.value === 'user')

    // Login function
    const login = async (mgv, password) => {
        try {
            // TODO: Replace with actual API call
            // For now, mock authentication
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Temporary validation
            if (mgv === 'admin' && password === 'admin123') {
                // Set authentication state
                isAuthenticated.value = true
                userRole.value = 'admin'
                userInfo.value = {
                    mgv: mgv,
                    role: 'admin',
                    name: 'Administrator'
                }

                // Persist to localStorage
                localStorage.setItem('isAuthenticated', 'true')
                localStorage.setItem('userRole', 'admin')
                localStorage.setItem('mgv', mgv)

                return { success: true }
            } else {
                return { 
                    success: false, 
                    error: 'Mã giảng viên hoặc mật khẩu không chính xác' 
                }
            }
        } catch (error) {
            return { 
                success: false, 
                error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' 
            }
        }
    }

    // Logout function
    const logout = () => {
        // Clear state
        isAuthenticated.value = false
        userRole.value = null
        userInfo.value = null

        // Clear localStorage
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('userRole')
        localStorage.removeItem('mgv')

        // Redirect to login
        router.push('/login')
    }

    // Check authentication
    const checkAuth = () => {
        return isAuthenticated.value
    }

    // Check role
    const hasRole = (role) => {
        return userRole.value === role
    }

    // Get current user
    const getCurrentUser = () => {
        return userInfo.value
    }

    return {
        // State
        isAuthenticated,
        userRole,
        userInfo,
        
        // Computed
        isAdmin,
        isAuthor,
        isUser,
        
        // Methods
        login,
        logout,
        checkAuth,
        hasRole,
        getCurrentUser,
        initAuth
    }
}
