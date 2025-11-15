import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  User,
  UserProfile,
  VerifyTokenResponse,
  TokenResponse,
  EmailVerificationStatus,
  EmailVerificationStatusResponse,
  Session,
  SessionsResponse,
  SessionStats,
  SessionStatsResponse,
  Device,
  DevicesResponse,
  AuditLogsResponse,
  PasswordValidationResponse,
  PasswordResetResponse,
  PasswordResetValidateResponse
} from '~/types/auth'
import { alovaInstance, isStandardizedError } from '~/utils/request'
import { ErrorResponse, isErrorInCategory } from '~/types/errors'
import { useShallow } from 'zustand/shallow';

interface AuthState {
  user: User | null
  profile: UserProfile | null
  token: string | null
  refresh_token: string | null
  tokenExpiry: number | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (email: string, password: string, turnstileToken?: string) => Promise<void>
  logout: () => Promise<void>
  register: (username: string, email: string, password: string, turnstileToken?: string) => Promise<void>
  fetchProfile: () => Promise<void>
  verifyToken: () => Promise<boolean>
  refreshToken: () => Promise<void>
  shouldRefreshToken: () => boolean
  isTokenExpired: () => boolean
  ensureValidToken: () => Promise<boolean>
  initializeAuth: () => Promise<boolean>
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
  requestPasswordReset: (email: string) => Promise<void>
  validatePasswordResetToken: (token: string) => Promise<PasswordResetValidateResponse>
  resetPassword: (token: string, newPassword: string) => Promise<void>
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
      refresh_token: null,
      tokenExpiry: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (email: string, password: string, turnstileToken?: string) => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Post<TokenResponse | ErrorResponse>('/api/auth/login', {
            email,
            password,
            turnstileToken: turnstileToken
          })

          // Check if response is an error
          if (res && typeof res === 'object' && 'success' in res && res.success === false) {
            throw new Error((res as ErrorResponse).message || 'Login failed')
          }

          // Cast to TokenResponse since we've confirmed it's not an ErrorResponse
          const tokenRes = res as TokenResponse
          
          // Check if response has the expected structure
          if (!tokenRes.access_token) {
            throw new Error('Access token not found in response')
          }

          const token = `Bearer ${tokenRes.access_token}`
          localStorage.setItem('Authorization', token)
          localStorage.setItem('refresh_token', tokenRes.refresh_token)

          // Calculate token expiry time
          const tokenExpiry = Date.now() + (tokenRes.expires_in * 1000)
          
          // Store expiry in localStorage for initialization check
          localStorage.setItem('token_expiry', tokenExpiry.toString())

          set({
            user: tokenRes.user || null,
            token: tokenRes.access_token,
            refresh_token: tokenRes.refresh_token,
            tokenExpiry,
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

      register: async (username: string, email: string, password: string, turnstileToken?: string) => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Post<TokenResponse | ErrorResponse>('/api/auth/register', {
            username,
            email,
            password,
            turnstileToken: turnstileToken
          })

          // Check if response is an error
          if (res && typeof res === 'object' && 'success' in res && res.success === false) {
            throw new Error((res as ErrorResponse).message || 'Registration failed')
          }

          // Cast to TokenResponse since we've confirmed it's not an ErrorResponse
          const tokenRes = res as TokenResponse
          
          // Check if response has the expected structure
          if (!tokenRes.access_token) {
            throw new Error('Access token not found in response')
          }

          const token = `Bearer ${tokenRes.access_token}`
          localStorage.setItem('Authorization', token)
          localStorage.setItem('refresh_token', tokenRes.refresh_token)

          // Calculate token expiry time
          const tokenExpiry = Date.now() + (tokenRes.expires_in * 1000)
          
          // Store expiry in localStorage for initialization check
          localStorage.setItem('token_expiry', tokenExpiry.toString())

          set({
            user: tokenRes.user || null,
            token: tokenRes.access_token,
            refresh_token: tokenRes.refresh_token,
            tokenExpiry,
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
          // Use the correct auth verification endpoint
          const response = await alovaInstance.Get<VerifyTokenResponse>('/api/auth/verify')
          
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
        localStorage.removeItem('token_expiry')
        set({
          user: null,
          profile: null,
          token: null,
          refresh_token: null,
          tokenExpiry: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      // New authentication endpoints
      refreshToken: async () => {
        set({ isLoading: true })
        try {
          const refreshToken = localStorage.getItem('refresh_token')
          const res = await alovaInstance.Post<TokenResponse | ErrorResponse>('/api/auth/refresh', {
            refresh_token: refreshToken
          },{
            cacheFor: {
              mode: 'memory',
              expire: 60 * 5 * 1000
            }
          })

          // Check if response is an error
          if (res && typeof res === 'object' && 'success' in res && res.success === false) {
            throw new Error((res as ErrorResponse).message || 'Token refresh failed')
          }

          // Cast to TokenResponse since we've confirmed it's not an ErrorResponse
          const tokenRes = res as TokenResponse
          const token = `Bearer ${tokenRes.access_token}`
          localStorage.setItem('Authorization', token)
          localStorage.setItem('refresh_token', tokenRes.refresh_token)

          // Calculate token expiry time
          const tokenExpiry = Date.now() + (tokenRes.expires_in * 1000)
          
          // Store expiry in localStorage for initialization check
          localStorage.setItem('token_expiry', tokenExpiry.toString())

          set({
            user: tokenRes.user || null,
            token: tokenRes.access_token,
            refresh_token: tokenRes.refresh_token,
            tokenExpiry,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Check if token needs refresh
      shouldRefreshToken: (): boolean => {
        const { tokenExpiry } = get()
        if (!tokenExpiry) return false
        // Refresh if token expires in less than 5 minutes
        return tokenExpiry - Date.now() < 5 * 60 * 1000
      },

      // Check if token is expired
      isTokenExpired: (): boolean => {
        const { tokenExpiry } = get()
        if (!tokenExpiry) return true
        return tokenExpiry <= Date.now()
      },

      // Ensure we have a valid token, refreshing if needed
      ensureValidToken: async (): Promise<boolean> => {
        const { shouldRefreshToken, refreshToken, clearAuth } = get()
        
        
        if (shouldRefreshToken()) {
          try {
            await refreshToken()
            return true
          } catch (error) {
            console.error('Failed to refresh token:', error)
            clearAuth()
            return false
          }
        }
        
        return true
      },

      // Initialize authentication state from localStorage and validate with server
      initializeAuth: async (): Promise<boolean> => {
        set({ isLoading: true })
        
        try {
          // Check if tokens exist in localStorage
          const token = localStorage.getItem('Authorization')
          const refreshToken = localStorage.getItem('refresh_token')
          
          if (!token || !refreshToken) {
            // No tokens found, not authenticated
            set({ isAuthenticated: false, isLoading: false })
            return false
          }

          // Check if token is expired
          const tokenExpiry = localStorage.getItem('token_expiry')
          let isExpired = false
          
          if (tokenExpiry) {
            const expiryTime = parseInt(tokenExpiry, 10)
            isExpired = Date.now() >= expiryTime
          }

          // If token is expired, try to refresh it
          if (isExpired) {
            try {
              await get().refreshToken()
            } catch (error) {
              console.error('Token refresh failed during initialization:', error)
              get().clearAuth()
              set({ isAuthenticated: false, isLoading: false })
              return false
            }
          }

          // Verify token with server
          const isValid = await get().verifyToken()
          
          if (!isValid) {
            // Token verification failed, try refresh once more
            try {
              await get().refreshToken()
              const refreshedValid = await get().verifyToken()
              
              if (!refreshedValid) {
                get().clearAuth()
                set({ isAuthenticated: false, isLoading: false })
                return false
              }
            } catch (error) {
              console.error('Token verification and refresh failed:', error)
              get().clearAuth()
              set({ isAuthenticated: false, isLoading: false })
              return false
            }
          }

          // Successfully authenticated
          set({ isAuthenticated: true, isLoading: false })
          return true
          
        } catch (error) {
          console.error('Authentication initialization failed:', error)
          get().clearAuth()
          set({ isAuthenticated: false, isLoading: false })
          return false
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
      },

      requestPasswordReset: async (email: string) => {
        set({ isLoading: true })
        try {
          await alovaInstance.Post<PasswordResetResponse>('/api/auth/password-reset/request', {
            email
          })
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      validatePasswordResetToken: async (token: string) => {
        set({ isLoading: true })
        try {
          const response = await alovaInstance.Post<PasswordResetValidateResponse>('/api/auth/password-reset/validate', {
            token
          })
          set({ isLoading: false })
          return response
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      resetPassword: async (token: string, newPassword: string) => {
        set({ isLoading: true })
        try {
          await alovaInstance.Post<PasswordResetResponse>('/api/auth/password-reset/reset', {
            token,
            new_password: newPassword
          })
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
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
  requestPasswordReset: state.requestPasswordReset,
  validatePasswordResetToken: state.validatePasswordResetToken,
  resetPassword: state.resetPassword,
  setToken: state.setToken,
  clearAuth: state.clearAuth
})))