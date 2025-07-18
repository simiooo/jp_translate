import React, { useState, useRef } from "react";
import WordCard from "../components/WordCard";
import { Token } from "../types/jp_ast";
import { useAntdTable } from "ahooks";
import { PaginatedResponse } from "~/types/history";
import { alovaInstance } from "~/utils/request";
import { useNavigate } from "react-router";
import { FaBookOpen } from "react-icons/fa6";
import Spinner from "~/components/Spinner";
import { VList, VListHandle } from "virtua";
import { useThrottleFn } from "ahooks";

const Vocabulary: React.FC = () => {
  // Sample data for demonstration
  const navigate = useNavigate();
  const listContainerRef = useRef<VListHandle>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());

  const handleTokenSelect = (word: string) => {
    const newSelected = new Set(selectedTokens);
    if (newSelected.has(word)) {
      newSelected.delete(word);
    } else {
      newSelected.add(word);
    }
    setSelectedTokens(newSelected);
  };

  const handleTokenEdit = (token: Token) => {
    console.log("Edit token:", token);
    // TODO: Implement edit functionality
  };

  const handleTokenDelete = (token: Token) => {
    console.log("Delete token:", token);
    // TODO: Implement delete functionality
  };

  //   const clearSelection = () => {
  //     setSelectedTokens(new Set());
  //   };

  //   const selectAll = () => {
  //     setSelectedTokens(new Set(tokens.map((token) => token.word)));
  //   };

  // 处理滚动加载 (带节流)
  const { run: throttledCheckScroll } = useThrottleFn(
    () => {
      if (!listContainerRef.current) return;
      const isAtBottom =
        listContainerRef.current.scrollOffset +
          listContainerRef.current.viewportSize +
          10 >
        listContainerRef.current.scrollSize;

      const hasMore =
        wordsTableProps?.dataSource?.length <
        (wordsTableProps?.pagination?.total ?? 0);

      if (isAtBottom && hasMore && !wordsLoading) {
        const nextPage = (wordsTableProps?.pagination?.current ?? 1) + 1;
        wordsRunAsync({ current: nextPage, pageSize: 10 }, undefined);
      }
    },
    { wait: 200 }
  );

  return (
    <Spinner loading={wordsLoading}>
      <div className="h-screen overflow-y-auto bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
          {/* Main container with shadow and rounded corners */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 sm:p-8 h-full flex flex-col">
            {/* Header */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-0">
                    单词表
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">管理和学习您的日语词汇</p>
                </div>
              </div>
              <input
                type="text"
                placeholder="搜索单词..."
                className="w-full p-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  wordsRunAsync({ current: 1, pageSize: 10, keyword: e.target.value }, { init: true });
                }}
              />
            </div>

            <div className="flex-grow">
              <VList
                ref={listContainerRef}
                count={wordsTableProps?.dataSource?.length ?? 0}
                overscan={10}
                itemSize={180}
                className=""
                onScroll={throttledCheckScroll}
              >
                {(index) => {
                  const token = wordsTableProps?.dataSource?.[index];
                  if (!token) return <div>暂无单词</div>;
                  return (
                    <div className="m-2">
                      <WordCard
                        key={`${token.word}-${index}`}
                        token={token}
                        isSelected={selectedTokens.has(token.word)}
                        onSelect={() => handleTokenSelect(token.word)}
                        onEdit={() => handleTokenEdit(token)}
                        onDelete={() => handleTokenDelete(token)}
                      />
                    </div>
                  );
                }}
              </VList>
            </div>
            {/* Virtualized word cards grid */}

            {/* Empty state */}
            {(wordsTableProps?.dataSource ?? []).length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                  <FaBookOpen
                    style={{ fontSize: "6rem", color: "#9CA3AF" }}
                  ></FaBookOpen>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  暂无单词
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  开始添加一些单词来构建您的词汇表
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Spinner>
  );
};

export default Vocabulary;
