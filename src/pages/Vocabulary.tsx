import React, { useState, useRef, useCallback } from "react";
import { Token } from "../types/jp_ast";
import { useAntdTable } from "ahooks";
import { PaginatedResponse } from "~/types/history";
import { alovaInstance } from "~/utils/request";
import { useNavigate } from "react-router";
import Spinner from "~/components/Spinner";
import { VList, VListHandle } from "virtua";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";

// New components
import VocabularySidebar from "~/components/VocabularySidebar";
import WordTweet from "~/components/WordTweet";
import VocabularyRightSidebar from "~/components/VocabularyRightSidebar";
import WordPostForm from "~/components/WordPostForm";

// Shadcn/ui imports
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from 'react-i18next';

const Vocabulary: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const listContainerRef = useRef<VListHandle>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [vlistKey] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState("my-vocabulary");
  const fetchedCountRef = useRef(-1);

  const {
    tableProps: wordsTableProps,
    loading: wordsLoading,
    runAsync: wordsRunAsync,
  } = useAntdTable<
    { total: number; list: Token[] },
    [{ current: number; pageSize: number; keyword?: string }, { init?: boolean } | undefined]
  >(
    async (
      { current, pageSize, keyword },
      params?: { init?: boolean }
    ): Promise<{ total: number; list: Token[] }> => {
      try {
        const data = await alovaInstance.Get<
          | { message: string }
          | {
              words?: Token[];
              pagination?: PaginatedResponse;
            }
        >("/api/words", {
          params: { page: current, limit: pageSize, keyword: keyword },
        });
        if ("message" in data) {
          throw Error(data.message);
        }
        return {
          total: data.pagination?.total ?? 0,
          list: (
            (params?.init ? [] : (wordsTableProps?.dataSource as Token[])) ?? []
          ).concat(data.words ?? []),
        };
      } catch (error) {
        console.error(error);
        navigate("/login");
        return {
          total: 0,
          list: [],
        };
      }
    },
    {
      throttleWait: 1000,
      defaultParams: [
        {
          current: 1,
          pageSize: 10,
          keyword: "",
        },
        undefined,
      ],
    }
  );


  const fetchItems = useCallback(async () => {
    if (fetching || wordsLoading || isError) return;
    
    const hasMore =
      wordsTableProps?.dataSource?.length <
      (wordsTableProps?.pagination?.total ?? 0);
    
    if (!hasMore) return;

    setFetching(true);
    setIsError(false);
    try {
      const nextPage = (wordsTableProps?.pagination?.current ?? 1) + 1;
      await wordsRunAsync({ current: nextPage, pageSize: 10, keyword: searchQuery }, undefined);
    } catch (error) {
      console.error("Failed to load more words:", error);
      setIsError(true);
    } finally {
      setFetching(false);
    }
  }, [fetching, wordsLoading, isError, wordsTableProps, wordsRunAsync, searchQuery]);

  const handleScroll = useCallback(async () => {
    if (!listContainerRef.current) return;
    
    const count = wordsTableProps?.dataSource?.length || 0;
    if (fetchedCountRef.current < count &&
        listContainerRef.current.findEndIndex() + 50 > count) {
      fetchedCountRef.current = count;
      await fetchItems();
    }
  }, [wordsTableProps?.dataSource?.length, fetchItems]);

  // Check if we need to load more data on initial render
  React.useEffect(() => {
    if (!listContainerRef.current || wordsLoading || isError) return;
    
    const hasMore =
      wordsTableProps?.dataSource?.length <
      (wordsTableProps?.pagination?.total ?? 0);
    
    if (!hasMore) return;

    // Check if there's empty space in the viewport that could be filled with more data
    const hasEmptySpace = listContainerRef.current.viewportSize > listContainerRef.current.scrollSize;
    
    if (hasEmptySpace) {
      fetchItems();
    }
  }, [wordsTableProps?.dataSource?.length, wordsLoading, isError, fetchItems]);

  const handleTokenLike = (token: Token) => {
    console.log("Like token:", token);
    // TODO: Implement like functionality
  };

  const handleTokenComment = (token: Token) => {
    console.log("Comment on token:", token);
    // TODO: Implement comment functionality
  };

  const handleTokenShare = (token: Token) => {
    console.log("Share token:", token);
    // TODO: Implement share functionality
  };

  const handleTokenBookmark = (token: Token) => {
    console.log("Bookmark token:", token);
    // TODO: Implement bookmark functionality
  };

  const handleFollowUser = (userId: string) => {
    console.log("Follow user:", userId);
    // TODO: Implement follow functionality
  };

  const handleTrendClick = (trend: string) => {
    console.log("Trend clicked:", trend);
    // TODO: Implement trend search functionality
  };

  const handleWordPost = (word: string, meaning: string, kana?: string, lemma?: string, inflection?: string) => {
    console.log("Post word:", { word, meaning, kana, lemma, inflection });
    // TODO: Implement word posting functionality
  };

  return (

      <div className="h-[calc(100vh-60px)] overflow-y-auto bg-background">
        <div className="flex h-full">
          {/* Left Sidebar */}
          <VocabularySidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0 border-x">
            {/* Header with search */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('Search for words or users...')}
                  className="w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    wordsRunAsync({ current: 1, pageSize: 10, keyword: e.target.value }, { init: true });
                  }}
                />
              </div>
            </div>

            {/* Word posting form at bottom */}
            <WordPostForm onSubmit={handleWordPost} />

            {/* Words list */}
            <div className="min-h-[calc(100vh-200px)]">
              {wordsLoading ? (
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
              ) : wordsTableProps?.dataSource?.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50">
                    <Search className="w-full h-full" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {t('No words yet')}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t('Start sharing words to build the community vocabulary')}
                  </p>
                </div>
              ) : (
                // Words list with VList
                <>
                  <VList
                    ref={listContainerRef}
                    count={wordsTableProps?.dataSource?.length ?? 0}
                    overscan={10}
                    itemSize={160}
                    onScroll={handleScroll}
                    key={`vlist-${vlistKey}`}
                  >
                    {(index) => {
                      const token = wordsTableProps?.dataSource?.[index];
                      if (!token) return <></>;
                      return (
                        <WordTweet
                          key={`${token.word}-${index}`}
                          token={token}
                          onLike={() => handleTokenLike(token)}
                          onComment={() => handleTokenComment(token)}
                          onShare={() => handleTokenShare(token)}
                          onBookmark={() => handleTokenBookmark(token)}
                          likes={Math.floor(Math.random() * 100)}
                          comments={Math.floor(Math.random() * 50)}
                          shares={Math.floor(Math.random() * 30)}
                          views={Math.floor(Math.random() * 1000)}
                        />
                      );
                    }}
                  </VList>
                  {fetching && (
                    <div className="p-4 flex justify-center">
                      <Spinner loading={true} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <VocabularyRightSidebar
            onFollow={handleFollowUser}
            onTrendClick={handleTrendClick}
          />
        </div>
      </div>
  );
};

export default Vocabulary;
export const HydrateFallback = HydrateFallbackTemplate