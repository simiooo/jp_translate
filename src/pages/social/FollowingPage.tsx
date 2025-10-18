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
import { Skeleton } from "@/components/ui/skeleton";
import { FaUserMinus, FaUserFriends } from "react-icons/fa";

const FollowingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useUser();
  const [page, setPage] = useState(1);
  const [following, setFollowing] = useState<RelationshipResponse[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Get the target user ID (either from params or current user)
  const targetUserId = userId ? parseInt(userId) : currentUser?.id;

  // Use ahooks useRequest for fetching following list
  const {
    data: followingData,
    loading: followingLoading,
    error: followingError,
    run: loadFollowing
  } = useRequest(
    async (pageNum: number = 1, limit: number = 20) => {
      if (!targetUserId) {
        throw new Error('User ID not available');
      }
      
      const response = await alovaInstance.Get<{
        following: RelationshipResponse[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      }>(`/api/social/users/${targetUserId}/following`, {
        params: { page: pageNum, limit }
      });
      
      return response;
    },
    {
      manual: true,
      onSuccess: (data) => {
        if (page === 1) {
          setFollowing(data.following);
        } else {
          setFollowing(prev => [...prev, ...data.following]);
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      },
      onError: (error) => {
        console.error("Failed to load following:", error);
      }
    }
  );

  // Use ahooks useRequest for unfollowing users
  const {
    run: unfollowUser
  } = useRequest(
    async (targetUserId: number) => {
      await alovaInstance.Delete(`/api/social/users/${targetUserId}/follow`);
    },
    {
      manual: true,
      onSuccess: () => {
        // Refresh following list
        loadFollowing(1);
      }
    }
  );

  // Load following when component mounts or user changes
  useEffect(() => {
    if (targetUserId) {
      loadFollowing(1);
    }
  }, [targetUserId]);

  const handleUnfollow = async (userId: number) => {
    await unfollowUser(userId);
  };

  const handleUserClick = (user: UserResponse) => {
    navigate(`/profile/${user.id}`);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFollowing(nextPage);
  };

  const retryLoad = () => {
    loadFollowing(1);
  };

  if (!currentUser && !userId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">{t('Please login')}</h2>
          <p className="text-muted-foreground mb-6">{t('You need to login to view following list')}</p>
          <Button onClick={() => navigate('/login')}>
            {t('Login')}
          </Button>
        </div>
      </div>
    );
  }

  if (followingError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">{t('Error loading following')}</h2>
          <p className="text-muted-foreground mb-6">{t('Failed to load following list')}</p>
          <Button onClick={retryLoad}>
            {t('Try again')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {userId && parseInt(userId) !== currentUser?.id 
              ? t("User's Following") 
              : t("My Following")}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FaUserFriends className="w-4 h-4" />
            <span>{followingData?.pagination?.total || 0} {t('following')}</span>
          </div>
        </div>

        {followingLoading && (following ?? []).length === 0 ? (
          // Loading skeleton
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : (following ?? []).length === 0 ? (
          // Empty state
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50">
              <FaUserFriends className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {t("No following yet")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {userId && parseInt(userId) !== currentUser?.id
                ? t("This user isn't following anyone yet")
                : t("You're not following anyone yet. Discover new users to follow!")}
            </p>
            {!userId && (
              <Button onClick={() => navigate('/social/recommended')}>
                {t("Find Users to Follow")}
              </Button>
            )}
          </Card>
        ) : (
          // Following list
          <div className="space-y-4">
            {following.map((relationship) => {
              const followingUser = relationship.following;
              const isCurrentUser = followingUser.id === currentUser?.id;
              
              return (
                <Card key={relationship.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div
                      className="cursor-pointer w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0"
                      onClick={() => handleUserClick(followingUser)}
                    >
                      {followingUser.avatar_url ? (
                        <img
                          src={followingUser.avatar_url}
                          alt={followingUser.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {followingUser.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleUserClick(followingUser)}
                    >
                      <h3 className="font-semibold text-foreground">{followingUser.username}</h3>
                      <p className="text-sm text-muted-foreground">
                        @{followingUser.username} · {t('Following')}
                      </p>
                    </div>
                    
                    {!isCurrentUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnfollow(followingUser.id)}
                      >
                        <FaUserMinus className="w-3 h-3 mr-1" />
                        {t('Unfollow')}
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
                  disabled={followingLoading}
                  variant="outline"
                >
                  {followingLoading ? t('Loading...') : t('Load more')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingPage;