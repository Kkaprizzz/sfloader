import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Heart, Copy, ArrowLeft } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import './SupportModal.css';

const UsdtIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#26A17B"/>
    <path d="M12.333 17.833V15.75H14.833V13.5H12.333V10.5C12.333 9.39583 12.729 8.83333 13.5 8.83333H14.833V6.66667H12.5C9.583 6.66667 8.16633 8.08333 8.16633 11V13.5H6.99967V15.75H8.16633V17.833H12.333Z" fill="white"/>
  </svg>
);

const SupportModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [isClosing, setIsClosing] = useState(false);
  const [showCryptoDetails, setShowCryptoDetails] = useState(false);
  const [copyText, setCopyText] = useState(t('copy'));
  const trc20Address = 'THNMr8tAyjUaSTFXnkE7bSv7i7oZHigVnD';

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
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
    setCopyText(t('copied'));
    setTimeout(() => setCopyText(t('copy')), 2000);
  };

  return (
    <div className={`modal-overlay ${isClosing ? 'fade-out' : ''}`} onClick={handleClose}>
      <div className={`modal-card-v5 ${isClosing ? 'scale-down' : ''}`} onClick={(e) => e.stopPropagation()}>

        <button className="close-x-v5" onClick={handleClose}><X size={18} /></button>

        <div className="tab-content">
          {showCryptoDetails ? (
            <div className="crypto-details-view">
              <button className="back-btn" onClick={() => setShowCryptoDetails(false)}>
                <ArrowLeft size={16} /> {t('back')}
              </button>
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
            <div className="donate-view">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
