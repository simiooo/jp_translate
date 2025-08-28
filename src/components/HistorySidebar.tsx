import React from "react";
import { TranslationRecord } from "~/types/history";
import { VList, VListHandle } from "virtua";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/components/Spinner";
import { cn } from "@/lib/utils";


// Define the structure of the parsed translated_text
interface ParsedTranslation {
  translation: string;
  [key: string]: string | number | boolean | object | null | undefined;
}

interface HistorySidebarProps {
  isHistoryCollapsed: boolean;
  setIsHistoryCollapsed: (collapsed: boolean) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  historyLoading: boolean;
  translations: TranslationRecord[];
  onSelectHistoryItem: (text: string) => void;
  hasMore: boolean;
  isError: boolean;
  onSearchChange: (query: string) => void; // New prop for search functionality
  onLoadMore: () => Promise<void>; // New prop for loading more data
}
// Avatar color variants using shadcn design tokens
const getAvatarColor = (index: number) => {
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", 
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"
  ];
  return colors[index % colors.length];
};
export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isHistoryCollapsed,
  setIsHistoryCollapsed,
  setShowHistory,
  historyLoading,
  translations,
  onSelectHistoryItem,
  hasMore,
  isError,
  onSearchChange,
  onLoadMore,
}) => {
  const listContainerRef = React.useRef<VListHandle>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [vlistKey, setVlistKey] = React.useState(0);
  const [fetching, setFetching] = React.useState(false);
  const fetchedCountRef = React.useRef(-1);

  // Reset VList key when collapsing/expanding to prevent rendering artifacts
  React.useEffect(() => {
    setVlistKey(prev => prev + 1);
  }, [isHistoryCollapsed]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
  };

  const fetchItems = React.useCallback(async () => {
    if (fetching || !hasMore || isError) return;
    
    setFetching(true);
    try {
      await onLoadMore();
    } finally {
      setFetching(false);
    }
  }, [fetching, hasMore, isError, onLoadMore]);

  const handleScroll = React.useCallback(async () => {
    if (!listContainerRef.current) return;
    
    const count = translations.length;
    if (fetchedCountRef.current < count &&
        listContainerRef.current.findEndIndex() + 50 > count) {
      fetchedCountRef.current = count;
      await fetchItems();
    }
  }, [translations.length, fetchItems]);

  // Check if we need to load more data on initial render
  React.useEffect(() => {
    if (!listContainerRef.current || !hasMore || isError) return;
    
    // Check if there's empty space in the viewport that could be filled with more data
    const hasEmptySpace = listContainerRef.current.viewportSize > listContainerRef.current.scrollSize;
    
    if (hasEmptySpace) {
      fetchItems();
    }
  }, [translations.length, hasMore, isError, fetchItems]);

  // Reset VList only when search query changes or when collapsing/expanding
  // This prevents unwanted scroll reset during infinite loading

  return (
    <Card
      className={cn(
        "rounded-r-2xl rounded-l-none border-l-0 overflow-hidden",
        "transition-all duration-300",
        isHistoryCollapsed ? "w-16" : "w-64"
      )}
      style={{ height: 'calc(100vh - 53px)' }}
    >
      <div className="h-full flex flex-col">
        <CardHeader className={cn("pb-0", isHistoryCollapsed ? "p-2" : "pr-2 pl-4")}>
          <div className={cn("flex items-center", isHistoryCollapsed ? "justify-center" : "justify-between")}>
            {!isHistoryCollapsed && (
              <CardTitle>翻译历史</CardTitle>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
              className={cn(isHistoryCollapsed ? "w-8 h-8" : "")}
              aria-label={isHistoryCollapsed ? "展开历史面板" : "折叠历史面板"}
            >
              {isHistoryCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {!isHistoryCollapsed && (
          <div className="px-4 pt-2 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                
                type="text"
                placeholder="搜索历史记录..."
                className="pl-9"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        )}
        <CardContent className="flex-1 p-0 overflow-hidden">
          {historyLoading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full">
              <VList
                ref={listContainerRef}
                count={translations?.length || 0}
                overscan={10}
                onScroll={handleScroll}
                itemSize={isHistoryCollapsed ? 60 : 100}
                key={`vlist-${vlistKey}-${isHistoryCollapsed ? 'collapsed' : 'expanded'}`}
              >
                {(index: number) => {
                  const record = translations?.[index];
                  if (!record) return <></>;
                  return (
                    <div
                      key={record?.source_text + record?.created_at + record?.target_lang}
                      className={cn(
                        "hover:bg-accent cursor-pointer border-b last:border-b-0",
                        isHistoryCollapsed ? "p-2" : "p-4"
                      )}
                      onClick={() => {
                        onSelectHistoryItem(record.source_text);
                        setShowHistory(false);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectHistoryItem(record.source_text);
                          setShowHistory(false);
                        }
                      }}
                    >
                      {isHistoryCollapsed ? (
                        <div className="flex justify-center items-center h-full">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                              getAvatarColor(index)
                            )}
                          >
                            {record.source_text.slice(0, 1)}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            {new Date(record.created_at).toLocaleString()}
                          </div>
                          <div className="text-sm font-medium line-clamp-2">
                            {record.source_text}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {typeof record.translated_text === 'object' 
                              ? (record.translated_text as unknown as ParsedTranslation)?.translation 
                              : record.translated_text}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              </VList>
              {fetching && (
                <div className="p-4 flex justify-center">
                  <Spinner loading={true} />
                </div>
              )}
              {!hasMore && translations.length > 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  没有更多数据了
                </div>
              )}
              {isError && (
                <div className="p-4 text-center text-sm text-destructive">
                  加载失败，请重试
                </div>
              )}
            </div>
          )}
          
        </CardContent>
      </div>
    </Card>
  );
};
