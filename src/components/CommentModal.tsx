import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './ModalCompat';
import { PostResponse, CommentResponse } from '../types/social';
import { useSocialStore } from '../store/social';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import {
  FaHeart,
  FaReply,
  FaTrash,
  FaPaperPlane,
  FaEllipsisV,
  FaSpinner,
} from 'react-icons/fa';
import { useAuthStore } from '../store/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
} from './ui/popover';
import { toast } from 'sonner';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostResponse | null;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, post }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const {
    comments,
    commentsLoading,
    commentsPagination,
    commentOnPost,
    getPostComments,
    deleteComment,
    likeComment,
    unlikeComment,
  } = useSocialStore();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [likingComments, setLikingComments] = useState<Set<number>>(new Set());
  const [deletingComments, setDeletingComments] = useState<Set<number>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load comments when modal opens
  useEffect(() => {
    if (isOpen && post) {
      setCurrentPage(1);
      setHasMore(true);
      getPostComments(post.id, 1, 20);
    }
  }, [isOpen, post, getPostComments]);

  // Update hasMore based on pagination
  useEffect(() => {
    if (commentsPagination) {
      setHasMore(commentsPagination.page < commentsPagination.pages);
    }
  }, [commentsPagination]);

  const handleSubmitComment = async () => {
    if (!post || !newComment.trim()) return;

    try {
      await commentOnPost(
        post.id,
        newComment.trim(),
        replyingTo?.id
      );
      setNewComment('');
      setReplyingTo(null);
      // Refresh comments from page 1
      getPostComments(post.id, 1, 20);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setDeletingComments(prev => new Set(prev).add(commentId));
    try {
      await deleteComment(commentId);
      toast.success(t('Comment deleted successfully'));
      // Refresh comments
      if (post) {
        getPostComments(post.id, 1, 20);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error(t('Failed to delete comment'));
    } finally {
      setDeletingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
      setCommentToDelete(null);
    }
  };

  const handleLikeComment = async (comment: CommentResponse) => {
    if (likingComments.has(comment.id)) return;
    
    setLikingComments(prev => new Set(prev).add(comment.id));
    
    try {
      if (!comment.is_liked) {
        await likeComment(comment.id);
      } else {
        await unlikeComment(comment.id);
      }
    } catch (error) {
      console.error('Failed to like/unlike comment:', error);
      toast.error(t('Failed to update like'));
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(comment.id);
        return newSet;
      });
    }
  };

  const loadMoreComments = async () => {
    if (!post || !hasMore || isLoadingMore) return;
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    try {
      await getPostComments(post.id, nextPage, 20);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Failed to load more comments:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const scrollBottom = scrollHeight - scrollTop - clientHeight;
    if (scrollBottom < 100 && !isLoadingMore && hasMore) {
      loadMoreComments();
    }
  }, [isLoadingMore, hasMore, loadMoreComments]);

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

  const renderComment = (comment: CommentResponse, depth = 0) => {
    const isOwnComment = user?.id === comment.user.id;
    const likeCount = comment.like_count || 0;
    const isLiking = likingComments.has(comment.id);
    const isDeleting = deletingComments.has(comment.id);

    return (
      <div
        key={comment.id}
        className={`mb-4 ${depth > 0 ? 'ml-6 pl-4 border-l-2 border-border' : ''} transition-all duration-200 hover:bg-muted/30 rounded-lg p-2 -m-2`}
      >
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
                className={`h-6 px-2 text-xs gap-1 ${comment.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                onClick={() => handleLikeComment(comment)}
                disabled={isLiking}
              >
                {isLiking ? (
                  <FaSpinner className="w-3 h-3 animate-spin" />
                ) : (
                  <FaHeart className="w-3 h-3" />
                )}
                {likeCount > 0 && <span>{likeCount}</span>}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-xs ${replyingTo?.id === comment.id ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500'}`}
                onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : comment)}
              >
                <FaReply className="w-3 h-3 mr-1" />
                {t('Reply')}
              </Button>
              {isOwnComment && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <FaSpinner className="w-3 h-3 animate-spin" />
                      ) : (
                        <FaEllipsisV className="w-3 h-3" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setCommentToDelete(comment.id)}
                    >
                      <FaTrash className="w-3 h-3 mr-2" />
                      {t('Delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {replyingTo?.id === comment.id && (
              <div className="mt-3 pl-4 border-l-2 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-blue-500 font-medium">
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
        {comment.replies && comment.replies?.length > 0 && (
          <div className="mt-4">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!post) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('Comments')}
      size="lg"
      className="max-h-[90vh] flex flex-col"
    >
      {/* Original post summary */}
      <div className="border-b border-border pb-4 mb-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            {post.user.avatar_url ? (
              <AvatarImage src={post.user.avatar_url} alt={post.user.username} />
            ) : (
              <AvatarFallback>
                {post.user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{post.user.username}</h3>
              <span className="text-muted-foreground text-sm">
                {formatTimeAgo(post.created_at)}
              </span>
            </div>
            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>
                <FaHeart className="inline w-3 h-3 mr-1" />
                {post.like_count} {t('Likes')}
              </span>
              <span>
                <FaReply className="inline w-3 h-3 mr-1" />
                {post.comment_count} {t('Comments')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comment input */}
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
            <Textarea
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
                {newComment?.length ?? 0}/280
              </span>
              <div className="flex items-center gap-2">
                {replyingTo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    {t('Cancel')}
                  </Button>
                )}
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
      </div>

      {/* Comments list */}
      <ScrollArea
        className="flex-1 pr-4 -mr-4"
        onScroll={handleScroll}
        ref={scrollAreaRef}
      >
        <div className="pr-4">
          {commentsLoading && currentPage === 1 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 mb-4 p-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4 mb-3" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : comments?.length > 0 ? (
            <>
              {comments.map(comment => renderComment(comment))}
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2">
                    <FaSpinner className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('Loading more comments...')}</span>
                  </div>
                </div>
              )}
              {!hasMore && comments.length >= 10 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {t('No more comments')}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('No comments yet. Be the first to comment!')}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Popover */}
      {commentToDelete !== null && (
        <Popover open={true} onOpenChange={() => setCommentToDelete(null)}>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="leading-none font-medium">{t('Delete Comment')}</h4>
                <p className="text-muted-foreground text-sm">
                  {t('Are you sure you want to delete this comment? This action cannot be undone.')}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCommentToDelete(null)}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => commentToDelete && handleDeleteComment(commentToDelete)}
                >
                  {t('Delete')}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </Modal>
  );
};

export default CommentModal;