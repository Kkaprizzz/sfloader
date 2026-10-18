import { useState, useEffect, useRef } from 'react';
import Icon from '../Icon';
import { videoService } from '../../api/videoService';
import './VideoResult.css';

const formatDuration = (sec) => {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' ГБ';
  return (bytes / 1024 ** 2).toFixed(0) + ' МБ';
};

const VideoResult = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [savedPath, setSavedPath] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => () => { if (unsubRef.current) unsubRef.current(); }, []);

  if (!data) return null;

  const handleDownload = async (format, index) => {
    if (activeIndex !== null) return;
    setError(null);
    setSavedPath(null);

    const folder = await videoService.chooseFolder();
    if (!folder) return;

    const cleanTitle = data.title.replace(/[<>:"/\\|?*\n\r]/g, '').trim();
    const filename = `${cleanTitle}_${format.quality_label}`;
    const id = `${Date.now()}-${index}`;

    setActiveIndex(index);
    setProgress(0);

    if (unsubRef.current) unsubRef.current();
    unsubRef.current = videoService.onProgress(({ id: pid, percent }) => {
      if (pid === id) setProgress(percent);
    });

    try {
      const filePath = await videoService.download({
        id,
        url: format.source_url,
        formatId: format.format_id,
        filename,
        folder,
      });
      setSavedPath(filePath);
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Ошибка загрузки');
    } finally {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      setActiveIndex(null);
      setProgress(0);
    }
  };

  const meta = [data.source, formatDuration(data.duration)].filter(Boolean).join(' · ');

  return (
    <section className="result">
      <header className="media">
        {data.thumbnail
          ? <img className="media-thumb" src={data.thumbnail} alt="" />
          : <div className="media-thumb" />}
        <div className="media-text">
          <h2 title={data.title}>{data.title}</h2>
          <p>{meta}</p>
        </div>
      </header>

      <div className="formats-head" aria-hidden="true">
        <span>Качество</span>
        <span>Размер</span>
        <span>Статус</span>
        <span />
      </div>

      <ul className="formats">
        {data.formats.map((format, index) => {
          const isActive = activeIndex === index;
          const isDimmed = activeIndex !== null && !isActive;
          return (
            <li key={index} className={`format${isActive ? ' is-active' : ''}${isDimmed ? ' is-dimmed' : ''}`}>
              <span className="format-quality">{format.quality_label}</span>
              <span className="format-size">{formatSize(format.filesize)}</span>
              <span className="format-status">{isActive ? 'Скачивание' : ''}</span>
              {isActive ? (
                <span className="format-percent">{Math.round(progress)}%</span>
              ) : (
                <button
                  className="format-action"
                  onClick={() => handleDownload(format, index)}
                  disabled={isDimmed}
                >
                  <Icon name="download" size={16} />
                  Скачать
                </button>
              )}
              {isActive && <span className="format-fill" style={{ width: `${progress}%` }} />}
            </li>
          );
        })}
      </ul>

      {error && (
        <div className="result-status is-error" role="alert">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      )}

      {savedPath && !error && (
        <div className="result-status is-ok">
          <Icon name="check" />
          <span>Сохранено</span>
          <button className="result-link" onClick={() => videoService.openInFolder(savedPath)}>
            <Icon name="folder" />
            Показать в папке
          </button>
        </div>
      )}
    </section>
  );
};

export default VideoResult;
