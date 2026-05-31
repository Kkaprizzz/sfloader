import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Clock, Loader2, Check, AlertCircle, FolderOpen } from 'lucide-react';
import { videoService } from '../../api/videoService';
import './VideoResult.css';

const VideoResult = ({ data }) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [savedPath, setSavedPath] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => () => { if (unsubRef.current) unsubRef.current(); }, []);

  if (!data) return null;

  const formatDuration = (sec) => {
    if (!sec) return '00:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '~?';
    if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB';
    return (bytes / 1024 ** 2).toFixed(0) + ' MB';
  };

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
      setError(typeof err === 'string' ? err : err?.message || t('downloadError'));
    } finally {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      setActiveIndex(null);
      setProgress(0);
    }
  };

  return (
    <div className="video-result-container">
      <div className="video-card">

        <div className="video-preview">
          <img src={data.thumbnail} alt={data.title} />
          <div className="duration-badge">
            <Clock size={12} />
            <span>{formatDuration(data.duration)}</span>
          </div>
        </div>

        <div className="video-details">
          <div className="video-info-header">
            <span className="source-badge">{data.source}</span>
            <h3 title={data.title}>{data.title}</h3>
          </div>

          <div className="quality-grid">
            {data.formats.map((format, index) => {
              const isActive = activeIndex === index;
              const isDisabled = activeIndex !== null && !isActive;
              return (
                <button
                  key={index}
                  className={`quality-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => handleDownload(format, index)}
                  disabled={isDisabled}
                >
                  {isActive && (
                    <span className="q-progress-fill" style={{ width: `${progress}%` }} />
                  )}
                  <div className="q-info">
                    <span className="q-label">{format.quality_label}</span>
                    <span className="q-size">
                      {isActive ? `${Math.round(progress)}%` : formatSize(format.filesize)}
                    </span>
                  </div>
                  {isActive
                    ? <Loader2 size={16} className="spin" />
                    : <Download size={16} />
                  }
                </button>
              );
            })}
          </div>

          {error && (
            <div className="dl-status error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {savedPath && !error && (
            <div className="dl-status success">
              <Check size={16} />
              <span>{t('saved')}</span>
              <button className="reveal-btn" onClick={() => videoService.openInFolder(savedPath)}>
                <FolderOpen size={14} /> {t('openFolder')}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default VideoResult;
