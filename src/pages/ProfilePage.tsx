import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useRequest } from 'ahooks'

import { AvatarUploadResponse } from '../types/auth'
import { alovaInstance, getErrorMessage, isStandardizedError } from '../utils/request'
import { Toast } from '../components/ToastCompat'
import { useUser, useProfile, useAuthActions, useIsLoading } from '~/store/auth'
import {
  ErrCodeInvalidToken,
  ErrCodeTokenExpired,
  ErrCodeUserNotAuthenticated,
  ErrCodeFileTooLarge,
  ErrCodeFileSizeExceeded,
  ErrCodeUnsupportedFileType,
  ErrCodeInvalidFileType,
  ErrCodeFileProcessingError,
  ErrCodeImageProcessingError,
  ErrCodeAvatarNotFound,
  ErrCodeFileDeleteFailed
} from '~/types/errors'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Progress } from '~/components/ui/progress'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'

import type { Route } from './+types/Home'
import { HydrateFallbackTemplate } from '~/components/HydrateFallbackTemplate'
import { useTranslation } from 'react-i18next'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Profile' },
    { name: 'description', content: 'User profile and subscription management' },
  ]
}

// Zod validation schema for password change
const changePasswordSchema = z.object({
  old_password: z.string().min(6, 'Old password must be at least 6 characters'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
})

// Helper function to get tier color
const getTierColor = (tier: string) => {
  switch (tier) {
    case 'free':
      return 'bg-gray-100 text-gray-800'
    case 'basic':
      return 'bg-blue-100 text-blue-800'
    case 'premium':
      return 'bg-purple-100 text-purple-800'
    case 'ultimate':
      return 'bg-gold-100 text-gold-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useUser()
  const profile = useProfile()
  const { logout, fetchProfile } = useAuthActions()
  const isLoading = useIsLoading()
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [isAvatarDeleting, setIsAvatarDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
    },
  })

  // Fetch user profile data
  const { loading: profileLoading, error: profileError, run: fetchProfileData } = useRequest(
    async () => {
      try {
        await fetchProfile()
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        
        // Handle standardized error format
        if (isStandardizedError(error)) {
          console.log('Profile fetch error code:', error.code, 'Message:', error.message);
          
          // If unauthorized, redirect to login
          if (error.code === ErrCodeUserNotAuthenticated || error.code === ErrCodeInvalidToken || error.code === ErrCodeTokenExpired) {
            navigate('/login')
          }
        } else if (error instanceof Error && error.message.includes('401')) {
          // Fallback for non-standardized errors
          navigate('/login')
        }
        throw error
      }
    },
    {
      onError: (error) => {
        Toast.error(t('Failed to fetch user information'))
        console.error(error)
      },
      // Only run once when component mounts
      manual: true
    }
  )

  // Fetch profile data only once when component mounts
  useEffect(() => {
    if (!profile && !profileLoading && !profileError) {
      fetchProfileData()
    }
  }, []) // Empty dependency array ensures this runs only once on mount

  // Handle password change
  const onPasswordSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    try {
      await alovaInstance.Post('/api/user/change-password', {
        old_password: data.old_password,
        new_password: data.new_password,
      })
      Toast.success(t('Password changed successfully'))
      setIsPasswordDialogOpen(false)
      form.reset()
    } catch (error) {
      console.error('Failed to change password:', error)
      
      // Handle standardized error format
      if (isStandardizedError(error)) {
        switch (error.code) {
          case 1406: // ErrCodeInvalidOldPassword
            Toast.error(t('Current password is incorrect'));
            break;
          case 1404: // ErrCodePasswordTooWeak
            Toast.error(t('New password does not meet security requirements'));
            break;
          default:
            Toast.error(getErrorMessage(error) || t('Password change failed, please try again'));
        }
      } else {
        Toast.error(t('Password change failed, please try again'));
      }
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      
      // Handle standardized error format for logging
      if (isStandardizedError(error)) {
        console.log('Logout error code:', error.code, 'Message:', error.message);
      }
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    
    const file = event.target.files?.[0]

    if (!file) return

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      Toast.error(t('Please select JPEG, PNG, GIF or WebP format images'))
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      Toast.error(t('Image size cannot exceed 2MB'))
      return
    }

    setIsAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await alovaInstance.Post<AvatarUploadResponse>('/api/user/avatar', formData)

      // Update user avatar URL in store
      if (response?.avatar_url) {
        // The avatar URL will be updated automatically when the profile is refetched
        // For now, we can trigger a profile refresh
        await fetchProfile()
      }

      Toast.success(t('Avatar uploaded successfully'))
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      
      // Handle standardized error format
      if (isStandardizedError(error)) {
        switch (error.code) {
          case ErrCodeFileTooLarge:
          case ErrCodeFileSizeExceeded:
            Toast.error(t('Image size cannot exceed 2MB'));
            break;
          case ErrCodeUnsupportedFileType:
          case ErrCodeInvalidFileType:
            Toast.error(t('Please select JPEG, PNG, GIF or WebP format images'));
            break;
          case ErrCodeFileProcessingError:
          case ErrCodeImageProcessingError:
            Toast.error(t('Failed to process image'));
            break;
          default:
            Toast.error(getErrorMessage(error) || t('Avatar upload failed, please try again'));
        }
      } else {
        Toast.error(t('Avatar upload failed, please try again'));
      }
    } finally {
      setIsAvatarUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle avatar delete
  const handleAvatarDelete = async () => {
    setIsAvatarDeleting(true)
    try {
      await alovaInstance.Delete('/api/user/avatar')

      // Update user avatar URL in store
      // The avatar removal will be reflected when the profile is refetched
      await fetchProfile()

      Toast.success(t('Avatar deleted successfully'))
    } catch (error) {
      console.error('Failed to delete avatar:', error)
      
      // Handle standardized error format
      if (isStandardizedError(error)) {
        switch (error.code) {
          case ErrCodeAvatarNotFound:
            Toast.error(t('Avatar not found'));
            break;
          case ErrCodeFileDeleteFailed:
            Toast.error(t('Failed to delete avatar file'));
            break;
          default:
            Toast.error(getErrorMessage(error) || t('Avatar deletion failed, please try again'));
        }
      } else {
        Toast.error(t('Avatar deletion failed, please try again'));
      }
    } finally {
      setIsAvatarDeleting(false)
    }
  }

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">{t('Loading')}...</div>
          </div>
        </div>
      </div>
    )
  }

  if (profileError || !profile || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-600">{t('Failed to load user information')}</div>
          </div>
        </div>
      </div>
    )
  }

  const usagePercentage = {
    translations: profile?.subscription?.limits.translations_per_day > 0 
      ? (profile.usage.daily_translations / profile.subscription?.limits.translations_per_day) * 100 
      : 0,
    tts: profile?.subscription?.limits.tts_requests_per_day > 0 
      ? (profile.usage.daily_tts / profile.subscription?.limits.tts_requests_per_day) * 100 
      : 0,
  }
  

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('Profile')}</h1>
          <Button onClick={handleLogout} variant="outline">
            {t('Logout')}
          </Button>
        </div>

        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('User Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  {user?.avatar_url ? (
                    <img
                      src={`${user?.avatar_url}?authorization=${localStorage?.getItem('Authorization')}`}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <span className="text-2xl font-semibold text-gray-500">
                        {user?.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {isAvatarUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={triggerFileInput}
                    disabled={isAvatarUploading || isAvatarDeleting || isLoading}
                    variant="outline"
                    size="sm"
                  >
                    {isAvatarUploading ? t('Uploading') : t('Change Avatar')}
                  </Button>
                  {user?.avatar_url && (
                    <Button
                      onClick={handleAvatarDelete}
                      disabled={isAvatarUploading || isAvatarDeleting || isLoading}
                      variant="destructive"
                      size="sm"
                    >
                      {isAvatarDeleting ? t('Deleting') : t('Delete Avatar')}
                    </Button>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{t('Supported formats: JPEG, PNG, GIF, WebP')}</p>
                <p>{t('Max size: 2MB')}</p>
                <p>{t('Recommended: square images')}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('Username')}</label>
                <p className="text-lg">{user?.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('Email')}</label>
                <p className="text-lg">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('User ID')}</label>
                <p className="text-lg">{user?.id}</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">{t('Change Password')}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('Change Password')}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="old_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Old Password')}</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder={t('Please enter old password')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="new_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('New Password')}</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder={t('Please enter new password (at least 6 characters)')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsPasswordDialogOpen(false)}
                        >
                          {t('Cancel')}
                        </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
                          {(form.formState.isSubmitting || isLoading) ? t('Changing') : t('Confirm Change')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Subscription Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('Tier')}:</span>
              <Badge className={getTierColor(profile.subscription?.tier)}>
                {profile.subscription?.tier.toUpperCase()}
              </Badge>
              <span className={`text-sm ${profile.subscription?.active ? 'text-green-600' : 'text-red-600'}`}>
                {profile.subscription?.active ? t('Active') : t('Expired')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('Start Date')}</label>
                <p>{formatDate(profile.subscription?.start_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('End Date')}</label>
                <p>{formatDate(profile.subscription?.end_date)}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">{t('Plan Limits')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">{t('Daily Translations')}</span>
                  <p className="text-lg">{profile?.subscription?.limits.translations_per_day}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('Daily TTS Requests')}</span>
                  <p className="text-lg">{profile?.subscription?.limits.tts_requests_per_day}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Usage Statistics')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Usage */}
            <div>
              <h4 className="font-medium mb-4">{t('Total Usage')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">{t('Total Translations')}</span>
                  <p className="text-2xl font-bold">{profile.usage?.translation_count}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('Total TTS Count')}</span>
                  <p className="text-2xl font-bold">{profile.usage?.tts_count}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Daily Usage */}
            <div>
              <h4 className="font-medium mb-4">{t("Today's Usage")}</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t('Translation Usage')}</span>
                    <span className="text-sm text-muted-foreground">
                      {profile.usage?.daily_translations} / {profile.subscription?.limits.translations_per_day}
                    </span>
                  </div>
                  <Progress value={usagePercentage.translations} />
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('Remaining')} {profile.usage?.translations_left} {t('times')}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t('TTS Usage')}</span>
                    <span className="text-sm text-muted-foreground">
                      {profile.usage?.daily_tts} / {profile.subscription?.limits.tts_requests_per_day}
                    </span>
                  </div>
                  <Progress value={usagePercentage.tts} />
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('Remaining')} {profile.usage?.tts_requests_left} {t('times')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export const HydrateFallback = HydrateFallbackTemplate