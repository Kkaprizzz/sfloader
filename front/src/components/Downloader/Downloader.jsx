import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Loader2, Zap, XCircle } from 'lucide-react';
import './Downloader.css';

const Downloader = ({ onDownload, isLoading }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url || isLoading) return;
    onDownload(url);
  };

  return (
    <div className="main-downloader">
      <form className="dl-form" onSubmit={handleSubmit}>
        <div className="dl-input-container">
          <Link2 className="dl-icon" size={18} />
          <input
            type="text"
            placeholder={t('pasteLink')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />
          <XCircle
            className={`clear-btn ${url ? 'visible' : ''}`}
            size={20}
            onClick={() => setUrl('')}
          />
        </div>
        <button className="dl-button" type="submit" disabled={isLoading || !url}>
          {isLoading ? (
            <Loader2 className="dl-spinner" size={18} />
          ) : (
            <>
              <span>{t('download')}</span>
              <Zap size={16} fill="currentColor" />
            </>
          )}
        </button>
      </form>

      <div className="dl-hint">
        {t('supported')}
      </div>
    </div>
  );
};

export default Downloader;