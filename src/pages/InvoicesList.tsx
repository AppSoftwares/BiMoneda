import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const InvoicesList: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050c1a] transition-colors pb-32">
      <header className="sticky top-0 z-40 bg-white dark:bg-primary border-b border-gray-100 dark:border-white/10 px-6 h-20 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-white active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-black text-primary dark:text-white tracking-tight uppercase">{t('recent_inv')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="p-6 space-y-6 max-w-md mx-auto">
        {/* Filters */}
        <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm overflow-x-auto gap-2">
            {['all', 'PAID', 'PENDING', 'CANCELLED'].map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all whitespace-nowrap ${filter === f ? 'bg-primary text-white shadow-lg' : 'text-gray-400'}`}
                >
                    {f === 'all' ? 'Todos' : f}
                </button>
            ))}
        </div>

        {/* List */}
        <div className="bg-white dark:bg-white/5 rounded-[40px] border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Cargando facturas...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No se encontraron facturas</div>
          ) : filteredInvoices.map((inv, i) => (
            <div
                key={inv.id}
                onClick={() => navigate(`/invoice/${inv.id}`)}
                className={`p-6 flex justify-between items-center ${i !== filteredInvoices.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''} active:bg-gray-50 dark:active:bg-white/5 transition-all cursor-pointer`}
            >
                <div className="space-y-1">
                  <div className="font-black text-primary dark:text-white text-base tracking-tight">{inv.clients?.name || 'Cliente Desconocido'}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <span>#INV-{inv.invoice_number}</span>
                    <span className="text-gray-200">|</span>
                    <span className={inv.status === 'PAID' ? 'text-blue-500' : 'text-accent-gold'}>{inv.status}</span>
                    <span className="text-gray-200">|</span>
                    <span className="text-primary dark:text-white/70 font-black">${inv.total_usd.toFixed(2)}</span>
                  </div>
                </div>
                <div className={inv.status === 'PAID' ? 'text-blue-500' : 'text-accent-gold'}>
                    {inv.status === 'PAID' ? (
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
      </main>
      <BottomNav />
    </div>
  );
};

export default InvoicesList;
