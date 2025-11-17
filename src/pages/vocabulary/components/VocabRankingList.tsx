import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
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
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="w-6 h-6" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-8 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
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
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <VocabStatCard 
              key={`${type}-${index}-${type === 'word' ? (item as WordStat).word : (item as LemmaStat).lemma}`}
              item={item} 
              index={index} 
              type={type} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VocabRankingList;