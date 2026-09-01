import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import { bcv } from '../services/BcvService';
import BottomNav from '../components/BottomNav';

const AddInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    clientId: '',
    subscriptionId: '',
    paymentMethod: 'Zelle',
    reference: '',
    amountUsd: 0,
    concept: '',
    bcvRate: 36.00,
  });

  useEffect(() => {
    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, name, rif');
        if (data) setClients(data);
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const updateRate = async () => {
      const rate = await bcv.getLatestRate();
      setFormData(prev => ({ ...prev, bcvRate: rate }));
    };
    updateRate();
  }, []);

  useEffect(() => {
    const fetchSubs = async () => {
      if (!formData.clientId) {
        setSubscriptions([]);
        return;
      }
      const { data } = await supabase
        .from('client_subscriptions')
        .select('*')
        .eq('client_id', formData.clientId)
        .eq('status', 'ACTIVA');
      if (data) setSubscriptions(data);
    };
    fetchSubs();
  }, [formData.clientId]);

  const selectedClient = clients.find(c => c.id === formData.clientId);
  const selectedSub = subscriptions.find(s => s.id.toString() === formData.subscriptionId);

  useEffect(() => {
    if (selectedSub) {
      setFormData(prev => ({
        ...prev,
        amountUsd: selectedSub.amount_usd,
        concept: selectedSub.billable_description
      }));
    }
  }, [formData.subscriptionId, selectedSub]);

  // Tax Logic: IGTF 3% only for Zelle (Divisas). 0% for Pago Movil / Transfer (Bs).
  const ivaPercent = 16;
  const igtfPercent = formData.paymentMethod === 'Zelle' ? 3 : 0;

  const ivaUsd = formData.amountUsd * (ivaPercent / 100);
  const igtfUsd = (formData.amountUsd + ivaUsd) * (igtfPercent / 100);
  const totalUsd = formData.amountUsd + ivaUsd + igtfUsd;
  const totalBs = totalUsd * formData.bcvRate;

  const calculateNextBilling = (date: Date, periodicity: string) => {
    const next = new Date(date);
    if (periodicity === 'SEMANAL') next.setDate(next.getDate() + 7);
    else if (periodicity === 'MENSUAL') next.setMonth(next.getMonth() + 1);
    else if (periodicity === 'SEMESTRAL') next.setMonth(next.getMonth() + 6);
    else if (periodicity === 'ANUAL') next.setFullYear(next.getFullYear() + 1);
    return next.toISOString().split('T')[0];
  };

  const handleCreate = async () => {
    if (!formData.clientId) return alert('Por favor selecciona un cliente');
    if (!formData.subscriptionId) return alert('Por favor selecciona una suscripción activa');

    setLoading(true);
    try {
      const invoiceNumber = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: invoice, error } = await (supabase as any).from('invoices').insert([{
        client_id: formData.clientId,
        subscription_id: formData.subscriptionId,
        invoice_number: invoiceNumber,
        control_number: "00-" + invoiceNumber,
        issue_date: new Date().toISOString(),
        status: 'PAID',
        subtotal_usd: formData.amountUsd,
        taxable_base_usd: formData.amountUsd,
        iva_percent: ivaPercent,
        iva_usd: ivaUsd,
        igtf_percent: igtfPercent,
        igtf_usd: igtfUsd,
        total_usd: totalUsd,
        total_bs: totalBs,
        bcv_rate: formData.bcvRate,
        payment_method: formData.paymentMethod,
        notes: `Plan: ${selectedSub?.app_product} | Ref: ${formData.reference}`,
        concept: formData.concept
      }]).select().single();

      if (error) throw error;

      const nextDate = calculateNextBilling(new Date(), selectedSub.periodicity);
      await (supabase as any)
        .from('client_subscriptions')
        .update({ next_billing_date: nextDate })
        .eq('id', formData.subscriptionId);

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
        <h1 className="text-lg font-bold text-primary tracking-tight">Generar Factura</h1>
      </header>

      <main className="p-6 space-y-8 max-w-md mx-auto">
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Seleccionar Cliente</label>
                <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary font-medium outline-none focus:border-accent-sky shadow-level-1 appearance-none"
                >
                    <option value="">-- Elige un cliente --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Plan de Suscripción</label>
                <select
                    value={formData.subscriptionId}
                    onChange={(e) => setFormData({...formData, subscriptionId: e.target.value})}
                    className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary font-medium outline-none focus:border-accent-sky shadow-level-1 appearance-none"
                    disabled={!formData.clientId}
                >
                    <option value="">-- {formData.clientId ? 'Elige un plan' : 'Selecciona un cliente primero'} --</option>
                    {subscriptions.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.app_product} ({s.periodicity}) - ${s.amount_usd}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Monto (USD)</label>
                <input
                    type="number"
                    value={formData.amountUsd}
                    onChange={(e) => setFormData({...formData, amountUsd: parseFloat(e.target.value) || 0})}
                    className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary font-bold outline-none focus:border-accent-sky shadow-level-1"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Método de Pago</label>
                <div className="flex bg-surface-container-low p-1 rounded-md border border-outline-variant">
                    {['Zelle', 'Pago Móvil', 'Transferencia'].map(m => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setFormData({...formData, paymentMethod: m})}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${formData.paymentMethod === m ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
                        >{m}</button>
                    ))}
                </div>
                <p className="text-[9px] text-on-surface-variant italic mt-1 px-1">
                    {igtfPercent > 0 ? '* Aplica IGTF (3%) por pago en divisas.' : '* Exento de IGTF por pago en moneda nacional.'}
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">N.º de Referencia</label>
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
            <h2 className="text-xs font-bold text-primary uppercase tracking-[0.15em] text-center">Resumen del Documento</h2>
            <div className="bg-white rounded-lg border border-outline-variant shadow-level-2 p-6 space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-outline-variant/30 pb-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Cliente</span>
                        <div className="text-sm font-bold text-primary uppercase">{selectedClient?.name || '---'}</div>
                        <div className="text-[9px] font-medium text-on-surface-variant">{selectedClient?.rif || '---'}</div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Monto Total</span>
                        <div className="text-lg font-bold text-primary">${totalUsd.toFixed(2)}</div>
                        <div className="text-[10px] font-bold text-accent-sky">Bs. {totalBs.toLocaleString()}</div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[9px] font-bold uppercase tracking-tight">
                    <div>
                        <span className="text-on-surface-variant block">Subtotal</span>
                        <span className="text-primary">${formData.amountUsd.toFixed(2)}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-on-surface-variant block">IVA (16%)</span>
                        <span className="text-primary">${ivaUsd.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-on-surface-variant block">IGTF ({igtfPercent}%)</span>
                        <span className="text-primary">${igtfUsd.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-4 rounded-md shadow-level-2 active:scale-[0.98] transition-all uppercase tracking-wider text-sm disabled:opacity-50 mt-4"
        >
          {loading ? 'Procesando...' : 'Emitir Factura Digital'}
        </button>
      </main>
      <BottomNav />
    </div>
  );
};

export default AddInvoice;
