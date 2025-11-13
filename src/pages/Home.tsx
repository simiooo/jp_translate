import { useEffect, useMemo } from "react";
import { useThrottle, useKeyPress, useResponsive } from "ahooks";
import { jsonrepair } from "jsonrepair";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import type { Route } from "./+types/Home";
import type { TranslationResult, Token } from "~/types/jp_ast";
import type { TranslationFormData } from "~/schemas/translation";
import { Toast } from "~/components/ToastCompat";
import { HistorySidebar } from "~/components/HistorySidebar";
import { Modal, useModal } from "~/components/ModalCompat";
import { Button } from "~/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { isElectron } from "~/utils/electron";
import { isBrowser } from "~/utils/ssr";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import { createSSEStream } from "~/utils/request";

import { useTranslationForm } from "./home/hooks/useTranslationForm";
import { useTranslationSubmission } from "./home/hooks/useTranslationSubmission";
import { useTranslationHistory } from "./home/hooks/useTranslationHistory";
import { useFileUpload } from "~/hooks/useFileUpload";
import { TranslationForm } from "./home/components/TranslationForm";
import { TranslationDisplay } from "./home/components/TranslationDisplay";

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
  
  // Hooks
  const {
    form,
    highlightPosition,
    setHighlightPosition,
    pending_translate_text,
    checkWhitespaceDebounced,
    normanizeText,
  } = useTranslationForm();

  const {
    loading,
    setLoading,
    bufferedTranslation,
    setBufferedTranslation,
    handleWordCreate,
    wordCreateLoading,
    handleTTS,
    ttsLoading,
    generatePositionInfo,
  } = useTranslationSubmission();

  const {
    showHistory,
    setShowHistory,
    isHistoryCollapsed,
    setIsHistoryCollapsed,
    history,
    historyRefresh,
    historyLoad,
    PAGE_SIZE,
  } = useTranslationHistory();
  const responsiveInfo = useResponsive()
  // SSR-compatible responsive direction logic
  const getResizableDirection = useMemo(() => {
    if (!responsiveInfo) return "horizontal";
    
    const { xs,sm,md } = responsiveInfo;
    // Use vertical layout for mobile devices (xs and sm breakpoints)
    // Use horizontal layout for larger screens (md, lg, xl, etc.)
    return (!md && (sm || xs)) ? "vertical" : "horizontal";
  }, [responsiveInfo]);

  const {
    isOpen,
    openModal,
    closeModal,
    params: addPendingToken,
  } = useModal();

  const {
    fileList,
    addFiles,
    removeFile,
    retryUpload,
    loading: fileUploadLoading,
  } = useFileUpload({
    maxCount: 1,
  });

  // Effects
  useEffect(() => {
    checkWhitespaceDebounced(pending_translate_text);
  }, [pending_translate_text, checkWhitespaceDebounced]);

  useEffect(() => {
    const [file] = fileList;
    form.setValue(
      "imgURL",
      file?.ObjectKey
        ? `${location.origin}/api/files/${file?.ObjectKey}`
        : undefined
    );
  }, [fileList]);

  // Throttled translation
  const translation = useThrottle<TranslationResult | null>(
    bufferedTranslation,
    {
      wait: 1000,
    }
  );

  // Keyboard shortcuts
  useKeyPress("alt.q", () => {
    form.setFocus("text");
  });

  // Submit handler
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
          onMessage(data: { type: string; data?: { text?: string; message?: string } }) {
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
        {/* 主要内容区域 */}
        <div className="flex-1 min-w-0">
          <ResizablePanelGroup
            className=""
            direction={getResizableDirection}
          >
            <ResizablePanel className="">
              <TranslationForm
                form={form}
                highlightPosition={highlightPosition}
                normanizeText={normanizeText}
                onSubmit={onSubmit}
                loading={loading}
                ttsLoading={ttsLoading}
                handleTTS={handleTTS}
                fileList={fileList}
                addFiles={addFiles}
                removeFile={removeFile}
                retryUpload={retryUpload}
                fileUploadLoading={fileUploadLoading}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel>
              <TranslationDisplay
                translation={translation}
                loading={loading}
                onAddToken={openModal}
                onTokenHover={(position) => setHighlightPosition(position || null)}
                onTokenLeave={() => setHighlightPosition(null)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Word Add Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} title={t("Word")} size="lg">
        <div>{t("Add Word to Vocabulary?")}</div>
        <div className="p-2"></div>
        <div className="flex justify-end gap-2">
          <Button
            disabled={wordCreateLoading}
            onClick={async () => {
              if (!addPendingToken) return;
              await handleWordCreate(addPendingToken as Token);
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

      {/* Loading Portal */}
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
  );
}

export const HydrateFallback = HydrateFallbackTemplate;
export default App;
