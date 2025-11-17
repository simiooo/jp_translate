import React from 'react';
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { WordStat, LemmaStat } from "~/types/vocabulary";

interface VocabStatCardProps {
  item: WordStat | LemmaStat;
  index: number;
  type: 'word' | 'lemma';
}

const VocabStatCard: React.FC<VocabStatCardProps> = ({ item, index, type }) => {
  const getPosColor = (pos: string) => {
    switch (pos?.toLowerCase?.()) {
      case 'verb':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'noun':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'adjective':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'adverb':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'particle':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500 font-bold';
    if (rank === 2) return 'text-gray-400 font-bold';
    if (rank === 3) return 'text-amber-600 font-bold';
    return 'text-muted-foreground';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-lg font-mono w-6 ${getRankColor(index + 1)}`}>
              {index + 1}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">
                  {type === 'word' ? (item as WordStat).word : (item as LemmaStat).lemma}
                </span>
                <Badge className={getPosColor(item.pos)}>
                  {item.pos}
                </Badge>
              </div>
              {type === 'word' && (item as WordStat).lemma && (item as WordStat).lemma !== (item as WordStat).word && (
                <div className="text-sm text-muted-foreground">
                  原形: {(item as WordStat).lemma}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">{item.count}</div>
            <div className="text-xs text-muted-foreground">访问次数</div>
            {item.write_count > 0 && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                书写: {item.write_count}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VocabStatCard;