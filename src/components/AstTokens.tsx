import { type AST, type Token } from "../types/jp_ast";
import { Button } from "./Button";
import { Cursor } from "./Cursor";
import { Tag } from "./Tag";

interface AstTokensProps {
  ast?: AST;
  loading?: boolean;
  onClick?: (ast?: Token) => void;
  onTokenClick?: (token?: Token) => void;
  onAddToken?: (token?: Token) => void;
}

export const AstToken: React.FC<{
  token: Token;
  onClick?: (ast?: Token) => void;
  onAdd?: (token?: Token) => void;
}> = ({ token, onClick, onAdd }) => {
  return (
    <div className="inline-flex flex-col gap-2">
      <div
        onClick={() => onClick?.(token)}
        className="inline-flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
      >
        <span className="text-gray-900 dark:text-gray-100 font-medium">{token.word}</span>
        <div className="flex gap-2 ml-2">
          <Tag key={token.pos} type="pos" label={token.pos} />
          {token.lemma && <Tag type="lemma" key={token.lemma} label="原型" value={token.lemma} />}
          {token.inflection && (
            <Tag type="inflection" label="変形" key={token.inflection} value={token.inflection} />
          )}
          {token.meaning && (
            <Tag key={token.meaning} type="meaning" label="意味" value={token.meaning} />
          )}
          {token.kana && <Tag key={token.kana} type="kana" label="仮名" value={token.kana} />}
        </div>

        <div className="pl-2"></div>

        <div>
          <Button 
          onClick={() => onAdd?.(token)} variant="link" size="sm">
            +
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
}) => {
  if (!ast) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* 显示当前层级的 tokens */}
      {ast.tokens && (
        <div className="flex flex-wrap gap-3 items-start">
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
              token={token}
            />
          ))}
        </div>
      )}

      {/* 递归显示子节点 */}
      {ast.children && ast.children.length > 0 && (
        <div className="flex ml-4 pl-4">
          {ast.children.map((child, index) => (
            <>
              <AstTokens key={index} ast={child} />
              {/* 在非最后一个子节点后添加分隔符 */}
              {index < (ast.children ?? []).length - 1 && (
                <div className="my-8 border-b border-gray-200 dark:border-gray-700" />
              )}
            </>
          ))}
        </div>
      )}
      {loading && <Cursor />}
    </div>
  );
};
