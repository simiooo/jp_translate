import type { Token, AST } from "~/types/jp_ast";

export function shouldRemoveWSCharacter(text?: string): boolean {
  if (!text) return false;
  if (text.length < 5) return false;
  const breakCharacterLength = text.split('').filter(c => c === '\n').length;
  return breakCharacterLength / text.length > 1 / 4;
}

export function normanizeText(text?: string): string | undefined {
  return text?.replaceAll(/[\s\n]+/g, "");
}

export function generatePositionInfo(
  sourceText: string,
  ast?: AST
): AST | undefined {
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
}

export function convertTokenToOriginalFormat(token: Token) {
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
}