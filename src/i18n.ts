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

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize i18n with conditional language detection
const initI18n = async () => {
  if (isBrowser) {
    // Browser environment - use language detector
    await i18n
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
        },
        
        // Ensure consistent language detection for SSR
        react: {
          useSuspense: false,
          bindI18n: 'languageChanged',
          bindI18nStore: 'added removed'
        }
      });
  } else {
    // Server environment - use fallback language
    await i18n
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
        lng: 'en', // Force English on server
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',
        
        interpolation: {
          escapeValue: false // React already safes from XSS
        },
        
        react: {
          useSuspense: false,
          bindI18n: 'languageChanged',
          bindI18nStore: 'added removed'
        }
      });
  }
};

// Initialize i18n
initI18n();

export default i18n;