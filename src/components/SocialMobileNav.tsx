import React from 'react';
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import {
  FaBook,
  FaStar,
  FaBell,
  FaHome,
  FaHashtag
} from "react-icons/fa";
import { useTranslation } from 'react-i18next';

const SocialMobileNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  const menuItems = [
    { id: 'home', label: t('Home'), icon: FaHome, to: '/social' },
    { id: 'my-posts', label: t('My Posts'), icon: FaBook, to: '/social/my-posts' },
    { id: 'recommended', label: t('Recommended'), icon: FaStar, to: '/social/recommended' },
    { id: 'notifications', label: t('Notifications'), icon: FaBell, to: '/social/notifications' },
    { id: 'trends', label: t('Trends'), icon: FaHashtag, to: '/social/trends' },
  ];

  const isActive = (path: string) => {
    if (path === '/social') {
      return location.pathname === '/social';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-50">
      <div className="flex items-center justify-around p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          
          return (
            <Button
              key={item.id}
              variant={active ? "secondary" : "ghost"}
              size="sm"
              className="flex flex-col items-center h-auto p-2 min-w-0 flex-1 mx-1"
              asChild
            >
              <Link to={item.to}>
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs truncate">{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default SocialMobileNav;