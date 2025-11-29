// Word statistics types based on WORD.md API documentation

export interface WordStat {
  word: string;
  lemma: string | null;
  pos: string;
  count: number;
  write_count: number;
  kana?: string;
  meaning?: string;
  inflection?: string;
}

export interface LemmaStat {
  lemma: string;
  pos: string;
  count: number;
  write_count: number;
  kana?: string;
  meaning?: string;
}

export interface UserTopWordsResponse {
  period: string;
  limit: number;
  top_words: WordStat[];
}

export interface UserTopLemmasResponse {
  period: string;
  limit: number;
  top_lemmas: LemmaStat[];
}

export interface GlobalTopWordsResponse {
  period: string;
  limit: number;
  top_words: WordStat[];
}

export interface GlobalTopLemmasResponse {
  period: string;
  limit: number;
  top_lemmas: LemmaStat[];
}

export type PeriodType = 'day' | 'week' | 'month' | 'year';