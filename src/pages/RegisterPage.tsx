import { useForm } from "react-hook-form";
import { RegisterFormData } from "../types/auth";
import { Input } from "../components/Input";
import { Toast } from "../components/Toast";
import type { Route } from "./+types/RegisterPage";
import { Button } from "~/components/Button";
import { alovaInstance } from "~/utils/request";
import { useNavigate } from "react-router";
import { User } from "./LoginPage";

interface RegisterPageProps {
  onRegister: (data: RegisterFormData) => void;
  onSwitchToLogin: () => void;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Register" },
    { name: "Register Page", content: "Welcome to Register Page" },
  ];
}

export default function RegisterPage({}: RegisterPageProps) {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    mode: "onBlur",
  });

  const onSubmit = async (data: RegisterFormData) => {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            用户注册
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className=" space-y-4">
            <Input
              label="用户名"
              name="username"
              register={register}
              error={errors.username}
              required="请输入用户名"
              placeholder="2-20位字符"
            />
            <Input
              label="邮箱"
              name="email"
              type="email"
              register={register}
              error={errors.email}
              required="请输入邮箱"
              placeholder="example@example.com"
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
            <Input
              label="确认密码"
              name="confirmPassword"
              type="password"
              register={register}
              error={errors.confirmPassword}
              required="请再次输入密码"
              placeholder="再次输入密码"
              validate={(value) =>
                value === watch("password") || "两次输入的密码不一致"
              }
            />
          </div>

          <div>
            <Button type="submit">注册</Button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600">
          <span>已有账号？</span>
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
          >
            立即登录
          </button>
        </div>
      </div>
    </div>
  );
}
