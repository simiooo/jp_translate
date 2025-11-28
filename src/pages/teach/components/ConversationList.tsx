import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Search, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "~/types/teach";
import { ConversationItem } from "./ConversationItem";

interface ConversationListProps {
  isCollapsed: boolean;
  isFullscreen?: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  conversations: Conversation[];
  isLoading: boolean;
  hasMore: boolean;
  isError: boolean;
  onSelectConversation: (conversationId: number) => void;
  onLoadMore: () => Promise<void>;
  onNewConversation: () => void;
  selectedConversationId: number | null;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  isCollapsed,
  isFullscreen = false,
  onToggleCollapse,
  conversations,
  isLoading,
  hasMore,
  isError,
  onSelectConversation,
  onLoadMore,
  onNewConversation,
  selectedConversationId,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLoadMore = useCallback(async () => {
    if (isFetching || !hasMore || isError) return;
    
    setIsFetching(true);
    try {
      await onLoadMore();
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, hasMore, isError, onLoadMore]);

  const handleScroll = useCallback(async (e: React.UIEvent<HTMLDivElement> | number) => {
    // Handle both event object and offset number cases
    if (typeof e === 'number') {
      // If it's a number offset, we can't determine scroll position, so skip
      return;
    }
    
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // Load more when near bottom (within 100px)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      await handleLoadMore();
    }
  }, [handleLoadMore]);

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        isFullscreen
          ? "h-full w-full rounded-none border-0 shadow-none overflow-hidden"
          : [
              "rounded-r-2xl rounded-l-none border-l-0 overflow-hidden",
              isCollapsed ? "w-16" : "w-60"
            ]
      )}
      style={!isFullscreen ? { height: 'calc(100vh - 53px)' } : undefined}
    >
      <div className="h-full flex flex-col">
        <CardHeader className={cn("pb-0", isCollapsed ? "p-2" : "pr-2 pl-4")}>
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
            {!isCollapsed && (
              <CardTitle>{t('Conversations')}</CardTitle>
            )}
            <div className="flex gap-1">
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNewConversation}
                  className="h-8 w-8"
                  aria-label={t('New conversation')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleCollapse(!isCollapsed)}
                className={cn(isCollapsed ? "w-8 h-8" : "")}
                aria-label={isCollapsed ? t('Expand conversation list') : t('Collapse conversation list')}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isCollapsed && (
          <div className="px-4 pt-2 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('Search conversations...')}
                className="pl-9"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        )}

        <CardContent className="flex-1 p-0 overflow-hidden">
          {isLoading && conversations.length === 0 ? (
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
            <ScrollArea 
              className="h-full" 
              onScroll={handleScroll}
            >
              <div className="py-2">
                {conversations.filter(conv => {
                  // Robust null/undefined checking
                  if (!conv) return false;
                  if (typeof conv !== 'object') return false;
                  // Ensure id exists and is a valid number
                  if (typeof conv.id !== 'number' && typeof conv.id !== 'string') return false;
                  const id = Number(conv.id);
                  return !isNaN(id) && id >= 0;
                }).map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={selectedConversationId === conversation.id}
                    onClick={() => onSelectConversation(conversation.id)}
                    isCollapsed={isCollapsed}
                  />
                ))}
                
                {isFetching && (
                  <div className="space-y-4 p-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                )}
                
                {!hasMore && conversations.length > 0 && (
                  <div className={cn("p-4 text-center text-muted-foreground", isCollapsed ? "flex justify-center" : "text-sm")}>
                    {isCollapsed ? (
                      <MessageSquare className="h-4 w-4 opacity-50" />
                    ) : (
                      t('No more conversations')
                    )}
                  </div>
                )}
                
                {isError && (
                  <div className="p-4 text-center text-sm text-destructive">
                    {t('Load failed, please try again')}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </div>
    </Card>
  );
};