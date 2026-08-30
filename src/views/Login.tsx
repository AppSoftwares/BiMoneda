import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Credenciales inválidas.' : error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-primary flex flex-col items-center p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="w-32 h-32 bg-white rounded-5xl shadow-2xl flex items-center justify-center overflow-hidden mb-12 border border-gray-50 transform transition-all hover:rotate-2">
          <img src="/logo-1024.png" alt="Logo" className="w-24 h-20 object-contain" />
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-primary dark:text-white uppercase tracking-tighter italic">BiMoneda</h2>
          <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] tracking-[0.3em]">{t('login_title')}</p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-[0.2em]">{t('email_label')}</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 shadow-sm rounded-[28px] px-8 py-5 text-sm text-primary dark:text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-300"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-[0.2em]">{t('pass_label')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 shadow-sm rounded-[28px] px-8 py-5 text-sm text-primary dark:text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-[11px] text-center font-black bg-red-50 p-4 rounded-2xl border border-red-100 uppercase tracking-wider">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-black py-6 rounded-[32px] shadow-2xl shadow-blue-900/50 active:scale-[0.97] transition-all uppercase tracking-[0.25em] text-sm disabled:opacity-50 mt-6"
          >
            {loading ? '...' : t('btn_signin')}
          </button>
        </form>

        <button
          onClick={() => navigate('/forgot-password')}
          className="mt-12 text-[10px] font-black text-accent-gold hover:text-primary transition-colors uppercase tracking-[0.2em]"
        >
          {t('forgot_pass')}
        </button>
      </div>
    </div>
  );
};

export default Login;
