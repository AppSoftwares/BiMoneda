import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Splash: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const version = "1.0.1";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="w-40 h-40 bg-white rounded-[40px] shadow-2xl flex items-center justify-center overflow-hidden mb-6 border border-gray-50 transform hover:scale-105 transition-transform duration-500">
           <img src="/logo-1024.png" alt="FacturaPro VE" className="w-32 h-32 object-contain" />
        </div>
        <span className="text-[12px] font-bold text-[#C99A32] tracking-[0.2em] uppercase mb-12">versión {version}</span>

        <h1 className="text-3xl font-black text-[#0B2545] leading-tight text-center mb-4">
          {t('splash_title')}
        </h1>
        <div className="w-16 h-1.5 bg-[#C99A32] rounded-full mb-8"></div>
        <p className="text-base text-gray-500 leading-relaxed text-center font-medium opacity-80">
          {t('splash_desc')}
        </p>
      </div>

      <div className="w-full max-w-sm mb-8">
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-[#0B2545] text-white font-black py-5 rounded-[24px] shadow-2xl shadow-blue-900/30 active:scale-[0.97] transition-all uppercase tracking-widest text-sm"
        >
          {t('btn_login')}
        </button>
      </div>
    </div>
  );
};

export default Splash;
