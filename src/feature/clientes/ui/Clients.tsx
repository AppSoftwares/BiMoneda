import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../data/db/supabase';
import { useLanguage } from '../../../core/context/LanguageContext';
import BottomNav from '../../../core/nav/BottomNav';

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearch] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background dark:bg-[#0b1c30] font-inter pb-32 transition-colors">
      <header className="sticky top-0 z-50 bg-white dark:bg-[#0d2b5b] border-b dark:border-white/10 px-6 h-20 flex items-center justify-between shadow-level-1">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 text-primary dark:text-white active:scale-90 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h1 className="text-xl font-bold text-primary dark:text-white tracking-tight">{t('clients_title')}</h1>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-md mx-auto">
        {/* Search */}
        <div className="relative">
            <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-white/10 border border-outline-variant dark:border-white/20 rounded-md px-12 py-4 text-sm text-primary dark:text-white outline-none focus:border-accent-sky shadow-level-1"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-white/5 rounded-lg border border-outline-variant dark:border-white/10 shadow-level-1 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-on-surface-variant dark:text-white/20 font-medium uppercase tracking-widest text-[10px] animate-pulse">{t('loading_clients')}</div>
          ) : filteredClients.length === 0 ? (
            <div className="p-10 text-center text-on-surface-variant dark:text-white/40 font-medium uppercase tracking-widest text-[10px]">{t('no_clients_found')}</div>
          ) : filteredClients.map((client, i) => (
            <div
                key={client.id}
                onClick={() => navigate(`/edit-client/${client.id}`)}
                className={`p-5 flex justify-between items-center ${i !== filteredClients.length - 1 ? 'border-b border-outline-variant/30 dark:border-white/10' : ''} active:bg-surface-container-low dark:active:bg-white/10 transition-all cursor-pointer`}
            >
                <div className="space-y-1">
                  <div className="font-bold text-primary dark:text-white text-sm tracking-tight uppercase">{client.name}</div>
                  <div className="text-[10px] font-medium text-on-surface-variant dark:text-white/40 uppercase tracking-wider flex items-center gap-2">
                    <span>{client.rif}</span>
                    <span className="opacity-30">|</span>
                    <span>{client.phone || t('no_phone')}</span>
                  </div>
                </div>
                <div className="text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
          ))}
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate('/add-client')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary dark:bg-secondary text-white rounded-full shadow-level-2 flex items-center justify-center active:scale-90 transition-transform z-50 border-4 border-white dark:border-[#0b1c30]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      <BottomNav />
    </div>
  );
};

export default Clients;
