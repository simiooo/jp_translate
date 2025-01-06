import { type AST, type Token } from '../types/jp_ast'
import { Tag } from './Tag'

interface AstTokensProps {
  ast?: AST
  loading?: boolean
}

export const AstToken: React.FC<{ token: Token }> = ({ token }) => {
  return (
    <div className="inline-flex flex-col gap-2">
      <div className="inline-flex items-center bg-gray-50 rounded-lg p-2 shadow-sm hover:bg-gray-100 transition-colors duration-200">
        <span className="text-gray-900 font-medium">
          {token.word}
        </span>
        <div className="flex gap-2 ml-2">
          <Tag type="pos" label={token.pos} />
          {token.lemma && (
            <Tag type="lemma" label="原型" value={token.lemma} />
          )}
          {token.inflection && (
            <Tag type="inflection" label="変形" value={token.inflection} />
          )}
          {token.meaning && (
            <Tag type="meaning" label="意味" value={token.meaning} />
          )}
          {token.kana && (
            <Tag type="kana" label="仮名" value={token.kana} />
          )}
        </div>
      </div>
    </div>
  )
}

export const AstTokens: React.FC<AstTokensProps> = ({ ast, loading }) => {
  if (!ast) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* 显示当前层级的 tokens */}
      {ast.tokens && (
        <div className="flex flex-wrap gap-3 items-start">
          {ast.tokens.map((token, index) => (
            <AstToken key={index} token={token} />
          ))}
        </div>
      )}
      
      {/* 递归显示子节点 */}
      {ast.children && ast.children.length > 0 && (
        <div className="ml-4 pl-4">
          {ast.children.map((child, index) => (
            <>
              <AstTokens key={index} ast={child} />
              {/* 在非最后一个子节点后添加分隔符 */}
              {index < (ast.children ?? []).length - 1 && (
                <div className="my-8 border-b border-gray-200" />
              )}
            </>
          ))}
        </div>
      )}
    </div>
  )
} 