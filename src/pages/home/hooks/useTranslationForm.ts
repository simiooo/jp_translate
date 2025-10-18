import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceFn } from "ahooks";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import {
  type TranslationFormData,
  translationFormSchema,
} from "~/schemas/translation";
import { shouldRemoveWSCharacter, normanizeText } from "../utils";

export function useTranslationForm() {
  const { t } = useTranslation();
  
  const [highlightPosition, setHighlightPosition] = useState<{
    s: number;
    e: number;
  } | null>(null);

  const form = useForm<TranslationFormData>({
    resolver: zodResolver(translationFormSchema),
    defaultValues: {
      text: "",
      sourceLanguage: "ja",
      imgURL: "",
    },
  });

  const pending_translate_text = form.watch("text");

  const { run: checkWhitespaceDebounced } = useDebounceFn(
    (text: string) => {
      if (shouldRemoveWSCharacter(text)) {
        toast(t("Whitespace detected"), {
          description: t("Your text contains excessive whitespace"),
          position: "top-center",
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

  return {
    form,
    highlightPosition,
    setHighlightPosition,
    pending_translate_text,
    checkWhitespaceDebounced,
    normanizeText,
  };
}