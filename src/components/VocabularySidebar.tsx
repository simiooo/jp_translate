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

interface VocabularySidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const VocabularySidebar: React.FC<VocabularySidebarProps> = ({
  activeTab
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  
  // If activeTab is not provided, determine it from the current path
  const currentActiveTab = activeTab || (() => {
    const path = location.pathname;
    if (path === "/vocabulary") return "home";
    if (path.startsWith("/vocabulary/my-vocabulary")) return "my-vocabulary";
    if (path.startsWith("/vocabulary/recommended")) return "recommended";
    if (path.startsWith("/vocabulary/notifications")) return "notifications";
    if (path.startsWith("/vocabulary/following")) return "following";
    if (path.startsWith("/vocabulary/followers")) return "followers";
    if (path.startsWith("/vocabulary/trends")) return "trends";
    return "home";
  })();
  const menuItems = [
    { id: 'home', label: t('Home'), icon: FaHome },
    { id: 'my-vocabulary', label: t('My Vocabulary'), icon: FaBook },
    { id: 'recommended', label: t('Recommended Vocabulary'), icon: FaStar },
    { id: 'notifications', label: t('Notifications'), icon: FaBell },
    { id: 'following', label: t('Following List'), icon: FaUserFriends },
    { id: 'followers', label: t('Followers List'), icon: FaUserPlus },
    { id: 'trends', label: t('Current Trends'), icon: FaHashtag },
  ];

  return (
    <div className="w-64 h-full bg-background border-r">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6">{t('Vocabulary Community')}</h2>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const to = item.id === 'home' ? '/vocabulary' : `/vocabulary/${item.id}`;
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

export default VocabularySidebar;