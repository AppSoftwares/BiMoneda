import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Splash: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const version = "1.1.3";

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-primary flex flex-col items-center justify-center p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm -mt-20">
        <div className="w-48 h-48 bg-white rounded-5xl shadow-2xl flex items-center justify-center overflow-hidden mb-10 border border-gray-50 transform hover:scale-105 transition-transform duration-500">
           <img src="/logo-1024.png" alt="BiMoneda" className="w-40 h-36 object-contain" />
        </div>
        <span className="text-sm font-black text-accent-gold tracking-[0.3em] uppercase mb-12">versión {version}</span>

        <h1 className="text-5xl font-black text-primary dark:text-white leading-[1] text-center mb-6 tracking-tighter italic">
          BiMoneda
        </h1>
        <p className="text-xl font-black text-primary dark:text-white uppercase tracking-widest text-center mb-6 opacity-80">
          Smart Finance
        </p>

        <div className="w-24 h-2.5 bg-accent-gold rounded-full mb-12 shadow-sm"></div>

        <p className="text-lg text-gray-500 dark:text-gray-300 leading-relaxed text-center font-bold opacity-90 px-4">
          {t('splash_desc')}
        </p>
      </div>

      <div className="w-full max-w-sm mb-12">
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-primary text-white font-black py-6 rounded-[32px] shadow-2xl shadow-blue-900/50 active:scale-[0.97] transition-all uppercase tracking-[0.25em] text-sm"
        >
          {t('btn_login')}
        </button>
      </div>
    </div>
  );
};

export default Splash;
