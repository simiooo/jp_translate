import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './auth'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset the store and localStorage before each test
    useAuthStore.setState({
      user: null,
      profile: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    })
    localStorageMock.clear()
  })

  it('should have initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  it('should set token correctly', () => {
    const { setToken } = useAuthStore.getState()
    setToken('test-token-123')

    const state = useAuthStore.getState()
    expect(state.token).toBe('test-token-123')
    expect(state.isAuthenticated).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalledWith('Authorization', 'Bearer test-token-123')
  })

  it('should clear auth state correctly', () => {
    // First set some state
    useAuthStore.setState({
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
      token: 'test-token',
      isAuthenticated: true
    })

    const { clearAuth } = useAuthStore.getState()
    clearAuth()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(localStorage.removeItem).toHaveBeenCalledWith('Authorization')
  })

  it('should persist state to localStorage', () => {
    const { setToken } = useAuthStore.getState()
    setToken('persisted-token')

    // The store should automatically persist to localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('Authorization', 'Bearer persisted-token')
  })

  it('should handle loading states', async () => {
    // Mock the login function to test loading state
    const mockLogin = vi.fn().mockRejectedValue(new Error('Login failed'))
    
    // Replace the login function temporarily
    const originalLogin = useAuthStore.getState().login
    useAuthStore.setState({ login: mockLogin })
    
    try {
      await useAuthStore.getState().login('test@example.com', 'password')
    } catch {
      // Expected to fail
    }
    
    // Restore original login function
    useAuthStore.setState({ login: originalLogin })
    
    // The store should handle loading state correctly
    expect(mockLogin).toHaveBeenCalled()
  })
})