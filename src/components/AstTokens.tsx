import { type AST, type Token } from "../types/jp_ast";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Cursor } from "./Cursor";
import { TypewriterText } from "./TypewriterText";
import { cn } from "@/lib/utils";

interface AstTokensProps {
  ast?: AST;
  loading?: boolean;
  onClick?: (ast?: Token) => void;
  onTokenClick?: (token?: Token) => void;
  onAddToken?: (token?: Token) => void;
  onTokenHover?: (position?: { start: number; end: number }) => void;
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
  onHover?: (position?: { start: number; end: number }) => void;
  onLeave?: () => void;
}> = ({ token, onClick, onAdd, onHover, onLeave }) => {
  return (
    <div className="inline-flex flex-col">
      <div
        onClick={() => onClick?.(token)}
        onMouseEnter={() => token.position && onHover?.(token.position)}
        onMouseLeave={() => onLeave?.()}
        className="inline-flex items-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 min-h-[3rem]"
        tabIndex={0}
        role="button"
        aria-label={`Token: ${token.word}`}
      >
        {/* Token word */}
        <div className="flex-shrink-0 mr-4">
          <span className="text-gray-900 dark:text-gray-100 font-semibold text-base select-text">
            {token.word}
          </span>
        </div>
        
        {/* Token badges */}
        <div className="flex flex-wrap gap-2 items-center flex-1">
          {token.lemma && (
            <Badge
              key={token.lemma}
              variant="outline"
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105",
                getBadgeColorClass('lemma')
              )}
            >
              <TypewriterText text={`原型: ${token.lemma}`} />
            </Badge>
          )}
          {token.inflection && (
            <Badge
              key={token.inflection}
              variant="outline"
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105",
                getBadgeColorClass('inflection')
              )}
            >
              <TypewriterText text={`変形: ${token.inflection}`} />
            </Badge>
          )}
          {(token.pos ?? []).map((pos) => (
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
          {token.meaning && (
            <Badge
              key={token.meaning}
              variant="outline"
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105",
                getBadgeColorClass('meaning')
              )}
            >
              <TypewriterText text={`意味: ${token.meaning}`} />
            </Badge>
          )}
          {token.kana && (
            <Badge
              key={token.kana}
              variant="outline"
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105",
                getBadgeColorClass('kana')
              )}
            >
              <TypewriterText text={`仮名: ${token.kana}`} />
            </Badge>
          )}
        </div>

        {/* Add button */}
        <div className="flex-shrink-0 ml-3">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.(token);
            }} 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg"
            aria-label="Add token to vocabulary"
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
  if (!ast) return null;

  return (
    <div className="flex flex-col gap-4 p-1">
      {/* Display current level tokens */}
      {ast.tokens && (
        <div className="flex flex-wrap gap-4 items-start justify-start">
          {ast.tokens.map((token, index) => (
            <AstToken
              key={token.word ?? index}
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
          ))}
        </div>
      )}

      {/* Recursively display child nodes */}
      {ast.children && ast.children.length > 0 && (
        <div className="flex flex-col ml-8 pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
          {ast.children.map((child, index) => (
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
              {index < (ast.children ?? []).length - 1 && (
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
          <span className="font-medium">解析中...</span>
        </div>
      )}
    </div>
  );
};
