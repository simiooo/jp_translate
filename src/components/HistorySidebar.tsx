import React from "react";
import { TranslationRecord } from "~/types/history";
import Spinner from "~/components/Spinner";
import { VList, VListHandle } from "virtua";

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
}
// Color configuration with complete Tailwind class names
const COLOR_VARIANTS = [
  {
    bg: "bg-amber-200",
    text: "text-amber-700"
  },
  {
    bg: "bg-blue-200",
    text: "text-blue-700"
  },
  {
    bg: "bg-cyan-200",
    text: "text-cyan-700"
  },
  {
    bg: "bg-emerald-200",
    text: "text-emerald-700"
  },
  {
    bg: "bg-fuchsia-200",
    text: "text-fuchsia-700"
  },
  {
    bg: "bg-gray-200",
    text: "text-gray-700"
  },
  {
    bg: "bg-green-200",
    text: "text-green-700"
  },
  {
    bg: "bg-indigo-200",
    text: "text-indigo-700"
  },
  {
    bg: "bg-lime-200",
    text: "text-lime-700"
  },
  {
    bg: "bg-orange-200",
    text: "text-orange-700"
  },
  {
    bg: "bg-pink-200",
    text: "text-pink-700"
  },
  {
    bg: "bg-purple-200",
    text: "text-purple-700"
  },
  {
    bg: "bg-red-200",
    text: "text-red-700"
  },
  {
    bg: "bg-teal-200",
    text: "text-teal-700"
  },
  {
    bg: "bg-violet-200",
    text: "text-violet-700"
  },
  {
    bg: "bg-yellow-200",
    text: "text-yellow-700"
  }
];
export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isHistoryCollapsed,
  setIsHistoryCollapsed,
  showHistory,
  setShowHistory,
  historyLoading,
  translations,
  onSelectHistoryItem,
  page,
  onPageChange,
  hasMore,
  isLoadingMore,
  isError,
}) => {
  const listContainerRef = React.useRef<VListHandle>(null);

  const checkScrollPosition = React.useCallback(() => {
    if (!listContainerRef.current) return;
    const isAtBottom = listContainerRef.current.scrollOffset  + listContainerRef.current.viewportSize + 10 > listContainerRef.current.scrollSize
    // console.log(listContainerRef.current.scrollOffset, listContainerRef.current.viewportSize,listContainerRef.current.scrollSize);
    
    if (isAtBottom && hasMore && !isLoadingMore && !isError) {
      onPageChange(page + 1);
    }
  }, [hasMore, isLoadingMore, isError, onPageChange, page]);

  return (
    <div
      className={`
        rounded-r-2xl
        overflow-hidden
        fixed md:relative ${
        isHistoryCollapsed ? "w-16" : "w-80"
      } h-screen bg-white shadow-lg 
      transition-all duration-300 transform ${
        showHistory ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } z-20`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 flex justify-between items-center">
          {!isHistoryCollapsed && (
            <h2 className="text-lg font-semibold">翻译历史</h2>
          )}
          <button
          type="button"
            onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            className="hidden md:block text-gray-500 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isHistoryCollapsed
                    ? "M13 5l7 7-7 7M5 5l7 7-7 7"
                    : "M11 19l-7-7 7-7M19 19l-7-7 7-7"
                }
              />
            </svg>
          </button>
          {!isHistoryCollapsed && (
            <button
              onClick={() => setShowHistory(false)}
              className="md:hidden text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex-1">
          
            <Spinner loading={historyLoading}>
              <VList
              ref={listContainerRef}
                count={translations?.length || 0}
                overscan={10}
                onScroll={checkScrollPosition}
                itemSize={isHistoryCollapsed ? 60 : 100}
              >
                {(index: number) => {
                  const record = translations?.[index];
                  if (!record) return <></>;
                  return (
                    <div
                      key={record.id || index}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        onSelectHistoryItem(record.source_text);
                        setShowHistory(false);
                      }}
                    >
                      {isHistoryCollapsed ? (
                        <div className="text-center ">
                          <div
                          className={`inline-block w-8 h-8 ${COLOR_VARIANTS[index % COLOR_VARIANTS.length].bg}
                          rounded-full flex items-center justify-center text-lg font-semibold
                          ${COLOR_VARIANTS[index % COLOR_VARIANTS.length].text}
                          `}
                          >{record.source_text.slice(0, 1)}</div>
                          
                        </div>
                      ) : (
                        <>
                          <div className="text-xs text-gray-500 mb-2">
                            {new Date(record.created_at).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-700 line-clamp-2">
                            {record.source_text}
                          </div>
                          <div className="text-sm text-gray-900 line-clamp-2 mt-1">
                            {typeof record.translated_text === 'object' 
                              ? (record.translated_text as unknown as ParsedTranslation)?.translation 
                              : record.translated_text}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }}
              </VList>
              {!hasMore && translations.length > 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  没有更多数据了
                </div>
              )}
              {isError && (
                <div className="p-4 text-center text-sm text-red-500">
                  加载失败，请重试
                </div>
              )}
            </Spinner>
          
        </div>
      </div>
    </div>
  );
};
