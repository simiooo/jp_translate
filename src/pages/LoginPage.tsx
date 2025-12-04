import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '../components/ui/input'
import { Toast } from '../components/ToastCompat'
import type { Route } from "./+types/LoginPage";
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { useNavigate } from 'react-router';
import { getErrorMessage, isStandardizedError } from '~/utils/request';
import { useRequest } from 'ahooks';
import { HydrateFallbackTemplate } from '~/components/HydrateFallbackTemplate'
import { useTranslation } from 'react-i18next'
import { useAuthActions, useIsLoading, useAuthStore } from '~/store/auth'
import {
  ErrCodeInvalidToken,
  ErrCodeTokenExpired,
  ErrCodeUserNotAuthenticated,
  ErrCodeInvalidCredentials,
  ErrCodeDailyLimitExceeded
} from '~/types/errors'
import { TurnstileWidget } from '~/components/TurnstileWidget'
import { useState } from 'react'



export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login" },
    { name: "description", content: "Welcome to Login Page!" },
  ];
}

// Zod validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  turnstileToken: z.string().optional(),
})

interface LoginPageProps {
  onSwitchToRegister: () => void
}
export interface User {
  email: string;
  id: number;
  username: string;
}

export default function LoginPage({ }: LoginPageProps) {
  const { t } = useTranslation();
  const { login } = useAuthActions();
  const isLoading = useIsLoading();
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileResetKey, setTurnstileResetKey] = useState<number>(0);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      turnstileToken: '',
    },
  })
  
  const navigate = useNavigate();
  
  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      // Update form data with turnstile token
      const formData = {
        ...data,
        turnstileToken
      };
      
      await login(formData.email, formData.password, formData.turnstileToken);
      navigate('/')
    } catch (error) {
      console.log('Login error:', error);
      
      // Reset Turnstile on error
      setTurnstileResetKey(prev => prev + 1);
      setTurnstileToken('');
      
      // Handle standardized error format
      if (isStandardizedError(error)) {
        // You can use error.code to show specific error messages
        switch (error.code) {
          case ErrCodeInvalidToken:
          case ErrCodeTokenExpired:
          case ErrCodeUserNotAuthenticated:
            Toast.error(t('Authentication failed, please login again'));
            break;
          case ErrCodeInvalidCredentials:
            Toast.error(t('Invalid email or password'));
            break;
          case ErrCodeDailyLimitExceeded:
            Toast.error(t('Daily usage limit exceeded'));
            break;
          default:
            Toast.error(getErrorMessage(error) || t('Login failed, please try again'));
        }
      } else {
        Toast.error(t('Login failed, please try again'));
      }
    }
  }

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    form.setValue('turnstileToken', token);
  }

  const handleTurnstileError = () => {
    Toast.error(t('Security verification failed'));
    setTurnstileToken('');
    form.setValue('turnstileToken', '');
  }

  const handleTurnstileExpire = () => {
    Toast.error(t('Verification expired, please try again'));
    setTurnstileToken('');
    form.setValue('turnstileToken', '');
  }

   useRequest(async () => {
    try {
      // Use fetchProfile from auth store to validate token
      const { fetchProfile } = useAuthStore.getState();
      await fetchProfile();
      // navigate('/')
    } catch (error) {
      console.error('Auto login error:', error);
      
      // Handle standardized error format for auto login
      if (isStandardizedError(error)) {
        console.log('Error code:', error.code, 'Message:', error.message);
      }
      
      // fetchProfile already handles clearing auth state for authentication errors
      // but we still need to ensure Authorization token is removed
      localStorage.removeItem("Authorization")
    } finally {
      // Ensure isLoading is set to false after auto-login check completes
      // This prevents the login button from being permanently disabled
      useAuthStore.setState({ isLoading: false });
    }
  },
  );

  const onSwitchToRegister = () => {
    navigate('/register')
  }

  const onForgotPassword = () => {
    navigate('/password-reset')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold">{t('User Login')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Email')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Password')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t('At least 6 characters')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('Please complete the security verification')}</p>
                <TurnstileWidget
                  siteKey={import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                  onVerify={handleTurnstileVerify}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                  resetKey={turnstileResetKey}
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || isLoading || !turnstileToken}
              >
                {(form.formState.isSubmitting || isLoading) ? t('Logging in...') : t('Login')}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={onForgotPassword}
              className="text-sm text-muted-foreground"
            >
              {t('Forgot Password?')}
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <span>{t("Don't have an account?")}</span>
            <Button
              variant="link"
              onClick={onSwitchToRegister}
              className="p-0 h-auto font-medium ml-1"
            >
              {t('Register now')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export const HydrateFallback = HydrateFallbackTemplate