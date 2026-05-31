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
      "featureFast": "Fast",
      "featureFastDesc": "High-speed processing",
      "featureSecure": "Secure",
      "featureSecureDesc": "No personal data needed",
      "featureMobile": "Mobile",
      "featureMobileDesc": "Works on iOS and Android",
      "footerText": "© {{year}} sfloader - Best Video Downloader",
      "modalTitle": "Contact Us",
      "modalSubtitle": "Ad proposals, bugs, or ideas? <br/> Feel free to reach out!",
      "modalScan": "Scan or tap to chat",
      "modalTopicBugs": "Bugs",
      "modalTopicFeatures": "Features",
      "modalTopicPR": "Partnership",
      "tabSupport": "Support",
      "tabDonate": "Donate",
      "donateTitle": "Support the Project",
      "donateSubtitle": "If you find sfloader useful, consider supporting its development. Every contribution helps!",
      "donateVia": "Donate via",
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
      "featureFast": "Быстро",
      "featureFastDesc": "Высокая скорость обработки",
      "featureSecure": "Безопасно",
      "featureSecureDesc": "Не требуются личные данные",
      "featureMobile": "Мобильно",
      "featureMobileDesc": "Работает на iOS и Android",
      "footerText": "© {{year}} sfloader - Лучший загрузчик видео",
      "modalTitle": "Связаться с нами",
      "modalSubtitle": "Предложения по рекламе, баги или идеи? <br/> Пишите, мы открыты для предложений!",
      "modalScan": "Сканируйте или нажмите для чата",
      "modalTopicBugs": "Баги",
      "modalTopicFeatures": "Фичи",
      "modalTopicPR": "Сотрудничество",
      "tabSupport": "Поддержка",
      "tabDonate": "Донат",
      "donateTitle": "Поддержать проект",
      "donateSubtitle": "Если sfloader оказался полезным, вы можете поддержать его разработку. Каждый вклад помогает!",
      "donateVia": "Отправить через",
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
