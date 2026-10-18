import Icon from '../Icon';
import './Downloader.css';

const Downloader = ({ url, onUrlChange, onSubmit, isLoading, inputRef }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onSubmit(url.trim());
  };

  return (
    <form className="linkbar" onSubmit={handleSubmit}>
      <div className="linkbar-field">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ссылка на видео"
          aria-label="Ссылка на видео"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          disabled={isLoading}
          spellCheck={false}
        />
        {url && !isLoading && (
          <button type="button" className="linkbar-clear" onClick={() => onUrlChange('')} aria-label="Очистить">
            <Icon name="close" size={14} />
          </button>
        )}
      </div>

      <button className="linkbar-submit" type="submit" disabled={isLoading || !url.trim()}>
        {isLoading ? 'Ищу…' : 'Найти'}
      </button>

      {isLoading && <div className="linkbar-busy" aria-hidden="true" />}
    </form>
  );
};

export default Downloader;
