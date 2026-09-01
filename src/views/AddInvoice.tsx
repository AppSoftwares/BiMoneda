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
    plan: 'Standard',
    paymentMethod: 'Zelle',
    reference: '',
    amountUsd: 100,
    bcvRate: 36.00,
  });

  useEffect(() => {
    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, name, rif');
        if (data) setClients(data);
    };
    fetchClients();
  }, []);

  const selectedClient = clients.find(c => c.id === formData.clientId);
  const ivaUsd = formData.amountUsd * 0.16;
  const totalUsd = formData.amountUsd + ivaUsd;
  const totalBs = totalUsd * formData.bcvRate;

  const handleCreate = async () => {
    if (!formData.clientId) return alert('Por favor selecciona un cliente');
    setLoading(true);
    try {
      const invoiceNumber = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: invoice, error } = await (supabase as any).from('invoices').insert([{
        client_id: formData.clientId,
        invoice_number: invoiceNumber,
        control_number: "00-" + invoiceNumber,
        issue_date: new Date().toISOString(),
        status: 'PAID',
        subtotal_usd: formData.amountUsd,
        taxable_base_usd: formData.amountUsd,
        iva_percent: 16,
        iva_usd: ivaUsd,
        igtf_percent: 0,
        igtf_usd: 0,
        total_usd: totalUsd,
        total_bs: totalBs,
        bcv_rate: formData.bcvRate,
        payment_method: formData.paymentMethod,
        notes: `Plan: ${formData.plan} | Ref: ${formData.reference}`
      }]).select().single();

      if (error) throw error;
      alert('¡Factura emitida exitosamente!');
      navigate(`/invoice/${invoice.id}`);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-inter pb-32">
      <header className="bg-white px-6 h-20 flex items-center gap-4 shadow-level-1 sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 text-primary active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-primary tracking-tight">Generate Digital Invoice</h1>
      </header>

      <main className="p-6 space-y-8 max-w-md mx-auto">
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Select Client</label>
                <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary font-medium outline-none focus:border-accent-sky shadow-level-1 appearance-none"
                >
                    <option value="">-- Choose a client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Subscription Plan</label>
                    <select
                        value={formData.plan}
                        onChange={(e) => setFormData({...formData, plan: e.target.value})}
                        className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary font-medium outline-none focus:border-accent-sky shadow-level-1"
                    >
                        <option value="Basic">Basic Plan</option>
                        <option value="Standard">Standard Plan</option>
                        <option value="Premium">Premium Plan</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Amount (USD)</label>
                    <input
                        type="number"
                        value={formData.amountUsd}
                        onChange={(e) => setFormData({...formData, amountUsd: parseFloat(e.target.value) || 0})}
                        className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary font-bold outline-none focus:border-accent-sky shadow-level-1"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Payment Method</label>
                <div className="flex bg-surface-container-low p-1 rounded-md border border-outline-variant">
                    {['Zelle', 'Pago Móvil', 'Transfer'].map(m => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setFormData({...formData, paymentMethod: m})}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${formData.paymentMethod === m ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
                        >{m}</button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Reference Number</label>
                <input
                    type="text"
                    placeholder="Ej. #998273"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary outline-none focus:border-accent-sky shadow-level-1"
                />
            </div>
        </div>

        {/* Invoice Preview Block */}
        <div className="space-y-4 pt-4">
            <h2 className="text-xs font-bold text-primary uppercase tracking-[0.15em] text-center">Document Preview</h2>
            <div className="bg-white rounded-lg border border-outline-variant shadow-level-2 p-6 space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-outline-variant/30 pb-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Cliente</span>
                        <div className="text-sm font-bold text-primary uppercase">{selectedClient?.name || '---'}</div>
                        <div className="text-[9px] font-medium text-on-surface-variant">{selectedClient?.rif || '---'}</div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Monto</span>
                        <div className="text-lg font-bold text-primary">${totalUsd.toFixed(2)}</div>
                        <div className="text-[10px] font-bold text-accent-sky">Bs. {totalBs.toLocaleString()}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px]">
                    <div>
                        <span className="text-on-surface-variant font-bold uppercase tracking-wider block">Plan</span>
                        <span className="text-primary font-bold">{formData.plan}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-on-surface-variant font-bold uppercase tracking-wider block">Tasa BCV</span>
                        <span className="text-primary font-bold">{formData.bcvRate.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-4">
            <button
                type="button"
                onClick={() => alert('Función "Enviar por WhatsApp" estará disponible al generar el PDF real.')}
                className="flex items-center justify-center gap-2 py-4 bg-green-500 text-white rounded-md font-bold text-[11px] uppercase tracking-wider shadow-md active:scale-95 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.956-.5-5.715-1.448l-6.282 1.656zm6.331-4.145c1.455.863 3.041 1.319 4.658 1.32h.005c5.424 0 9.835-4.412 9.838-9.835.001-2.628-2.043-5.1-3.908-6.965s-4.337-3.907-6.966-3.908c-5.423 0-9.834 4.411-9.837 9.835-.001 1.744.457 3.447 1.323 4.965l-.499 1.823.587-.155z" />
                </svg>
                WhatsApp
            </button>
            <button
                type="button"
                onClick={() => alert('Función "Enviar por Email" estará disponible al generar el PDF real.')}
                className="flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-md font-bold text-[11px] uppercase tracking-wider shadow-md active:scale-95 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
            </button>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-accent-sky text-white font-bold py-4 rounded-md shadow-level-2 active:scale-[0.98] transition-all uppercase tracking-wider text-sm disabled:opacity-50 mt-4"
        >
          {loading ? 'Processing...' : 'Issue Digital Invoice'}
        </button>
      </main>
      <BottomNav />
    </div>
  );
};

export default AddInvoice;
