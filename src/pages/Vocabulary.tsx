import React, { useState } from "react";
import WordCard from "../components/WordCard";
import { Token } from "../types/jp_ast";
import { useAntdTable } from "ahooks";
import { PaginatedResponse } from "~/types/history";
import { alovaInstance } from "~/utils/request";
import { useNavigate } from "react-router";
import Spinner from "~/components/Spinner";

const Vocabulary: React.FC = () => {
  // Sample data for demonstration
  const navigate = useNavigate();

  const [tokens] = useState<Token[]>([
    {
      word: "こんにちは",
      pos: "fixed_phrase",
      meaning: "你好",
      kana: "こんにちは",
      lemma: null,
      inflection: null,
    },
    {
      word: "食べる",
      pos: "verb",
      meaning: "吃",
      kana: "たべる",
      lemma: "食べる",
      inflection: null,
    },
    {
      word: "美しい",
      pos: "adjective",
      meaning: "美丽的",
      kana: "うつくしい",
      lemma: "美しい",
      inflection: null,
    },
    {
      word: "学校",
      pos: "other",
      meaning: "学校",
      kana: "がっこう",
      lemma: null,
      inflection: null,
    },
    {
      word: "とても",
      pos: "adverb",
      meaning: "非常",
      kana: "とても",
      lemma: null,
      inflection: null,
    },
    {
      word: "そして",
      pos: "conjunction",
      meaning: "然后",
      kana: "そして",
      lemma: null,
      inflection: null,
    },
    {
      word: "三",
      pos: "numeral",
      meaning: "三",
      kana: "さん",
      lemma: null,
      inflection: null,
    },
    {
      word: "は",
      pos: "particle",
      meaning: "主题助词",
      kana: "は",
      lemma: null,
      inflection: null,
    },
  ]);

  const {
    tableProps: wordsTableProps,

    loading: wordsLoading,
    // runAsync: wordsRunAsync,
  } = useAntdTable<
    { total: number; list: Token[] },
    [{ current: number; pageSize: number }, { init?: boolean } | undefined]
  >(
    async (
      { current, pageSize },
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
          params: { page: current, limit: pageSize },
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
      defaultParams: [
        {
          current: 1,
          pageSize: 10,
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

  return (
    <Spinner loading={wordsLoading}>
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto max-h-[calc(100vh-4rem)]">
          {/* Main container with shadow and rounded corners */}
          <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-8">
            {/* Header */}
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-0">
                    单词表
                  </h1>
                  <p className="text-gray-600">管理和学习您的日语词汇</p>
                </div>
              </div>
            </div>

            {/* Word cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {tokens.map((token, index) => (
                <WordCard
                  key={`${token.word}-${index}`}
                  token={token}
                  isSelected={selectedTokens.has(token.word)}
                  onSelect={() => handleTokenSelect(token.word)}
                  onEdit={() => handleTokenEdit(token)}
                  onDelete={() => handleTokenDelete(token)}
                />
              ))}
            </div>

            {/* Empty state */}
            {tokens.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  暂无单词
                </h3>
                <p className="text-gray-500 mb-6">
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
