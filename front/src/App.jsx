import React, { useState } from 'react';
import './App.css';
import { useTranslation } from 'react-i18next';
import TitleBar from './components/TitleBar/TitleBar';
import Hero from './components/Hero/Hero';
import Downloader from './components/Downloader/Downloader';
import Features from './components/Features/Features';
import SupportModal from './components/SupportModal/SupportModal';
import VideoResult from './components/VideoResult/VideoResult';
import { videoService } from './api/videoService';

function App() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      setError(typeof err === 'string' ? err : err?.message || t('extractError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TitleBar onSupportClick={() => setIsModalOpen(true)} />
      <div className="app-container">
      <main>
        <Hero />
        <Downloader onDownload={handleDownload} isLoading={loading} />
        {error && <div className="app-error">{error}</div>}
        {videoData && <VideoResult data={videoData} />}
        <Features />
      </main>

      <footer className="footer">
        <p>{t('footerText', { year: new Date().getFullYear() })}</p>
      </footer>

      <SupportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      </div>
    </>
  );
}

export default App;