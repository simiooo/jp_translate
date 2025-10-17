import { useEffect, useRef, useState } from "react";
import type { Token, TranslationResult, AST } from "../types/jp_ast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jsonrepair } from "jsonrepair";
import {
  type TranslationFormData,
  translationFormSchema,
} from "../schemas/translation";
import { Toast } from "../components/ToastCompat";
import { MdAutoFixHigh } from "react-icons/md";
import {
  useAntdTable,
  useDebounceFn,
  useKeyPress,
  useRequest,
  useResponsive,
  useThrottle,
} from "ahooks";
import { Cursor } from "../components/Cursor";
import { AstTokens } from "../components/AstTokens";
import { IoImageOutline } from "react-icons/io5";
import { createPortal } from "react-dom";
import Markdown from "react-markdown";
import {
  alovaInstance,
  alovaBlobInstance,
  createSSEStream,
  EventData,
} from "~/utils/request";
import { PaginatedResponse, TranslationRecord } from "~/types/history";
import { HistorySidebar } from "../components/HistorySidebar";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import TextHighlightMask from "~/components/TextHighlightMask";
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
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { isBrowser } from "~/utils/ssr";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import { useTranslation } from "react-i18next";

function shouldRemoveWSCharacter(text?: string): boolean {
  if (!text) return false;
  if (text.length < 5) return false;
  const breakCharacterLength = text.split('').filter(c => c === '\n').length
  return breakCharacterLength / text.length > 1 / 4;
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

  // 高亮状态
  const [highlightPosition, setHighlightPosition] = useState<{
    s: number;
    e: number;
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
  const normanizeText = (text?: string) => {
    return text?.replaceAll(/[\s\n]+/g, "");
  };
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
    form.setValue(
      "imgURL",
      file?.ObjectKey
        ? `${location.origin}/api/files/${file?.ObjectKey}`
        : undefined
    );
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

  const translation = useThrottle<TranslationResult | null>(
    bufferedTranslation,
    {
      wait: 1000,
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
  const pending_translate_text = form.watch("text");
  
  const { run: checkWhitespaceDebounced } = useDebounceFn(
    (text: string) => {
      if (shouldRemoveWSCharacter(text)) {
        toast(t("Whitespace detected"), {
          description: t("Your text contains excessive whitespace"),
          position:"top-center",
          action: {
            label: t("Format now"),
            onClick: () => {
              const normalizedText = normanizeText(text);
              form.setValue("text", normalizedText ?? "");
              toast.success(t("Text formatted successfully"));
            },
          },
        });
      }
    },
    { wait: 1000 }
  );

  useEffect(() => {
    checkWhitespaceDebounced(pending_translate_text);
  }, [pending_translate_text, checkWhitespaceDebounced]);
  // 生成位置信息的函数
  const generatePositionInfo = (
    sourceText: string,
    ast?: AST
  ): AST | undefined => {
    if (!ast || !sourceText) return ast;

    // 递归处理 AST 节点
    const processNode = (node: AST): AST => {
      const processedNode: AST = { ...node };

      // 处理当前节点的 tokens
      if (node.tk && node.tk.length > 0) {
        processedNode.tk = node.tk.map((token: Token, index: number, tokens: Token[]) => {
          const processedToken: Token = { ...token };
          
          // 获取当前 token 的文本
          const tokenText = token.w;
          if (tokenText) {
            // 计算前面所有 token 的总长度
            const previousTokensLength = tokens.slice(0, index).reduce((sum, prevToken) => {
              return sum + (prevToken.w?.length || 0);
            }, 0);
            
            // 设置位置信息
            processedToken.po = {
              s: previousTokensLength,
              e: previousTokensLength + tokenText.length
            };
          }
          
          return processedToken;
        });
      }

      // 递归处理子节点
      if (node.c && node.c.length > 0) {
        processedNode.c = node.c.map((childNode: AST) => processNode(childNode));
      }

      return processedNode;
    };

    return processNode(ast);
  };

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
                    
                    // 生成位置信息
                    if (translationData.a) {
                      translationData.a = generatePositionInfo(
                        form.getValues("text") || "",
                        translationData.a
                      );
                    }
                    
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
                historyLoad(
                  { current: 1, pageSize: PAGE_SIZE },
                  { init: true }
                );
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

  // Convert compressed token keys back to original format for API compatibility
  const convertTokenToOriginalFormat = (token: Token) => {
    return {
      word: token.w,
      pos: token.p,
      meaning: token.m,
      kana: token.k,
      lemma: token.l,
      inflection: token.i,
      position: token.po ? {
        start: token.po.s,
        end: token.po.e
      } : undefined
    };
  };

  const { runAsync: handleWordCreate, loading: wordCreateLoading } = useRequest(
    async (word: Token) => {
      if (!translation) return;
      try {
        const originalFormatWord = convertTokenToOriginalFormat(word);
        const res = await alovaInstance.Post<{
          [key: string]: string | number | undefined;
          code?: number;
        }>("/api/words", { ...originalFormatWord, pos: originalFormatWord?.pos?.join });
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
            await historyLoad(
              { current: nextPage, pageSize: PAGE_SIZE },
              undefined
            );
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
                  <ResizablePanelGroup
                    className=""
                    direction={
                      (responsiveInfo?.["xs"] ||
                        (responsiveInfo?.["sm"] && responsiveInfo?.["md"])) &&
                      !responsiveInfo["lg"]
                        ? "vertical"
                        : "horizontal"
                    }
                  >
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant={"ghost"}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const text = normanizeText(
                                      form.getValues("text")
                                    );
                                    form.setValue("text", text ?? "");
                                  }}
                                >
                                  <MdAutoFixHigh />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                {t("Format Text")}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={
                                    ttsLoading || !form.getValues("text")
                                  }
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleTTS(form.getValues("text"));
                                  }}
                                >
                                  <MdVolumeUp />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                {t("Text-to-Speech")}
                              </TooltipContent>
                            </Tooltip>
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
                                  {loading
                                    ? t("Loading") + "..."
                                    : t("Translate")}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                {t("Press Alt + Enter to submit")}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="p-1"></div>
                          <div className="relative">
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
                                      placeholder={t(
                                        "Enter Japanese text here\nExample: こんにちは、元気ですか？\nAlt + Q to focus input"
                                      )}
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
                    </ResizablePanel>
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
                                        {translation?.t ?? ""}
                                      </Markdown>
                                      <div className="inline-flex items-center gap-2">
                                        {loading && <Cursor />}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex-1 p-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 md:h-[calc((100vh-121px)/2)]">
                                  <AstTokens
                                    ast={translation?.a}
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
                                {t(
                                  "Translation results will be displayed here"
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>

                {isBrowser() &&
                  createPortal(
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

export const HydrateFallback = HydrateFallbackTemplate;
export default App;
