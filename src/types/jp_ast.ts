export interface Position {
  s: number; // Start character offset in the original sentence
  e: number;   // End character offset in the original sentence
}

export interface Token {
  w: string; // 单词或短语
  p: string[]; // 词性
  m: string | null; //词的含义
  k: string | null; //词的含义
  l: string | null; // 词的原型（如果有的话）
  i: string | null; // 词的变形（如果有的话）
  po?: Position; // Source code position information
}

export interface AST {
  ty: "sentence" | "clause"; // 节点类型，表示是句子还是子句
  tk?: Token[]; // 句子或子句中的词或短语
  c?: AST[]; // 子句的递归结构
}

export type TranslationResult = {

  s?: string; // 原始句子
  t?: string; // 翻译后的句子
  a?: AST; // 抽象语法树（AST）结构
  error?: string;
}