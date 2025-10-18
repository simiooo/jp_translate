import { Cursor } from "~/components/Cursor";
import { AstTokens } from "~/components/AstTokens";
import { Skeleton } from "~/components/ui/skeleton";
import Markdown from "react-markdown";
import { useTranslation } from "react-i18next";

import type { TranslationResult, Token } from "~/types/jp_ast";

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
    <div className="relative h-[calc(100vh-121px)]">
      {loading && (
        <div className="absolute top-4 right-4 z-10">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      )}
      <div className="h-full flex flex-col bg-card rounded-lg">
        {translation || loading ? (
          <>
            <div className="p-4 max-h-[40%] overflow-auto">
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
                onAddToken={onAddToken}
                onTokenHover={onTokenHover}
                onTokenLeave={onTokenLeave}
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
  );
}