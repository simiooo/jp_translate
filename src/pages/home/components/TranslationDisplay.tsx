import { Cursor } from "~/components/Cursor";
import { AstTokens } from "~/components/AstTokens";
import Markdown from "react-markdown";
import { useTranslation } from "react-i18next";

import type { TranslationResult, Token } from "~/types/jp_ast";
import { ScrollArea } from "~/components/ui/scroll-area";

interface TranslationDisplayProps {
  translation: TranslationResult | null;
  loading: boolean;
  onAddToken: (token?: Token) => void;
  onTokenHover: (position?: { s: number; e: number }) => void;
  onTokenLeave: () => void;
}

export function TranslationDisplay({
  translation,
  loading,
  onAddToken,
  onTokenHover,
  onTokenLeave,
}: TranslationDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className="relative h-full">
      <div className="h-full flex flex-col">
        {translation || loading ? (
          <>
            <div className="p-4 max-h-1/4 shrink">
              <ScrollArea className="">
                <div className="flex justify-between items-start">
                  {translation?.error && (
                    <div className="bg-amber-50 border-amber-800 border-2 rounded-2xl p-1 pl-2 pr-2 text-amber-800 2xl:text-base">
                      {translation?.error}
                    </div>
                  )}
                  <div className="inline-flex gap-2 text-foreground 2xl:text-lg">
                    <Markdown>{translation?.t ?? ""}</Markdown>
                    <div className="inline-flex items-center gap-2">
                      {loading && <Cursor />}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
            <ScrollArea className="p-4 flex-3 min-h-0">
              <AstTokens
                  ast={translation?.a}
                  loading={loading}
                  onAddToken={onAddToken}
                  onTokenHover={onTokenHover}
                  onTokenLeave={onTokenLeave}
                />
            </ScrollArea>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground 2xl:text-lg">
            {t("Translation results will be displayed here")}
          </div>
        )}
      </div>
    </div>
  );
}
