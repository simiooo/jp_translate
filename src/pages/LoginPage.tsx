import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { LoginFormData } from '../types/auth'
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
import { alovaInstance } from '~/utils/request';
import { useRequest } from 'ahooks';
import { HydrateFallbackTemplate } from '~/components/HydrateFallbackTemplate'



export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login" },
    { name: "description", content: "Welcome to Login Page!" },
  ];
}

// Zod validation schema
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6位字符'),
})

interface LoginPageProps {
  onLogin: (data: LoginFormData) => void
  onSwitchToRegister: () => void
}
export interface User {
  email: string;
  id: number;
  username: string;
}

export default function LoginPage({ }: LoginPageProps) {
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
      const res = await alovaInstance.Post<{token?: string, user?: User}>('/api/auth/login', {
        email: data.email,
        password: data.password
      })
      if(!res.token) {
        throw Error('token not found')
      }
      localStorage.setItem('Authorization', `Bearer ${res.token}`)
      navigate('/')
    } catch (error) {
      console.log(error);
      Toast.error('登录失败，请重试')
      console.log(error);
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
      console.error(error)
      localStorage.removeItem("Authorization")
    }
  },
  );

  const onSwitchToRegister = () => {
    navigate('/register')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold">用户登录</CardTitle>
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
                      <FormLabel>邮箱</FormLabel>
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
                      <FormLabel>密码</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="至少6位字符"
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
                {form.formState.isSubmitting ? '登录中...' : '登录'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <span>没有账号？</span>
            <Button
              variant="link"
              onClick={onSwitchToRegister}
              className="p-0 h-auto font-medium ml-1"
            >
              立即注册
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export const HydrateFallback = HydrateFallbackTemplate