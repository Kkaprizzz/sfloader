import React from 'react';
import { useTranslation } from 'react-i18next';
import './Features.css';

const IconSites = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="11.5" stroke="currentColor" strokeWidth="1.6" />
    <ellipse cx="16" cy="16" rx="5" ry="11.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4.5 16h23" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="23.4" cy="8.8" r="2.4" fill="currentColor" />
  </svg>
);

const IconPrivate = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <path
      d="M16 3.5l10 3.6v7.1c0 6.7-4.5 10.9-10 12.9-5.5-2-10-6.2-10-12.9V7.1l10-3.6z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="13.4" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 15.8v4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconQuality = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <path d="M9.5 5h13l5.5 7.5L16 28 3 12.5 9.5 5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path
      d="M3 12.5h26M9.5 5l6.5 7.5L22.5 5M16 12.5V28"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      opacity="0.55"
    />
  </svg>
);

const IconFree = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <path d="M6 6h9l11 11-9 9L6 15V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="11" cy="11" r="2" fill="currentColor" />
  </svg>
);

const Features = () => {
  const { t } = useTranslation();

  const data = [
    { icon: <IconSites />, title: t('featSitesTitle'), desc: t('featSitesDesc') },
    { icon: <IconPrivate />, title: t('featPrivateTitle'), desc: t('featPrivateDesc') },
    { icon: <IconQuality />, title: t('featQualityTitle'), desc: t('featQualityDesc') },
    { icon: <IconFree />, title: t('featFreeTitle'), desc: t('featFreeDesc') },
  ];

  return (
    <div className="features-grid">
      {data.map((item, index) => (
        <div className="feature-card" key={index}>
          <div className="feature-icon">{item.icon}</div>
          <h3>{item.title}</h3>
          <p>{item.desc}</p>
        </div>
      ))}
    </div>
  );
};

export default Features;
