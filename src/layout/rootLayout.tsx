import { Outlet } from "react-router";
import TitleBar from "~/components/TitleBar";

// 公开路由，不需要认证
const PUBLIC_ROUTES = ["/login", "/register"];

export default function RootLayout() {

  // 对于公开路由，直接渲染内容
  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return <Outlet />;
  }


  // 认证成功，渲染主要内容
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-gray-900">
     
      <div className="grow-0 shrink-0">
        <TitleBar />
      </div>

      {/* 主要内容区域 */}
      <main className="h-[calc(100vh-51px)] overflow-y-auto dark:bg-gray-900">
        <Outlet />
      </main>
    </div>
  );
}
