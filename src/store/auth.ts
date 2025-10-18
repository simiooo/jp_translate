import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  User,
  UserProfile,
  VerifyTokenResponse,
  TokenResponse,
  AuthResponse,
  EmailVerificationStatus,
  EmailVerificationStatusResponse,
  Session,
  SessionsResponse,
  SessionStats,
  SessionStatsResponse,
  Device,
  DevicesResponse,
  AuditLogsResponse,
  PasswordValidationResponse
} from '~/types/auth'
import { alovaInstance, isStandardizedError } from '~/utils/request'
import { isErrorInCategory } from '~/types/errors'
import { useShallow } from 'zustand/shallow';

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
  refreshToken: () => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  validatePassword: (password: string) => Promise<boolean>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: () => Promise<void>
  getEmailVerificationStatus: () => Promise<EmailVerificationStatus>
  getSessions: () => Promise<Session[]>
  revokeAllSessions: (password: string) => Promise<void>
  getSessionStats: () => Promise<SessionStats>
  getDevices: () => Promise<Device[]>
  revokeDevice: (deviceId: number) => Promise<void>
  getAuditLogs: (params?: {
    email?: string
    event_type?: string
    success?: boolean
    start_time?: string
    end_time?: string
    limit?: number
    offset?: number
  }) => Promise<AuditLogsResponse>
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
          const res = await alovaInstance.Post<TokenResponse>('/api/auth/login', {
            email,
            password
          })

          const token = `Bearer ${res.access_token}`
          localStorage.setItem('Authorization', token)
          localStorage.setItem('refresh_token', res.refresh_token)

          set({
            user: res.user || null,
            token: res.access_token,
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
          const refreshToken = localStorage.getItem('refresh_token')
          await alovaInstance.Post('/api/auth/logout', {
            refresh_token: refreshToken
          })
        } catch (error) {
          console.error('Logout API call failed:', error)
          if (isStandardizedError(error)) {
            console.log('Logout error code:', error.code, 'Message:', error.message)
          }
        } finally {
          localStorage.removeItem('Authorization')
          localStorage.removeItem('refresh_token')
          get().clearAuth()
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Post<AuthResponse>('/api/auth/register', {
            username,
            email,
            password
          })

          const token = `Bearer ${res.data.token.access_token}`
          localStorage.setItem('Authorization', token)
          localStorage.setItem('refresh_token', res.data.token.refresh_token)

          set({
            user: res.data.user || null,
            token: res.data.token.access_token,
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
          // Use API-prefixed path to align with dev proxy and production reverse proxy
          const response = await alovaInstance.Get<VerifyTokenResponse>('/api/user/verify')
          
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
              // Return false to indicate authentication failed, let layout handle navigation
              return false
            }
          } else if (error instanceof Error && error.message.includes('401')) {
            // Handle 401 Unauthorized errors
            get().clearAuth()
            // Return false to indicate authentication failed, let layout handle navigation
            return false
          }
          
          // For non-authentication errors, rethrow
          throw error
        }
      },

      clearAuth: () => {
        localStorage.removeItem('Authorization')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          profile: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      // New authentication endpoints
      refreshToken: async () => {
        set({ isLoading: true })
        try {
          const refreshToken = localStorage.getItem('refresh_token')
          const res = await alovaInstance.Post<TokenResponse>('/api/auth/refresh', {
            refresh_token: refreshToken
          })

          const token = `Bearer ${res.access_token}`
          localStorage.setItem('Authorization', token)
          localStorage.setItem('refresh_token', res.refresh_token)

          set({
            user: res.user || null,
            token: res.access_token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        set({ isLoading: true })
        try {
          await alovaInstance.Post('/api/user/change-password', {
            old_password: oldPassword,
            new_password: newPassword
          })
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      validatePassword: async (password: string) => {
        const res = await alovaInstance.Post<PasswordValidationResponse>('/api/auth/validate-password', {
          password
        })
        return res.data.valid
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true })
        try {
          await alovaInstance.Post('/api/auth/verify-email', {
            token
          })
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      resendVerification: async () => {
        set({ isLoading: true })
        try {
          await alovaInstance.Post('/api/auth/resend-verification')
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      getEmailVerificationStatus: async () => {
        const res = await alovaInstance.Get<EmailVerificationStatusResponse>('/api/user/email-verification-status')
        return res.data
      },

      getSessions: async () => {
        const res = await alovaInstance.Get<SessionsResponse>('/api/user/sessions')
        return res.data.sessions
      },

      revokeAllSessions: async (password: string) => {
        set({ isLoading: true })
        try {
          await alovaInstance.Post('/api/user/sessions/revoke-all', {
            password
          })
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      getSessionStats: async () => {
        const res = await alovaInstance.Get<SessionStatsResponse>('/api/user/sessions/stats')
        return res.data
      },

      getDevices: async () => {
        const res = await alovaInstance.Get<DevicesResponse>('/api/user/devices')
        return res.data.devices
      },

      revokeDevice: async (deviceId: number) => {
        set({ isLoading: true })
        try {
          await alovaInstance.Delete(`/api/user/devices/${deviceId}`)
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      getAuditLogs: async (params = {}) => {
        const res = await alovaInstance.Get<AuditLogsResponse>('/api/user/audit-logs', {
          params
        })
        return res
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
export const useAuthActions = () => useAuthStore(useShallow((state) => ({
  login: state.login,
  logout: state.logout,
  register: state.register,
  fetchProfile: state.fetchProfile,
  verifyToken: state.verifyToken,
  refreshToken: state.refreshToken,
  changePassword: state.changePassword,
  validatePassword: state.validatePassword,
  verifyEmail: state.verifyEmail,
  resendVerification: state.resendVerification,
  getEmailVerificationStatus: state.getEmailVerificationStatus,
  getSessions: state.getSessions,
  revokeAllSessions: state.revokeAllSessions,
  getSessionStats: state.getSessionStats,
  getDevices: state.getDevices,
  revokeDevice: state.revokeDevice,
  getAuditLogs: state.getAuditLogs,
  setToken: state.setToken,
  clearAuth: state.clearAuth
})))