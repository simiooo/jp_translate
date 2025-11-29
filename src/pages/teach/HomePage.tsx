import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useResponsive } from "ahooks";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTeachHistory } from "./hooks/useTeachHistory";
import { useTeachConversation } from "./hooks/useTeachConversation";
import { ConversationList } from "./components/ConversationList";
import { MessageBubble } from "./components/MessageBubble";
import { ChatInput } from "./components/ChatInput";
import type { Conversation } from "~/types/teach";

export default function TeachPage() {
  const { t } = useTranslation();
  const responsiveInfo = useResponsive();
  
  const {
    showConversationList,
    isConversationListCollapsed,
    setIsConversationListCollapsed,
    selectedConversationId,
    handleSelectConversation,
    handleBackToList,
    handleNewConversation,
    conversationList,
    conversationListLoad,
    conversationListRefresh,
  } = useTeachHistory();

  const {
    messages,
    currentConversation,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    stopStreaming,
    messagesEndRef,
  } = useTeachConversation({
    conversationId: selectedConversationId,
    onConversationCreated: async (conversationId) => {
      await conversationListLoad({ current: 1, pageSize: 20 }, {init: true})
      handleSelectConversation(conversationId);
    },
  });

  // Mobile layout detection
  const isMobile = !responsiveInfo?.md;

  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  const handleStopStreaming = () => {
    stopStreaming();
  };

  // Mobile view: Show either list or chat
  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Conversation List View */}
        {showConversationList && (
          <div className="flex-1 flex">
            <ConversationList
              isFullscreen={true}
              isCollapsed={false}
              onToggleCollapse={() => {}}
              conversations={conversationList.dataSource as Conversation[]}
              isLoading={conversationList.loading}
              hasMore={conversationList.pagination.total > (conversationList.dataSource?.length || 0)}
              isError={false}
              onSelectConversation={handleSelectConversation}
              onLoadMore={async () => {
                await conversationListLoad({ current: 1, pageSize: 20 }, undefined);
              }}
              onNewConversation={handleNewConversation}
              selectedConversationId={selectedConversationId}
            />
          </div>
        )}

        {/* Chat View */}
        {!showConversationList && (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="border-b bg-background px-4 py-3 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-medium truncate">
                  {currentConversation?.title || t('New Conversation')}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {isStreaming ? t('Typing...') : t('Ready')}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4">
                {isLoading && messages.length === 0 ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                    {isStreaming && (
                      <MessageBubble
                        message={{
                          id: Date.now(),
                          role: 'assistant',
                          content: streamingContent,
                          token_count: 0,
                          created_at: new Date().toISOString(),
                        }}
                        isStreaming={true}
                      />
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              onStopStreaming={handleStopStreaming}
              isStreaming={isStreaming}
              placeholder={t('Type your message...')}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    );
  }

  // Desktop view: Show both list and chat
  return (
    <div className="h-full flex bg-background">
      {/* Conversation List */}
      <div className={cn(
        "transition-all duration-300",
        isConversationListCollapsed ? "w-16" : "w-80"
      )}>
        <ConversationList
          isCollapsed={isConversationListCollapsed}
          onToggleCollapse={setIsConversationListCollapsed}
          conversations={conversationList.dataSource as Conversation[]}
          isLoading={conversationList.loading}
          hasMore={conversationList.pagination.total > (conversationList.dataSource?.length || 0)}
          isError={false}
          onSelectConversation={handleSelectConversation}
          onLoadMore={async () => {
            await conversationListLoad({ current: 1, pageSize: 20 }, undefined);
          }}
          onNewConversation={handleNewConversation}
          selectedConversationId={selectedConversationId}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="text-lg font-semibold">
                {currentConversation?.title || t('New Conversation')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isStreaming ? t('Typing...') : t('Ready')}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-6">
            {isLoading && messages.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 && !selectedConversationId ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    {t('Start a new conversation')}
                  </h2>
                  <p className="text-muted-foreground">
                    {t('Ask me anything about Japanese language learning')}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isStreaming && (
                  <MessageBubble
                    message={{
                      id: Date.now(),
                      role: 'assistant',
                      content: streamingContent,
                      token_count: 0,
                      created_at: new Date().toISOString(),
                    }}
                    isStreaming={true}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
          placeholder={t('Type your message...')}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}