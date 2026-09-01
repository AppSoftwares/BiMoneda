import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dbStatus, setDbStatus] = useState<'Checking...' | 'Connected' | 'Error'>('Checking...');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { error } = await supabase.from('invoices').select('count', { count: 'exact', head: true });
        if (error) throw error;
        setDbStatus('Connected');
      } catch (err) {
        setDbStatus('Error');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-[#050c1a] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-colors flex flex-col">
      {/* Top Bar */}
      <header className="bg-white dark:bg-primary border-b border-gray-100 dark:border-white/10 px-6 h-20 flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
            <h1 className="text-xl font-black text-primary dark:text-white tracking-tight uppercase">BiMoneda Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${dbStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{dbStatus}</span>
            </div>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-12 h-12 rounded-full border-2 border-accent-gold p-0.5 shadow-md active:scale-90 transition-transform"
        >
          <img src={avatarUrl || "/logo-1024.png"} alt="User" className="w-full h-full object-cover rounded-full" />
        </button>
      </header>

      <main className="flex-1 p-6 space-y-10 max-w-md mx-auto pb-32">
        <button
          onClick={() => navigate('/add-invoice')}
          className="w-full bg-primary text-white font-black py-5 rounded-[24px] shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-sm"
        >
          {t('btn_create_inv')}
        </button>

        <section className="space-y-4">
          <h2 className="text-sm font-black text-primary dark:text-accent-gold uppercase tracking-[0.2em] ml-2">{t('monthly_rev')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-gray-100 dark:border-white/10 shadow-sm flex flex-col items-center">
              <div className="w-12 h-12 bg-primary dark:bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center leading-tight">Clientes</span>
              <span className="text-3xl font-black text-primary dark:text-white tracking-tighter">--</span>
            </div>

            <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-gray-100 dark:border-white/10 shadow-sm flex flex-col items-center">
              <div className="w-12 h-12 bg-accent-gold rounded-2xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.73 1.037M12 8V7m0 8v1m0-8c-1.11 0-2.08-.407-2.73-1.037M12 8v1m0 8c1.11 0 2.08.407 2.73.1.037M12 16v1" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center leading-tight">P2P Hoy</span>
              <span className="text-3xl font-black text-primary dark:text-white tracking-tighter">--</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-black text-primary dark:text-accent-gold uppercase tracking-[0.2em]">{t('recent_inv')}</h2>
            <button
                onClick={() => navigate('/invoices')}
                className="text-[10px] font-black text-accent-gold uppercase tracking-[0.2em] hover:text-primary transition-colors underline"
            >
                {t('view_all')}
            </button>
          </div>
          <div className="bg-white dark:bg-white/5 rounded-[40px] border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
            {dbStatus === 'Connected' ? (
                <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                    No hay facturas recientes. Empieza creando una.
                </div>
            ) : (
                <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">
                    Cargando datos reales...
                </div>
            )}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Dashboard;
