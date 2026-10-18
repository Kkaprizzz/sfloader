import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import TitleBar from './components/TitleBar/TitleBar';
import UpdateBar from './components/UpdateBar/UpdateBar';
import Downloader from './components/Downloader/Downloader';
import ResultPanel from './components/ResultPanel/ResultPanel';
import QueueList from './components/Lists/QueueList';
import HistoryList from './components/Lists/HistoryList';
import SettingsDialog from './components/Settings/SettingsDialog';

const api = window.api;

// Ошибки из ipcRenderer.invoke приходят с префиксом «Error invoking remote method…».
const ipcMessage = (err, fallback) =>
  String(err?.message || err || fallback).replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/, '');

function App() {
  const inputRef = useRef(null);
  const hintTimer = useRef(null);

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [hint, setHint] = useState(null);

  const [tab, setTab] = useState('queue');
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [appVersion, setAppVersion] = useState('');
  const [appUpdate, setAppUpdate] = useState({ state: 'idle' });
  const [ytdlp, setYtdlp] = useState({ state: 'idle' });
  const [barDismissed, setBarDismissed] = useState(false);

  useEffect(() => {
    api.queue.list().then(setTasks);
    api.settings.get().then(setSettings);
    api.app.version().then(setAppVersion);
    api.app.updateStatus().then(setAppUpdate);
    api.ytdlp.status().then(setYtdlp);
    const offs = [
      api.queue.onChanged(setTasks),
      api.app.onUpdateChanged(setAppUpdate),
      api.ytdlp.onChanged(setYtdlp),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  const refreshHistory = useCallback(() => api.history.list().then(setHistory), []);

  useEffect(() => {
    refreshHistory();
    return api.history.onChanged(refreshHistory);
  }, [refreshHistory]);

  const flash = (text) => {
    clearTimeout(hintTimer.current);
    setHint(text);
    hintTimer.current = setTimeout(() => setHint(null), 2000);
  };

  const handleSearch = async (link) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api.extractInfo(link));
    } catch (err) {
      setError(ipcMessage(err, 'Не удалось получить информацию о видео'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (format, keepOpen) => {
    const res = await api.queue.add({
      url: result.url,
      title: result.title,
      thumbnail: result.thumbnail,
      source: result.source,
      duration: result.duration,
      ...format,
    });
    if (res.duplicate) {
      flash('Уже в очереди');
      return;
    }
    setTab('queue');
    if (keepOpen) {
      flash(`${format.label} добавлено в очередь`);
      return;
    }
    setResult(null);
    setUrl('');
    inputRef.current?.focus();
  };

  const handleRedownload = async (id) => {
    await api.history.redownload(id);
    setTab('queue');
  };

  const openTab = (next) => {
    setTab(next);
    if (next === 'history') refreshHistory();
  };

  const clearHistory = () => {
    if (window.confirm('Очистить историю? Файлы на диске останутся.')) api.history.clear();
  };

  const showBar =
    !barDismissed &&
    (['available', 'downloading', 'ready'].includes(appUpdate.state) ||
      (appUpdate.state === 'error' && appUpdate.version));

  return (
    <div className="app">
      <TitleBar onSettings={() => setSettingsOpen(true)} />
      {showBar && <UpdateBar update={appUpdate} onDismiss={() => setBarDismissed(true)} />}

      <Downloader
        url={url}
        onUrlChange={setUrl}
        onSubmit={handleSearch}
        isLoading={loading}
        inputRef={inputRef}
      />
      {error && <div className="app-error" role="alert">{error}</div>}
      {result && (
        <ResultPanel data={result} hint={hint} onAdd={handleAdd} onClose={() => setResult(null)} />
      )}

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'queue'} className="tab" onClick={() => openTab('queue')}>
          Загрузки {tasks.length > 0 && <span className="tab-count">{tasks.length}</span>}
        </button>
        <button role="tab" aria-selected={tab === 'history'} className="tab" onClick={() => openTab('history')}>
          История {history.length > 0 && <span className="tab-count">{history.length}</span>}
        </button>
        {tab === 'history' && history.length > 0 && (
          <button className="tabs-action" onClick={clearHistory}>Очистить историю</button>
        )}
      </div>

      <main className="app-content" role="tabpanel">
        {tab === 'queue'
          ? <QueueList tasks={tasks} />
          : <HistoryList entries={history} onRedownload={handleRedownload} />}
      </main>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettings={setSettings}
        appVersion={appVersion}
        appUpdate={appUpdate}
        ytdlp={ytdlp}
      />
    </div>
  );
}

export default App;
