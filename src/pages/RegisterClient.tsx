import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const RegisterClient: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rif: '',
    email: '',
    phone: '',
    trial: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Removing 'is_active' as it might not exist in user's schema yet
      const { error } = await supabase.from('clients').insert([{
        name: formData.name,
        rif: formData.rif,
        email: formData.email,
        phone: formData.phone
      }]);
      if (error) throw error;
      alert('¡Cliente registrado con éxito!');
      navigate('/dashboard');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050c1a] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-colors flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-white active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-black text-primary dark:text-white uppercase tracking-tight">{t('register_client_title')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 pb-32">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-[0.2em]">{t('client_name_label')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm rounded-3xl px-6 py-5 text-sm text-primary dark:text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-[0.2em]">{t('rif_label')}</label>
              <input
                type="text"
                placeholder="V-12345678-9"
                value={formData.rif}
                onChange={(e) => setFormData({...formData, rif: e.target.value})}
                className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm rounded-3xl px-6 py-5 text-sm text-primary dark:text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-[0.2em]">{t('email_label')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm rounded-3xl px-6 py-5 text-sm text-primary dark:text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-[0.2em]">{t('phone_label')}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm rounded-3xl px-6 py-5 text-sm text-primary dark:text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-gray-100 dark:border-white/10 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                  <span className="text-sm font-black text-primary dark:text-white">Enable 1-Month Free Trial</span>
                  <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">No credit card required.</p>
              </div>
              <button
                  type="button"
                  onClick={() => setFormData({...formData, trial: !formData.trial})}
                  className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${formData.trial ? 'bg-green-500' : 'bg-gray-200 dark:bg-white/10'}`}
              >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${formData.trial ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white font-black py-5 rounded-3xl shadow-2xl shadow-green-900/30 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-sm disabled:opacity-50"
          >
            {loading ? '...' : t('btn_register')}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
};

export default RegisterClient;
