import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { X, Mail, Send, Instagram, Music, Bug, Lightbulb, Handshake, Heart, MessageSquare, Copy, ArrowLeft } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import './SupportModal.css';
import qrImage from '../../assets/qr-code.png';

const TikTokIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13 3.44-.3 6.88-.45 10.32-.13 1.9-.9 3.84-2.45 4.96-1.55 1.17-3.66 1.48-5.54 1.05-1.88-.43-3.58-1.74-4.4-3.48-.82-1.74-.83-3.87-.01-5.61.82-1.74 2.52-3.05 4.4-3.48 1.1-.25 2.25-.18 3.32.18.01-2.8.01-5.6 0-8.4-.01-.01-.01-.01-.01-.02-.01-.01-.01-.01-.01-.02.01-2.5.01-5 .02-7.51z" />
  </svg>
);

const UsdtIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#26A17B"/>
    <path d="M12.333 17.833V15.75H14.833V13.5H12.333V10.5C12.333 9.39583 12.729 8.83333 13.5 8.83333H14.833V6.66667H12.5C9.583 6.66667 8.16633 8.08333 8.16633 11V13.5H6.99967V15.75H8.16633V17.833H12.333Z" fill="white"/>
  </svg>
);

const SupportModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState('support');
  const [showCryptoDetails, setShowCryptoDetails] = useState(false);
  const [copyText, setCopyText] = useState('Copy');
  const trc20Address = 'THNMr8tAyjUaSTFXnkE7bSv7i7oZHigVnD';

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setActiveTab('support');
      setShowCryptoDetails(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(trc20Address);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy'), 2000);
  };

  return (
    <div className={`modal-overlay ${isClosing ? 'fade-out' : ''}`} onClick={handleClose}>
      <div className={`modal-card-v5 ${isClosing ? 'scale-down' : ''}`} onClick={(e) => e.stopPropagation()}>
        
        <button className="close-x-v5" onClick={handleClose}><X size={20} /></button>

        <div className="modal-top-bar">
          <div className="text-toggle">
            <button onClick={() => setActiveTab('support')} className={activeTab === 'support' ? 'active' : ''}>
              <MessageSquare size={14} />
              <span>{t('tabSupport')}</span>
            </button>
            <button onClick={() => setActiveTab('donate')} className={activeTab === 'donate' ? 'active' : ''}>
              <Heart size={14} />
              <span>{t('tabDonate')}</span>
            </button>
          </div>
        </div>

        {activeTab === 'support' && (
          <div className="tab-content">
            <div className="modal-header-v5">
              <h2>{t('modalTitle')}</h2>
              <p><Trans i18nKey="modalSubtitle" /></p>
            </div>
            <div className="qr-wrapper-v5">
              <div className="qr-glow-v5"></div>
              <a href="https://t.me/gufyeah" target="_blank" rel="noreferrer"><img src={qrImage} alt="QR Code" className="qr-img-v5" /></a>
              <span className="qr-label-v5">{t('modalScan')}</span>
            </div>
            <div className="topics-list-v5">
              <div className="topic-v5"><Bug size={14} /> <span>{t('modalTopicBugs')}</span></div>
              <div className="topic-v5"><Lightbulb size={14} /> <span>{t('modalTopicFeatures')}</span></div>
              <div className="topic-v5"><Handshake size={14} /> <span>{t('modalTopicPR')}</span></div>
            </div>
            <div className="social-grid-v5">
              <a href="https://t.me/gufyeah" target="_blank" rel="noreferrer" className="tile-v5 tg-v5"><Send size={28} fill="white" /></a>
              <a href="https://instagram.com/" target="_blank" rel="noreferrer" className="tile-v5 ig-v5"><Instagram size={28} /></a>
              <a href="https://tiktok.com/" target="_blank" rel="noreferrer" className="tile-v5 tt-v5"><TikTokIcon size={28} /></a>
              <a href="mailto:sacha12765@gmail.com" className="tile-v5 ml-v5"><Mail size={28} /></a>
            </div>
          </div>
        )}

        {activeTab === 'donate' && (
          <div className="tab-content">
            {showCryptoDetails ? (
              <div className="crypto-details-view">
                <button className="back-btn" onClick={() => setShowCryptoDetails(false)}><ArrowLeft size={18} /> Back</button>
                <h4>USDT (TRC-20)</h4>
                <div className="qr-code-container">
                  <QRCodeCanvas value={trc20Address} size={180} bgColor="#fff" fgColor="#000" />
                </div>
                <div className="address-box">
                  <span className="address-text">{trc20Address}</span>
                  <button onClick={handleCopy} className="copy-btn">
                    <Copy size={16} /> {copyText}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="modal-header-v5">
                  <h2>{t('donateTitle')}</h2>
                  <p>{t('donateSubtitle')}</p>
                </div>
                <div className="donate-options">
                  <a href="https://www.donationalerts.com/r/alexann" target="_blank" rel="noreferrer" className="donate-btn-link da">
                    <Heart size={20} />
                    <span>{t('donateVia')} DonationAlerts</span>
                  </a>
                  <button onClick={() => setShowCryptoDetails(true)} className="donate-btn-link crypto">
                    <UsdtIcon size={20} />
                    <span>USDT (TRC-20)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportModal;