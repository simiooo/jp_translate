import React, { useState, useEffect } from "react";
import { useRequest } from "ahooks";
import { useTranslation } from 'react-i18next'
import { alovaInstance } from "~/utils/request";
import { PostResponse } from "~/types/social";

// Store
import { useSocialStore } from "~/store/social";

// Components
import Post from "~/components/Post";
import PostForm from "~/components/PostForm";

// Shadcn/ui imports
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FaStar, FaThumbsUp } from "react-icons/fa";

const RecommendedPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [recommendedPosts, setRecommendedPosts] = useState<PostResponse[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  // Social store for batch like operations
  const { addToLikeQueue, updatePostInList } = useSocialStore();

  // Use ahooks useRequest for fetching recommended posts
  const {
    data: recommendedData,
    loading: recommendedLoading,
    error: recommendedError,
    run: loadRecommendedPosts
  } = useRequest(
    async (pageNum: number = 1, limit: number = 10) => {
      const response = await alovaInstance.Get<{
        posts: PostResponse[];
        total: number;
      }>('/api/social/recommendations/posts', {
        params: { page: pageNum, limit }
      });
      
      return response;
    },
    {
      manual: true,
      onSuccess: (data) => {
        if (page === 1) {
          setRecommendedPosts(data.posts);
        } else {
          setRecommendedPosts(prev => [...prev, ...data.posts]);
        }
        setHasMore(recommendedPosts.length + data.posts.length < data.total);
      },
      onError: (error) => {
        console.error("Failed to load recommended posts:", error);
      }
    }
  );

  // Handle post like/unlike with optimistic updates and batch processing
  const handlePostLike = (postId: number, isLiked: boolean) => {
    // Find the post in the current recommended posts
    const post = recommendedPosts.find(p => p.id === postId);
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
        // Refresh recommended posts after successful creation
        loadRecommendedPosts(1);
      }
    }
  );

  // Load recommended posts when component mounts
  useEffect(() => {
    loadRecommendedPosts(1);
  }, []);


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
    try {
      await alovaInstance.Post(`/api/social/posts/${post.id}/repost`);
      // Refresh recommended posts to show the new repost
      loadRecommendedPosts(1);
    } catch (error) {
      console.error('Failed to repost:', error);
    }
  };

  const handlePostSubmit = async (content: string, contentType?: string, visibility?: string, parentPostId?: number, imageUrls?: string[]) => {
    await createPost(content, contentType, visibility, parentPostId, imageUrls);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadRecommendedPosts(nextPage);
  };

  const retryLoad = () => {
    loadRecommendedPosts(1);
  };

  const posts = recommendedData?.posts || [];
  const isLoading = recommendedLoading && posts.length === 0;
  const hasError = !!recommendedError;

  return (
    <div className="h-[calc(100vh-60px)] overflow-y-auto bg-background">
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 min-w-0 border-x">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
            <div className="max-w-2xl mx-auto px-4 md:px-0">
              <div className="flex items-center gap-3">
                <FaStar className="w-6 h-6 text-yellow-500" />
                <h1 className="text-xl font-bold">{t("Recommended")}</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t("Discover high-quality posts curated for you")}
              </p>
            </div>
          </div>

          {/* Error state */}
          {hasError && (
            <div className="p-4">
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <div className="flex items-center justify-between">
                  <span className="text-destructive">{t('Failed to load recommended posts')}</span>
                  <Button onClick={retryLoad} size="sm" variant="outline">
                    {t('Try again')}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Word posting form */}
          <PostForm onSubmit={handlePostSubmit} />

          {/* Recommended posts list */}
          <div className="min-h-[calc(100vh-200px)]">
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
                  <FaStar className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {t("No recommendations yet")}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t("Start interacting with posts to get personalized recommendations")}
                </p>
                <Button onClick={retryLoad}>
                  {t("Refresh")}
                </Button>
              </div>
            ) : (
              // Recommended posts list
              <>
                <div className="space-y-1">
                  {posts.map((post, index) => (
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
                  ))}
                </div>
                {hasMore && (
                  <div className="p-4 text-center">
                    <Button
                      onClick={loadMore}
                      disabled={recommendedLoading}
                      variant="outline"
                    >
                      {recommendedLoading ? t('Loading...') : t('Load more')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-80 h-full bg-background border-l p-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaThumbsUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">{t("Why these posts?")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("These posts are recommended based on your interactions, followed users, and popular content in the community.")}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecommendedPage;