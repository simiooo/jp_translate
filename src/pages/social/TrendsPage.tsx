import React, { useState, useEffect } from "react";
import { useRequest } from "ahooks";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useTranslation } from 'react-i18next'
import { alovaInstance } from "~/utils/request";
import { PostResponse, TrendingHashtagsResponse } from "~/types/social";

// Store
import { useSocialStore } from "~/store/social";

// Components
import Post from "~/components/Post";

// Shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FaHashtag, FaFire, FaClock } from "react-icons/fa";

const TrendsPage: React.FC = () => {
  const { t } = useTranslation();
  const search = useSearch({ from: '/social/trends' });
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(() => {
    const hashtag = search.hashtag;
    return hashtag ? decodeURIComponent(hashtag) : null;
  });
  
  // Social store
  const { } = useSocialStore();

  // Use ahooks useRequest for fetching trending hashtags
  const {
    data: trendingHashtagsData,
    loading: trendingHashtagsLoading,
    error: trendingHashtagsError,
    run: loadTrendingHashtags
  } = useRequest(
    async (timeRange: string = '24h', limit: number = 10) => {
      const response = await alovaInstance.Get<TrendingHashtagsResponse>('/api/social/feed/trends', {
        params: { time_range: timeRange, limit }
      });
      
      return response;
    },
    {
      manual: true,
      onError: (error) => {
        console.error("Failed to load trending hashtags:", error);
      }
    }
  );

  // Use ahooks useRequest for fetching trending posts
  const {
    data: trendingData,
    loading: trendingLoading,
    error: trendingError,
    run: loadTrendingPosts
  } = useRequest(
    async (timeRange: string = '24h', pageNum: number = 1, limit: number = 10, hashtag?: string) => {
      const params: Record<string, string | number> = { time_range: timeRange, page: pageNum, limit };
      if (hashtag) {
        params.hashtag = hashtag.replace('#', '');
      }
      
      const response = await alovaInstance.Get<{
        posts: PostResponse[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
        time_range: string;
        hashtag?: string;
      }>('/api/social/feed/trending', {
        params
      });
      
      return response;
    },
    {
      manual: true,
      onSuccess: (data) => {
        setHasMore(data.pagination.page < data.pagination.pages);
      },
      onError: (error) => {
        console.error("Failed to load trending posts:", error);
      }
    }
  );

  // Handle post like/unlike with optimistic updates
  const handlePostLike = async (postId: number, isLiked: boolean) => {
    // Find the post in the current trending posts
    const post = trendingData?.posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update - immediately update UI
    const newIsLiked = isLiked;
    const newLikeCount = newIsLiked ? post.like_count + 1 : Math.max(0, post.like_count - 1);
    
    // Update the post in the trending data immediately
    const updatedTrendingData = trendingData ? {
      ...trendingData,
      posts: trendingData.posts.map(p =>
        p.id === postId
          ? { ...p, is_liked: newIsLiked, like_count: newLikeCount }
          : p
      )
    } : undefined;

    // Update the component state to trigger re-render
    if (updatedTrendingData) {
      // We need to update the component's state, but since we're using useRequest,
      // we'll update the store's trendingPosts instead
      useSocialStore.setState({ trendingPosts: updatedTrendingData.posts });
    }

    try {
      if (newIsLiked) {
        await useSocialStore.getState().likePost(postId);
      } else {
        await useSocialStore.getState().unlikePost(postId);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Rollback on error
      const rollbackTrendingData = trendingData ? {
        ...trendingData,
        posts: trendingData.posts.map(p =>
          p.id === postId
            ? { ...p, is_liked: post.is_liked, like_count: post.like_count }
            : p
        )
      } : undefined;
      
      if (rollbackTrendingData) {
        useSocialStore.setState({ trendingPosts: rollbackTrendingData.posts });
      }
    }
  };

  // Load trending hashtags when component mounts or time range changes
  useEffect(() => {
    loadTrendingHashtags(selectedTimeRange, 10);
  }, [selectedTimeRange]);

  // Load trending posts when component mounts, time range changes, or hashtag changes
  useEffect(() => {
    loadTrendingPosts(selectedTimeRange, 1, 10, selectedHashtag || undefined);
  }, [selectedTimeRange, selectedHashtag]);


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
      // Refresh trending posts to show the new repost
      loadTrendingPosts(selectedTimeRange, 1);
    } catch (error) {
      console.error('Failed to repost:', error);
    }
  };

  const handleTrendClick = (trend: string) => {
    setSelectedHashtag(trend);
    setPage(1);
    // Navigate with new search parameter
    navigate({
      to: '/social/trends',
      search: { hashtag: encodeURIComponent(trend) }
    });
  };

  const handleClearHashtag = () => {
    setSelectedHashtag(null);
    setPage(1);
    // Navigate without hashtag parameter
    navigate({
      to: '/social/trends',
      search: {}
    });
  };

  const handleTimeRangeChange = (timeRange: '1h' | '24h' | '7d' | '30d') => {
    setSelectedTimeRange(timeRange);
    setPage(1);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadTrendingPosts(selectedTimeRange, nextPage, 10, selectedHashtag || undefined);
  };

  const retryLoad = () => {
    setPage(1);
    loadTrendingHashtags(selectedTimeRange, 10);
    loadTrendingPosts(selectedTimeRange, 1, 10, selectedHashtag || undefined);
  };

  if (trendingError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">{t('Error loading trends')}</h2>
          <p className="text-muted-foreground mb-6">{t('Failed to load trending content')}</p>
          <Button onClick={retryLoad}>
            {t('Try again')}
          </Button>
        </div>
      </div>
    );
  }

  const posts = trendingData?.posts || [];
  const trendingHashtags = trendingHashtagsData?.trends || [];
  const isLoading = trendingLoading && posts.length === 0;
  const isLoadingHashtags = trendingHashtagsLoading && trendingHashtags.length === 0;
  const hasAnyError = trendingError || trendingHashtagsError;

  return (
    <div className="h-[calc(100vh-60px)] overflow-y-auto bg-background">
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 min-w-0 border-x">
          {/* Header - 只在非移动端显示 */}
          <div className="hidden md:block sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <FaFire className="w-6 h-6 text-red-500" />
                <h1 className="text-xl font-bold">{t("Current Trends")}</h1>
              </div>
              
              {/* Selected hashtag filter */}
              {selectedHashtag && (
                <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaHashtag className="w-4 h-4 text-primary" />
                    <span className="font-medium">{selectedHashtag}</span>
                    <span className="text-sm text-muted-foreground">
                      {t('Filtering by hashtag')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHashtag}
                  >
                    {t('Clear')}
                  </Button>
                </div>
              )}
              
              {/* Time range selector */}
              <div className="flex gap-2 flex-wrap">
                {(['1h', '24h', '7d', '30d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeRangeChange(range)}
                  >
                    {range === '1h' && <FaClock className="w-3 h-3 mr-1" />}
                    {range === '24h' && <FaFire className="w-3 h-3 mr-1" />}
                    {range === '7d' && <FaFire className="w-3 h-3 mr-1" />}
                    {range === '30d' && <FaHashtag className="w-3 h-3 mr-1" />}
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* 移动端顶部导航 */}
          <div className="md:hidden sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
            <div className="flex items-center gap-3">
              <FaFire className="w-5 h-5 text-red-500" />
              <h1 className="text-lg font-bold">{t("Current Trends")}</h1>
            </div>
            
            {/* 移动端时间范围选择器 */}
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {(['1h', '24h', '7d', '30d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeRangeChange(range)}
                  className="flex-shrink-0"
                >
                  {range}
                </Button>
              ))}
            </div>
            
            {/* 移动端选中的hashtag */}
            {selectedHashtag && (
              <div className="mt-3 p-2 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaHashtag className="w-3 h-3 text-primary" />
                  <span className="text-sm font-medium">{selectedHashtag}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHashtag}
                  className="h-6 px-2 text-xs"
                >
                  {t('Clear')}
                </Button>
              </div>
            )}
          </div>

          {/* Error state */}
          {hasAnyError && (
            <div className="p-4">
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <div className="flex items-center justify-between">
                  <span className="text-destructive">{t('Failed to load trending content')}</span>
                  <Button onClick={retryLoad} size="sm" variant="outline">
                    {t('Try again')}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Trending Topics Section */}
          <div className="p-4 border-b">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaHashtag className="w-5 h-5" />
                    {t("Trending Hashtags")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingHashtags ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-6 h-6" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-12" />
                        </div>
                      ))}
                    </div>
                  ) : trendingHashtags.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      {t('No trending hashtags available')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trendingHashtags.map((trend, index) => (
                        <div
                          key={trend.hashtag.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => handleTrendClick(`#${trend.hashtag.name}`)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-muted-foreground w-6">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-semibold">#{trend.hashtag.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {trend.post_count} {t('posts')} · {trend.total_engagement} {t('engagement')}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            +{Math.round(trend.total_engagement / Math.max(trend.post_count, 1))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Trending Posts */}
          <div className="min-h-[calc(100vh-200px)] md:min-h-[calc(100vh-280px)]">
            <div className="p-4 border-b">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FaFire className="w-5 h-5 text-orange-500" />
                  {t("Trending Posts")}
                </h2>
              </div>
            </div>

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
            ) : posts.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50">
                  <FaFire className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {t("No trending posts")}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t("No posts are trending in this time period. Check back later!")}
                </p>
                <Button onClick={retryLoad}>
                  {t("Refresh")}
                </Button>
              </div>
            ) : (
              // Trending posts list
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
                      disabled={trendingLoading}
                      variant="outline"
                    >
                      {trendingLoading ? t('Loading...') : t('Load more')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - 只在大屏幕显示 */}
        <div className="hidden lg:block w-80 h-full bg-background border-l p-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaFire className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold">{t("About Trends")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("Trending posts are determined by engagement metrics including likes, comments, and shares within the selected time period.")}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrendsPage;