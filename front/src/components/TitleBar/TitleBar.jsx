import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Square, Copy, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import './TitleBar.css';

const TitleBar = ({ onSupportClick }) => {
  const { t } = useTranslation();
  const wc = window.api?.windowControls;
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!wc) return undefined;
    wc.isMaximized().then(setMaximized);
    return wc.onMaximizeChange(setMaximized);
  }, [wc]);

  return (
    <div className="titlebar">
      <div className="titlebar-brand">sf<span>loader</span></div>

      <div className="titlebar-actions">
        <button className="tb-support" onClick={onSupportClick}>{t('support')}</button>
        <LanguageSwitcher />

        {wc && (
          <>
            <div className="tb-divider" />
            <div className="win-controls">
              <button className="win-btn" onClick={() => wc.minimize()} aria-label="Свернуть">
                <Minus size={15} />
              </button>
              <button className="win-btn" onClick={() => wc.toggleMaximize()} aria-label="Развернуть">
                {maximized ? <Copy size={12} /> : <Square size={12} />}
              </button>
              <button className="win-btn win-close" onClick={() => wc.close()} aria-label="Закрыть">
                <X size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TitleBar;
