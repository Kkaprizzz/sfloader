import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="lang-switcher">
      <button 
        onClick={() => changeLanguage('en')} 
        className={i18n.language === 'en' ? 'active' : ''}
      >
        EN
      </button>
      <div className="separator"></div>
      <button 
        onClick={() => changeLanguage('ru')} 
        className={i18n.language === 'ru' ? 'active' : ''}
      >
        RU
      </button>
    </div>
  );
};

export default LanguageSwitcher;