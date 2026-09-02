import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data: invData } = await supabase
          .from('invoices')
          .select('*, clients(name)')
          .order('issue_date', { ascending: false });

        if (error) throw error;
        setInvoices(invData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const filteredInvoices = filter === 'all'
    ? invoices
    : invoices.filter(inv => inv.status === filter);

  const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((acc, curr) => acc + (curr.total_usd || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + (curr.total_usd || 0), 0);

  return (
    <div className="min-h-screen bg-background font-inter pb-32">
      <header className="sticky top-0 z-50 bg-white px-6 h-20 flex items-center justify-between shadow-level-1">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 text-primary active:scale-90 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h1 className="text-xl font-bold text-primary tracking-tight">{t('invoices_title')}</h1>
        </div>
        <button
            onClick={() => navigate('/books')}
            className="text-primary p-2 active:scale-90 transition-transform"
            title="Libros Contables"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        </button>
      </header>

      <main className="p-6 space-y-8 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-outline-variant shadow-level-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">{t('total_paid')}</span>
                <div className="text-lg font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-outline-variant shadow-level-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">{t('total_pending')}</span>
                <div className="text-lg font-bold text-amber-600">${totalPending.toFixed(2)}</div>
            </div>
        </div>

        {/* Filters */}
        <div className="flex bg-surface-container-low p-1 rounded-md border border-outline-variant overflow-x-auto no-scrollbar gap-1">
            {['all', 'PAID', 'PENDING', 'CANCELLED'].map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 min-w-[80px] py-2.5 text-[9px] font-bold uppercase tracking-widest rounded transition-all whitespace-nowrap ${filter === f ? 'bg-white text-primary shadow-sm border border-outline-variant/30' : 'text-on-surface-variant'}`}
                >
                    {f === 'all' ? t('all_filters') : t(`status_${f.toLowerCase()}`)}
                </button>
            ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-lg border border-outline-variant shadow-level-1 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-on-surface-variant font-medium uppercase tracking-widest text-[10px] animate-pulse">{t('loading_invoices')}</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-10 text-center text-on-surface-variant font-medium uppercase tracking-widest text-[10px]">{t('no_invoices')}</div>
          ) : filteredInvoices.map((inv, i) => (
            <div
                key={inv.id}
                className={`p-5 flex justify-between items-center ${i !== filteredInvoices.length - 1 ? 'border-b border-outline-variant/30' : ''} active:bg-surface-container-low transition-all`}
            >
                <div className="space-y-1 flex-1">
                  <div className="font-bold text-primary text-sm tracking-tight uppercase">{inv.clients?.name || 'Cliente Final'}</div>
                  <div className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                    <span>#INV-{inv.invoice_number}</span>
                    <span className="opacity-30">|</span>
                    <span>{new Date(inv.issue_date).toLocaleDateString('es-VE')}</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : inv.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {t(`status_${inv.status.toLowerCase()}`)}
                        </span>
                        <div className="text-sm font-bold text-primary">${inv.total_usd.toFixed(2)}</div>
                    </div>
                    <button
                        onClick={() => navigate(`/invoice/${inv.id}`)}
                        className="p-2 bg-surface-container-low rounded-full text-secondary active:scale-90 transition-all border border-outline-variant/30"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                </div>
            </div>
          ))}
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate('/add-invoice')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-level-2 flex items-center justify-center active:scale-90 transition-transform z-50 border-4 border-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      <BottomNav />
    </div>
  );
};

export default Invoices;
