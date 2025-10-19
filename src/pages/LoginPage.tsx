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
import { alovaInstance, getErrorMessage, isStandardizedError } from '~/utils/request';
import { useRequest } from 'ahooks';
import { HydrateFallbackTemplate } from '~/components/HydrateFallbackTemplate'
import { useTranslation } from 'react-i18next'
import { useAuthActions, useIsLoading } from '~/store/auth'
import {
  ErrCodeInvalidToken,
  ErrCodeTokenExpired,
  ErrCodeUserNotAuthenticated,
  ErrCodeInvalidCredentials,
  ErrCodeDailyLimitExceeded
} from '~/types/errors'



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
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  
  const navigate = useNavigate();
  
  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data.email, data.password);
      navigate('/')
    } catch (error) {
      console.log('Login error:', error);
      
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

   useRequest(async () => {
    try {
      const data = await alovaInstance.Get<{[key: string]: string | number} | null>("/api/translation");
      if(!data) throw Error('Not logined')
      if ("message" in data) {
        throw Error(String(data.message))
      }
      navigate('/')
    } catch (error) {
      console.error('Auto login error:', error);
      
      // Handle standardized error format for auto login
      if (isStandardizedError(error)) {
        console.log('Error code:', error.code, 'Message:', error.message);
      }
      
      localStorage.removeItem("Authorization")
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

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || isLoading}
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