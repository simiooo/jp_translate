import React, { useState, useEffect } from "react";
import { useRequest } from "ahooks";
import { useUser } from "~/store/auth";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from 'react-i18next'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FaBell, FaHeart, FaComment, FaUserPlus, FaShare, FaClock } from "react-icons/fa";

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'repost';
  user: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  post?: {
    id: number;
    content: string;
  };
  message: string;
  created_at: string;
  is_read: boolean;
}

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Mock notifications data - in a real app, this would come from the API
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'like',
      user: { id: 123, username: 'japanese_learner', avatar_url: '' },
      post: { id: 456, content: '新しい単語を学びました！' },
      message: 'liked your post',
      created_at: '2025-09-10T15:30:00Z',
      is_read: false
    },
    {
      id: '2',
      type: 'comment',
      user: { id: 124, username: 'vocab_master', avatar_url: '' },
      post: { id: 456, content: '新しい単語を学びました！' },
      message: 'commented on your post',
      created_at: '2025-09-10T14:20:00Z',
      is_read: false
    },
    {
      id: '3',
      type: 'follow',
      user: { id: 125, username: 'language_lover', avatar_url: '' },
      message: 'started following you',
      created_at: '2025-09-10T13:15:00Z',
      is_read: true
    }
  ];

  // Use ahooks useRequest for fetching notifications (mock for now)
  const {
    loading: notificationsLoading,
    error: notificationsError,
    run: loadNotifications
  } = useRequest(
    async (pageNum: number = 1, limit: number = 20) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock data for now
      return {
        notifications: mockNotifications,
        pagination: {
          total: mockNotifications.length,
          page: pageNum,
          limit: limit,
          pages: 1
        }
      };
    },
    {
      manual: true,
      onSuccess: (data) => {
        if (page === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications(prev => [...prev, ...data.notifications]);
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      },
      onError: (error) => {
        console.error("Failed to load notifications:", error);
      }
    }
  );

  // Load notifications when component mounts
  useEffect(() => {
    if (currentUser) {
      loadNotifications(1);
    }
  }, [currentUser]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <FaHeart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <FaComment className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <FaUserPlus className="w-4 h-4 text-green-500" />;
      case 'repost':
        return <FaShare className="w-4 h-4 text-purple-500" />;
      default:
        return <FaBell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return t('Just now');
      if (diffInMinutes < 60) return `${diffInMinutes}m`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
      return `${Math.floor(diffInMinutes / 1440)}d`;
    } catch {
      return dateString;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.post) {
      navigate({ to: `/social/post/${notification.post.id}` });
    } else if (notification.user) {
      navigate({ to: `/profile/${notification.user.id}` });
    }
  };

  const handleUserClick = (userId: number) => {
    navigate({ to: `/profile/${userId}` });
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage);
  };

  const retryLoad = () => {
    loadNotifications(1);
  };

  if (!currentUser) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">{t('Please login')}</h2>
          <p className="text-muted-foreground mb-6">{t('You need to login to view notifications')}</p>
          <Button onClick={() => navigate({ to: '/login' })}>
            {t('Login')}
          </Button>
        </div>
      </div>
    );
  }

  if (notificationsError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">{t('Error loading notifications')}</h2>
          <p className="text-muted-foreground mb-6">{t('Failed to load notifications')}</p>
          <Button onClick={retryLoad}>
            {t('Try again')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-3">
            <FaBell className="w-5 h-5 md:w-6 md:h-6" />
            {t("Notifications")}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm">{notifications.filter(n => !n.is_read).length} {t('unread')}</span>
          </div>
        </div>

        {notificationsLoading && notifications.length === 0 ? (
          // Loading skeleton
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          // Empty state
          <Card className="p-6 md:p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50">
              <FaBell className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {t("No notifications yet")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("When people interact with your posts, you'll see it here.")}
            </p>
            <Button onClick={() => navigate({ to: '/social' })}>
              {t("Start Sharing")}
            </Button>
          </Card>
        ) : (
          // Notifications list
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  !notification.is_read ? 'border-l-4 border-l-primary' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span
                            className="font-semibold cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserClick(notification.user.id);
                            }}
                          >
                            {notification.user.username}
                          </span>
                          {' '}{t(notification.message)}
                        </p>
                        
                        {notification.post && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            "{notification.post.content}"
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <FaClock className="w-3 h-3" />
                        {formatTimeAgo(notification.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  onClick={loadMore}
                  disabled={notificationsLoading}
                  variant="outline"
                >
                  {notificationsLoading ? t('Loading...') : t('Load more')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;