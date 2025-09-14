import { type AST, type Token } from "../types/jp_ast";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Cursor } from "./Cursor";
import { TypewriterText } from "./TypewriterText";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface AstTokensProps {
  ast?: AST;
  loading?: boolean;
  onClick?: (ast?: Token) => void;
  onTokenClick?: (token?: Token) => void;
  onAddToken?: (token?: Token) => void;
  onTokenHover?: (position?: { s: number; e: number }) => void;
  onTokenLeave?: () => void;
}

// Badge color classes for different token types
const getBadgeColorClass = (type: 'pos' | 'lemma' | 'inflection' | 'meaning' | 'kana') => {
  const colorClasses = {
    pos: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700',
    lemma: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 border-green-200 dark:border-green-700',
    inflection: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-700',
    meaning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700',
    kana: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 border-red-200 dark:border-red-700'
  };
  return colorClasses[type] || '';
};

export const AstToken: React.FC<{
  token: Token;
  onClick?: (ast?: Token) => void;
  onAdd?: (token?: Token) => void;
  onHover?: (position?: { s: number; e: number }) => void;
  onLeave?: () => void;
}> = ({ token, onClick, onAdd, onHover, onLeave }) => {
 const { t } = useTranslation();
 return (
    <div className="inline-flex flex-col">
      <div
        onClick={() => onClick?.(token)}
        onMouseEnter={() => token.po && onHover?.(token.po)}
        onMouseLeave={() => onLeave?.()}
        className="bg-"
        aria-label={`Token: ${token.w}`}
      >
        {/* Token word */}
        <div className="flex-shrink-0 mr-4">
          <h6 className="text-gray-800 dark:text-gray-100 font-semibold text-base select-text">
            {token.w}
          </h6>
        </div>
        <div
        className="p-1"
        ></div>
        {/* Token badges */}
        <div className="flex flex-wrap gap-2 gap-y-1 items-center flex-1">
          {token.l && (
            <Badge
              key={`lemma-${token.l}`}
              variant="outline"
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105",
                getBadgeColorClass('lemma')
              )}
            >
              <TypewriterText text={t('Lemma: {{lemma}}', { lemma: token.l })} />
            </Badge>
          )}
          {token.i && (
            <Badge
              key={`inflection-${token.i}`}
              variant="outline"
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105",
                getBadgeColorClass('inflection')
              )}
            >
              <TypewriterText text={`${token.i}`} />
            </Badge>
          )}
          {(token.p ?? []).map((pos) => (
            <Badge
              key={pos}
              variant="outline"
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105",
                getBadgeColorClass('pos')
              )}
            >
              <TypewriterText text={pos} />
            </Badge>
          ))}
          {token.m && (
            <Badge
              key={`meaning-${token.m}`}
              variant="outline"
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105",
                getBadgeColorClass('meaning')
              )}
            >
              <TypewriterText text={t('Meaning: {{meaning}}', { meaning: token.m })} />
            </Badge>
          )}
          {token.k && (
            <Badge
              key={`kana-${token.k}`}
              variant="outline"
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105",
                getBadgeColorClass('kana')
              )}
            >
              <TypewriterText text={t('Kana: {{kana}}', { kana: token.k })} />
            </Badge>
          )}
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault()
              onAdd?.(token);
            }} 
            variant="ghost" 
            size="sm"
            className=""
            aria-label={t('Add token to vocabulary')}
          >
            <span className="text-sm font-bold">+</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export const AstTokens: React.FC<AstTokensProps> = ({
  ast,
  loading,
  onTokenClick,
  onClick,
  onAddToken,
  onTokenHover,
  onTokenLeave,
}) => {
 const { t } = useTranslation();
 if (!ast) return null;

  return (
    <div className="flex flex-col gap-4 p-1">
      {/* Display current level tokens */}
      {ast.tk && (
        <div className="flex flex-wrap gap-4 items-start justify-start">
          {ast.tk.map((token, index) => (<div
          className="py-2"
          >
          <AstToken
              key={token.w ?? index}
              onClick={(token) => {
                onTokenClick?.(token);
                onClick?.(token);
              }}
              onAdd={(token) => {
                onAddToken?.(token);
              }}
              onHover={onTokenHover}
              onLeave={onTokenLeave}
              token={token}
            />
          </div>
            
          ))}
        </div>
      )}

      {/* Recursively display child nodes */}
      {ast.c && ast.c.length > 0 && (
        <div className="flex flex-col ml-8 pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
          {ast.c.map((child, index) => (
            <div key={index} className="flex flex-col">
              <AstTokens
                ast={child}
                onTokenClick={onTokenClick}
                onClick={onClick}
                onAddToken={onAddToken}
                onTokenHover={onTokenHover}
                onTokenLeave={onTokenLeave}
              />
              {/* Add separator between child nodes */}
              {index < (ast.c ?? []).length - 1 && (
                <div className="my-6">
                  <Separator className="bg-gray-200 dark:bg-gray-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 justify-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
          <Cursor />
          <span className="font-medium">{t('Analyzing...')}</span>
        </div>
      )}
    </div>
  );
};
