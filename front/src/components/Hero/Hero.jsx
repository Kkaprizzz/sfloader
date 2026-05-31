import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import './Hero.css';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <div className="hero">
      <h1>
        <Trans i18nKey="heroTitle">
          Download Video in <span className="highlight">Seconds</span>
        </Trans>
      </h1>
      <p>{t('heroSubtitle')}</p>
    </div>
  );
};

export default Hero;