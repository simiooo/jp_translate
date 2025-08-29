import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaSearch, FaUserPlus } from "react-icons/fa";

interface VocabularyRightSidebarProps {
  onFollow?: (userId: string) => void;
  onTrendClick?: (trend: string) => void;
}

const VocabularyRightSidebar: React.FC<VocabularyRightSidebarProps> = ({
  onFollow,
  onTrendClick
}) => {
  // Mock data for recommendations
  const recommendedUsers = [
    { id: '1', name: '日语学习者', username: '@japanese_learner', followers: '1.2k' },
    { id: '2', name: '词汇大师', username: '@vocab_master', followers: '3.4k' },
    { id: '3', name: '语言爱好者', username: '@language_lover', followers: '2.1k' },
    { id: '4', name: '日语教师', username: '@japanese_teacher', followers: '5.6k' },
    { id: '5', name: '单词收藏家', username: '@word_collector', followers: '890' }
  ];

  // Mock data for trends
  const trends = [
    { id: '1', name: '#日语学习', tweets: '12.3k' },
    { id: '2', name: '#词汇记忆', tweets: '8.7k' },
    { id: '3', name: '#语言学习', tweets: '23.1k' },
    { id: '4', name: '#单词挑战', tweets: '5.4k' },
    { id: '5', name: '#每日一词', tweets: '3.2k' }
  ];

  return (
    <div className="w-80 h-full bg-background border-l">
      <div className="p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="搜索用户或话题"
            className="w-full pl-10 pr-4 py-2 bg-muted rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Recommended Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">推荐关注</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-muted-foreground text-xs truncate">{user.username}</p>
                    <p className="text-muted-foreground text-xs">{user.followers} 粉丝</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onFollow?.(user.id)}
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
            {trends.map((trend, index) => (
              <div
                key={trend.id}
                className="cursor-pointer hover:bg-muted p-2 rounded-lg transition-colors"
                onClick={() => onTrendClick?.(trend.name)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1} · 趋势
                  </span>
                </div>
                <p className="font-semibold text-foreground">{trend.name}</p>
                <p className="text-muted-foreground text-xs">{trend.tweets} 推文</p>
              </div>
            ))}
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
            <span>© 2024 词汇社区</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabularyRightSidebar;