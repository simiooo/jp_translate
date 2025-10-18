import { Outlet, useNavigation, useLocation, useNavigate } from "react-router";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import TitleBar from "~/components/TitleBar";
import { Toaster } from "~/components/ui/sonner";
import { useAuthStore } from "~/store/auth";
import { useEffect, useState } from "react";

// 公开路由，不需要认证
const PUBLIC_ROUTES = ["/login", "/register"];

export default function RootLayout() {
  const navigation = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyToken, isAuthenticated, isLoading, clearAuth } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(false);
  const isNavigating = Boolean(navigation.location);

  // 验证用户token
  useEffect(() => {
    const verifyUser = async () => {
      // 如果是公开路由，不需要验证
      if (PUBLIC_ROUTES.includes(location.pathname)) {
        return;
      }

      // 如果已经认证，不需要重复验证
      if (isAuthenticated) {
        return;
      }

      // 检查是否有token
      const token = localStorage.getItem('Authorization');
      if (!token) {
        // 没有token，重定向到登录页
        navigate('/login', { replace: true });
        return;
      }

      setIsVerifying(true);
      try {
        const isValid = await verifyToken();
        if (!isValid) {
          // token验证失败，重定向到登录页
          navigate('/login', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        // 验证过程中出错，清除认证状态并重定向
        clearAuth();
        navigate('/login', { replace: true });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyUser();
  }, [location.pathname, isAuthenticated ]);

  // 对于公开路由，直接渲染内容
  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return (
      <>
        <Outlet />
        <Toaster />
      </>
    );
  }

  // 显示加载状态
  if (isLoading || isVerifying) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-900">
        <HydrateFallbackTemplate />
      </div>
    );
  }


  // 认证成功，渲染主要内容
  return (
    <div className="h-screen bg-gray-50 flex flex-col dark:bg-gray-900">
      
      <div className="grow-0 shrink-0">
        <TitleBar />
      </div>

      {/* 主要内容区域 - 使用响应式字体大小 */}
      <main className="h-[calc(100vh-54px)] overflow-y-auto dark:bg-gray-900 text-base 2xl:text-lg">
        {isNavigating ? <HydrateFallbackTemplate /> : <Outlet />}
      </main>
      <Toaster />
    </div>
  );
}
