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

/**
 * Helper function to check if a response is an ErrorResponse
 */
function isErrorResponse(response: unknown): response is ErrorResponse {
  return response !== null &&
         typeof response === 'object' &&
         'success' in response &&
         response.success === false &&
         'code' in response &&
         'message' in response;
}

/**
 * Helper function to handle API responses and throw standardized errors
 */
function handleApiResponse<T>(response: T | ErrorResponse, defaultErrorMessage: string): T {
  if (isErrorResponse(response)) {
    const error: Error & Partial<ErrorResponse> = new Error(response.message || defaultErrorMessage);
    error.code = response.code;
    error.details = response.details;
    error.timestamp = response.timestamp;
    error.request_id = response.request_id;
    throw error;
  }
  return response;
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  token: string | null
  refresh_token: string | null
  tokenExpiry: number | null
  isAuthenticated: boolean
  isLoading: boolean
  isRefreshing: boolean
  refreshPromise: Promise<void> | null
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
      isRefreshing: false,
      refreshPromise: null,

      // Actions
      login: async (email: string, password: string, turnstileToken?: string) => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Post<TokenResponse | ErrorResponse>('/api/auth/login', {
            email,
            password,
            turnstileToken: turnstileToken
          })

          // Handle potential ErrorResponse
          const tokenRes = handleApiResponse<TokenResponse>(res, 'Login failed')

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
          if (refreshToken) {
            await alovaInstance.Post('/api/auth/logout', {
              refresh_token: refreshToken
            })
          }
        } catch (error) {
          console.error('Logout API call failed:', error)
          if (isStandardizedError(error)) {
            console.log('Logout error code:', error.code, 'Message:', error.message)
          }
        } finally {
          localStorage.removeItem('Authorization')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('token_expiry')
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

          // Handle potential ErrorResponse
          const tokenRes = handleApiResponse<TokenResponse>(res, 'Registration failed')

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
          const profile = await alovaInstance.Get<UserProfile | ErrorResponse>('/api/user/profile')
          
          // Handle potential ErrorResponse
          const validProfile = handleApiResponse<UserProfile>(profile, 'Failed to fetch user profile')
          
          set({
            profile: validProfile,
            isLoading: false
          })
          console.log(validProfile);
          
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
          const response = await alovaInstance.Get<VerifyTokenResponse | ErrorResponse>('/api/auth/verify')
          
          // Handle potential ErrorResponse
          const validResponse = handleApiResponse<VerifyTokenResponse>(response, 'Token verification failed')
          
          set({
            user: validResponse.user,
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
          isLoading: false,
          isRefreshing: false,
          refreshPromise: null
        })
      },

      // New authentication endpoints
      refreshToken: async () => {
        const { isRefreshing, refreshPromise } = get()
        
        // If already refreshing, return the existing promise
        if (isRefreshing && refreshPromise) {
          return refreshPromise
        }
        
        // Create a new refresh promise
        const newRefreshPromise = (async () => {
          try {
            set({ isLoading: true, isRefreshing: true })
            const refreshToken = localStorage.getItem('refresh_token')
            
            if (!refreshToken) {
              throw new Error('No refresh token available')
            }
            
            const res = await alovaInstance.Post<TokenResponse | ErrorResponse>('/api/auth/refresh', {
              refresh_token: refreshToken
            },{
              cacheFor: {
                mode: 'memory',
                expire: 60 * 5 * 1000
              }
            })

            // Handle potential ErrorResponse
            const tokenRes = handleApiResponse<TokenResponse>(res, 'Token refresh failed')

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
              isLoading: false,
              isRefreshing: false,
              refreshPromise: null
            })
          } catch (error) {
            set({
              isLoading: false,
              isRefreshing: false,
              refreshPromise: null
            })
            throw error
          }
        })()
        
        // Store the promise and return it
        set({ refreshPromise: newRefreshPromise })
        return newRefreshPromise
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
          const res = await alovaInstance.Post<ErrorResponse | { success: true }>('/api/user/change-password', {
            old_password: oldPassword,
            new_password: newPassword
          })
          
          // Handle potential ErrorResponse
          handleApiResponse(res, 'Password change failed')
          
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      validatePassword: async (password: string) => {
        const res = await alovaInstance.Post<PasswordValidationResponse | ErrorResponse>('/api/auth/validate-password', {
          password
        })
        
        // Handle potential ErrorResponse
        const validRes = handleApiResponse<PasswordValidationResponse>(res, 'Password validation failed')
        return validRes.data.valid
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Post<ErrorResponse | { success: true }>('/api/auth/verify-email', {
            token
          })
          
          // Handle potential ErrorResponse
          handleApiResponse(res, 'Email verification failed')
          
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      resendVerification: async () => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Post<ErrorResponse | { success: true }>('/api/auth/resend-verification')
          
          // Handle potential ErrorResponse
          handleApiResponse(res, 'Failed to resend verification email')
          
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      getEmailVerificationStatus: async () => {
        const res = await alovaInstance.Get<EmailVerificationStatusResponse | ErrorResponse>('/api/user/email-verification-status')
        
        // Handle potential ErrorResponse
        const validRes = handleApiResponse<EmailVerificationStatusResponse>(res, 'Failed to get email verification status')
        return validRes.data
      },

      getSessions: async () => {
        const res = await alovaInstance.Get<SessionsResponse | ErrorResponse>('/api/user/sessions')
        
        // Handle potential ErrorResponse
        const validRes = handleApiResponse<SessionsResponse>(res, 'Failed to fetch sessions')
        return validRes.data.sessions
      },

      revokeAllSessions: async (password: string) => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Post<ErrorResponse | { success: true }>('/api/user/sessions/revoke-all', {
            password
          })
          
          // Handle potential ErrorResponse
          handleApiResponse(res, 'Failed to revoke all sessions')
          
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      getSessionStats: async () => {
        const res = await alovaInstance.Get<SessionStatsResponse | ErrorResponse>('/api/user/sessions/stats')
        
        // Handle potential ErrorResponse
        const validRes = handleApiResponse<SessionStatsResponse>(res, 'Failed to fetch session stats')
        return validRes.data
      },

      getDevices: async () => {
        const res = await alovaInstance.Get<DevicesResponse | ErrorResponse>('/api/user/devices')
        
        // Handle potential ErrorResponse
        const validRes = handleApiResponse<DevicesResponse>(res, 'Failed to fetch devices')
        return validRes.data.devices
      },

      revokeDevice: async (deviceId: number) => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Delete<ErrorResponse | { success: true }>(`/api/user/devices/${deviceId}`)
          
          // Handle potential ErrorResponse
          handleApiResponse(res, 'Failed to revoke device')
          
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      getAuditLogs: async (params = {}) => {
        const res = await alovaInstance.Get<AuditLogsResponse | ErrorResponse>('/api/user/audit-logs', {
          params
        })
        
        // Handle potential ErrorResponse
        return handleApiResponse<AuditLogsResponse>(res, 'Failed to fetch audit logs')
      },

      requestPasswordReset: async (email: string) => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Post<PasswordResetResponse | ErrorResponse>('/api/auth/password-reset/request', {
            email
          })
          
          // Handle potential ErrorResponse
          handleApiResponse<PasswordResetResponse>(res, 'Failed to request password reset')
          
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      validatePasswordResetToken: async (token: string) => {
        set({ isLoading: true })
        try {
          const response = await alovaInstance.Post<PasswordResetValidateResponse | ErrorResponse>('/api/auth/password-reset/validate', {
            token
          })
          
          // Handle potential ErrorResponse
          const validResponse = handleApiResponse<PasswordResetValidateResponse>(response, 'Failed to validate password reset token')
          
          set({ isLoading: false })
          return validResponse
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      resetPassword: async (token: string, newPassword: string) => {
        set({ isLoading: true })
        try {
          const res = await alovaInstance.Post<PasswordResetResponse | ErrorResponse>('/api/auth/password-reset/reset', {
            token,
            new_password: newPassword
          })
          
          // Handle potential ErrorResponse
          handleApiResponse<PasswordResetResponse>(res, 'Failed to reset password')
          
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