export interface Position {
  start: number; // Start character offset in the original sentence
  end: number;   // End character offset in the original sentence
}

export interface Token {
  word: string; // 单词或短语
  pos: string[]; // 词性
  meaning: string | null; //词的含义
  kana: string | null; //词的含义
  lemma: string | null; // 词的原型（如果有的话）
  inflection: string | null; // 词的变形（如果有的话）
  position?: Position; // Source code position information
}

export interface AST {
  type: "sentence" | "clause"; // 节点类型，表示是句子还是子句
  tokens?: Token[]; // 句子或子句中的词或短语
  children?: AST[]; // 子句的递归结构
}

export type TranslationResult = {

  sentence?: string; // 原始句子
  translation?: string; // 翻译后的句子
  ast?: AST; // 抽象语法树（AST）结构
  error?: string;
}