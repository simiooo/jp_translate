import React, { useEffect } from 'react';
import { useRequest } from "ahooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaUserPlus } from "react-icons/fa";
import { alovaInstance } from "~/utils/request";
import { TrendingHashtagsResponse, RecommendedUsersResponse } from "~/types/social";

interface SocialRightSidebarProps {
  onFollow?: (userId: string) => void;
  onTrendClick?: (trend: string) => void;
}

const SocialRightSidebar: React.FC<SocialRightSidebarProps> = ({
  onFollow,
  onTrendClick
}) => {
  // Use ahooks useRequest for fetching trending hashtags
  const {
    data: trendingData,
    run: loadTrendingHashtags
  } = useRequest(
    async () => {
      const response = await alovaInstance.Get<TrendingHashtagsResponse>('/api/social/feed/trends', {
        params: { time_range: '24h', limit: 5 }
      });
      return response;
    },
    {
      manual: false,
      onError: (error) => {
        console.error("Failed to load trending hashtags:", error);
      }
    }
  );

  // Use ahooks useRequest for fetching recommended users
  const {
    data: recommendedUsersData,
    run: loadRecommendedUsers
  } = useRequest(
    async () => {
      const response = await alovaInstance.Get<RecommendedUsersResponse>('/api/social/recommendations/users', {
        params: { limit: 5 }
      });
      return response;
    },
    {
      manual: false,
      onError: (error) => {
        console.error("Failed to load recommended users:", error);
      }
    }
  );

  // Load data on component mount
  useEffect(() => {
    loadTrendingHashtags();
    loadRecommendedUsers();
  }, []);

  const trendingHashtags = trendingData?.trends || [];
  const recommendedUsers = recommendedUsersData?.users || [];

  return (
    <div className="w-80 h-full bg-background border-l">
      <div className="p-4 space-y-6">

        {/* Recommended Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">推荐关注</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{user.username}</p>
                      <p className="text-muted-foreground text-xs truncate">@{user.username}</p>
                    </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex-shrink-0 ml-2"
                  onClick={() => onFollow?.(user.id.toString())}
                >
                  <FaUserPlus className="w-3 h-3 mr-1" />
                  关注
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trends */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">当前趋势</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trendingHashtags.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                暂无热门话题
              </div>
            ) : (
              trendingHashtags.map((trend, index) => (
                <div
                  key={trend.hashtag.id}
                  className="cursor-pointer hover:bg-muted p-2 rounded-lg transition-colors"
                  onClick={() => onTrendClick?.(`#${trend.hashtag.name}`)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1} · 趋势
                    </span>
                  </div>
                  <p className="font-semibold text-foreground truncate">#{trend.hashtag.name}</p>
                  <p className="text-muted-foreground text-xs">{trend.post_count} 推文</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Footer links */}
        <div className="text-muted-foreground text-xs space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="cursor-pointer hover:underline">服务条款</span>
            <span className="cursor-pointer hover:underline">隐私政策</span>
            <span className="cursor-pointer hover:underline">Cookie政策</span>
            <span className="cursor-pointer hover:underline">可访问性</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="cursor-pointer hover:underline">广告信息</span>
            <span className="cursor-pointer hover:underline">更多</span>
            <span>© {new Date().getFullYear()} 词汇社区</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialRightSidebar;