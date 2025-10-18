import { useState } from "react";
import { useRequest } from "ahooks";
import { Toast } from "~/components/ToastCompat";
import { useTranslation } from "react-i18next";

import type { Token, TranslationResult } from "~/types/jp_ast";
import { alovaInstance } from "~/utils/request";
import { generatePositionInfo, convertTokenToOriginalFormat } from "../utils";

export function useTranslationSubmission() {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [bufferedTranslation, setBufferedTranslation] = useState<TranslationResult | null>(null);

  const { runAsync: handleWordCreate, loading: wordCreateLoading } = useRequest(
    async (word: Token) => {
      if (!bufferedTranslation) return;
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

  const { runAsync: handleTTS, loading: ttsLoading } = useRequest(
    async (text: string) => {
      if (!text || ttsLoading) return;

      try {
        const audioBlob = await alovaInstance.Post<Blob>("/api/tts", {
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

  return {
    loading,
    setLoading,
    bufferedTranslation,
    setBufferedTranslation,
    handleWordCreate,
    wordCreateLoading,
    handleTTS,
    ttsLoading,
    generatePositionInfo,
  };
}