import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-primary flex flex-col items-center p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="w-28 h-28 bg-white rounded-[32px] shadow-xl flex items-center justify-center overflow-hidden mb-12 border border-gray-50">
          <img src="/logo-1024.png" alt="Logo" className="w-18 h-14 object-contain" />
        </div>

        <div className="text-center mb-12 px-4">
          <h2 className="text-3xl font-black text-primary dark:text-white uppercase tracking-tighter italic">Fiora</h2>
          <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] tracking-[0.25em]">{t('rec_title')}</p>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="w-full space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-[0.2em]">{t('email_label')}</label>
              <input
                type="email"
                placeholder="su@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 shadow-sm rounded-[28px] px-8 py-5 text-sm text-primary dark:text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-300"
                required
              />
            </div>

            {error && <p className="text-red-500 text-[11px] text-center font-black bg-red-50 p-4 rounded-2xl border border-red-100 uppercase tracking-wider">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-black py-6 rounded-[32px] shadow-2xl shadow-blue-900/50 active:scale-[0.97] transition-all uppercase tracking-[0.2em] text-sm disabled:opacity-50 mt-6"
            >
              {loading ? '...' : t('btn_send')}
            </button>
          </form>
        ) : (
          <div className="bg-green-50 p-10 rounded-[48px] border border-green-100 text-center w-full shadow-sm animate-fade-in space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-green-700 text-sm font-black uppercase tracking-widest leading-relaxed">
              ¡Enlace enviado! Revisa tu bandeja de entrada para continuar.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="mt-14 text-[10px] font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-[0.3em]"
        >
          {t('btn_back')}
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
