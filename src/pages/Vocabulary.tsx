import React, { useState, useRef, useEffect } from "react";
import WordCard from "../components/WordCard";
import { Token } from "../types/jp_ast";
import { useAntdTable } from "ahooks";
import { PaginatedResponse } from "~/types/history";
import { alovaInstance } from "~/utils/request";
import { useNavigate } from "react-router";
import { FaBookOpen } from "react-icons/fa6";
import Spinner from "~/components/Spinner";
import { Grid, GridCellRenderer } from "react-virtualized";
import { useThrottleFn } from "ahooks";


const Vocabulary: React.FC = () => {
  // Sample data for demonstration
  const navigate = useNavigate();
  const gridRef = useRef<Grid>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    ({ scrollTop, clientHeight, scrollHeight }: { scrollTop: number; clientHeight: number; scrollHeight: number }) => {
      const isAtBottom = scrollTop + clientHeight + 10 > scrollHeight;

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

  const cellRenderer: GridCellRenderer = ({ columnIndex, rowIndex, key, style }) => {
    const index = rowIndex * 2 + columnIndex;
    const token = wordsTableProps?.dataSource?.[index];
    
    if (!token) return <div key={key} style={style} />;
    
    return (
      <div key={key} style={{ ...style, padding: '8px' }}>
        <WordCard
          token={token}
          isSelected={selectedTokens.has(token.word)}
          onSelect={() => handleTokenSelect(token.word)}
          onEdit={() => handleTokenEdit(token)}
          onDelete={() => handleTokenDelete(token)}
        />
      </div>
    );
  };

  // 计算列数和宽度
  const calculateGridDimensions = () => {
    const containerWidth = windowSize.width - 64; // 减去padding
    const columnWidth = 300; // 固定卡片宽度
    const columnCount = Math.max(1, Math.floor(containerWidth / columnWidth));
    const rowCount = Math.ceil((wordsTableProps?.dataSource?.length || 0) / columnCount);
    
    return { columnCount, columnWidth, rowCount };
  };

  const { columnCount, columnWidth, rowCount } = calculateGridDimensions();

  // 检查是否需要加载更多数据来填满容器
  useEffect(() => {
    if (!gridRef.current || !wordsTableProps?.dataSource?.length || wordsLoading ||
        wordsTableProps.dataSource.length >= (wordsTableProps.pagination?.total ?? 0)) return;

    // 给一点时间让网格渲染完成
    const timer = setTimeout(() => {
      if (gridRef.current) {
        // 检查内容高度是否小于容器高度
        const contentHeight = rowCount * 200; // rowHeight是200
        const containerHeight = windowSize.height - 200;
        
        if (contentHeight < containerHeight) {
          const nextPage = (wordsTableProps.pagination?.current ?? 1) + 1;
          wordsRunAsync({ current: nextPage, pageSize: 10 }, undefined);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [wordsTableProps?.dataSource?.length, rowCount, windowSize.height, wordsLoading, wordsTableProps?.pagination, wordsRunAsync]);

  return (
    <Spinner loading={wordsLoading}>
      <div className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
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
              <Grid
                ref={gridRef}
                width={windowSize.width - 64}
                height={windowSize.height - 200} // 减去header和padding的高度
                columnCount={columnCount}
                columnWidth={columnWidth}
                rowCount={rowCount}
                rowHeight={200} // 固定行高
                cellRenderer={cellRenderer}
                overscanRowCount={10}
                onScroll={throttledCheckScroll}
                style={{ outline: 'none' }}
              />
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
