import React from "react";
import { TranslationRecord } from "~/types/history";
import Spinner from "~/components/Spinner";

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
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isHistoryCollapsed,
  setIsHistoryCollapsed,
  showHistory,
  setShowHistory,
  historyLoading,
  translations,
  onSelectHistoryItem,
}) => {
  return (
    <div
      className={`
        rounded-r-lg
        fixed md:relative ${
        isHistoryCollapsed ? "w-16" : "w-80"
      } h-screen bg-white shadow-lg 
      transition-all duration-300 transform ${
        showHistory ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } z-20`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4  flex justify-between items-center">
          {!isHistoryCollapsed && (
            <h2 className="text-lg font-semibold">翻译历史</h2>
          )}
          <button
            onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            className="hidden md:block text-gray-500 hover:text-gray-900 
            "
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
              className="md:hidden text-gray-500 
              hover:text-gray-700
              "
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
        <div className="flex-1 overflow-y-auto">
          {historyLoading ? <Spinner></Spinner> : (translations ?? [])?.map((record, index) => (
            <div
              key={record.id || index}
              className="p-4  hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                onSelectHistoryItem(record.source_text);
                setShowHistory(false);
              }}
            >
              {isHistoryCollapsed ? (
                <div className="text-center text-gray-500 text-sm">
                  {record.source_text.slice(0,2)}
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
          ))}
        </div>
      </div>
    </div>
  );
};
