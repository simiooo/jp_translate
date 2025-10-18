import React, { useState, useEffect } from "react";
import { useRequest } from "ahooks";
import { useUser } from "~/store/auth";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from 'react-i18next'
import { alovaInstance } from "~/utils/request";
import { RelationshipResponse, UserResponse } from "~/types/social";

// Shadcn/ui imports
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { FaUserPlus, FaUserFriends } from "react-icons/fa";

const FollowersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useUser();
  const [page, setPage] = useState(1);
  const [followers, setFollowers] = useState<RelationshipResponse[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Get the target user ID (either from params or current user)
  const targetUserId = userId ? parseInt(userId) : currentUser?.id;

  // Use ahooks useRequest for fetching followers
  const {
    data: followersData,
    loading: followersLoading,
    error: followersError,
    run: loadFollowers
  } = useRequest(
    async (pageNum: number = 1, limit: number = 20) => {
      if (!targetUserId) {
        throw new Error('User ID not available');
      }
      
      const response = await alovaInstance.Get<{
        followers: RelationshipResponse[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      }>(`/api/social/users/${targetUserId}/followers`, {
        params: { page: pageNum, limit }
      });
      
      return response;
    },
    {
      manual: true,
      onSuccess: (data) => {
        if (page === 1) {
          setFollowers(data.followers);
        } else {
          setFollowers(prev => [...prev, ...data.followers]);
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      },
      onError: (error) => {
        console.error("Failed to load followers:", error);
      }
    }
  );

  // Use ahooks useRequest for following/unfollowing users
  const {
    run: followUser
  } = useRequest(
    async (targetUserId: number) => {
      await alovaInstance.Post(`/api/social/users/${targetUserId}/follow`);
    },
    {
      manual: true,
      onSuccess: () => {
        // Refresh followers list
        loadFollowers(1);
      }
    }
  );

  // Load followers when component mounts or user changes
  useEffect(() => {
    if (targetUserId) {
      loadFollowers(1);
    }
  }, [targetUserId]);

  const handleFollow = async (userId: number) => {
    await followUser(userId);
  };

  const handleUserClick = (user: UserResponse) => {
    navigate(`/profile/${user.id}`);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFollowers(nextPage);
  };

  const retryLoad = () => {
    loadFollowers(1);
  };

  if (!currentUser && !userId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">{t('Please login')}</h2>
          <p className="text-muted-foreground mb-6">{t('You need to login to view followers')}</p>
          <Button onClick={() => navigate('/login')}>
            {t('Login')}
          </Button>
        </div>
      </div>
    );
  }

  if (followersError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">{t('Error loading followers')}</h2>
          <p className="text-muted-foreground mb-6">{t('Failed to load followers list')}</p>
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold">
            {userId && parseInt(userId) !== currentUser?.id
              ? t("User's Followers")
              : t("My Followers")}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FaUserFriends className="w-4 h-4" />
            <span className="text-sm md:text-base">{followersData?.pagination?.total || 0} {t('followers')}</span>
          </div>
        </div>

        {followersLoading && (followers ?? [])?.length === 0 ? (
          // Loading skeleton
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24 md:w-32" />
                    <Skeleton className="h-3 w-20 md:w-24" />
                  </div>
                  <Skeleton className="h-8 w-16 md:w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : (followers ?? [])?.length === 0 ? (
          // Empty state
          <Card className="p-6 md:p-8 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground opacity-50">
              <FaUserFriends className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {t("No followers yet")}
            </h3>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              {userId && parseInt(userId) !== currentUser?.id
                ? t("This user doesn't have any followers yet")
                : t("You don't have any followers yet. Keep sharing great content!")}
            </p>
            {!userId && (
              <Button onClick={() => navigate('/social')}>
                {t("Start Sharing")}
              </Button>
            )}
          </Card>
        ) : (
          // Followers list
          <div className="space-y-3 md:space-y-4">
            {followers.map((relationship) => {
              const follower = relationship.follower;
              const isCurrentUser = follower.id === currentUser?.id;
              
              return (
                <Card key={relationship.id} className="p-3 md:p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div
                      className="cursor-pointer w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0"
                      onClick={() => handleUserClick(follower)}
                    >
                      {follower.avatar_url ? (
                        <img
                          src={follower.avatar_url}
                          alt={follower.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm md:text-lg">
                          {follower.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => handleUserClick(follower)}
                    >
                      <h3 className="font-semibold text-foreground text-sm md:text-base truncate">{follower.username}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        @{follower.username} · {t('Followed you')}
                      </p>
                    </div>
                    
                    {!isCurrentUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFollow(follower.id)}
                        className="flex-shrink-0"
                      >
                        <FaUserPlus className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">{t('Follow back')}</span>
                        <span className="sm:hidden">{t('Follow')}</span>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
            
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  onClick={loadMore}
                  disabled={followersLoading}
                  variant="outline"
                >
                  {followersLoading ? t('Loading...') : t('Load more')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowersPage;