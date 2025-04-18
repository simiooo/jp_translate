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
import { CircleButton } from "../components/CircleButton";
import type { Route } from "./+types/Home";
import { alovaBlobInstance, alovaInstance, createSSEStream, EventData } from "~/utils/request";
import { PaginatedResponse, TranslationRecord } from "~/types/history";
import { useNavigate } from "react-router";
import { HistorySidebar } from "../components/HistorySidebar";

// import { unknown } from "zod";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Japanese Learning By Translate" },
    { name: "apanese Learning By Translate", content: "Welcome to apanese Learning By Translate!" },
  ];
}

function App() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [bufferedTranslation, setBufferedTranslation] =
    useState<TranslationResult | null>(null);
  // const [bufferedThinking, setBufferedThinking] = useState<string>();

  // const reasoningRef = useRef<HTMLDivElement>(null);


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

  const {data: history, refresh: historyRefresh, loading: historyLoading} = useRequest(async () => {
    try {
      const data = await alovaInstance.Get<{message: string} |{translations?: TranslationRecord[], pagination?: PaginatedResponse}>("/api/translation");
      if("message" in data) {
        throw Error(data.message)
      }
      return {...data, translations: data.translations?.map(translation => ({...translation, translated_text: translation?.translated_text?.length > 0 ? JSON.parse(jsonrepair(translation?.translated_text)) : translation?.translated_text}))}
    } catch (error) {
      console.error(error)
      navigate('/login')
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

  const {runAsync: handleTTS, loading: ttsLoading} = useRequest(async (text: string, lang: string) => {
    if (!text || ttsLoading) return;

    try {

      const audioBlob = await alovaBlobInstance.Post<Blob>('/api/tts', {
        text,
        lang
      })
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      Toast.error("语音合成失败，请重试");
    }
  } , {
    manual: true
  })


  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden flex">
      {/* 侧边栏历史记录 */}
      <HistorySidebar
        isHistoryCollapsed={isHistoryCollapsed}
        setIsHistoryCollapsed={setIsHistoryCollapsed}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        historyLoading={historyLoading}
        translations={history?.translations ?? []}
        onSelectHistoryItem={(text) => {
          form.setValue("text", text);
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
            className="h-[calc(100vh - 144px)] flex flex-col"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 flex-1">
              <div className="md:col-span-5 space-y-5">
                <div className="relative">
                  <textarea
                  
                    {...form.register("text")}
                    className="bg-white w-full h-[25vh]  md:h-[70vh] p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="日本語を入力してください"
                  />
                  {/* 原文区域的 TTS 按钮 */}
                  
                    <CircleButton
                      onClick={(e) => {
                        e.preventDefault();
                        const text = form.getValues("text")
                        if(!text) return
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
