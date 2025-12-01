import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CommentResponse } from '~/types/social';
import { useSocialStore } from '~/store/social';
import { useAuthStore } from '~/store/auth';
import Spinner from '~/components/Spinner';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { FaHeart, FaReply, FaTrash, FaPaperPlane, FaEdit, FaEllipsisH, FaComment, FaShare } from 'react-icons/fa';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PostDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const {
    getPost,
    currentPost,
    postsLoading,
    postsError,
    comments,
    commentsLoading,
    commentOnPost,
    getPostComments,
    deleteComment,
    likePost,
    unlikePost,
    repostPost,
    deletePost,
    updatePost,
  } = useSocialStore();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentResponse | null>(null);
  const [editingPost, setEditingPost] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editVisibility, setEditVisibility] = useState('public');

  // Load post and comments on mount
  useEffect(() => {
    if (postId) {
      getPost(Number(postId));
      getPostComments(Number(postId), 1, 20);
    }
  }, [postId, getPost, getPostComments]);

  // Update edit content when post loads
  useEffect(() => {
    if (currentPost) {
      setEditContent(currentPost.content);
      setEditVisibility(currentPost.visibility);
    }
  }, [currentPost]);

  const handleLike = useCallback(async () => {
    if (!currentPost) return;
    
    try {
      if (currentPost.is_liked) {
        await unlikePost(currentPost.id);
      } else {
        await likePost(currentPost.id);
      }
      // Refresh post data
      getPost(currentPost.id);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error(t('Failed to update like'));
    }
  }, [currentPost, likePost, unlikePost, getPost, t]);

  const handleRepost = useCallback(async () => {
    if (!currentPost) return;
    
    try {
      await repostPost(currentPost.id);
      toast.success(t('Post reposted successfully'));
      // Refresh post data
      getPost(currentPost.id);
    } catch (error) {
      console.error('Failed to repost:', error);
      toast.error(t('Failed to repost post'));
    }
  }, [currentPost, repostPost, getPost, t]);

  const handleDeletePost = useCallback(async () => {
    if (!currentPost) return;
    
    if (!window.confirm(t('Are you sure you want to delete this post?'))) return;
    
    try {
      await deletePost(currentPost.id);
      toast.success(t('Post deleted successfully'));
      navigate('/social');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error(t('Failed to delete post'));
    }
  }, [currentPost, deletePost, navigate, t]);

  const handleUpdatePost = useCallback(async () => {
    if (!currentPost) return;
    
    try {
      await updatePost(currentPost.id, editContent, editVisibility);
      toast.success(t('Post updated successfully'));
      setEditingPost(false);
      // Refresh post data
      getPost(currentPost.id);
    } catch (error) {
      console.error('Failed to update post:', error);
      toast.error(t('Failed to update post'));
    }
  }, [currentPost, editContent, editVisibility, updatePost, getPost, t]);

  const handleSubmitComment = useCallback(async () => {
    if (!currentPost || !newComment.trim()) return;

    try {
      await commentOnPost(
        currentPost.id,
        newComment.trim(),
        replyingTo?.id
      );
      setNewComment('');
      setReplyingTo(null);
      // Refresh comments
      getPostComments(currentPost.id, 1, 20);
      // Refresh post to update comment count
      getPost(currentPost.id);
      toast.success(t('Comment posted successfully'));
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error(t('Failed to post comment'));
    }
  }, [currentPost, newComment, replyingTo, commentOnPost, getPostComments, getPost, t]);

  const handleDeleteComment = useCallback(async (commentId: number) => {
    if (!currentPost) return;
    
    if (!window.confirm(t('Are you sure you want to delete this comment?'))) return;
    
    try {
      await deleteComment(commentId);
      // Refresh comments
      getPostComments(currentPost.id, 1, 20);
      // Refresh post to update comment count
      getPost(currentPost.id);
      toast.success(t('Comment deleted successfully'));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error(t('Failed to delete comment'));
    }
  }, [currentPost, deleteComment, getPostComments, getPost, t]);

  const formatTimeAgo = useCallback((dateString: string) => {
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
  }, [t]);

  const canEditPost = useCallback(() => {
    if (!currentPost || !user) return false;
    const isOwnPost = currentPost.user.id === user.id;
    const createdAt = new Date(currentPost.created_at);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
    return isOwnPost && diffInMinutes <= 5;
  }, [currentPost, user]);

  const renderComment = (comment: CommentResponse, depth = 0) => {
    const isOwnComment = user?.id === comment.user.id;

    return (
      <div key={comment.id} className={`mb-4 ${depth > 0 ? 'ml-6 pl-4 border-l-2 border-border' : ''}`}>
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8">
            {comment.user.avatar_url ? (
              <AvatarImage src={comment.user.avatar_url} alt={comment.user.username} />
            ) : (
              <AvatarFallback className="text-xs">
                {comment.user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{comment.user.username}</h4>
              <span className="text-muted-foreground text-xs">
                {formatTimeAgo(comment.created_at)}
              </span>
              {isOwnComment && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  {t('You')}
                </span>
              )}
            </div>
            <p className="text-foreground text-sm whitespace-pre-wrap">{comment.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-blue-500"
                onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : comment)}
              >
                <FaReply className="w-3 h-3 mr-1" />
                {t('Reply')}
              </Button>
              {isOwnComment && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <FaTrash className="w-3 h-3 mr-1" />
                  {t('Delete')}
                </Button>
              )}
            </div>
            {replyingTo?.id === comment.id && (
              <div className="mt-3 pl-4 border-l-2 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-blue-500">
                    {t('Replying to')} @{comment.user.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-xs"
                    onClick={() => setReplyingTo(null)}
                  >
                    {t('Cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (postsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (postsError || !currentPost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-destructive mb-4">
          {postsError || t('Post not found')}
        </p>
        <Button onClick={() => navigate('/social')}>
          {t('Back to feed')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Post Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12">
                {currentPost.user.avatar_url ? (
                  <AvatarImage src={currentPost.user.avatar_url} alt={currentPost.user.username} />
                ) : (
                  <AvatarFallback>
                    {currentPost.user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">{currentPost.user.username}</h2>
                <p className="text-muted-foreground text-sm">
                  {formatTimeAgo(currentPost.created_at)}
                </p>
              </div>
            </div>
            
            {/* Post Actions Menu */}
            {canEditPost() && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <FaEllipsisH className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingPost(true)}>
                    <FaEdit className="w-4 h-4 mr-2" />
                    {t('Edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeletePost} className="text-destructive">
                    <FaTrash className="w-4 h-4 mr-2" />
                    {t('Delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Post Content */}
          {editingPost ? (
            <div className="space-y-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={280}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {editContent.length}/280
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingPost(false);
                      setEditContent(currentPost.content);
                    }}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button onClick={handleUpdatePost}>
                    {t('Save')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-foreground whitespace-pre-wrap text-base">
                {currentPost.content}
              </p>
              
              {/* Display images if any */}
              {currentPost.image_urls && currentPost.image_urls.length > 0 && (
                <div className={`grid gap-2 mt-4 ${
                  currentPost.image_urls.length === 1 ? 'grid-cols-1' :
                  currentPost.image_urls.length === 2 ? 'grid-cols-2' :
                  'grid-cols-2 md:grid-cols-3'
                }`}>
                  {currentPost.image_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Post image ${index + 1}`}
                      className="rounded-lg object-cover w-full h-48 md:h-64"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Post Stats */}
          <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground border-y border-border py-3">
            <span>
              <FaHeart className="inline w-4 h-4 mr-1" />
              {currentPost.like_count} {t('Likes')}
            </span>
            <span>
              <FaReply className="inline w-4 h-4 mr-1" />
              {currentPost.comment_count} {t('Comments')}
            </span>
            <span>
              {t('Visibility')}: {currentPost.visibility}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-around">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => {
                // Focus comment input
                const textarea = document.getElementById('comment-textarea');
                textarea?.focus();
              }}
            >
              <FaComment className="w-4 h-4" />
              {t('Comment')}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleRepost}
            >
              <FaShare className="w-4 h-4" />
              {t('Repost')}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${currentPost.is_liked ? 'text-red-500' : ''}`}
              onClick={handleLike}
            >
              <FaHeart className="w-4 h-4" />
              {t('Like')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">{t('Comments')}</h3>
          
          {/* Comment Input */}
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                {user?.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                ) : (
                  <AvatarFallback className="text-xs">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                {replyingTo && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-blue-500">
                      {t('Replying to')} @{replyingTo.user.username}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-xs"
                      onClick={() => setReplyingTo(null)}
                    >
                      {t('Cancel')}
                    </Button>
                  </div>
                )}
                <Textarea
                  id="comment-textarea"
                  placeholder={replyingTo 
                    ? t('Reply to @{username}...', { username: replyingTo.user.username })
                    : t('Add a comment...')
                  }
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                  maxLength={280}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {newComment.length}/280
                  </span>
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="gap-2"
                  >
                    <FaPaperPlane className="w-4 h-4" />
                    {t('Post')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-4">
              {commentsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))
              ) : comments.length > 0 ? (
                comments.map(comment => renderComment(comment))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('No comments yet. Be the first to comment!')}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostDetailPage;