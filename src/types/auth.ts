export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData extends LoginFormData {
  username: string
  confirmPassword: string
}

export interface Role {
  id: number
  name: string
}

export interface User {
  id: number
  username: string
  email: string
  email_verified?: boolean
  avatar_url?: string
  role_id?: number
  role?: Role
  created_at?: string
  updated_at?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: User
}

export interface AuthResponse {
  success: boolean
  data: {
    user: User
    token: TokenResponse
  }
  message: string
}

export interface Subscription {
  tier: 'free' | 'basic' | 'premium' | 'ultimate'
  start_date: string
  end_date: string
  active: boolean
  limits: {
    translations_per_day: number
    tts_requests_per_day: number
  }
}

export interface Usage {
  translation_count: number
  tts_count: number
  daily_translations: number
  daily_tts: number
  translations_left: number
  tts_requests_left: number
}

export interface UserProfile {
  user: User
  subscription: Subscription
  usage: Usage
}

export interface ChangePasswordFormData {
  old_password: string
  new_password: string
}

export interface AvatarUploadResponse {
  message: string
  avatar_url: string
  file_info: {
    original_filename: string
    file_size: number
    content_type: string
    object_key: string
    uploaded_at: string
  }
  user_info: {
    user_id: number
  }
}

export interface AvatarDeleteResponse {
  message: string
}

export interface VerifyTokenResponse {
  user: User
  subscription: Subscription
  usage: Usage
}

// Session Management Types
export interface Session {
  id: number
  user_id: number
  token: string
  device_id: string
  device_name: string
  ip_address: string
  user_agent: string
  expires_at: string
  last_used_at: string
  revoked: boolean
  created_at: string
}

export interface SessionsResponse {
  success: boolean
  data: {
    sessions: Session[]
  }
}

export interface SessionStats {
  total_sessions: number
  active_sessions: number
  devices: Array<{
    device_name: string
    session_count: number
  }>
}

export interface SessionStatsResponse {
  success: boolean
  data: SessionStats
}

// Device Management Types
export interface Device {
  id: number
  device_id: string
  device_name: string
  ip_address: string
  last_used: string
  created_at: string
  expires_at: string
}

export interface DevicesResponse {
  success: boolean
  data: {
    devices: Device[]
  }
}

// Email Verification Types
export interface EmailVerificationStatus {
  email_verified: boolean
  verification_sent_at: string
  verification_attempts: number
}

export interface EmailVerificationStatusResponse {
  success: boolean
  data: EmailVerificationStatus
}

// Password Reset Types
export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetValidateResponse {
  success: boolean
  data: {
    email: string
    expires_at: string
  }
}

export interface PasswordResetFormData {
  token: string
  new_password: string
}

export interface PasswordResetResponse {
  success: boolean
  message: string
}

export interface PasswordResetValidateRequest {
  token: string
}

// Audit Log Types
export interface AuditLog {
  id: number
  user_id: number
  email: string
  event_type: string
  description: string
  ip_address: string
  user_agent: string
  metadata: string
  success: boolean
  created_at: string
}

export interface AuditLogsResponse {
  success: boolean
  data: {
    logs: AuditLog[]
    total: number
  }
}

// Password Validation Types
export interface PasswordValidationResponse {
  success: boolean
  data: {
    valid: boolean
    errors: string[]
  }
}

// Admin Types
export interface AccountLockoutStatus {
  email: string
  is_locked: boolean
  lockout_info: string | null
}

export interface AccountLockoutStatusResponse {
  success: boolean
  data: AccountLockoutStatus
}

export interface AccountLockRequest {
  email: string
  reason: string
  permanent: boolean
  duration: number
}

export interface AccountUnlockRequest {
  email: string
}
