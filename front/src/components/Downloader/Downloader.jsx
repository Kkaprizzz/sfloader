import { useState } from 'react';
import Icon from '../Icon';
import './Downloader.css';

const Downloader = ({ onDownload, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url || isLoading) return;
    onDownload(url);
  };

  return (
    <form className="linkbar" onSubmit={handleSubmit}>
      <div className="linkbar-field">
        <input
          type="text"
          placeholder="Ссылка на видео"
          aria-label="Ссылка на видео"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          spellCheck={false}
        />
        {url && !isLoading && (
          <button type="button" className="linkbar-clear" onClick={() => setUrl('')} aria-label="Очистить">
            <Icon name="close" size={14} />
          </button>
        )}
      </div>

      <button className="linkbar-submit" type="submit" disabled={isLoading || !url}>
        {isLoading ? 'Ищу…' : 'Найти'}
      </button>

      {isLoading && <div className="linkbar-busy" aria-hidden="true" />}
    </form>
  );
};

export default Downloader;
