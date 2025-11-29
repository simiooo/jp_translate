import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import {
  useUserTopWords,
  useUserTopLemmas,
  useGlobalTopWords,
  useGlobalTopLemmas
} from './hooks/useVocabularyStats';
import VocabRankingList from './components/VocabRankingList';
import { PeriodType } from "~/types/vocabulary";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";

const VocabularyHomePage: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('week');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  // Fetch all vocabulary statistics
  const {
    data: userTopWords,
    loading: userTopWordsLoading,
    error: userTopWordsError,
    refresh: refreshUserTopWords
  } = useUserTopWords(period, 50);
  
  const {
    data: userTopLemmas,
    loading: userTopLemmasLoading,
    error: userTopLemmasError,
    refresh: refreshUserTopLemmas
  } = useUserTopLemmas(period, 50);
  
  const {
    data: globalTopWords,
    loading: globalTopWordsLoading,
    error: globalTopWordsError,
    refresh: refreshGlobalTopWords
  } = useGlobalTopWords(period, 50);
  
  const {
    data: globalTopLemmas,
    loading: globalTopLemmasLoading,
    error: globalTopLemmasError,
    refresh: refreshGlobalTopLemmas
  } = useGlobalTopLemmas(period, 50);

  // Refresh all data when period changes
  useEffect(() => {
    refreshUserTopWords();
    refreshUserTopLemmas();
    refreshGlobalTopWords();
    refreshGlobalTopLemmas();
  }, [period, refreshUserTopWords, refreshUserTopLemmas, refreshGlobalTopWords, refreshGlobalTopLemmas]);

  const periodOptions: { value: PeriodType; label: string }[] = [
    { value: 'day', label: '今日' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'year', label: '本年' }
  ];

  const renderRankingLists = () => {
    return (
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="flex justify-center">
          <Select value={period} onValueChange={(value: PeriodType) => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ranking Lists */}
        <div className={`grid gap-6 ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* User Top Words */}
          <VocabRankingList
            title="我的热门词汇"
            data={userTopWords?.top_words}
            loading={userTopWordsLoading}
            error={userTopWordsError}
            type="word"
            onRetry={refreshUserTopWords}
          />

          {/* User Top Lemmas */}
          <VocabRankingList
            title="我的热门词元"
            data={userTopLemmas?.top_lemmas}
            loading={userTopLemmasLoading}
            error={userTopLemmasError}
            type="lemma"
            onRetry={refreshUserTopLemmas}
          />

          {/* Global Top Words */}
          <VocabRankingList
            title="全球热门词汇"
            data={globalTopWords?.top_words}
            loading={globalTopWordsLoading}
            error={globalTopWordsError}
            type="word"
            onRetry={refreshGlobalTopWords}
          />

          {/* Global Top Lemmas */}
          <VocabRankingList
            title="全球热门词元"
            data={globalTopLemmas?.top_lemmas}
            loading={globalTopLemmasLoading}
            error={globalTopLemmasError}
            type="lemma"
            onRetry={refreshGlobalTopLemmas}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">词汇统计</h1>
        <p className="text-muted-foreground text-center">
          查看您和全球用户的热门日语词汇和词元统计
        </p>
      </div>

      {/* Content */}
      {isDesktop ? (
        // Desktop layout: Show all rankings at once
        renderRankingLists()
      ) : (
        // Mobile layout: Use tabs
        <Tabs defaultValue="user-words" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="user-words">我的词汇</TabsTrigger>
            <TabsTrigger value="user-lemmas">我的词元</TabsTrigger>
            <TabsTrigger value="global-words">全球词汇</TabsTrigger>
            <TabsTrigger value="global-lemmas">全球词元</TabsTrigger>
          </TabsList>

          {/* Period Selector for Mobile */}
          <div className="flex justify-center mt-4 mb-4">
            <Select value={period} onValueChange={(value: PeriodType) => setPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tab Contents */}
          <TabsContent value="user-words" className="mt-0">
            <VocabRankingList
              title="我的热门词汇"
              data={userTopWords?.top_words}
              loading={userTopWordsLoading}
              error={userTopWordsError}
              type="word"
              onRetry={refreshUserTopWords}
            />
          </TabsContent>

          <TabsContent value="user-lemmas" className="mt-0">
            <VocabRankingList
              title="我的热门词元"
              data={userTopLemmas?.top_lemmas}
              loading={userTopLemmasLoading}
              error={userTopLemmasError}
              type="lemma"
              onRetry={refreshUserTopLemmas}
            />
          </TabsContent>

          <TabsContent value="global-words" className="mt-0">
            <VocabRankingList
              title="全球热门词汇"
              data={globalTopWords?.top_words}
              loading={globalTopWordsLoading}
              error={globalTopWordsError}
              type="word"
              onRetry={refreshGlobalTopWords}
            />
          </TabsContent>

          <TabsContent value="global-lemmas" className="mt-0">
            <VocabRankingList
              title="全球热门词元"
              data={globalTopLemmas?.top_lemmas}
              loading={globalTopLemmasLoading}
              error={globalTopLemmasError}
              type="lemma"
              onRetry={refreshGlobalTopLemmas}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default VocabularyHomePage;
export const HydrateFallback = HydrateFallbackTemplate;