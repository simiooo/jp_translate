import { Outlet } from "react-router";
import SocialSidebar from "~/components/SocialSidebar";

export default function SocialLayout() {
  return (
    <div className="flex h-full">
      <SocialSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}