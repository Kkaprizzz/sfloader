import { useEffect, useRef } from 'react';
import Icon from '../Icon';
import './SettingsDialog.css';

const SOURCE = { bundled: 'встроенный', updated: 'обновлён', system: 'системный' };

function appStatus(u) {
  switch (u.state) {
    case 'checking': return 'Проверяю…';
    case 'none': return 'Последняя версия';
    case 'available': return `Доступна ${u.version}`;
    case 'downloading': return `Скачиваю ${Math.floor(u.percent || 0)}%`;
    case 'ready': return `${u.version} готова к установке`;
    case 'unsupported':
    case 'error': return u.error;
    default: return '';
  }
}

function ytdlpStatus(y) {
  switch (y.state) {
    case 'checking': return 'Проверяю…';
    case 'updating': return 'Скачиваю новую версию…';
    case 'ok': return 'Актуальная';
    case 'error': return y.error;
    default: return '';
  }
}

const SettingsDialog = ({ open, onClose, settings, onSettings, appVersion, appUpdate, ytdlp }) => {
  const ref = useRef(null);
  const api = window.api;

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const set = (patch) => api.settings.set(patch).then(onSettings);

  let appAction = { label: 'Проверить', run: api.app.checkUpdate };
  if (appUpdate.state === 'available') {
    appAction = appUpdate.manual
      ? { label: 'Открыть страницу', run: api.app.downloadUpdate }
      : { label: 'Обновить', run: api.app.downloadUpdate };
  }
  if (appUpdate.state === 'ready') appAction = { label: 'Перезапустить', run: api.app.installUpdate };
  const appBusy = appUpdate.state === 'checking' || appUpdate.state === 'downloading';
  const ytdlpBusy = ytdlp.state === 'checking' || ytdlp.state === 'updating';
  const appError = appUpdate.state === 'error' || appUpdate.state === 'unsupported';

  return (
    <dialog
      ref={ref}
      className="settings"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="settings-title"
    >
      <div className="settings-body">
        <header className="settings-head">
          <h2 id="settings-title">Настройки</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть" title="Закрыть">
            <Icon name="close" />
          </button>
        </header>

        {settings && (
          <>
            <div className="settings-row">
              <span className="settings-label">Папка загрузок</span>
              <div className="settings-control">
                <span className="settings-path" title={settings.folder}>{settings.folder}</span>
                <div className="settings-buttons">
                  <button className="btn" onClick={() => api.settings.chooseFolder().then(onSettings)}>Изменить…</button>
                  <button className="btn" onClick={() => api.settings.openFolder()}>Открыть</button>
                </div>
              </div>
            </div>

            <div className="settings-row">
              <span className="settings-label" id="concurrency-label">Одновременно</span>
              <div className="segmented" role="radiogroup" aria-labelledby="concurrency-label">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    role="radio"
                    aria-checked={settings.concurrency === n}
                    className={settings.concurrency === n ? 'is-on' : ''}
                    onClick={() => set({ concurrency: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-row">
              <span className="settings-label">Уведомления</span>
              <label className="check">
                <input
                  type="checkbox"
                  checked={settings.notify}
                  onChange={(e) => set({ notify: e.target.checked })}
                />
                <span className="check-box" aria-hidden="true"><Icon name="check" size={14} /></span>
                Когда окно не в фокусе
              </label>
            </div>
          </>
        )}

        <div className="settings-row settings-version">
          <span className="settings-label">SFLoader {appVersion}</span>
          <div className="settings-control">
            <span className={`settings-status${appError ? ' is-danger' : ''}`} title={appStatus(appUpdate)}>
              {appStatus(appUpdate)}
            </span>
            <button className="btn" onClick={() => appAction.run()} disabled={appBusy}>{appAction.label}</button>
          </div>
        </div>

        <div className="settings-row settings-version">
          <span className="settings-label">
            yt-dlp {ytdlp.version || '—'}
            {ytdlp.source && <small>{SOURCE[ytdlp.source]}</small>}
          </span>
          <div className="settings-control">
            <span className={`settings-status${ytdlp.state === 'error' ? ' is-danger' : ''}`} title={ytdlpStatus(ytdlp)}>
              {ytdlpStatus(ytdlp)}
            </span>
            <button className="btn" onClick={() => api.ytdlp.check()} disabled={ytdlpBusy}>Проверить</button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default SettingsDialog;
