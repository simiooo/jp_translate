export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData extends LoginFormData {
  username: string
  confirmPassword: string
}

export interface User {
  id: number
  username: string
  email: string
  avatar_url?: string
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
