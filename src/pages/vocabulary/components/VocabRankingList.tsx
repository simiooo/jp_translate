import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { ScrollArea } from "~/components/ui/scroll-area";
import VocabStatCard from './VocabStatCard';
import { WordStat, LemmaStat } from "~/types/vocabulary";
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from "~/components/ui/button";

interface VocabRankingListProps {
  title: string;
  data: WordStat[] | LemmaStat[] | undefined;
  loading: boolean;
  error: Error | unknown;
  type: 'word' | 'lemma';
  onRetry?: () => void;
}

const VocabRankingList: React.FC<VocabRankingListProps> = ({
  title,
  data,
  loading,
  error,
  type,
  onRetry
}) => {
  if (loading) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="p-4 border-b last:border-b-0">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-5 w-8" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">加载失败</h3>
            <p className="text-muted-foreground mb-4">
              无法获取{title}数据，请稍后重试
            </p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-muted-foreground">
              暂无数据
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="space-y-0">
            {data.map((item, index) => (
              <VocabStatCard
                key={`${type}-${index}-${type === 'word' ? (item as WordStat).word : (item as LemmaStat).lemma}`}
                item={item}
                index={index}
                type={type}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default VocabRankingList;