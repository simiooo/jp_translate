import { Outlet } from "react-router";
import { useState } from "react";
import SocialSidebar from "~/components/SocialSidebar";
import { Button } from "@/components/ui/button";
import { FaBars } from "react-icons/fa";

export default function SocialLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-full relative">
      {/* 左侧边栏 - 桌面端显示 */}
      <div className="hidden md:block">
        <SocialSidebar />
      </div>

      {/* 移动端侧边栏 - 按需显示 */}
      {isSidebarOpen && (
        <SocialSidebar
          isMobile={true}
          onClose={closeSidebar}
        />
      )}

      {/* 主内容区域 */}
      <main className="flex-1 overflow-auto">
        {/* 移动端顶部导航栏 */}
        <div className="md:hidden sticky top-0 z-40 bg-background border-b p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
          >
            <FaBars className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Social</h1>
          <div className="w-9 h-9"></div> {/* 占位符，保持标题居中 */}
        </div>
        
        <Outlet />
      </main>
    </div>
  );
}