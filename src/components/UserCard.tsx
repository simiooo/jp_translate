import React from 'react';
import { UserResponse } from '../types/social';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  FaUserPlus,
  FaUserCheck,
  FaEllipsisH
} from "react-icons/fa";
import { useTranslation } from 'react-i18next';

interface UserCardProps {
  user: UserResponse;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onClick?: () => void;
  isFollowLoading?: boolean;
  isUnfollowLoading?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  isFollowing = false,
  onFollow,
  onUnfollow,
  onClick,
  isFollowLoading = false,
  isUnfollowLoading = false
}) => {
  const { t } = useTranslation();

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowLoading || isUnfollowLoading) return; // Prevent clicks during loading
    if (isFollowing) {
      onUnfollow?.();
    } else {
      onFollow?.();
    }
  };

  const handleCardClick = () => {
    onClick?.();
  };

  return (
    <Card 
      className="border-0 rounded-none border-b hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 bg-primary">
              {user.avatar_url ? (
                <AvatarImage
                  src={user.avatar_url}
                  alt={user.username}
                />
              ) : (
                <AvatarFallback className="text-white font-bold text-lg">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">
                {user.username}
              </h3>
              <p className="text-muted-foreground text-sm">
                @{user.username}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className="rounded-full"
              onClick={handleFollowClick}
              disabled={isFollowLoading || isUnfollowLoading}
            >
              {isFollowLoading || isUnfollowLoading ? (
                <>
                  <div className="w-3 h-3 mr-1 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t('Loading...')}
                </>
              ) : isFollowing ? (
                <>
                  <FaUserCheck className="w-3 h-3 mr-1" />
                  {t('Following')}
                </>
              ) : (
                <>
                  <FaUserPlus className="w-3 h-3 mr-1" />
                  {t('Follow')}
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                console.log("More options for user:", user.id);
              }}
            >
              <FaEllipsisH className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;