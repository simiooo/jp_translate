import { Outlet, useNavigation } from "react-router";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import { Toaster } from "~/components/ui/sonner";

export default function AuthLayout() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 主要内容区域 */}
      <main className="min-h-screen">
        {isNavigating ? <HydrateFallbackTemplate /> : <Outlet />}
      </main>
      <Toaster />
    </div>
  );
}