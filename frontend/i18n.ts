import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  // i18next-http-backend
  // loads translations from your server
  // https://github.com/i18next/i18next-http-backend
  .use(Backend)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Add supported languages here
    supportedLngs: ['en', 'hi'],
    // Disable loading of resources in the default language (en)
    // since we've already loaded them in the HTML
    load: 'languageOnly',
    // Don't use a suffix for the default language
    // So that /locales/en/translation.json will be loaded for 'en'
    // instead of /locales/en-US/translation.json
    nonExplicitSupportedLngs: false,
    // Don't use a suffix for the default language
    // So that /locales/en/translation.json will be loaded for 'en'
    // instead of /locales/en/translation.json
    loadCurrentLocale: true,
  });

export default i18n;
