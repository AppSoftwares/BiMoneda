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
        const { data, error } = await supabase
          .from('invoices')
          .select('*, clients(name)')
          .order('issue_date', { ascending: false });

        if (error) throw error;
        setInvoices(data || []);
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
  const totalOverdue = invoices.filter(i => i.status === 'CANCELLED').reduce((acc, curr) => acc + (curr.total_usd || 0), 0); // Using CANCELLED as proxy for overdue or adjustment

  return (
    <div className="min-h-screen bg-background font-inter pb-32">
      <header className="sticky top-0 z-50 bg-white px-6 h-20 flex items-center justify-between shadow-level-1">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 text-primary active:scale-90 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h1 className="text-xl font-bold text-primary tracking-tight">{t('recent_inv')}</h1>
        </div>
      </header>

      <main className="p-6 space-y-8 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-outline-variant shadow-level-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Total Pendiente</span>
                <div className="text-lg font-bold text-amber-600">${totalPending.toFixed(2)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-outline-variant shadow-level-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Total Atrasado</span>
                <div className="text-lg font-bold text-red-600">${totalOverdue.toFixed(2)}</div>
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
                onClick={() => navigate(`/invoice/${inv.id}`)}
                className={`p-5 flex justify-between items-center ${i !== filteredInvoices.length - 1 ? 'border-b border-outline-variant/30' : ''} active:bg-surface-container-low transition-all cursor-pointer`}
            >
                <div className="space-y-1">
                  <div className="font-bold text-primary text-sm tracking-tight">{inv.clients?.name || 'Cliente Final'}</div>
                  <div className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                    <span>#INV-{inv.invoice_number}</span>
                    <span className="opacity-30">|</span>
                    <span>{new Date(inv.issue_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : inv.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {inv.status}
                    </span>
                    <div className="text-sm font-bold text-primary">${inv.total_usd.toFixed(2)}</div>
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
