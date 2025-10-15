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
  FaHashtag,
  FaTimes
} from "react-icons/fa";
import { useTranslation } from 'react-i18next';

interface SocialSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const SocialSidebar: React.FC<SocialSidebarProps> = ({
  activeTab,
  isMobile = false,
  onClose
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  
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

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // 移动端侧边栏样式
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex md:hidden">
        {/* 背景遮罩 */}
        <div
          className="fixed inset-0 bg-black/50"
          onClick={onClose}
        />
        
        {/* 侧边栏内容 */}
        <div className="relative w-64 h-full bg-background border-r">
          {/* 关闭按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10"
            onClick={onClose}
          >
            <FaTimes className="w-4 h-4" />
          </Button>
          
          <div className="p-4 pt-12">
            <h2 className="text-xl font-bold mb-6">{t('Social')}</h2>
            
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
                    onClick={handleLinkClick}
                  >
                    <Link to={to}>
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </nav>

            {/* User profile section */}
            <Card className="mt-8">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">U</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t('Username')}</p>
                    <p className="text-muted-foreground text-xs">@username</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // 桌面端侧边栏样式
  return (
    <div className="w-64 h-full bg-background border-r">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6">{t('Social')}</h2>
        
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
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* User profile section */}
        <Card className="mt-8">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold">U</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{t('Username')}</p>
                <p className="text-muted-foreground text-xs">@username</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SocialSidebar;