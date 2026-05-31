import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, ShieldCheck, Smartphone } from 'lucide-react';
import './Features.css';

const Features = () => {
  const { t } = useTranslation();

  const data = [
    { icon: <Zap />, title: t('featureFast'), desc: t('featureFastDesc') },
    { icon: <ShieldCheck />, title: t('featureSecure'), desc: t('featureSecureDesc') },
    { icon: <Smartphone />, title: t('featureMobile'), desc: t('featureMobileDesc') }
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