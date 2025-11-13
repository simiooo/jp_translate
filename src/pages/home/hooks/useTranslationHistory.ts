import { useState, useEffect } from "react";
import { useAntdTable, useResponsive } from "ahooks";
import { jsonrepair } from "jsonrepair";
import { Toast } from "~/components/ToastCompat";

import type { TranslationRecord } from "~/types/history";
import { alovaInstance } from "~/utils/request";
import { PaginatedResponse } from "~/types/history";
import { ErrorResponse } from "~/types/errors";

const PAGE_SIZE = 50;

export function useTranslationHistory() {
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  
  const responsiveInfo = useResponsive();
  
  useEffect(() => {
    if (
      (responsiveInfo["xs"] ||
        (responsiveInfo["sm"] && responsiveInfo["md"])) &&
      !responsiveInfo["lg"]
    ) {
      setIsHistoryCollapsed(true);
    }
  }, [responsiveInfo]);

  const {
    tableProps: history,
    refresh: historyRefresh,
    runAsync: historyLoad,
  } = useAntdTable<
    { total: number; list: TranslationRecord[] },
    [
      { current: number; pageSize: number; keyword?: string },
      { init?: boolean } | undefined,
    ]
  >(
    async (
      { current, pageSize, keyword },
      params?: { init?: boolean }
    ): Promise<{ total: number; list: TranslationRecord[] }> => {
      try {
        const data = await alovaInstance.Get<
          | ErrorResponse
          | {
              translations?: TranslationRecord[];
              pagination?: PaginatedResponse;
            }
        >("/api/translation", {
          params: { page: current, limit: pageSize, keyword: keyword },
        });
        if ("message" in data) {
          throw Error(data.message);
        }
        return {
          total: data.pagination?.total ?? 0,
          list: // Only reset data when it's an initial load (search or first page)
          // For pagination, always concatenate with existing data
          (
            (params?.init && current === 1
              ? []
              : (history?.dataSource as TranslationRecord[])) ?? []
          ).concat(
            data.translations?.map((translation) => {
              try {
                return {
                  ...translation,
                  translated_text:
                    translation?.translated_text?.length > 0
                      ? JSON.parse(jsonrepair(translation?.translated_text))
                      : translation?.translated_text,
                };
              } catch (error) {
                console.error(error);
                return {
                  created_at: "",
                  id: 12,
                  source_lang: "ja",
                  source_text: "",
                  target_lang: "zh",
                  translated_text: "",
                };
              }
            }) ?? []
          ),
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
      debounceWait: 1000,
      debounceLeading: false,
      defaultPageSize: PAGE_SIZE,
      defaultCurrent: 1,
    }
  );

  return {
    showHistory,
    setShowHistory,
    isHistoryCollapsed,
    setIsHistoryCollapsed,
    history,
    historyRefresh,
    historyLoad,
    PAGE_SIZE,
  };
}