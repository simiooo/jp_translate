import React from "react";
import { TranslationRecord } from "~/types/history";
import { VList, VListHandle } from "virtua";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  onSearchChange: (query: string) => void; // New prop for search functionality
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
  page,
  onPageChange,
  hasMore,
  isLoadingMore,
  isError,
  onSearchChange,
}) => {
  const listContainerRef = React.useRef<VListHandle>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [vlistKey, setVlistKey] = React.useState(0);

  // Reset VList key when collapsing/expanding to prevent rendering artifacts
  React.useEffect(() => {
    setVlistKey(prev => prev + 1);
  }, [isHistoryCollapsed]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
  };

  const checkScrollPosition = React.useCallback(() => {
    if (!listContainerRef.current) return;
    const isAtBottom = listContainerRef.current.scrollOffset  + listContainerRef.current.viewportSize + 10 > listContainerRef.current.scrollSize
    // console.log(listContainerRef.current.scrollOffset, listContainerRef.current.viewportSize,listContainerRef.current.scrollSize);
    
    if (isAtBottom && hasMore && !isLoadingMore && !isError) {
      onPageChange(page + 1);
    }
  }, [hasMore, isLoadingMore, isError, onPageChange, page]);

  // Reset VList when translations change significantly to prevent rendering artifacts
  React.useEffect(() => {
    if (listContainerRef.current) {
      // Force VList to reset its internal state when translations change
      listContainerRef.current.scrollTo(0);
    }
  }, [translations.length]);

  return (
    <Card
      className={cn(
        "rounded-r-2xl rounded-l-none border-l-0 overflow-hidden",
        "transition-all duration-300",
        isHistoryCollapsed ? "w-12" : "w-64"
      )}
      style={{ height: 'calc(100vh - 53px)' }}
    >
      <div className="h-full flex flex-col">
        <CardHeader className="pr-2 pl-4 pb-0">
          <div className="flex justify-between items-center">
            {!isHistoryCollapsed && (
              <CardTitle>翻译历史</CardTitle>
            )}
            <Button
              variant="ghost"
              // size="icon"
              size={"sm"}
              onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
              className=""
              aria-label={isHistoryCollapsed ? "展开历史面板" : "折叠历史面板"}
            >
              {isHistoryCollapsed ? (
                <ChevronRight />
              ) : (
                <ChevronLeft />
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
                onScroll={checkScrollPosition}
                itemSize={isHistoryCollapsed ? 60 : 100}
                key={`vlist-${vlistKey}-${isHistoryCollapsed ? 'collapsed' : 'expanded'}`}
              >
                {(index: number) => {
                  const record = translations?.[index];
                  if (!record) return <></>;
                  return (
                    <div
                      key={record?.source_text + record?.created_at + record?.target_lang}
                      className="p-4 hover:bg-accent cursor-pointer border-b last:border-b-0"
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
                        <div className="flex justify-center">
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
