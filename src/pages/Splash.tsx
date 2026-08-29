import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Splash: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const version = "1.0.1";

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-primary flex flex-col items-center justify-center p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm -mt-20">
        <div className="w-44 h-44 bg-white rounded-5xl shadow-2xl flex items-center justify-center overflow-hidden mb-8 border border-gray-50 transform hover:scale-105 transition-transform duration-500">
           <img src="/logo-1024.png" alt="FacturaPro VE" className="w-36 h-32 object-contain" />
        </div>
        <span className="text-sm font-black text-accent-gold tracking-[0.25em] uppercase mb-10">versión {version}</span>

        <h1 className="text-4xl font-black text-primary dark:text-white leading-[1.1] text-center mb-6">
          {t('splash_title')}
        </h1>
        <div className="w-20 h-2 bg-accent-gold rounded-full mb-10"></div>
        <p className="text-lg text-gray-500 dark:text-gray-300 leading-relaxed text-center font-bold opacity-90 px-2">
          {t('splash_desc')}
        </p>
      </div>

      <div className="w-full max-w-sm mb-12">
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-primary text-white font-black py-5 rounded-3xl shadow-2xl shadow-blue-900/40 active:scale-[0.97] transition-all uppercase tracking-widest text-sm"
        >
          {t('btn_login')}
        </button>
      </div>
    </div>
  );
};

export default Splash;
