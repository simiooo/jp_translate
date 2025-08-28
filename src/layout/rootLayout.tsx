import { Outlet, useNavigation, useLocation } from "react-router";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import TitleBar from "~/components/TitleBar";
import { Toaster } from "~/components/ui/sonner";

// 公开路由，不需要认证
const PUBLIC_ROUTES = ["/login", "/register"];

export default function RootLayout() {
  const navigation = useNavigation();
  const location = useLocation();
  const isNavigating = Boolean(navigation.location);
  // 对于公开路由，直接渲染内容
  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return (
      <>
        <Outlet />
        <Toaster />
      </>
    );
  }


  // 认证成功，渲染主要内容
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-gray-900">
      
      <div className="grow-0 shrink-0">
        <TitleBar />
      </div>

      {/* 主要内容区域 - 使用响应式字体大小 */}
      <main className="h-[calc(100vh-53px)] overflow-y-auto dark:bg-gray-900 text-base 2xl:text-lg">
        {isNavigating ? <HydrateFallbackTemplate /> : <Outlet />}
      </main>
      <Toaster />
    </div>
  );
}
