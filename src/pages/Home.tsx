import { useEffect, useRef, useState } from "react";
import type { Token, TranslationResult } from "../types/jp_ast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jsonrepair } from "jsonrepair";
import {
  type TranslationFormData,
  translationFormSchema,
} from "../schemas/translation";
import { Toast } from "../components/ToastCompat";
import { useAntdTable, useKeyPress, useRequest, useResponsive, useThrottle } from "ahooks";
import { Cursor } from "../components/Cursor";
import { AstTokens } from "../components/AstTokens";
import { IoImageOutline } from "react-icons/io5";
import { createPortal } from "react-dom";
import type { Route } from "./+types/Home";
import Markdown from "react-markdown";
import { alovaInstance, alovaBlobInstance, createSSEStream, EventData } from "~/utils/request";
import { PaginatedResponse, TranslationRecord } from "~/types/history";
import { HistorySidebar } from "../components/HistorySidebar";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
const PAGE_SIZE = 50;
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Modal, useModal } from "~/components/ModalCompat";
import { isElectron } from "~/utils/electron";
import { ImageUploaderRef } from "~/components/ImageUploader";
import { motion } from "framer-motion";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Input } from "~/components/ui/input";
import { MdDelete, MdOutlineTranslate, MdVolumeUp } from "react-icons/md";
import { UploadFileItem, useFileUpload } from "~/hooks/useFileUpload";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import {
  Card,
  CardContent,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { isBrowser } from "~/utils/ssr";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
  const responsiveInfo = useResponsive()
  useEffect(() => {
    if((responsiveInfo["xs"] || responsiveInfo["sm"] && responsiveInfo["md"]) && !responsiveInfo["lg"] ) {
        setIsHistoryCollapsed(true)
    }
    
  }, [responsiveInfo])
  
  // 高亮状态
  const [highlightPosition, setHighlightPosition] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const submitRef = useRef<HTMLButtonElement>(null);
  const form = useForm<TranslationFormData>({
    resolver: zodResolver(translationFormSchema),
    defaultValues: {
      text: "",
      sourceLanguage: "ja",
      imgURL: "",
    },
  });

  const uploadBtnRef = useRef<HTMLInputElement>(null);

  const {
    fileList,
    addFiles,
    removeFile,
    retryUpload,
    loading: fileUploadLoading,
  } = useFileUpload({
    maxCount: 1,
  });
  useEffect(() => {
    const [file] = fileList;
    form.setValue("imgURL", file?.ObjectKey ? `${location.origin}/api/files/${file?.ObjectKey}` : undefined);
  }, [fileList]);
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
            // Only reset data when it's an initial load (search or first page)
            // For pagination, always concatenate with existing data
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

  const translation = useThrottle<TranslationResult | null>(
    bufferedTranslation,
    {
      wait: 300,
    }
  );
  useKeyPress("alt.enter", () => {
    form.handleSubmit(onSubmit)();
  });

  useKeyPress("alt.q", () => {
    console.log("text focus");

    form.setFocus("text");
  });

  const imgRef = useRef<ImageUploaderRef>(null);

  const onSubmit = async (data: TranslationFormData) => {
    try {
      let fullResponse = "";
      setLoading(true);
      setBufferedTranslation(null);
      const sse = createSSEStream(
        new URL(
          "/api/translation",
          isElectron() ? "https://risureader.top" : location.origin
        ).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            source_text: data.text,
            image_url: data.imgURL ? data.imgURL : null,
          }),
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
                imgRef.current?.clearFiles?.();
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
                historyLoad({ current: 1, pageSize: PAGE_SIZE }, { init: true });
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
        }
      );
      sse.connect();
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  const { runAsync: handleWordCreate, loading: wordCreateLoading } = useRequest(
    async (word: Token) => {
      if (!translation) return;
      try {
        const res = await alovaInstance.Post<{
          [key: string]: string | number | undefined;
          code?: number;
        }>("/api/words", {...word, pos: word?.pos?.join});
        if (res.code) {
          throw Error(res.message?.toString() || "保存单词失败");
        }
        Toast.success(t("Word saved successfully"));
      } catch (error) {
        console.error("保存单词失败:", error);
        Toast.error(t("Failed to save word, please try again"));
      }
    },
    {
      manual: true,
    }
  );

  // TTS functionality
  const { runAsync: handleTTS, loading: ttsLoading } = useRequest(
    async (text: string) => {
      if (!text || ttsLoading) return;

      try {
        const audioBlob = await alovaBlobInstance.Post<Blob>("/api/tts", {
          text,
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
      } catch (error) {
        console.error("TTS error:", error);
        Toast.error(t("TTS failed, please try again"));
      }
    },
    {
      manual: true,
    }
  );

  return (
    <div>
      <div className="h-full bg-background overflow-x-hidden flex">
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
          hasMore={history.dataSource.length < (history.pagination?.total ?? 0)}
          isError={false}
          onSearchChange={(keyword) => {
            historyLoad(
              { current: 1, pageSize: PAGE_SIZE, keyword: keyword },
              { init: true }
            );
          }}
          onLoadMore={async () => {
            const nextPage = (history?.pagination?.current ?? 0) + 1;
            await historyLoad({ current: nextPage, pageSize: PAGE_SIZE }, undefined);
          }}
        />

        {/* 遮罩层 - 移动端显示 */}
        {showHistory && (
          <div
            className="fixed inset-0 blur-2xl bg-black/10 z-10 md:hidden"
            onClick={() => setShowHistory(false)}
          ></div>
        )}
  
        {/* 主要内容区域 */}
        <div className="flex-1 min-w-0">
          <Form {...form}>
            <form className="h-full" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="container mx-auto px-4 py-6 h-full">
                <div className="h-full">
                  <ResizablePanelGroup className="" direction={((responsiveInfo?.["xs"] || responsiveInfo?.["sm"] && responsiveInfo?.["md"]) && !responsiveInfo["lg"] ) ? "vertical" :"horizontal"}>
                    <ResizablePanel className="">
                      <div className="">
                        <div className="p-4">
                          <div className="flex">
                            <FormField
                              control={form.control}
                              name="imgURL"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <Button
                                      className=""
                                      variant={"ghost"}
                                      disabled={fileUploadLoading}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        uploadBtnRef.current?.click();
                                      }}
                                    >
                                      <IoImageOutline></IoImageOutline>
                                    </Button>
                                  </FormLabel>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="image-upload-input"
                                    ref={uploadBtnRef}
                                    onChange={async (e) => {
                                      try {
                                        const thisFile = e.target.files?.[0];
                                        let uploadableFile:
                                          | UploadFileItem
                                          | undefined;
                                        if (
                                          (uploadableFile = fileList?.find?.(
                                            (el) =>
                                              el.FileName === thisFile?.name
                                          ))
                                        ) {
                                          await retryUpload(uploadableFile.uid);
                                          return;
                                        }
                                        if (
                                          thisFile?.name &&
                                          thisFile.size > 0
                                        ) {
                                          await addFiles([thisFile]);
                                        }
                                      } catch (error) {
                                        toast(t("Failed to upload file"));
                                        console.error(error);
                                      }
                                    }}
                                  />
                                  <FormControl>
                                    <input
                                      {...field}
                                      className="hidden"
                                      type="text"
                                    />
                                  </FormControl>

                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="p-1"></div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  key="submit"
                                  ref={submitRef}
                                  // variant={'ghost'}
                                  type="submit"
                                  disabled={
                                    loading || form.formState.isSubmitting
                                  }
                                >
                                  <MdOutlineTranslate />
                                  {loading ? t("Loading") + "..." : t("Translate")}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                {t("Press Alt + Enter to submit")}
                              </TooltipContent>
                            </Tooltip>
                            <div className="p-1"></div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  disabled={ttsLoading || !form.getValues("text")}
                                  onClick={() => handleTTS(form.getValues("text"))}
                                >
                                  <MdVolumeUp />
                                  {ttsLoading && <Cursor />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                {t("Text-to-Speech")}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="p-1"></div>
                          <div
                          className="relative"
                          >
                            <FormField
                              control={form.control}
                              name="text"
                              render={({ field }) => (
                                <FormItem>
                                  {/* <FormLabel>翻译文本</FormLabel> */}
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      className="h-60 text-base 2xl:text-lg"
                                      placeholder={
                                        t("Enter Japanese text here\nExample: こんにちは、元気ですか？\nAlt + Q to focus input")
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {/* 高亮遮罩层 */}
                          {highlightPosition && (
                            <div className="absolute left-0 top-0 inset-0 pointer-events-none z-20">
                              <TextHighlightMask
                                text={form.getValues("text") || ""}
                                position={highlightPosition}
                              />
                            </div>
                          )}
                          </div>

                          
                          {fileList?.length > 0 && (
                            <div className="px-12 py-8">
                              <Carousel>
                                <CarouselContent className="">
                                  {fileList.map((file) => {
                                    return (
                                      <CarouselItem className="">
                                        <Card className="p-1 px-0">
                                          <CardContent className="p-1">
                                            <div className="flex justify-end gap-1 pb-1">
                                              <Badge variant={"outline"}>
                                                {file.status}
                                              </Badge>

                                              <Button
                                                size={"sm"}
                                                variant={"ghost"}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  if (!file?.uid) return;
                                                  removeFile(file?.uid);
                                                }}
                                              >
                                                <MdDelete />
                                              </Button>
                                            </div>

                                            <img
                                              className="h-full object-cover"
                                              src={file.URL}
                                              alt={file?.FileName}
                                            />
                                          </CardContent>
                                        </Card>
                                      </CarouselItem>
                                    );
                                  })}
                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext />
                              </Carousel>
                            </div>
                          )}
                        </div>
                      </div>
                    </ResizablePanel >
                    <ResizableHandle withHandle />
                    <ResizablePanel>
                      <div className="">
                        <div className="relative h-[calc(100vh-121px)]">
                          {loading && (
                            <div className="absolute top-4 right-4 z-10">
                              <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                          )}
                          <div className="h-full flex flex-col bg-card rounded-lg">
                            {translation || loading ? (
                              <>
                                <div className="p-4  max-h-[40%] overflow-auto">
                                  <div className="flex justify-between items-start">
                                    {translation?.error && (
                                        <div className="bg-amber-50 border-amber-800 border-2 rounded-2xl p-1 pl-2 pr-2 text-amber-800 2xl:text-base">
                                          {translation?.error}
                                        </div>
                                      )}
                                    <div className="inline-flex gap-2 text-foreground 2xl:text-lg">
                                      <Markdown>
                                        {translation?.translation ?? ""}
                                      </Markdown>
                                      <div className="inline-flex items-center gap-2">
                                        {loading && <Cursor />}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex-1 p-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
                                  <AstTokens
                                    ast={translation?.ast}
                                    loading={loading}
                                    onAddToken={(token) => {
                                      if (!token) return;
                                      openModal(token);
                                    }}
                                    onTokenHover={(p) =>
                                      setHighlightPosition(p ?? null)
                                    }
                                    onTokenLeave={() =>
                                      setHighlightPosition(null)
                                    }
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="h-full flex items-center justify-center text-muted-foreground 2xl:text-lg">
                                {t("Translation results will be displayed here")}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>

                {isBrowser() && createPortal(
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
                    ></div>
                  ),
                   document.documentElement
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} title={t("Word")} size="lg">
        <div>{t("Add Word to Vocabulary?")}</div>
        <div className="p-2"></div>
        <div className="flex justify-end gap-2">
          <Button
            disabled={wordCreateLoading}
            onClick={async () => {
              if (!addPendingToken) return;
              await handleWordCreate(addPendingToken);
              closeModal();
            }}
          >
            {wordCreateLoading ? t("Saving...") : t("Yes")}
          </Button>
          <Button variant="secondary" onClick={() => closeModal()}>
            {t("No")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// 文本高亮遮罩组件
const TextHighlightMask = ({
  text,
  position,
}: {
  text: string;
  position: { start: number; end: number } | null;
}) => {
  if (!text || !position) return null;

  // 获取指定位置的字符
  const highlightedText = text.substring(position.start, position.end);

  // 计算前面的文本
  const beforeText = text.substring(0, position.start);

  // 计算后面的文本
  const afterText = text.substring(position.end);

  return (
    <div className="w-full h-full p-0">
      <div className="w-full h-full bg-transparent">
        {/* 使用绝对定位来覆盖textarea */}
        <div className="absolute inset-0 py-1.5 px-3 pointer-events-none">
          {/* 隐藏的textarea用于测量尺寸 */}
          <Textarea
            readOnly
            value={text}
            className="absolute inset-0 bg-transparent opacity-0 whitespace-pre-wrap break-words resize-none pointer-events-none"
            style={{
              fontFamily: "inherit",
              fontSize: "inherit",
              lineHeight: "inherit",
              width: "100%",
              height: "100%",
            }}
          />

          {/* 高亮遮罩 */}
          <div className="relative w-full h-full text-base  md:text-sm">
            <div className="absolute inset-0 p-0 whitespace-pre-wrap break-words leading-normal">
              {/* 前面的文本 */}
              <span className="text-transparent inset-0 p-0 text-base  md:text-sm">{beforeText}</span>

              {/* 高亮部分 */}
              <motion.span
                className="bg-red-100 text-red-800 text-base md:text-sm 2xl:text-base border-none bg-opacity-50 rounded px-0 py-0 inline-block align-baseline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {highlightedText}
              </motion.span>

              {/* 后面的文本 */}
              <span className="text-transparent inset-0 p-0 text-base  md:text-sm">{afterText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export const HydrateFallback = HydrateFallbackTemplate
export default App;
