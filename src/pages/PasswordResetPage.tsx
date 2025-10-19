import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Toast } from '~/components/ToastCompat'
import { getErrorMessage, isStandardizedError } from '~/utils/request'
import { HydrateFallbackTemplate } from '~/components/HydrateFallbackTemplate'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { useState, useEffect } from 'react'
import { useAuthActions } from '~/store/auth'
import { useNavigate, useSearchParams } from 'react-router'

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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { requestPasswordReset, validatePasswordResetToken, resetPassword } = useAuthActions()
  const [step, setStep] = useState<'request' | 'validate' | 'reset'>('request')
  const [isLoading, setIsLoading] = useState(false)
  const [validatedEmail, setValidatedEmail] = useState<string>('')
  const [urlToken, setUrlToken] = useState<string | null>(null)

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

  // Extract token from URL query string on component mount
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setUrlToken(token)
      // If token is provided in URL, automatically validate it
      handleTokenValidation(token)
    }
  }, [searchParams])

  const handleRequestSubmit = async (data: PasswordResetRequestFormData) => {
    setIsLoading(true)
    try {
      await requestPasswordReset(data.email)
      Toast.success(t('If your email address is in our database, you will receive a password reset link shortly.'))
      setStep('validate')
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

  const handleTokenValidation = async (token: string) => {
    setIsLoading(true)
    try {
      const response = await validatePasswordResetToken(token)
      setValidatedEmail(response.data.email)
      setStep('reset')
      // Pre-fill the token field in the reset form
      resetForm.setValue('token', token)
      Toast.success(t('Token validated successfully'))
    } catch (error) {
      console.error('Failed to validate token:', error)
      if (isStandardizedError(error)) {
        Toast.error(getErrorMessage(error) || t('Invalid or expired reset token'))
      } else {
        Toast.error(t('Invalid or expired reset token'))
      }
      // If token is from URL and validation fails, stay on validate step
      if (!urlToken) {
        throw error
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSubmit = async (data: PasswordResetFormData) => {
    setIsLoading(true)
    try {
      await resetPassword(data.token, data.new_password)
      Toast.success(t('Password reset successfully. You can now login with your new password.'))
      // Redirect to login page after successful reset
      setTimeout(() => {
        navigate('/login')
      }, 2000)
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


  // Handle token input and validation
  const handleTokenSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const token = formData.get('token') as string
    if (token.trim()) {
      handleTokenValidation(token)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold">
            {step === 'request'
              ? t('Reset Password')
              : step === 'validate'
                ? t('Enter Reset Token')
                : t('Set New Password')}
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
          ) : step === 'validate' ? (
            <div className="space-y-6">
              {urlToken && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                    {t('Validating token from email link...')}
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center">
                {urlToken
                  ? t('Please wait while we validate your reset token...')
                  : t('Please enter the reset token sent to your email address.')}
              </p>
              {!urlToken && (
                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="token" className="text-sm font-medium">
                      {t('Reset Token')}
                    </label>
                    <Input
                      id="token"
                      name="token"
                      type="text"
                      placeholder={t('Enter the token from your email')}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? t('Validating...') : t('Validate Token')}
                  </Button>
                </form>
              )}
              {!urlToken && (
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setStep('request')}
                    className="text-sm"
                  >
                    {t('Back to request form')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t('Token validated for:')} <strong>{validatedEmail}</strong>
                    </p>
                  </div>
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
                            readOnly
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
                    onClick={() => setStep('validate')}
                    className="text-sm"
                  >
                    {t('Back to token validation')}
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