import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
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
      redirectTo: `${window.location.origin}/reset-password`,
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center overflow-hidden mb-8 border border-gray-50">
          <img src="/logo-1024.png" alt="Logo" className="w-16 h-14 object-contain" />
        </div>

        <div className="text-center mb-10 px-4">
          <h2 className="text-3xl font-black text-[#0B2545]">{t('rec_title')}</h2>
          <p className="text-gray-400 font-semibold mt-2">{t('rec_subtitle')}</p>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="w-full space-y-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-[#C99A32] uppercase ml-1 tracking-widest">{t('email_label')}</label>
              <input
                type="email"
                placeholder="su@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl px-6 py-4 text-sm text-[#0B2545] focus:ring-2 focus:ring-[#0B2545] outline-none transition-all"
                required
              />
            </div>

            {error && <p className="text-red-500 text-[11px] text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B2545] text-white font-black py-5 rounded-[24px] shadow-2xl shadow-blue-900/30 active:scale-[0.97] transition-all uppercase tracking-widest text-sm disabled:opacity-50"
            >
              {loading ? '...' : t('btn_send')}
            </button>
          </form>
        ) : (
          <div className="bg-green-50 p-8 rounded-[32px] border border-green-100 text-center w-full shadow-sm animate-fade-in">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-green-700 text-sm font-bold">
              ¡Enlace enviado! Revisa tu bandeja de entrada para continuar.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="mt-12 text-sm font-black text-gray-400 hover:text-[#0B2545] transition-colors uppercase tracking-widest"
        >
          {t('btn_back')}
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
