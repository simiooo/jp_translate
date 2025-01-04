import Dexie, { Table } from 'dexie';

export interface TranslationHistory {
  id?: number;
  sourceText: string;
  translation: string;
  timestamp: Date;
  ast: any;
}

export class TranslationDatabase extends Dexie {
  translations!: Table<TranslationHistory>;

  constructor() {
    super('TranslationDB');
    this.version(1).stores({
      translations: '++id, timestamp'
    });
  }
}

export const db = new TranslationDatabase(); 