export type LanguageCode = 'ja' | 'zh' | 'en' | 'es'; // 可以根据需要扩展


// 分页响应的类型
export interface PaginatedResponse {
  limit: number; // 每页数量
  page: number; // 当前页码
  pages: number; // 总页数
  total: number; // 总记录数
}

export interface TranslationRecord {
  created_at: string;
  id: number;
  source_lang: LanguageCode;
  source_text: string;
  target_lang: LanguageCode;
  translated_text: string;
}
