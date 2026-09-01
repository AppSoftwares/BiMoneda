import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dbStatus, setDbStatus] = useState<'Checking...' | 'Connected' | 'Error'>('Checking...');
  const [totals, setTotals] = useState({ usd: 0, bs: 0 });
  const [counts, setCounts] = useState({ clients: 0, p2p: 0 });
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        setDbStatus('Connected');

        // Fetch User Info
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
        }

        // Fetch Recent Invoices
        const { data: invData } = await supabase
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

        // Calculate Totals (Mock logic for now or real query)
        const { data: allInv } = await supabase.from('invoices').select('total_usd, total_bs');
        const sumUsd = allInv?.reduce((acc, curr) => acc + (curr.total_usd || 0), 0) || 0;
        const sumBs = allInv?.reduce((acc, curr) => acc + (curr.total_bs || 0), 0) || 0;
        setTotals({ usd: sumUsd, bs: sumBs });

      } catch (err) {
        setDbStatus('Error');
      }
    };
    init();
  }, []);

  const currentMonth = new Intl.DateTimeFormat('es-VE', { month: 'short' }).format(new Date());

  return (
    <div className="min-h-screen bg-background font-inter pb-32">
      {/* Top Bar */}
      <header className="bg-white px-6 h-20 flex items-center justify-between shadow-level-1 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 text-primary active:scale-90 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
             </svg>
          </button>
          <div className="flex flex-col">
              <h1 className="text-lg font-bold text-primary tracking-tight">Provider Dashboard</h1>
              <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest">{dbStatus}</span>
              </div>
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
          className="w-full bg-primary text-white font-bold py-4 rounded-md shadow-level-2 active:scale-[0.98] transition-all uppercase tracking-wider text-sm"
        >
          {t('btn_create_inv')}
        </button>

        <section className="space-y-4">
          <h2 className="text-xs font-bold text-primary uppercase tracking-[0.15em] ml-1">{t('monthly_rev')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-lg border border-outline-variant shadow-level-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-surface-container-low text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/10">$ USD</div>
              </div>
              <div className="text-xl font-bold text-primary tracking-tight">${totals.usd.toLocaleString()}</div>
              <p className="text-[10px] font-medium text-on-surface-variant mt-1 uppercase tracking-wider">{t('total_earned')} ({currentMonth})</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-outline-variant shadow-level-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-surface-container-low text-accent-sky text-[10px] font-bold px-2 py-0.5 rounded border border-accent-sky/10">Bs VEF</div>
              </div>
              <div className="text-xl font-bold text-accent-sky tracking-tight">{totals.bs.toLocaleString()}</div>
              <p className="text-[10px] font-medium text-on-surface-variant mt-1 uppercase tracking-wider">Tasa BCV: 36.00</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold text-primary uppercase tracking-[0.15em] ml-1">Subscription Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-lg border border-outline-variant shadow-level-1 flex flex-col items-center">
              <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.07 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 00-7 7v1h11v-1a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 text-center">Active Clients</span>
              <span className="text-2xl font-bold text-primary">{counts.clients}</span>
            </div>

            <div className="bg-white p-5 rounded-lg border border-outline-variant shadow-level-1 flex flex-col items-center">
              <div className="w-10 h-10 bg-accent-sky rounded-lg flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 text-center">P2P Today</span>
              <span className="text-2xl font-bold text-primary">{counts.p2p}</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-bold text-primary uppercase tracking-[0.15em]">{t('recent_inv')}</h2>
            <button
                onClick={() => navigate('/invoices')}
                className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline transition-all"
            >
                {t('view_all')}
            </button>
          </div>
          <div className="bg-white rounded-lg border border-outline-variant shadow-level-1 overflow-hidden">
            {invoices.length === 0 ? (
                <div className="p-10 text-center text-on-surface-variant font-medium text-[10px] uppercase tracking-widest">No hay facturas registradas</div>
            ) : invoices.map((inv, i) => (
              <div
                key={inv.id}
                onClick={() => navigate(`/invoice/${inv.id}`)}
                className={`p-5 flex justify-between items-center ${i !== invoices.length - 1 ? 'border-b border-outline-variant/30' : ''} active:bg-surface-container-low transition-all cursor-pointer`}
              >
                <div className="space-y-1">
                  <div className="font-bold text-primary text-sm tracking-tight">{inv.clients?.name || 'Cliente Final'}</div>
                  <div className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                    <span>#INV-{inv.invoice_number}</span>
                    <span className="opacity-30">|</span>
                    <span className={`font-bold ${inv.status === 'PAID' ? 'text-green-600' : 'text-amber-500'}`}>{inv.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-right">
                      <div className="text-sm font-bold text-primary">${inv.total_usd.toFixed(2)}</div>
                      <div className="text-[9px] font-medium text-on-surface-variant italic">Bs. {inv.total_bs.toLocaleString()}</div>
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
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Dashboard;
