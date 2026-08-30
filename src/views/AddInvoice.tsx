import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const AddInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    clientId: '',
    paymentMethod: 'Zelle',
    amountUsd: 100,
    bcvRate: 36.00,
  });

  useEffect(() => {
    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, name');
        if (data) setClients(data);
    };
    fetchClients();
  }, []);

  const totalBs = formData.amountUsd * formData.bcvRate;
  const ivaUsd = formData.amountUsd * 0.16;
  const grandTotalUsd = formData.amountUsd + ivaUsd;
  const grandTotalBs = grandTotalUsd * formData.bcvRate;

  const handleCreate = async () => {
    if (!formData.clientId) return alert('Por favor selecciona un cliente');
    setLoading(true);
    try {
      const { error } = await supabase.from('invoices').insert([{
        client_id: formData.clientId,
        invoice_number: Math.floor(100000 + Math.random() * 900000).toString(),
        control_number: "00-" + Math.floor(100000 + Math.random() * 900000).toString(),
        issue_date: new Date().toISOString(),
        status: 'PAID',
        subtotal_usd: formData.amountUsd,
        taxable_base_usd: formData.amountUsd,
        iva_percent: 16,
        iva_usd: ivaUsd,
        igtf_percent: 0,
        igtf_usd: 0,
        total_usd: grandTotalUsd,
        total_bs: grandTotalBs,
        bcv_rate: formData.bcvRate,
        payment_method: formData.paymentMethod
      }]);

      if (error) throw error;
      alert('¡Factura emitida exitosamente!');
      navigate('/dashboard');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-[#050c1a] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-colors flex flex-col">
      <header className="sticky top-0 z-40 bg-white dark:bg-primary border-b border-gray-100 dark:border-white/10 px-6 h-20 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-white active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-black text-primary dark:text-white uppercase tracking-tight">Nueva Factura Digital</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-md mx-auto pb-32">
        <div className="space-y-6">
            <div className="space-y-3">
                <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Seleccionar Cliente</label>
                <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 rounded-[28px] px-8 py-5 text-sm text-primary dark:text-white font-bold outline-none appearance-none focus:ring-4 focus:ring-primary/10 transition-all"
                >
                    <option value="">-- Elige un cliente --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="space-y-3">
                <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Monto Base (USD)</label>
                <input
                    type="number"
                    value={formData.amountUsd}
                    onChange={(e) => setFormData({...formData, amountUsd: parseFloat(e.target.value) || 0})}
                    className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 rounded-[28px] px-8 py-5 text-xl text-primary dark:text-white font-black outline-none focus:ring-4 focus:ring-primary/10"
                />
            </div>

            <div className="space-y-3">
                <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Método de Pago</label>
                <div className="grid grid-cols-3 gap-3">
                    {['Zelle', 'Pago Móvil', 'Transfer'].map(method => (
                        <button
                            key={method}
                            onClick={() => setFormData({...formData, paymentMethod: method})}
                            className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.paymentMethod === method ? 'bg-primary text-white border-primary shadow-xl shadow-blue-900/20' : 'bg-white dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/10'}`}
                        >
                            {method}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="space-y-4 pt-6">
            <h2 className="text-sm font-black text-primary dark:text-accent-gold uppercase tracking-[0.2em] ml-2 text-center">Resumen del Documento</h2>
            <div className="bg-white dark:bg-white/5 rounded-[40px] shadow-2xl border border-gray-100 dark:border-white/10 p-8 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">IVA (16.00%)</span>
                    <span className="text-primary dark:text-white font-black">${ivaUsd.toFixed(2)}</span>
                </div>
                <div className="h-px bg-gray-50 dark:bg-white/5 mb-6"></div>
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-accent-gold font-black uppercase tracking-[0.2em] text-[11px]">Total a Cobrar</span>
                        <div className="text-primary dark:text-white font-black text-3xl tracking-tighter mt-1">${grandTotalUsd.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[11px] text-primary dark:text-accent-gold font-black uppercase tracking-widest italic">Bs. {grandTotalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</div>
                        <div className="text-[8px] text-gray-300 font-bold uppercase mt-1">Tasa: {formData.bcvRate}</div>
                    </div>
                </div>
            </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-primary text-white font-black py-6 rounded-[32px] shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition-all uppercase tracking-[0.25em] text-sm disabled:opacity-50 mt-4"
        >
          {loading ? 'Procesando...' : 'Emitir Factura Legal'}
        </button>
      </main>
      <BottomNav />
    </div>
  );
};

export default AddInvoice;
