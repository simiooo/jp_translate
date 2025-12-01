import { Outlet } from "react-router";
import SocialSidebar from "~/components/SocialSidebar";
import SocialMobileNav from "~/components/SocialMobileNav";

export default function SocialLayout() {
  
  return (
    <div className="flex h-full">
      {/* Sidebar - hidden on mobile, visible on md and up */}
      <div className="hidden md:block">
        <SocialSidebar />
      </div>
      <main className="flex-1 overflow-auto min-w-0 pb-16 md:pb-0">
        <Outlet />
      </main>
      
      {/* Mobile Navigation - hidden on desktop */}
      <SocialMobileNav />
    </div>
  );
}