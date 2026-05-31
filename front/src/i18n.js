import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "support": "Support",
      "heroTitle": "Download Video in <1>Seconds</1>",
      "heroSubtitle": "Paste your link below and save video in high quality.",
      "pasteLink": "Paste video link here...",
      "download": "Download",
      "supported": "Supported more than 100 services",
      "extractError": "Failed to get video info",
      "downloadError": "Download failed",
      "saved": "Saved successfully",
      "openFolder": "Show in folder",
      "featSitesTitle": "100+ services",
      "featSitesDesc": "YouTube, TikTok, Instagram and dozens more",
      "featPrivateTitle": "Local & private",
      "featPrivateDesc": "Everything runs on your machine, no servers",
      "featQualityTitle": "Top quality",
      "featQualityDesc": "Up to 4K, video and audio in one file",
      "featFreeTitle": "Free",
      "featFreeDesc": "No ads, no sign-up, no limits",
      "footerText": "© {{year}} sfloader - Best Video Downloader",
      "donateTitle": "Support the Project",
      "donateSubtitle": "If you find sfloader useful, consider supporting its development. Every contribution helps!",
      "donateVia": "Donate via",
      "back": "Back",
      "copy": "Copy",
      "copied": "Copied!",
    }
  },
  ru: {
    translation: {
      "support": "Поддержка",
      "heroTitle": "Скачивай Видео за <1>Секунды</1>",
      "heroSubtitle": "Вставь ссылку ниже и сохрани видео в высоком качестве.",
      "pasteLink": "Вставьте ссылку на видео...",
      "download": "Скачать",
      "supported": "Поддерживается более 100 сервисов",
      "extractError": "Не удалось получить информацию о видео",
      "downloadError": "Ошибка загрузки",
      "saved": "Успешно сохранено",
      "openFolder": "Показать в папке",
      "featSitesTitle": "100+ сервисов",
      "featSitesDesc": "YouTube, TikTok, Instagram и десятки других",
      "featPrivateTitle": "Локально и приватно",
      "featPrivateDesc": "Всё работает на вашем компьютере, без серверов",
      "featQualityTitle": "Лучшее качество",
      "featQualityDesc": "До 4K, видео и звук в одном файле",
      "featFreeTitle": "Бесплатно",
      "featFreeDesc": "Без рекламы, регистрации и ограничений",
      "footerText": "© {{year}} sfloader - Лучший загрузчик видео",
      "donateTitle": "Поддержать проект",
      "donateSubtitle": "Если sfloader оказался полезным, вы можете поддержать его разработку. Каждый вклад помогает!",
      "donateVia": "Отправить через",
      "back": "Назад",
      "copy": "Копировать",
      "copied": "Скопировано!",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
