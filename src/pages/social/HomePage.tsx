import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRequest } from "ahooks";
import { alovaInstance } from "~/utils/request";
import { PostResponse } from "~/types/social";
import Spinner from "~/components/Spinner";
import { VList, VListHandle } from "virtua";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import { useTranslation } from 'react-i18next'

// Store
import { useSocialStore } from "~/store/social";

// Components
import Post from "~/components/Post";
import SocialRightSidebar from "~/components/SocialRightSidebar";
import PostForm from "~/components/PostForm";

// Shadcn/ui imports
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const HomePage: React.FC = () => {
  const { t } = useTranslation()
  const listContainerRef = useRef<VListHandle>(null);
  const [vlistKey] = useState(0);
  const fetchedCountRef = useRef(-1);
  
  // Social store for feed data
  const { feed, getFeed } = useSocialStore();
  const feedLoading = useSocialStore((state) => state.feedLoading);
  const feedError = useSocialStore((state) => state.feedError);

  // Use ahooks useRequest for creating posts
  const {
    run: createPost
  } = useRequest(
    async (content: string, contentType: string = 'text', visibility: string = 'public', parentPostId?: number, imageUrls?: string[]) => {
      const response = await alovaInstance.Post<{ post: PostResponse }>('/api/social/posts', {
        content,
        content_type: contentType,
        visibility,
        parent_post_id: parentPostId,
        image_urls: imageUrls
      });
      return response;
    },
    {
      manual: true,
      onSuccess: () => {
        // Refresh feed after successful creation
        getFeed('combined', 1);
      },
      onError: (error) => {
        console.error('Failed to create post:', error);
      }
    }
  );

  // Handle post like/unlike with optimistic updates
  const handlePostLike = async (postId: number, isLiked: boolean) => {
    // Find the post in the current feed
    const post = feed.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update - immediately update UI
    const newIsLiked = isLiked;
    const newLikeCount = newIsLiked ? post.like_count + 1 : Math.max(0, post.like_count - 1);
    
    // Update the post in the feed immediately
    const updatedFeed = feed.map(p =>
      p.id === postId
        ? { ...p, is_liked: newIsLiked, like_count: newLikeCount }
        : p
    );
    
    // Update the store state to trigger re-render
    useSocialStore.setState({ feed: updatedFeed });

    try {
      if (newIsLiked) {
        await useSocialStore.getState().likePost(postId);
      } else {
        await useSocialStore.getState().unlikePost(postId);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Rollback on error
      const rollbackFeed = feed.map(p =>
        p.id === postId
          ? { ...p, is_liked: post.is_liked, like_count: post.like_count }
          : p
      );
      useSocialStore.setState({ feed: rollbackFeed });
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
        // Refresh feed to show the new repost
        getFeed('combined', 1);
      }
    }
  );


  // Initial feed load
  useEffect(() => {
    getFeed('combined', 1);
  }, [getFeed]);

  const handleScroll = useCallback(async () => {
    if (!listContainerRef.current || feedLoading) return;
    
    const posts = feed || [];
    const count = posts.length;
    
    if (fetchedCountRef.current < count &&
        listContainerRef.current.findEndIndex() + 50 > count) {
      fetchedCountRef.current = count;
      const nextPage = Math.floor(count / 10) + 1;
      await getFeed('combined', nextPage, 10);
    }
  }, [feed, feedLoading, getFeed]);

  // Check if we need to load more data on initial render
  useEffect(() => {
    if (!listContainerRef.current || feedLoading) return;
    
    const posts = feed || [];
    const hasMore = posts.length < (useSocialStore.getState().feedPagination.total || 0);
    
    if (!hasMore) return;

    // Check if there's empty space in the viewport that could be filled with more data
    const hasEmptySpace = listContainerRef.current.viewportSize > listContainerRef.current.scrollSize;
    
    if (hasEmptySpace) {
      const nextPage = Math.floor(posts.length / 10) + 1;
      getFeed('combined', nextPage, 10);
    }
  }, [feed, feedLoading, getFeed]);


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

  const handleTrendClick = (hashtag: string) => {
    console.log("Hashtag clicked:", hashtag);
    // Navigate to trends page with the hashtag pre-selected
    window.location.href = `/social/trends?hashtag=${encodeURIComponent(hashtag)}`;
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await alovaInstance.Post(`/api/social/users/${userId}/follow`);
      // Refresh feed after combined user
      getFeed('combined', 1);
    } catch (error) {
      console.error("Failed to follow user:", error);
    }
  };

  const handlePostSubmit = async (content: string, contentType?: string, visibility?: string, parentPostId?: number, imageUrls?: string[]) => {
    await createPost(content, contentType, visibility, parentPostId, imageUrls);
  };


  const retryLoad = () => {
    getFeed('combined', 1);
  };

  const posts = feed || [];
  const isLoading = feedLoading && posts.length === 0;
  const hasError = !!feedError;

  return (
    <div className="h-[calc(100vh-60px)] overflow-y-auto bg-background">
      <div className="flex h-full">

        {/* Main Content */}
        <div className="flex-1 min-w-0 border-x">
          {/* Header - 只在非移动端显示 */}
          <div className="hidden md:block sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <h1 className="text-xl font-bold">{t("Social Feed")}</h1>
            </div>
          </div>

          {/* Error state */}
          {hasError && (
            <div className="p-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-between">
                <span className="text-destructive">{t('Failed to load feed')}</span>
                <Button onClick={retryLoad} size="sm" variant="outline">
                  {t('Try again')}
                </Button>
              </div>
            </div>
          )}

          {/* Word posting form at bottom */}
          <PostForm onSubmit={handlePostSubmit} />

          {/* Feed */}
          <div className="h-[calc(100vh-200px)] md:h-[calc(100vh-280px)]">
            <>
                {isLoading ? (
                  <div className="space-y-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="p-4 border-b">
                        <div className="flex gap-3">
                          <Skeleton className="w-12 h-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex gap-4">
                              <Skeleton className="h-4 w-12" />
                              <Skeleton className="h-4 w-12" />
                              <Skeleton className="h-4 w-12" />
                              <Skeleton className="h-4 w-12" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 && !feedLoading ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50">
                      <span className="w-full h-full flex items-center justify-center text-2xl">💭</span>
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
                  // Feed list with VList
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
                    {feedLoading && posts.length > 0 && (
                      <div className="p-4 flex justify-center">
                        <Spinner loading={true} />
                      </div>
                    )}
                  </>
                )}
            </>
          </div>
        </div>

        {/* Right Sidebar - 只在大屏幕显示 */}
        <SocialRightSidebar
          onFollow={handleFollowUser}
          onTrendClick={handleTrendClick}
        />
      </div>
    </div>
  );
};

export default HomePage;
export const HydrateFallback = HydrateFallbackTemplate;