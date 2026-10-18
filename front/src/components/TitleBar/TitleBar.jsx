import { useEffect, useState } from 'react';
import './TitleBar.css';

const GLYPHS = {
  minimize: <path d="M0 5.5h10" />,
  maximize: <rect x="0.5" y="0.5" width="9" height="9" />,
  restore: (
    <>
      <path d="M2.5 2.5V0.5h7v7h-2" />
      <rect x="0.5" y="2.5" width="7" height="7" />
    </>
  ),
  close: <path d="M0 0l10 10M10 0L0 10" />,
};

const Glyph = ({ name }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
    {GLYPHS[name]}
  </svg>
);

const TitleBar = () => {
  const wc = window.api?.windowControls;
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!wc) return undefined;
    wc.isMaximized().then(setMaximized);
    return wc.onMaximizeChange(setMaximized);
  }, [wc]);

  return (
    <div className="titlebar">
      <div className="titlebar-brand">
        <span>sf</span>loader
      </div>

      {wc && (
        <div className="win-controls">
          <button className="win-btn" onClick={() => wc.minimize()} aria-label="Свернуть">
            <Glyph name="minimize" />
          </button>
          <button
            className="win-btn"
            onClick={() => wc.toggleMaximize()}
            aria-label={maximized ? 'Восстановить' : 'Развернуть'}
          >
            <Glyph name={maximized ? 'restore' : 'maximize'} />
          </button>
          <button className="win-btn win-close" onClick={() => wc.close()} aria-label="Закрыть">
            <Glyph name="close" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TitleBar;
