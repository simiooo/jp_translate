import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserProfile, VerifyTokenResponse } from '~/types/auth'
import { alovaInstance, isStandardizedError } from '~/utils/request'
import { isErrorInCategory } from '~/types/errors'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  fetchProfile: () => Promise<void>
  verifyToken: () => Promise<boolean>
  setToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Post<{ token?: string; user?: User }>('/api/auth/login', {
            email,
            password
          })

          if (!res.token) {
            throw new Error('Token not found in response')
          }

          const token = `Bearer ${res.token}`
          localStorage.setItem('Authorization', token)

          set({
            user: res.user || null,
            token: res.token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await alovaInstance.Post('/api/auth/logout')
        } catch (error) {
          console.error('Logout API call failed:', error)
          if (isStandardizedError(error)) {
            console.log('Logout error code:', error.code, 'Message:', error.message)
          }
        } finally {
          localStorage.removeItem('Authorization')
          get().clearAuth()
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Post<{ token?: string; user?: User }>('/api/auth/register', {
            username,
            email,
            password
          })

          if (!res.token) {
            throw new Error('Token not found in response')
          }

          const token = `Bearer ${res.token}`
          localStorage.setItem('Authorization', token)

          set({
            user: res.user || null,
            token: res.token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      fetchProfile: async () => {
        set({ isLoading: true })
        try {
          const profile = await alovaInstance.Get<UserProfile>('/api/user/profile')
          set({
            profile,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          
          if (isStandardizedError(error)) {
            // If unauthorized, clear auth state
            if (error.code === 1006 || error.code === 1003 || error.code === 1004) {
              get().clearAuth()
            }
          } else if (error instanceof Error && error.message.includes('401')) {
            get().clearAuth()
          }
          throw error
        }
      },

      setToken: (token: string) => {
        localStorage.setItem('Authorization', `Bearer ${token}`)
        set({
          token,
          isAuthenticated: true
        })
      },

      verifyToken: async (): Promise<boolean> => {
        set({ isLoading: true })
        try {
          const response = await alovaInstance.Get<VerifyTokenResponse>('/user/verify')
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false
          })
          
          return true
        } catch (error) {
          set({ isLoading: false })
          
          if (isStandardizedError(error)) {
            // Check if it's an authentication-related error
            if (error.code && isErrorInCategory(error.code, 'AUTHENTICATION')) {
              // Clear auth state for authentication errors
              get().clearAuth()
              
              // Redirect to login page if we're not already there
              // Return false to indicate authentication failed, let layout handle navigation
              return false
              return false
            }
          } else if (error instanceof Error && error.message.includes('401')) {
            // Handle 401 Unauthorized errors
            get().clearAuth()
            // Return false to indicate authentication failed, let layout handle navigation
            return false
            return false
          }
          
          // For non-authentication errors, rethrow
          throw error
        }
      },

      clearAuth: () => {
        localStorage.removeItem('Authorization')
        set({
          user: null,
          profile: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Helper hooks for easier access to auth state
export const useUser = () => useAuthStore((state) => state.user)
export const useProfile = () => useAuthStore((state) => state.profile)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useIsLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  register: state.register,
  fetchProfile: state.fetchProfile,
  verifyToken: state.verifyToken,
  setToken: state.setToken,
  clearAuth: state.clearAuth
}))