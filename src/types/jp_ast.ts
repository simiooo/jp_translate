export type POS = "adverb" | "conjunction" | "verb" | "adjective" | "numeral" | "particle" | "fixed_phrase" | "other";

export interface Token {
  word: string; // 单词或短语
  pos: POS; // 词性
  lemma: string | null; // 词的原型（如果有的话）
  inflection: string | null; // 词的变形（如果有的话）
}

export interface AST {
  type: "sentence" | "clause"; // 节点类型，表示是句子还是子句
  tokens?: Token[]; // 句子或子句中的词或短语
  children?: AST[]; // 子句的递归结构
}

export interface TranslationResult {
  sentence?: string; // 原始句子
  translation?: string; // 翻译后的句子
  ast?: AST; // 抽象语法树（AST）结构
}