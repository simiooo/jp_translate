import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRequest } from "ahooks";
import { useUser } from "~/store/auth";
import { useNavigate } from "react-router";
import Spinner from "~/components/Spinner";
import { VList, VListHandle } from "virtua";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import { useTranslation } from 'react-i18next'
import { alovaInstance } from "~/utils/request";
import { PostResponse, PostCreateRequest } from "~/types/social";

// Store
import { useSocialStore } from "~/store/social";

import Post from "~/components/Post";
import SocialRightSidebar from "~/components/SocialRightSidebar";
import PostForm from "~/components/PostForm";

// Shadcn/ui imports
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const MyPostsPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate();
  const listContainerRef = useRef<VListHandle>(null);
  const [vlistKey] = useState(0);
  const fetchedCountRef = useRef(-1);

  // Get current user
  const currentUser = useUser();
  
  // Social store for batch like operations
  const { addToLikeQueue, updatePostInList } = useSocialStore();

  // Use ahooks useRequest for fetching user posts
  const {
    data: postsData,
    loading: postsLoading,
    error: postsError,
    run: loadUserPosts,
    refresh
  } = useRequest(
    async (page: number = 1, limit: number = 10) => {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      const response = await alovaInstance.Get<{
        posts: PostResponse[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      }>(`/api/social/posts/user/${currentUser.id}`, {
        params: { page, limit }
      });
      
      return response;
    },
    {
      manual: true,
      onError: (error) => {
        console.error("Failed to load user posts:", error);
      }
    }
  );

  // Load posts when user is available
  useEffect(() => {
    if (currentUser?.id) {
      loadUserPosts(1, 10);
    }
  }, [currentUser?.id]);

  // Use ahooks useRequest for creating posts
  const {
    run: createPost
  } = useRequest(
    async (content: string, contentType: string = 'text', visibility: string = 'public', parentPostId?: number, imageUrls?: string[]) => {
      const postData: PostCreateRequest = {
        content,
        content_type: contentType as 'text' | 'image' | 'quote',
        visibility: visibility as 'public' | 'followers',
        parent_post_id: parentPostId,
        image_urls: imageUrls
      };
      const response = await alovaInstance.Post<{ post: PostResponse }>('/api/social/posts', postData);
      return response;
    },
    {
      manual: true,
      onSuccess: () => {
        // Refresh posts after successful creation
        refresh();
      },
      onError: (error) => {
        console.error('Failed to create post:', error);
      }
    }
  );

  // Handle post like/unlike with optimistic updates and batch processing
  const handlePostLike = (postId: number, isLiked: boolean) => {
    // Find the post in the current posts data
    const post = postsData?.posts.find(p => p.id === postId);
    if (post) {
      // Optimistic update - immediately update UI
      updatePostInList(postId, {
        is_liked: isLiked,
        like_count: isLiked ? post.like_count + 1 : Math.max(0, post.like_count - 1)
      });

      // Add to batch queue
      addToLikeQueue(postId, isLiked ? 'like' : 'unlike');
    }
  };

  // Use ahooks useRequest for reposting
  const {
    run: repostPost
  } = useRequest(
    async (postId: number) => {
      await alovaInstance.Post(`/api/social/posts/${postId}/repost`);
    },
    {
      manual: true,
      onSuccess: () => {
        // Refresh posts to show the new repost
        refresh();
      }
    }
  );


  const handleScroll = useCallback(async () => {
    if (!listContainerRef.current || !currentUser?.id || postsLoading) return;
    
    const posts = postsData ? postsData.posts : [];
    const count = posts.length;
    
    if (fetchedCountRef.current < count &&
        listContainerRef.current.findEndIndex() + 50 > count) {
      fetchedCountRef.current = count;
      const nextPage = Math.floor(count / 10) + 1;
      await loadUserPosts(nextPage, 10);
    }
  }, [postsData, postsLoading, currentUser?.id, loadUserPosts]);

  // Check if we need to load more data on initial render
  useEffect(() => {
    if (!listContainerRef.current || postsLoading || !currentUser?.id) return;
    
    const posts = postsData ? postsData.posts : [];
    const hasMore = posts.length < (postsData?.pagination?.total || 0);
    
    if (!hasMore) return;

    // Check if there's empty space in the viewport that could be filled with more data
    const hasEmptySpace = listContainerRef.current.viewportSize > listContainerRef.current.scrollSize;
    
    if (hasEmptySpace) {
      const nextPage = Math.floor(posts.length / 10) + 1;
      loadUserPosts(nextPage, 10);
    }
  }, [postsData, postsLoading, currentUser?.id, loadUserPosts]);


  const handlePostComment = (post: { id: number }) => {
    console.log("Comment on post:", post);
    // TODO: Implement comment modal or navigation
  };

  const handlePostShare = (post: { id: number }) => {
    console.log("Share post:", post);
    // TODO: Implement share functionality
  };

  const handlePostBookmark = (post: { id: number }) => {
    console.log("Bookmark post:", post);
    // TODO: Implement bookmark functionality
  };

  const handlePostRepost = async (post: { id: number }) => {
    await repostPost(post.id);
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await alovaInstance.Post(`/api/social/users/${userId}/follow`);
      // Refresh posts after following user
      refresh();
    } catch (error) {
      console.error("Failed to follow user:", error);
    }
  };

  const handleTrendClick = (hashtag: string) => {
    console.log("Hashtag clicked:", hashtag);
    // Navigate to trends page with the hashtag pre-selected
    window.location.href = `/social/trends?hashtag=${encodeURIComponent(hashtag)}`;
  };

  const handlePostSubmit = async (content: string, contentType?: string, visibility?: string, parentPostId?: number, imageUrls?: string[]) => {
    await createPost(content, contentType, visibility, parentPostId, imageUrls);
  };

  const retryLoad = () => {
    refresh();
  };

  if (!currentUser) {
    return (
      <div className="h-[calc(100vh-60px)] overflow-y-auto bg-background">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">{t('Please login')}</h2>
            <p className="text-muted-foreground mb-6">{t('You need to login to view your posts')}</p>
            <Button onClick={() => navigate('/login')}>
              {t('Login')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const posts = postsData ? postsData.posts : [];
  const isLoading = postsLoading && posts.length === 0;
  const hasError = !!postsError;

  return (
    <div className="h-[calc(100vh-60px)] overflow-y-auto bg-background">
      <div className="flex h-full">

        {/* Main Content */}
        <div className="flex-1 min-w-0 border-x">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto px-4 md:px-0">
              <h1 className="text-xl font-bold">{t("My Posts")}</h1>
            </div>
          </div>

          {/* Error state */}
          {hasError && (
            <div className="p-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-between">
                <span className="text-destructive">{t('Failed to load posts')}</span>
                <Button onClick={retryLoad} size="sm" variant="outline">
                  {t('Try again')}
                </Button>
              </div>
            </div>
          )}

          {/* Post creation form */}
          <PostForm onSubmit={handlePostSubmit} />

          {/* Posts list */}
          <div className="h-[calc(100vh-200px)]">
            <>
                {isLoading ? (
                  <div className="space-y-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="p-4 border-b">
                        <div className="flex gap-3">
                          <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex gap-2 md:gap-4">
                              <Skeleton className="h-4 w-8 md:w-12" />
                              <Skeleton className="h-4 w-8 md:w-12" />
                              <Skeleton className="h-4 w-8 md:w-12" />
                              <Skeleton className="h-4 w-8 md:w-12" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50">
                      <span className="w-full h-full flex items-center justify-center text-2xl">📝</span>
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      {t("No posts yet")}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {t("Start sharing your thoughts with the community")}
                    </p>
                    <Button onClick={retryLoad}>
                      {t("Refresh")}
                    </Button>
                  </div>
                ) : (
                  // Posts list with VList
                  <>
                    <VList
                      ref={listContainerRef}
                      count={posts.length}
                      overscan={10}
                      itemSize={160}
                      onScroll={handleScroll}
                      key={`vlist-${vlistKey}`}
                    >
                      {(index) => {
                        const post = posts[index];
                        if (!post) return <></>;
                        return (
                          <Post
                            key={`${post.id}-${index}`}
                            post={post}
                            onComment={() => handlePostComment(post)}
                            onShare={() => handlePostShare(post)}
                            onBookmark={() => handlePostBookmark(post)}
                            onRepost={() => handlePostRepost(post)}
                            onLike={handlePostLike}
                            isLiked={post.is_liked}
                          />
                        );
                      }}
                    </VList>
                    {postsLoading && posts.length > 0 && (
                      <div className="p-4 flex justify-center">
                        <Spinner loading={true} />
                      </div>
                    )}
                  </>
                )}
            </>
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <SocialRightSidebar
            onFollow={handleFollowUser}
            onTrendClick={handleTrendClick}
          />
        </div>
      </div>
    </div>
  );
};

export default MyPostsPage;
export const HydrateFallback = HydrateFallbackTemplate;