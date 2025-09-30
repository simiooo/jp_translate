import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en/translation.json';
import zhTranslation from './locales/zh/translation.json';
import jaTranslation from './locales/ja/translation.json';

// Import existing POS translations
import enPos from '../locales/en-US/pos.json';
import zhPos from '../locales/zh-CN/pos.json';
import jaPos from '../locales/ja/pos.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
        pos: enPos.pos
      },
      zh: {
        translation: zhTranslation,
        pos: zhPos.pos
      },
      ja: {
        translation: jaTranslation,
        pos: jaPos.pos
      }
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React already safes from XSS
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;