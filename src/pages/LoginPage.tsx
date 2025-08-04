import { useForm } from 'react-hook-form'
import { LoginFormData } from '../types/auth'
import { Input } from '../components/Input'
import { Toast } from '../components/Toast'
import type { Route } from "./+types/LoginPage";
import { Button } from '~/components/Button';
import { useNavigate } from 'react-router';
import { alovaInstance } from '~/utils/request';
import { useRequest } from 'ahooks';



export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login" },
    { name: "description", content: "Welcome to Login Page!" },
  ];
}

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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    // mode: 'onBlur',
  })
  const navigate = useNavigate();
  const onSubmit = async (data: LoginFormData) => {
    
    try {
      const res=  await alovaInstance.Post<{token?: string, user?: User}>('/api/auth/login', {
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
    <div>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">用户登录</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className=" space-y-4">
            <Input
              label="邮箱"  
              error={errors.email}
              required="请输入邮箱"
              placeholder="example@example.com"
              name="email"
              register={register}
            />
            <Input
              label="密码"
              name="password"
              type="password"
              register={register}
              error={errors.password}
              required="请输入密码"
              placeholder="至少6位字符"
            />
          </div>

          <div>
            <Button
              type="submit"
              
            >
              登录
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <span>没有账号？</span>
          <button
            onClick={onSwitchToRegister}
            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus:outline-none"
          >
            立即注册
          </button>
        </div>
      </div>
    </div>
    </div>
    
  )
}
