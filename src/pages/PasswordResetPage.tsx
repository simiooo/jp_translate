import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Toast } from '~/components/ToastCompat'
import { alovaInstance, getErrorMessage, isStandardizedError } from '~/utils/request'
import { HydrateFallbackTemplate } from '~/components/HydrateFallbackTemplate'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'

export function meta() {
  return [
    { title: 'Password Reset' },
    { name: 'description', content: 'Reset your password' },
  ]
}

// Zod validation schema for password reset request
const passwordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

// Zod validation schema for password reset
const passwordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
})

type PasswordResetRequestFormData = z.infer<typeof passwordResetRequestSchema>
type PasswordResetFormData = z.infer<typeof passwordResetSchema>

export default function PasswordResetPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [isLoading, setIsLoading] = useState(false)

  const requestForm = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: '',
    },
  })

  const resetForm = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      token: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const handleRequestSubmit = async (data: PasswordResetRequestFormData) => {
    setIsLoading(true)
    try {
      await alovaInstance.Post('/api/auth/password-reset/request', {
        email: data.email,
      })
      Toast.success(t('If your email address is in our database, you will receive a password reset link shortly.'))
      setStep('reset')
    } catch (error) {
      console.error('Failed to request password reset:', error)
      if (isStandardizedError(error)) {
        Toast.error(getErrorMessage(error) || t('Failed to request password reset'))
      } else {
        Toast.error(t('Failed to request password reset'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSubmit = async (data: PasswordResetFormData) => {
    setIsLoading(true)
    try {
      await alovaInstance.Post('/api/auth/password-reset/reset', {
        token: data.token,
        new_password: data.new_password,
      })
      Toast.success(t('Password reset successfully. You can now login with your new password.'))
      // Redirect to login page or show success message
    } catch (error) {
      console.error('Failed to reset password:', error)
      if (isStandardizedError(error)) {
        Toast.error(getErrorMessage(error) || t('Failed to reset password'))
      } else {
        Toast.error(t('Failed to reset password'))
      }
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold">
            {step === 'request' ? t('Reset Password') : t('Set New Password')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'request' ? (
            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(handleRequestSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={requestForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Email')}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="example@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={requestForm.formState.isSubmitting || isLoading}
                >
                  {(requestForm.formState.isSubmitting || isLoading) ? t('Sending...') : t('Send Reset Link')}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Reset Token')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('Enter the token from your email')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="new_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('New Password')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t('At least 8 characters')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Confirm Password')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t('Enter password again')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={resetForm.formState.isSubmitting || isLoading}
                >
                  {(resetForm.formState.isSubmitting || isLoading) ? t('Resetting...') : t('Reset Password')}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setStep('request')}
                    className="text-sm"
                  >
                    {t('Back to request form')}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const HydrateFallback = HydrateFallbackTemplate