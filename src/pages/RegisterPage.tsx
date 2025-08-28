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

interface RegisterPageProps {
  onRegister: (data: RegisterFormData) => void;
  onSwitchToLogin: () => void;
}

// Zod validation schema
const registerSchema = z.object({
  username: z.string().min(2, '用户名至少需要2位字符').max(20, '用户名不能超过20位字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6位字符'),
  confirmPassword: z.string().min(6, '请再次输入密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Register" },
    { name: "Register Page", content: "Welcome to Register Page" },
  ];
}

export default function RegisterPage({}: RegisterPageProps) {
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
      Toast.error("注册失败，请重试");
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
          <CardTitle className="text-3xl font-extrabold">用户注册</CardTitle>
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
                      <FormLabel>用户名</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="2-20位字符"
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
                      <FormLabel>邮箱</FormLabel>
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>确认密码</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="再次输入密码"
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
                {form.formState.isSubmitting ? '注册中...' : '注册'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <span>已有账号？</span>
            <Button
              variant="link"
              onClick={onSwitchToLogin}
              className="p-0 h-auto font-medium ml-1"
            >
              立即登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const HydrateFallback = HydrateFallbackTemplate