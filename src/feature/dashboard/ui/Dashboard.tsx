import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../data/db/supabase';
import { useLanguage } from '../../../core/context/LanguageContext';
import { bcv } from '../../../data/repository/BcvService';
import BottomNav from '../../../core/nav/BottomNav';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dbStatus, setDbStatus] = useState<'Checking...' | 'Connected' | 'Error'>('Checking...');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totals, setTotals] = useState({ usd: 0, bs: 0 });
  const [counts, setCounts] = useState({ clients: 0, p2p: 0 });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [currentRate, setCurrentRate] = useState<number>(36.00);

  // Filter State
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    init();
  }, [filterMonth, filterYear]);

  const init = async () => {
    try {
      setDbStatus('Connected');

      // Fetch User Info
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }

      // Fetch Recent Invoices
      const { data: invData } = await (supabase as any)
        .from('invoices')
        .select('*, clients(name)')
        .order('issue_date', { ascending: false })
        .limit(5);
      if (invData) setInvoices(invData);

      // Fetch Client Count
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Fetch P2P Count Today
      const today = new Date().toISOString().split('T')[0];
      const { count: p2pCount } = await supabase
        .from('crypto_operations')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      setCounts({ clients: clientCount || 0, p2p: p2pCount || 0 });

      // Calculate Totals based on Month/Year filter
      const startDate = `${filterYear}-${filterMonth.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(filterYear, filterMonth, 0).getDate();
      const endDate = `${filterYear}-${filterMonth.toString().padStart(2, '0')}-${lastDay}`;

      const { data: filteredInv } = await (supabase as any)
        .from('invoices')
        .select('total_usd, total_bs')
        .gte('issue_date', startDate)
        .lte('issue_date', endDate);

      const sumUsd = (filteredInv as any[])?.reduce((acc: number, curr: any) => acc + (curr.total_usd || 0), 0) || 0;
      const sumBs = (filteredInv as any[])?.reduce((acc: number, curr: any) => acc + (curr.total_bs || 0), 0) || 0;
      setTotals({ usd: sumUsd, bs: sumBs });

      // Fetch Rate
      const rate = await bcv.getLatestRate();
      setCurrentRate(rate);

    } catch (err) {
      setDbStatus('Error');
    }
  };

  const selectedMonthName = new Date(filterYear, filterMonth - 1).toLocaleString('es-VE', { month: 'short' }).toUpperCase();

  return (
    <div className="min-h-screen bg-background font-inter pb-32 dark:bg-[#0b1c30] transition-colors">
      {/* Top Bar */}
      <header className="bg-white px-6 h-20 flex items-center justify-between shadow-level-1 sticky top-0 z-50 dark:bg-[#0d2b5b] dark:border-b dark:border-white/10">
        <div className="flex flex-col">
            <h1 className="text-lg font-bold text-primary tracking-tight dark:text-white uppercase">{t('dash_title')}</h1>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest dark:text-white/60">
                    {dbStatus === 'Connected' ? t('status_connected') : dbStatus}
                </span>
            </div>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full border border-outline-variant p-0.5 active:scale-90 transition-transform"
        >
          <img src={avatarUrl || "/logo-1024.png"} alt="User" className="w-full h-full object-cover rounded-full" />
        </button>
      </header>

      <main className="p-6 space-y-8 max-w-md mx-auto">
        <button
          onClick={() => navigate('/add-invoice')}
          className="w-full bg-primary text-white font-bold py-4 rounded-md shadow-level-2 active:scale-[0.98] transition-all uppercase tracking-wider text-sm dark:bg-secondary"
        >
          {t('btn_create_inv')}
        </button>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-bold text-primary uppercase tracking-[0.15em] dark:text-secondary">{t('monthly_rev')}</h2>
            <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5 bg-surface-container-low dark:bg-white/10 px-3 py-1.5 rounded-lg border dark:border-white/10 active:scale-95 transition-all"
            >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {selectedMonthName} {filterYear}
            </button>
          </div>

          {showMonthPicker && (
              <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-outline-variant dark:border-white/10 shadow-xl grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-200">
                  {Array.from({length: 12}, (_, i) => (
                      <button
                        key={i}
                        onClick={() => { setFilterMonth(i + 1); setShowMonthPicker(false); }}
                        className={`py-2 text-[9px] font-bold rounded-lg transition-all ${filterMonth === i + 1 ? 'bg-primary text-white' : 'bg-surface-container-low dark:bg-white/10 dark:text-white/60'}`}
                      >
                          {new Date(0, i).toLocaleString('es', {month: 'short'}).toUpperCase()}
                      </button>
                  ))}
              </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-lg border border-outline-variant shadow-level-1 dark:bg-white/5 dark:border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-surface-container-low text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/10 dark:bg-white/10 dark:text-white uppercase">$ USD</div>
              </div>
              <div className="text-xl font-bold text-primary tracking-tight dark:text-white">${totals.usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <p className="text-[10px] font-medium text-on-surface-variant mt-1 uppercase tracking-wider dark:text-white/40">{t('total_earned')} ({selectedMonthName})</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-outline-variant shadow-level-1 dark:bg-white/5 dark:border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-surface-container-low text-secondary text-[10px] font-bold px-2 py-0.5 rounded border border-secondary/10 dark:bg-white/10 dark:text-secondary uppercase">Bs VEF</div>
              </div>
              <div className="text-xl font-bold text-secondary tracking-tight">{totals.bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <p className="text-[10px] font-medium text-on-surface-variant mt-1 uppercase tracking-wider dark:text-white/40">{t('bcv_rate')}: {currentRate.toFixed(2)}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold text-primary uppercase tracking-[0.15em] ml-1 dark:text-secondary">{t('sub_summary')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-lg border border-outline-variant shadow-level-1 flex flex-col items-center dark:bg-white/5 dark:border-white/10">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-3 dark:bg-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.07 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 00-7 7v1h11v-1a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 text-center dark:text-white/60">{t('active_clients')}</span>
              <span className="text-2xl font-bold text-primary dark:text-white">{counts.clients}</span>
            </div>

            <div className="bg-white p-5 rounded-lg border border-outline-variant shadow-level-1 flex flex-col items-center dark:bg-white/5 dark:border-white/10">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 text-center dark:text-white/60">{t('p2p_today')}</span>
              <span className="text-2xl font-bold text-primary dark:text-white">{counts.p2p}</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-bold text-primary uppercase tracking-[0.15em] dark:text-secondary">{t('recent_inv')}</h2>
            <button
                onClick={() => navigate('/invoices')}
                className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline transition-all"
            >
                {t('view_all')}
            </button>
          </div>
          <div className="bg-white rounded-lg border border-outline-variant shadow-level-1 overflow-hidden dark:bg-white/5 dark:border-white/10">
            {invoices.length === 0 ? (
                <div className="p-10 text-center text-on-surface-variant font-medium text-[10px] uppercase tracking-widest dark:text-white/40">No hay facturas registradas</div>
            ) : invoices.map((inv, i) => (
              <div
                key={inv.id}
                onClick={() => navigate(`/invoice/${inv.id}`)}
                className={`p-5 flex justify-between items-center ${i !== invoices.length - 1 ? 'border-b border-outline-variant/30' : ''} active:bg-surface-container-low transition-all cursor-pointer dark:active:bg-white/10`}
              >
                <div className="space-y-1">
                  <div className="font-bold text-primary text-sm tracking-tight dark:text-white uppercase">{inv.clients?.name || 'Cliente Final'}</div>
                  <div className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider flex items-center gap-2 dark:text-white/40">
                    <span>#INV-{inv.invoice_number}</span>
                    <span className="opacity-30">|</span>
                    <span className={`font-bold ${inv.status === 'PAID' ? 'text-green-600' : 'text-amber-500'}`}>{inv.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-right">
                      <div className="text-sm font-bold text-primary dark:text-white">${inv.total_usd.toFixed(2)}</div>
                      <div className="text-[9px] font-medium text-on-surface-variant italic dark:text-white/40">Bs. {inv.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                   </div>
                   {inv.status === 'PAID' ? (
                      <div className="text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                   ) : (
                      <div className="text-amber-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
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
