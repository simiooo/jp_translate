import { useState, useEffect } from "react";
import type { TranslationResult } from "../types/jp_ast";
import { useForm } from "react-hook-form";
import { jsonrepair } from "jsonrepair";
// import { zodResolver } from '@hookform/resolvers/zod'
import { type TranslationFormData } from "../schemas/translation";
import { Toast } from "../components/Toast";
import { useRequest, useThrottle } from "ahooks";
import { Cursor } from "../components/Cursor";
import { AstTokens } from "../components/AstTokens";
// import { Reasoning } from "../components/Reasoning";
import { createPortal } from "react-dom";
import type { Route } from "./+types/Home";
import { alovaInstance, createSSEStream, EventData } from "~/utils/request";
import { PaginatedResponse, TranslationRecord } from "~/types/history";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Japanese Learning By Translate" },
    { name: "apanese Learning By Translate", content: "Welcome to apanese Learning By Translate!" },
  ];
}




function App() {
  // const [translation, setTranslation] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [bufferedTranslation, setBufferedTranslation] =
    useState<TranslationResult | null>(null);
  // const [bufferedThinking, setBufferedThinking] = useState<string>();

  // const reasoningRef = useRef<HTMLDivElement>(null);

  // 添加 TTS loading 状态
  const [ttsLoading, setTtsLoading] = useState<{
    original: boolean;
    translation: boolean;
  }>({
    original: false,
    translation: false,
  });

  const form = useForm<TranslationFormData>({
    defaultValues: {
      text: "",
      sourceLanguage: "ja",
    },
  });

  // 从 URL 读取初始文本
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const textFromUrl = searchParams.get("text");
    const langFromUrl = searchParams.get("lang") as "zh" | "ja";

    if (textFromUrl) {
      form.setValue("text", decodeURIComponent(textFromUrl));
    }
    if (langFromUrl && (langFromUrl === "zh" || langFromUrl === "ja")) {
      form.setValue("sourceLanguage", langFromUrl);
    }
  }, [form]);

  // 加载历史记录
  useEffect(() => {
    // const loadHistory = async () => {
    //   const records = await db.translations
    //     .orderBy("timestamp")
    //     .reverse()
    //     .limit(50)
    //     .toArray();
    //   setHistory(records);
    // };
    // loadHistory();
  }, []);

  const {data: history, refresh: historyRefresh} = useRequest(async () => {
    try {
      const data = await alovaInstance.Get<{translations?: TranslationRecord[], pagination?: PaginatedResponse}>("/api/translation");
      return {...data, translations: data.translations?.map(translation => ({...translation, translated_text: translation?.translated_text?.length > 0 ? JSON.parse(translation?.translated_text) : translation?.translated_text}))}
    } catch (error) {
      console.error(error)
    }    

  });

  const translation = useThrottle<TranslationResult | null>(
    bufferedTranslation,
    {
      wait: 300,
    }
  );
  
  // const thinking = useThrottle<string | undefined>(bufferedThinking, {
  //   wait: 500,
  // });

  // useRequest(
  //   async () => {
  //     reasoningRef.current?.scrollTo(0, 0xffff);
  //   },
  //   {
  //     refreshDeps: [thinking],
  //   }
  // );

  const onSubmit = async (data: TranslationFormData) => {
    let fullResponse = "";
    const sse = createSSEStream("/api/translation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source_text: data.text }),
      onMessage(data: EventData<{text?: string; message?: string}>) {
        switch (data.type) {
          case "chunk":
            fullResponse += data.data?.text?.trim?.();
            try {
              if ((data.data?.text ?? '')?.length > 0) {
                const translationData = JSON.parse(
                  jsonrepair(fullResponse)
                ) as TranslationResult;
                setBufferedTranslation(() => {
                  return translationData;
                });
              }
            } catch (error) {
              console.error(error)
            }
            
            break;
          case "start":
            setBufferedTranslation(null);
            setLoading(true);
            break;
          case "end":
            setLoading(false);
            break;
          case "error":
            setLoading(false);
            break;
          case "complete":
            historyRefresh()
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
  };

  const handleTTS = async (text: string, type: "original" | "translation") => {
    if (!text || ttsLoading[type]) return;

    try {
      setTtsLoading((prev) => ({ ...prev, [type]: true }));

      const response = await fetch(`/api/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer`,
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
        }),
      });

      if (!response.ok) throw new Error("TTS request failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      Toast.error("语音合成失败，请重试");
    } finally {
      setTtsLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden flex">
      {/* 侧边栏历史记录 */}
      <div
        className={`fixed md:relative ${
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
              className="hidden md:block text-gray-500 hover:text-gray-700"
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
          <div className="flex-1 overflow-y-auto">
            {(history?.translations ?? [])?.map((record, index) => (
              <div
                key={record.id || index}
                className="p-4  hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  form.setValue("text", record.source_text);
                  setShowHistory(false);
                }}
              >
                {isHistoryCollapsed ? (
                  <div className="text-center text-gray-500 text-sm">
                    {index + 1}
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
                      {record.translated_text?.translation}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 遮罩层 - 移动端显示 */}
      {showHistory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setShowHistory(false)}
        ></div>
      )}

      {/* 主要内容区域 */}
      <div className="flex-1 min-w-0">
        <div className="container mx-auto px-4 py-6 h-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
              日中翻译
            </h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="md:hidden px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
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

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 flex flex-col"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 flex-1">
              <div className="md:col-span-5 space-y-5">
                <div className="relative">
                  <textarea
                    {...form.register("text")}
                    className="bg-white w-full h-[50vh] md:h-[70vh] p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="日本語を入力してください"
                  />
                  {/* 原文区域的 TTS 按钮 */}
                  {form.getValues("text") && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleTTS(form.getValues("text"), "original");
                      }}
                      disabled={ttsLoading.original}
                      className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
                        ttsLoading.original
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      }`}
                      title="播放原文语音"
                    >
                      {ttsLoading.original ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
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
                      )}
                    </button>
                  )}
                </div>
                {form.formState.errors.text && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.text.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="relative h-[50vh] md:h-[70vh]">
                  {loading && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="animate-spin rounded-full h-8 w-8 -2 border-blue-500"></div>
                    </div>
                  )}
                  <div className="h-full flex flex-col bg-white rounded-lg">
                    {translation || loading ? (
                      <>
                        <div className="p-4  max-h-[40%] overflow-auto">
                          <div className="flex justify-between items-start">
                            <p className="text-gray-700">
                              {translation?.translation}
                              {loading && <Cursor />}
                            </p>

                            {translation?.translation && !loading && (
                              <button
                                onClick={() =>
                                  handleTTS(
                                    translation.translation ?? "",
                                    "translation"
                                  )
                                }
                                disabled={ttsLoading.translation}
                                className={`ml-2 p-2 rounded-full transition-all duration-200 ${
                                  ttsLoading.translation
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                }`}
                                title="播放翻译语音"
                              >
                                {ttsLoading.translation ? (
                                  <svg
                                    className="w-5 h-5 animate-spin"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                ) : (
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
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 p-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                          <AstTokens ast={translation?.ast} loading={loading} />
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        翻译结果将在这里显示
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-4 md:mt-8 mb-4 md:mb-6">
              <button
                type="submit"
                disabled={loading || form.formState.isSubmitting}
                className="px-8 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                {loading ? "翻译中..." : "翻译"}
              </button>
            </div>
          </form>

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
  );
}

export default App;
