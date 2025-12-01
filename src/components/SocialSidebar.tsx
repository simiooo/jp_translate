import React from 'react';
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FaBook,
  FaStar,
  FaBell,
  FaUserFriends,
  FaUserPlus,
  FaHome,
  FaHashtag
} from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '~/store/auth';

interface SocialSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const SocialSidebar: React.FC<SocialSidebarProps> = ({
  activeTab
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const profile = useAuthStore(state => state.profile)
  
  // If activeTab is not provided, determine it from the current path
  const currentActiveTab = activeTab || (() => {
    const path = location.pathname;
    if (path === "/social") return "home";
    if (path.startsWith("/social/my-posts")) return "my-posts";
    if (path.startsWith("/social/recommended")) return "recommended";
    if (path.startsWith("/social/notifications")) return "notifications";
    if (path.startsWith("/social/following")) return "following";
    if (path.startsWith("/social/followers")) return "followers";
    if (path.startsWith("/social/trends")) return "trends";
    return "home";
  })();
  const menuItems = [
    { id: 'home', label: t('Home'), icon: FaHome },
    { id: 'my-posts', label: t('My Posts'), icon: FaBook },
    { id: 'recommended', label: t('Recommended'), icon: FaStar },
    { id: 'notifications', label: t('Notifications'), icon: FaBell },
    { id: 'following', label: t('Following'), icon: FaUserFriends },
    { id: 'followers', label: t('Followers'), icon: FaUserPlus },
    { id: 'trends', label: t('Trends'), icon: FaHashtag },
  ];

  return (
    <div className="w-64 h-full bg-background border-r">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6 hidden md:block">{t('Social')}</h2>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const to = item.id === 'home' ? '/social' : `/social/${item.id}`;
            return (
              <Button
                key={item.id}
                variant={currentActiveTab === item.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                asChild
              >
                <Link to={to}>
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* User profile section */}
        <Card className="mt-8 hidden md:block">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{profile?.user?.username?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{profile?.user?.username ?? "-"}</p>
                <p className="text-muted-foreground text-xs">@{profile?.user?.username ?? "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SocialSidebar;