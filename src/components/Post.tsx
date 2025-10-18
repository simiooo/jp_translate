import React, { useState } from 'react';
import { PostResponse } from '../types/social';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  FaHeart,
  FaComment,
  FaShare,
  FaBookmark,
  FaEllipsisH,
  FaRetweet
} from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import './PostAnimations.css';

interface PostProps {
  post: PostResponse;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onRepost?: () => void;
  onLike?: (postId: number, isLiked: boolean) => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isReposted?: boolean;
}

const Post: React.FC<PostProps> = ({
  post,
  onComment,
  onBookmark,
  onRepost,
  onLike,
  isBookmarked = false,
  isReposted = false
}) => {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [likeCountAnimating, setLikeCountAnimating] = useState(false);

  const handleLike = () => {
    // Trigger animation immediately
    setIsAnimating(true);
    setLikeCountAnimating(true);
    
    // Reset animations after duration
    setTimeout(() => setIsAnimating(false), 300);
    setTimeout(() => setLikeCountAnimating(false), 300);

    // Notify parent component about the like action
    if (onLike) {
      onLike(post.id, !post.is_liked);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return t('Just now');
      if (diffInHours < 24) return `${diffInHours}h`;
      return `${Math.floor(diffInHours / 24)}d`;
    } catch {
      return dateString;
    }
  };

  const renderPostContent = () => {
    // Regular post content
    return (
      <div className="text-foreground mb-4">
        <p className="whitespace-pre-wrap">{post.content}</p>
        
        {/* Display images if any */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className={`grid gap-2 mt-3 ${
            post.image_urls.length === 1 ? 'grid-cols-1' :
            post.image_urls.length === 2 ? 'grid-cols-2' :
            'grid-cols-2 md:grid-cols-3'
          }`}>
            {post.image_urls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Post image ${index + 1}`}
                className="rounded-lg object-cover w-full h-32 md:h-48"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Handle quote posts
  if (post.parent_post && post.content_type === 'quote') {
    return (
      <Card className="border-0 rounded-none border-b hover:bg-muted/50 transition-colors">
        <CardContent className="p-4">
          {/* Header with user info */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-10 h-10 md:w-12 md:h-12 bg-primary">
              {post.user.avatar_url ? (
                <AvatarImage
                  src={post.user.avatar_url}
                  alt={post.user.username}
                />
              ) : (
                <AvatarFallback className="text-white font-bold text-lg">
                  {post.user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">
                  {post.user.username}
                </h3>
                <span className="text-muted-foreground text-sm">
                  · {formatTimeAgo(post.created_at)}
                </span>
              </div>
              
              {/* Quote content */}
              {post.content && (
                <div className="mb-3">
                  <p className="text-foreground">{post.content}</p>
                </div>
              )}
              
              {/* Quoted post */}
              <Card className="border-l-4 border-primary bg-muted/30 mb-3">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2 mb-2">
                   <Avatar className="w-6 h-6 md:w-8 md:h-8 bg-primary">
                      {post.parent_post.user.avatar_url ? (
                        <AvatarImage
                          src={post.parent_post.user.avatar_url}
                          alt={post.parent_post.user.username}
                        />
                      ) : (
                        <AvatarFallback className="text-white font-bold text-xs">
                          {post.parent_post.user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-sm">{post.parent_post.user.username}</h4>
                      <p className="text-muted-foreground text-xs">
                        {formatTimeAgo(post.parent_post.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm">
                    {renderPostContent.call({ post: post.parent_post })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground hover:text-blue-500 hover:bg-blue-100"
                  onClick={onComment}
                >
                  <FaComment className="w-4 h-4 mr-1" />
                  {t('Reply')} {post.comment_count > 0 && `(${post.comment_count})`}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${isReposted ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground hover:text-green-500'} hover:bg-green-100`}
                  onClick={onRepost}
                >
                  <FaRetweet className="w-4 h-4 mr-1" />
                  {t('Quote')} {post.repost_count > 0 && `(${post.repost_count})`}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={`like-button ${post.is_liked ? 'text-red-500 hover:text-red-600 liked' : 'text-muted-foreground hover:text-red-500'} hover:bg-red-100 ${isAnimating ? 'animating' : ''}`}
                  onClick={handleLike}
                >
                  <FaHeart className={`heart-icon w-4 h-4 mr-1 ${post.is_liked ? 'text-red-500' : ''}`} />
                  <span className={`like-count ${likeCountAnimating ? 'animating' : ''}`}>
                    {t('Like')} {post.like_count > 0 && `(${post.like_count})`}
                  </span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${isBookmarked ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-yellow-500'} hover:bg-yellow-100`}
                  onClick={onBookmark}
                >
                  <FaBookmark className="w-4 h-4 mr-1" />
                  {t('Bookmark')}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <FaEllipsisH className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Regular post
  return (
    <Card className="border-0 rounded-none border-b hover:bg-muted/50 transition-colors">
      <CardContent className="px-4">
        {/* Header with user info */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-10 h-10 md:w-12 md:h-12 bg-primary">
            {post.user.avatar_url ? (
              <AvatarImage
                src={post.user.avatar_url}
                alt={post.user.username}
              />
            ) : (
              <AvatarFallback className="text-white font-bold text-lg">
                {post.user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">
                {post.user.username}
              </h3>
              <span className="text-muted-foreground text-sm">
                · {formatTimeAgo(post.created_at)}
              </span>
            </div>
            
            {/* Post content */}
            {renderPostContent()}
            
            {/* Action buttons */}
            <div className="flex items-center justify-start gap-2 md:gap-6 -translate-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
                onClick={onComment}
              >
                <FaComment className="w-4 h-4 md:mr-1" />
                {post.comment_count > 0 && (
                  <span className="hidden md:inline">{post.comment_count}</span>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-green-500 hover:bg-green-50"
                onClick={onRepost}
              >
                <FaShare className="w-4 h-4 md:mr-1" />
                {post.repost_count > 0 && (
                  <span className="hidden md:inline">{post.repost_count}</span>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={`inline-flex like-button ${post.is_liked ? 'text-red-500 hover:text-red-600 liked' : 'text-muted-foreground hover:text-red-500'} hover:bg-red-50 ${isAnimating ? 'animating' : ''}`}
                onClick={handleLike}
              >
                <FaHeart className={`heart-icon w-4 h-4 md:mr-1 ${post.is_liked ? 'text-red-500' : ''}`} />
                <span className={`like-count hidden md:inline ${likeCountAnimating ? 'animating' : ''}`}>
                  {post.like_count > 0 && `${post.like_count}`}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={`${isBookmarked ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-yellow-500'} hover:bg-yellow-50`}
                onClick={onBookmark}
              >
                <FaBookmark className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Post;
