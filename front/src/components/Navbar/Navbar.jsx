import React from 'react';
import { useTranslation } from 'react-i18next';
import './Navbar.css';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = ({ onSupportClick }) => {
  const { t } = useTranslation();

  return (
    <header className="navbar-container">
      <nav className="navbar-glass">
        <div className="logo">sf<span>loader</span></div>
        <div className="nav-links">
          <button onClick={() => onSupportClick('support')} className="nav-btn">{t('support')}</button>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;