import { useState, useEffect } from "react";
import { useAntdTable, useResponsive } from "ahooks";
import { Toast } from "~/components/ToastCompat";
import type { Conversation } from "~/types/teach";
import { getConversations } from "~/utils/teachApi";

const PAGE_SIZE = 20;

export function useTeachHistory() {
  const [showConversationList, setShowConversationList] = useState(true);
  const [isConversationListCollapsed, setIsConversationListCollapsed] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  
  const responsiveInfo = useResponsive();
  
  useEffect(() => {
    if (
      (responsiveInfo["xs"] ||
        (responsiveInfo["sm"] && responsiveInfo["md"])) &&
      !responsiveInfo["lg"]
    ) {
      setIsConversationListCollapsed(true);
    }
  }, [responsiveInfo]);

  const {
    tableProps: conversationList,
    refresh: conversationListRefresh,
    runAsync: conversationListLoad,
  } = useAntdTable<
    { total: number; list: Conversation[] },
    [
      { current: number; pageSize: number; keyword?: string },
      { init?: boolean } | undefined,
    ]
  >(
    async (
      { current, pageSize },
      params?: { init?: boolean }
    ): Promise<{ total: number; list: Conversation[] }> => {
      try {
        const data = await getConversations(current, pageSize);
        
        // Only reset data when it's an initial load (search or first page)
        // For pagination, always concatenate with existing data
        const existingData = (params?.init && current === 1)
          ? []
          : (conversationList?.dataSource as Conversation[]) ?? [];
        
        return {
          total: data.pagination.total,
          list: existingData.concat(data.conversations),
        };
      } catch (error) {
        console.error(error);
        Toast.error(error instanceof Error ? error.message : String(error));
        return {
          total: 0,
          list: [],
        };
      }
    },
    {
      debounceWait: 500,
      debounceLeading: false,
      defaultPageSize: PAGE_SIZE,
      defaultCurrent: 1,
    }
  );

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversationId(conversationId);
    setShowConversationList(false);
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setSelectedConversationId(null);
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setShowConversationList(false);
  };

  return {
    showConversationList,
    setShowConversationList,
    isConversationListCollapsed,
    setIsConversationListCollapsed,
    selectedConversationId,
    handleSelectConversation,
    handleBackToList,
    handleNewConversation,
    conversationList,
    conversationListRefresh,
    conversationListLoad,
    PAGE_SIZE,
  };
}