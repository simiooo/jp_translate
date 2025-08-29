import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RegisterFormData } from "../types/auth";
import { Input } from "../components/ui/input";
import { Toast } from "../components/ToastCompat";
import type { Route } from "./+types/RegisterPage";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { alovaInstance } from "~/utils/request";
import { useNavigate } from "react-router";
import { User } from "./LoginPage";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import { useTranslation } from 'react-i18next';

interface RegisterPageProps {
  onRegister: (data: RegisterFormData) => void;
  onSwitchToLogin: () => void;
}

// Zod validation schema
const registerSchema = z.object({
  username: z.string().min(2, 'Username must be 2-20 characters').max(20, 'Username must be 2-20 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please enter password again'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Register" },
    { name: "Register Page", content: "Welcome to Register Page" },
  ];
}

export default function RegisterPage({}: RegisterPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate()
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    try {
      const res = await alovaInstance.Post<{token?: string, user?: User}>("/api/auth/register", {
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
      });
      if(!res.token) {
        throw Error('注册失败')
      }
      localStorage.setItem('Authorization', `Bearer ${res.token}`)
      navigate('/')
    } catch (error) {
      Toast.error(t('Registration failed, please try again'));
      console.log(error);
    }
  };

  const onSwitchToLogin =() => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold">{t('User Registration')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Username')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('2-20 characters')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
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
                  <FormField
                    control={form.control}
                    name="confirmPassword"
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
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? t('Registering...') : t('Register')}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <span>{t('Already have an account?')}</span>
            <Button
              variant="link"
              onClick={onSwitchToLogin}
              className="p-0 h-auto font-medium ml-1"
            >
              {t('Login now')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const HydrateFallback = HydrateFallbackTemplate