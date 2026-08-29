import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dbStatus, setDbStatus] = useState<'Checking...' | 'Connected' | 'Error'>('Checking...');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Check connection
      try {
        const { error } = await supabase.from('invoices').select('count', { count: 'exact', head: true });
        if (error) throw error;
        setDbStatus('Connected');
      } catch (err) {
        setDbStatus('Error');
      }

      // Fetch avatar
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-[#050c1a] transition-colors pb-32">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-primary border-b border-gray-100 dark:border-white/10 px-6 h-20 flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
            <h1 className="text-xl font-black text-primary dark:text-white tracking-tight uppercase">{t('dash_title')}</h1>
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

      <main className="p-6 space-y-10 max-w-md mx-auto">
        {/* Main Action */}
        <button
          onClick={() => navigate('/create-invoice')}
          className="w-full bg-primary text-white font-black py-5 rounded-[24px] shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-sm"
        >
          {t('btn_create_inv')}
        </button>

        {/* Monthly Revenue Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-primary dark:text-accent-gold uppercase tracking-[0.2em] ml-2">{t('monthly_rev')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-gray-100 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">USD</div>
                <span className="text-[10px] font-black text-primary dark:text-white uppercase tracking-widest opacity-60">USD</span>
              </div>
              <div className="text-2xl font-black text-primary dark:text-white tracking-tighter">$4,500.00</div>
              <p className="text-[9px] font-bold text-gray-400 mt-3 uppercase tracking-wider">{t('total_earned')} (Nov)</p>
            </div>

            <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-gray-100 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-accent-gold text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">Bs</div>
                <span className="text-[10px] font-black text-primary dark:text-white uppercase tracking-widest opacity-60">VEF</span>
              </div>
              <div className="text-xl font-black text-primary dark:text-white tracking-tighter leading-tight break-all">162,000.00</div>
              <p className="text-[9px] font-bold text-accent-gold mt-3 uppercase tracking-wider italic">{t('bcv_rate')}: 36,000.00</p>
            </div>
          </div>
        </section>

        {/* Subscription Summary */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-primary dark:text-accent-gold uppercase tracking-[0.2em] ml-2">{t('sub_summary')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-gray-100 dark:border-white/10 shadow-sm flex flex-col items-center">
              <div className="w-12 h-12 bg-primary dark:bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center leading-tight">{t('active_subs')}</span>
              <span className="text-3xl font-black text-primary dark:text-white tracking-tighter">312</span>
            </div>

            <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-gray-100 dark:border-white/10 shadow-sm flex flex-col items-center">
              <div className="w-12 h-12 bg-accent-gold rounded-2xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0zm-1 3a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center leading-tight">{t('pending_pay')}</span>
              <span className="text-3xl font-black text-primary dark:text-white tracking-tighter">24</span>
            </div>
          </div>
        </section>

        {/* Recent Invoices */}
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
            {[
              { id: '1', name: "Acme Corp", date: "2023-11-15", amount: "$250.00", status: "Paid" },
              { id: '2', name: "VeneSoftware", date: "2023-11-14", amount: "$150.00", status: "Pending" },
              { id: '3', name: "TechServices Co", date: "2023-11-12", amount: "$400.00", status: "Paid" }
            ].map((inv, i) => (
              <div
                key={i}
                onClick={() => navigate(`/invoice/${inv.id}`)}
                className={`p-6 flex justify-between items-center ${i !== 2 ? 'border-b border-gray-50 dark:border-white/5' : ''} active:bg-gray-50 dark:active:bg-white/5 transition-all cursor-pointer`}
              >
                <div className="space-y-1">
                  <div className="font-black text-primary dark:text-white text-base tracking-tight">{inv.name}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <span>#INV-{inv.date}</span>
                    <span className="text-gray-200">|</span>
                    <span className={inv.status === 'Paid' ? 'text-blue-500' : 'text-accent-gold'}>{inv.status}</span>
                    <span className="text-gray-200">|</span>
                    <span className="text-primary dark:text-white/70 font-black">{inv.amount}</span>
                  </div>
                </div>
                <div className={inv.status === 'Paid' ? 'text-blue-500' : 'text-accent-gold'}>
                    {inv.status === 'Paid' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
