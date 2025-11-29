import React from 'react';
import { WordStat, LemmaStat } from "~/types/vocabulary";
import { Badge } from "~/components/ui/badge";

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
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    if (rank === 3) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    return 'bg-muted text-muted-foreground';
  };

  const getRankSize = (rank: number) => {
    if (rank <= 3) return 'text-lg font-bold';
    return 'text-base font-medium';
  };

  const displayWord = type === 'word' ? (item as WordStat).word : (item as LemmaStat).lemma;
  const kana = item.kana || '';
  const meaning = item.meaning || '';
  const inflection = (item as WordStat).inflection;

  return (
    <div className="group hover:bg-muted/50 transition-colors duration-200">
      <div className="px-6 py-4">
        <div className="flex items-start gap-4">
          {/* Rank Badge */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getRankColor(index + 1)} ${getRankSize(index + 1)}`}>
            {index + 1}
          </div>
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Word and Kana */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xl font-semibold text-foreground">
                    {displayWord}
                  </span>
                  {kana && (
                    <span className="text-sm text-muted-foreground font-medium">
                      {kana}
                    </span>
                  )}
                </div>
                
                {/* Meaning */}
                {meaning && (
                  <div className="mt-1 text-base text-foreground font-medium">
                    {meaning}
                  </div>
                )}
                
                {/* Metadata Row */}
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  {item.pos && (
                    <Badge className={`px-2 py-0.5 text-xs font-medium ${getPosColor(item.pos)}`}>
                      {item.pos}
                    </Badge>
                  )}
                  
                  {inflection && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {inflection}
                    </span>
                  )}
                  
                  {type === 'word' && (item as WordStat).lemma && (item as WordStat).lemma !== displayWord && (
                    <span className="text-xs text-muted-foreground">
                      原形: {(item as WordStat).lemma}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold text-foreground">
                  {item.count}
                </div>
                <div className="text-xs text-muted-foreground">
                  访问
                </div>
                {item.write_count > 0 && (
                  <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                    书写: {item.write_count}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabStatCard;