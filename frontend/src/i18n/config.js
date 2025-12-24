import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      es: {
        translation: esTranslations,
      },
      fr: {
        translation: frTranslations,
      },
      de: {
        translation: deTranslations,
      },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Check localStorage first, then browser language, then default to 'en'
      order: ['localStorage', 'navigator'],
      // Cache the language in localStorage
      caches: ['localStorage'],
      // Use this key in localStorage
      lookupLocalStorage: 'i18nextLng',
    },
    // Ensure language changes trigger re-renders everywhere
    react: {
      useSuspense: false,
    },
  });

// Ensure language is loaded from localStorage on initialization
const savedLanguage = localStorage.getItem('i18nextLng');
if (savedLanguage && ['en', 'es', 'fr', 'de'].includes(savedLanguage)) {
  i18n.changeLanguage(savedLanguage);
}

export default i18n;

