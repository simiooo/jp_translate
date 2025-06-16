import { useRef, useState } from "react";
import type { Token, TranslationResult } from "../types/jp_ast";
import { useForm } from "react-hook-form";
import { jsonrepair } from "jsonrepair";
// import { zodResolver } from '@hookform/resolvers/zod'
import { type TranslationFormData } from "../schemas/translation";
import { Toast } from "../components/Toast";
import { useAntdTable, useKeyPress, useRequest, useThrottle } from "ahooks";
import { Cursor } from "../components/Cursor";
import { AstTokens } from "../components/AstTokens";
// import { Reasoning } from "../components/Reasoning";
import { createPortal } from "react-dom";
import { CircleButton } from "../components/CircleButton";
import type { Route } from "./+types/Home";
import {
  alovaBlobInstance,
  alovaInstance,
  createSSEStream,
  EventData,
} from "~/utils/request";
import { PaginatedResponse, TranslationRecord } from "~/types/history";
// import { useNavigate } from "react-router";
import { HistorySidebar } from "../components/HistorySidebar";
import { Button } from "~/components/Button";
import { Tooltip } from "~/components/Tooltip";
import { Modal, useModal } from "~/components/Modal";
import { ImageUploader, ImageUploaderRef, UploadFile } from "~/components/ImageUploader";

// import { unknown } from "zod";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Japanese Learning By Translate" },
    {
      name: "apanese Learning By Translate",
      content: "Welcome to apanese Learning By Translate!",
    },
  ];
}

function App() {
  // const navigate = useNavigate();
  const {
    isOpen,
    openModal,
    closeModal,
    params: addPendingToken,
  } = useModal<Token>();
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [bufferedTranslation, setBufferedTranslation] =
    useState<TranslationResult | null>(null);
  // const [bufferedThinking, setBufferedThinking] = useState<string>();

  const submitRef = useRef<HTMLButtonElement>(null);
  const form = useForm<TranslationFormData>({
    defaultValues: {
      text: "",
      sourceLanguage: "ja",
    },
  });

  const {
    tableProps: history,
    refresh: historyRefresh,
    runAsync: historyLoad,
  } = useAntdTable<
    { total: number; list: TranslationRecord[] },
    [{ current: number; pageSize: number; keyword?: string }, { init?: boolean } | undefined]
  >(
    async (
      { current, pageSize, keyword },
      params?: { init?: boolean }
    ): Promise<{ total: number; list: TranslationRecord[] }> => {
      try {
        const data = await alovaInstance.Get<
          | { message: string }
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
          list: (
            (params?.init
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
              }
              } catch (error) {
                console.error(error)
                return {
                  created_at: "", id: 12, source_lang: "ja", source_text: "",
                  target_lang: "zh", translated_text: ""
                }
              }
              
            }) ?? []
          ),
        };
      } catch (error) {
        console.error(error);
        // if(error instanceof Error && error.message !== "translation limit reached")  {
        //   navigate("/login");
        // }
        Toast.error(error instanceof Error ? error.message : String(error));
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

  const translation = useThrottle<TranslationResult | null>(
    bufferedTranslation,
    {
      wait: 300,
    }
  );
  useKeyPress("alt.enter", () => {
    submitRef.current?.click();
  });

  useKeyPress("alt.q", () => {
    form.setFocus("text");
  });

  const imgRef = useRef<ImageUploaderRef>(null)

  const onSubmit = async (data: TranslationFormData) => {
    try {
      let fullResponse = "";
      setLoading(true);
      setBufferedTranslation(null);
      let files: UploadFile[] = []
      if(imgRef.current !== null) {
        files = imgRef.current.getUploadedFiles() ?? []
      }
      const sse = createSSEStream("/api/translation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        
        body: JSON.stringify({ source_text: data.text, image_url:files?.[0].URL }),
        onMessage(data: EventData<{ text?: string; message?: string }>) {
          switch (data.type) {
            case "chunk":
              fullResponse += data.data?.text?.trim?.();
              try {
                if ((data.data?.text ?? "")?.length > 0) {
                  const translationData = JSON.parse(
                    jsonrepair(fullResponse)
                  ) as TranslationResult;
                  setBufferedTranslation(() => {
                    return translationData;
                  });
                }
              } catch (error) {
                console.error(error);
              }

              break;
            case "start":
              setBufferedTranslation(null);

              break;
            case "end":
              setLoading(false);
              break;
            case "error":
              Toast.error(String(data?.data?.message));
              setLoading(false);
              break;
            case "complete":
              historyRefresh();
              historyLoad({ current: 1, pageSize: 10 }, { init: true });
              setLoading(false);
              break;
          }
        },
        onClose() {
          setLoading(false);
        },
        onError(error) {
          console.error(error);
          setLoading(false);
        },
      });
      sse.connect();
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  const { runAsync: handlWordCreate, loading: wordCreateLoading } = useRequest(
    async (word: Token) => {
      if (!translation) return;
      try {
        const res = await alovaInstance.Post<{
          [key: string]: string | number | undefined;
          code?: number;
        }>("/api/words", word);
        if (res.code) {
          throw Error(res.message?.toString() || "保存单词失败");
        }
        Toast.success("单词已保存");
      } catch (error) {
        console.error("保存单词失败:", error);
        Toast.error("保存单词失败，请重试");
      }
    },
    {
      manual: true,
    }
  );

  const { runAsync: handleTTS, loading: ttsLoading } = useRequest(
    async (text: string, lang: string) => {
      if (!text || ttsLoading) return;

      try {
        const audioBlob = await alovaBlobInstance.Post<Blob>("/api/tts", {
          text,
          lang,
        });

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
      } catch (error) {
        console.error("TTS error:", error);
        Toast.error("语音合成失败，请重试");
      }
    },
    {
      manual: true,
    }
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 overflow-x-hidden flex">
        {/* 侧边栏历史记录 */}
        <HistorySidebar
          isHistoryCollapsed={isHistoryCollapsed}
          setIsHistoryCollapsed={setIsHistoryCollapsed}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          historyLoading={history.loading}
          translations={history?.dataSource ?? []}
          onSelectHistoryItem={(text) => {
            form.setValue("text", text);
          }}
          page={history?.pagination?.current ?? 1}
          total={history?.pagination?.total ?? 0}
          onPageChange={(page) => {
            historyLoad({ current: page, pageSize: 10 }, undefined);
          }}
          hasMore={history.dataSource.length < (history.pagination?.total ?? 0)}
          isLoadingMore={history.loading}
          isError={false}
          onSearchChange={(keyword) => {
            historyLoad({ current: 1, pageSize: 10, keyword: keyword }, { init: true });
          }}
        />

        {/* 遮罩层 - 移动端显示 */}
        {showHistory && (
          <div
            className="fixed inset-0 blur-2xl bg-black opacity-12 z-10 md:hidden"
            onClick={() => setShowHistory(false)}
          ></div>
        )}

        {/* 主要内容区域 */}
        <div className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-6 h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div className="flex items-baseline justify-between w-1/1 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold inline-flex items-center text-gray-800 dark:text-gray-200 mb-4 md:mb-0">
                  日中翻译
                </h1>

                <div className="">
                  <Tooltip content="按 Alt + Enter 提交" placement="bottom">
                    <Button
                      key="submit"
                      ref={submitRef}
                      type="submit"
                      disabled={loading || form.formState.isSubmitting}
                      loading={loading}
                    >
                      {loading ? "翻译中..." : "翻译"}
                    </Button>
                  </Tooltip>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="md:hidden px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  历史记录
                </button>
              </div>
            </div>

            <div className="h-[calc(100vh - 144px)] flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 flex-1">
                <div className="md:col-span-5 space-y-5">
                  <div className="relative">
                    
                    <textarea
                      {...form.register("text")}
                      className="bg-white dark:bg-gray-800 w-full h-[25vh]  md:h-[70vh] p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-gray-100"
                      placeholder={
                        "日本語を入力してください\n例：こんにちは、元気ですか？\nAlt + Q 选择输入框"
                      }
                    />
                    <ImageUploader
                    ref={imgRef}
                    ></ImageUploader>
                    {/* 原文区域的 TTS 按钮 */}
                    <CircleButton
                      onClick={(e) => {
                        e.preventDefault();
                        const text = form.getValues("text");
                        if (!text) return;
                        handleTTS(text, "ja");
                      }}
                      disabled={ttsLoading}
                      loading={ttsLoading}
                      title="播放原文语音"
                      className="absolute top-4 -right-4.5"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.788v6.424a.5.5 0 00.757.429l5.5-3.212a.5.5 0 000-.858l-5.5-3.212a.5.5 0 00-.757.43z"
                        />
                      </svg>
                    </CircleButton>
                  </div>
                  {form.formState.errors.text && (
                    <div className="text-red-500 text-sm">
                      {form.formState.errors.text.message}
                    </div>
                  )}
                </div>

                <div className="md:col-span-7 space-y-4">
                  <div className="relative h-[50vh] md:h-[70vh]">
                    {loading && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="animate-spin rounded-full h-8 w-8 -2 border-blue-500"></div>
                      </div>
                    )}
                    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg">
                      {translation || loading ? (
                        <>
                          <div className="p-4  max-h-[40%] overflow-auto">
                            <div className="flex justify-between items-start">
                              {translation?.error && (
                                <div className="bg-amber-50 border-amber-800 border-2 rounded-2xl p-1 pl-2 pr-2 text-amber-800">
                                  {translation?.error}
                                </div>
                              )}
                              <div className="inline-flex gap-2 text-gray-700 dark:text-gray-300">
                                <span>{translation?.translation}</span>
                                <div className="inline-flex items-center gap-2">
                                  {loading && <Cursor />}
                                </div>
                              </div>

                              {translation?.translation && !loading && (
                                <CircleButton
                                  onClick={() =>
                                    handleTTS(
                                      translation.translation ?? "",
                                      "cn-zh"
                                    )
                                  }
                                  disabled={ttsLoading}
                                  loading={ttsLoading}
                                  title="播放翻译语音"
                                  className="ml-2"
                                  type="borderless"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.788v6.424a.5.5 0 00.757.429l5.5-3.212a.5.5 0 000-.858l-5.5-3.212a.5.5 0 00-.757.43z"
                                    />
                                  </svg>
                                </CircleButton>
                              )}
                            </div>
                          </div>

                          <div className="flex-1 p-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
                            <AstTokens
                              ast={translation?.ast}
                              loading={loading}
                              onAddToken={(token) => {
                                if (!token) return;
                                // 显示词性、原型、变形、意义和仮名
                                // Toast.info(
                                //   `词性: ${token.pos}, 原型: ${token.lemma}, 变形: ${token.inflection}, 意义: ${token.meaning}, 仮名: ${token.kana}`)
                                //   handlWordCreate(token)
                                openModal(token);
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                          翻译结果将在这里显示
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {createPortal(
              loading && (
                <div
                  className="
          absolute
          left-1/2
          top-1/2
          z-30
          -translate-x-1/2
          -translate-y-1/2
          "
                >
                  {/* <Reasoning ref={reasoningRef} thinking={thinking}></Reasoning> */}
                </div>
              ),
              document.documentElement
            )}
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} title="Word" size="lg">
        <div>Add Word to Vocabulary?</div>
        <div className="p-2"></div>
        <div className="flex justify-end gap-2">
          <Button
            loading={wordCreateLoading}
            onClick={async () => {
              if (!addPendingToken) return;
              await handlWordCreate(addPendingToken);
              closeModal();
            }}
          >
            Yes
          </Button>
          <Button variant="secondary" onClick={() => closeModal()}>
            No
          </Button>
        </div>
      </Modal>
    </form>
  );
}

export default App;
