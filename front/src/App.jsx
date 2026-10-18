import { useState } from 'react';
import './App.css';
import TitleBar from './components/TitleBar/TitleBar';
import Downloader from './components/Downloader/Downloader';
import VideoResult from './components/VideoResult/VideoResult';
import { videoService } from './api/videoService';

function App() {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async (url) => {
    setLoading(true);
    setVideoData(null);
    setError(null);

    try {
      const data = await videoService.extractInfo(url);
      setVideoData(data);
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Не удалось получить информацию о видео');
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = !videoData && !loading && !error;

  return (
    <div className="app">
      <TitleBar />
      <Downloader onDownload={handleDownload} isLoading={loading} />
      <main className="app-content">
        {isEmpty && <p className="app-hint">Вставь ссылку и нажми Enter</p>}
        {error && <div className="app-error" role="alert">{error}</div>}
        {videoData && <VideoResult data={videoData} />}
      </main>
    </div>
  );
}

export default App;
