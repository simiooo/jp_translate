import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useRequest } from 'ahooks'

import { UserProfile, AvatarUploadResponse } from '../types/auth'
import { alovaInstance } from '../utils/request'
import { Toast } from '../components/ToastCompat'

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

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Profile' },
    { name: 'description', content: 'User profile and subscription management' },
  ]
}

// Zod validation schema for password change
const changePasswordSchema = z.object({
  old_password: z.string().min(6, '旧密码至少需要6位字符'),
  new_password: z.string().min(6, '新密码至少需要6位字符'),
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
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
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
  const { loading: profileLoading, error: profileError } = useRequest(
    async () => {
      try {
        const data = await alovaInstance.Get<UserProfile>('/api/user/profile')
        setProfile(data)
        return data
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        // If unauthorized, redirect to login
        if (error instanceof Error && error.message.includes('401')) {
          localStorage.removeItem('Authorization')
          navigate('/login')
        }
        throw error
      }
    },
    {
      onError: (error) => {
        Toast.error('获取用户信息失败')
        console.error(error)
      },
    }
  )

  // Handle password change
  const onPasswordSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    try {
      await alovaInstance.Post('/api/user/change-password', {
        old_password: data.old_password,
        new_password: data.new_password,
      })
      Toast.success('密码修改成功')
      setIsPasswordDialogOpen(false)
      form.reset()
    } catch (error) {
      console.error('Failed to change password:', error)
      Toast.error('密码修改失败，请重试')
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await alovaInstance.Post('/api/auth/logout')
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      localStorage.removeItem('Authorization')
      navigate('/login')
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    
    const file = event.target.files?.[0]
    console.log(file);

    if (!file) return

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      Toast.error('请选择 JPEG、PNG、GIF 或 WebP 格式的图片')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      Toast.error('图片大小不能超过 2MB')
      return
    }

    setIsAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await alovaInstance.Post<AvatarUploadResponse>('/api/user/avatar', formData)

      // Update profile with new avatar URL
      if (profile) {
        setProfile({
          ...profile,
          user: {
            ...profile.user,
            avatar_url: `${response?.avatar_url}`,
          },
        })
      }

      Toast.success('头像上传成功')
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      Toast.error('头像上传失败，请重试')
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

      // Update profile to remove avatar URL
      if (profile) {
        setProfile({
          ...profile,
          user: {
            ...profile.user,
            avatar_url: undefined,
          },
        })
      }

      Toast.success('头像删除成功')
    } catch (error) {
      console.error('Failed to delete avatar:', error)
      Toast.error('头像删除失败，请重试')
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
            <div className="text-lg">加载中...</div>
          </div>
        </div>
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-600">加载用户信息失败</div>
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
          <h1 className="text-3xl font-bold">个人资料</h1>
          <Button onClick={handleLogout} variant="outline">
            退出登录
          </Button>
        </div>

        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  {profile.user?.avatar_url ? (
                    <img
                      src={`${profile.user?.avatar_url}?authorization=${localStorage?.getItem('Authorization')}`}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <span className="text-2xl font-semibold text-gray-500">
                        {profile.user?.username.charAt(0).toUpperCase()}
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
                    disabled={isAvatarUploading || isAvatarDeleting}
                    variant="outline"
                    size="sm"
                  >
                    {isAvatarUploading ? '上传中...' : '更换头像'}
                  </Button>
                  {profile.user?.avatar_url && (
                    <Button
                      onClick={handleAvatarDelete}
                      disabled={isAvatarUploading || isAvatarDeleting}
                      variant="destructive"
                      size="sm"
                    >
                      {isAvatarDeleting ? '删除中...' : '删除头像'}
                    </Button>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>支持格式: JPEG, PNG, GIF, WebP</p>
                <p>最大大小: 2MB</p>
                <p>推荐尺寸: 正方形图片</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">用户名</label>
                <p className="text-lg">{profile.user?.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">邮箱</label>
                <p className="text-lg">{profile.user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">用户ID</label>
                <p className="text-lg">{profile.user?.id}</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">修改密码</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>修改密码</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="old_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>旧密码</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="请输入旧密码"
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
                            <FormLabel>新密码</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="请输入新密码（至少6位字符）"
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
                          取消
                        </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting ? '修改中...' : '确认修改'}
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
            <CardTitle>订阅信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">套餐类型:</span>
              <Badge className={getTierColor(profile.subscription?.tier)}>
                {profile.subscription?.tier.toUpperCase()}
              </Badge>
              <span className={`text-sm ${profile.subscription?.active ? 'text-green-600' : 'text-red-600'}`}>
                {profile.subscription?.active ? '生效中' : '已过期'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">开始日期</label>
                <p>{formatDate(profile.subscription?.start_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">结束日期</label>
                <p>{formatDate(profile.subscription?.end_date)}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">套餐限制</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">每日翻译次数</span>
                  <p className="text-lg">{profile?.subscription?.limits.translations_per_day}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">每日语音合成次数</span>
                  <p className="text-lg">{profile?.subscription?.limits.tts_requests_per_day}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>使用统计</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Usage */}
            <div>
              <h4 className="font-medium mb-4">总使用量</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">总翻译次数</span>
                  <p className="text-2xl font-bold">{profile.usage?.translation_count}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">总语音合成次数</span>
                  <p className="text-2xl font-bold">{profile.usage?.tts_count}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Daily Usage */}
            <div>
              <h4 className="font-medium mb-4">今日使用情况</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">翻译使用量</span>
                    <span className="text-sm text-muted-foreground">
                      {profile.usage?.daily_translations} / {profile.subscription?.limits.translations_per_day}
                    </span>
                  </div>
                  <Progress value={usagePercentage.translations} />
                  <p className="text-sm text-muted-foreground mt-1">
                    剩余 {profile.usage?.translations_left} 次
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">语音合成使用量</span>
                    <span className="text-sm text-muted-foreground">
                      {profile.usage?.daily_tts} / {profile.subscription?.limits.tts_requests_per_day}
                    </span>
                  </div>
                  <Progress value={usagePercentage.tts} />
                  <p className="text-sm text-muted-foreground mt-1">
                    剩余 {profile.usage?.tts_requests_left} 次
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