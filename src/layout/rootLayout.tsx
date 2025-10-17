import { Outlet } from "@tanstack/react-router";
import TitleBar from "~/components/TitleBar";
import { Toaster } from "~/components/ui/sonner";

export default function RootLayout() {



  // 认证成功，渲染主要内容
  return (
    <div className="h-screen bg-gray-50 flex flex-col dark:bg-gray-900">
      
      <div className="grow-0 shrink-0">
        <TitleBar />
      </div>

      {/* 主要内容区域 - 使用响应式字体大小 */}
      <main className="h-[calc(100vh-54px)] overflow-y-auto dark:bg-gray-900 text-base 2xl:text-lg">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
