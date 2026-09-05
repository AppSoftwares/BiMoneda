import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../data/db/supabase';
import { useLanguage } from '../../../core/context/LanguageContext';
import { bcv } from '../../../data/repository/BcvService';
import BottomNav from '../../../core/nav/BottomNav';

const AddInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    clientId: '',
    subscriptionId: '',
    paymentMethod: 'Zelle',
    paymentCondition: 'CONTADO' as 'CONTADO' | 'CREDITO',
    saleType: 'INTERNA' as 'INTERNA' | 'EXTERNA',
    reference: '',
    amountUsd: 0,
    concept: '',
    observations: '',
    bcvRate: 36.00,
  });

  useEffect(() => {
    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, name, rif');
        if (data) setClients(data);
    };
    fetchClients();
  }, []);

  const updateRate = async () => {
    setFetchingRate(true);
    try {
      const rate = await bcv.getLatestRate();
      setFormData(prev => ({ ...prev, bcvRate: rate }));
    } catch (e) {
      // Quietly fail or handle
    } finally {
      setFetchingRate(false);
    }
  };

  useEffect(() => {
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
      let rateToUse = formData.bcvRate;
      try {
        rateToUse = await bcv.getLatestRate();
      } catch (e) {
        const confirmar = confirm('No se pudo obtener la tasa BCV más reciente. ¿Emitir la factura con la última tasa cargada (' + formData.bcvRate + ')?');
        if (!confirmar) { setLoading(false); return; }
      }

      const invoiceNumber = Math.floor(100000 + Math.random() * 900000).toString();
      const now = new Date();

      const { data: invoice, error } = await (supabase as any).from('invoices').insert([{
        client_id: formData.clientId,
        subscription_id: formData.subscriptionId,
        invoice_number: invoiceNumber,
        control_number: "00-" + invoiceNumber,
        issue_date: now.toISOString().split('T')[0],
        issue_time: now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        assignment_date: now.toISOString().split('T')[0],
        status: 'PAID',
        subtotal_usd: formData.amountUsd,
        taxable_base_usd: formData.amountUsd,
        iva_percent: ivaPercent,
        iva_usd: ivaUsd,
        igtf_percent: igtfPercent,
        igtf_usd: igtfUsd,
        total_usd: totalUsd,
        total_bs: totalUsd * rateToUse,
        bcv_rate: rateToUse,
        payment_method: formData.paymentMethod,
        payment_condition: formData.paymentCondition,
        sale_type: formData.saleType,
        observations: formData.observations,
        item_code: `SUB-${selectedSub?.app_product}`,
        item_unit: 'SERVICIO',
        tax_aliquot: 'G',
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
    <div className="min-h-screen bg-background dark:bg-[#0b1c30] font-inter pb-32 transition-colors">
      <header className="bg-white dark:bg-[#0d2b5b] border-b dark:border-white/10 px-6 h-20 flex items-center gap-4 shadow-level-1 sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 text-primary dark:text-white active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-primary dark:text-white tracking-tight uppercase">Generar Factura</h1>
      </header>

      <main className="p-6 space-y-8 max-w-md mx-auto">
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant dark:text-white/60 uppercase tracking-widest ml-1">Seleccionar Cliente</label>
                <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className="w-full bg-white dark:bg-white/10 border border-outline-variant dark:border-white/20 rounded-md px-5 py-4 text-sm text-primary dark:text-white font-medium outline-none focus:border-accent-sky shadow-level-1 appearance-none"
                >
                    <option value="">-- Elige un cliente --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant dark:text-white/60 uppercase tracking-widest ml-1">Plan de Suscripción</label>
                <select
                    value={formData.subscriptionId}
                    onChange={(e) => setFormData({...formData, subscriptionId: e.target.value})}
                    className="w-full bg-white dark:bg-white/10 border border-outline-variant dark:border-white/20 rounded-md px-5 py-4 text-sm text-primary dark:text-white font-medium outline-none focus:border-accent-sky shadow-level-1 appearance-none disabled:opacity-50"
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

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-on-surface-variant dark:text-white/60 uppercase tracking-widest ml-1">Condición Pago</label>
                    <div className="flex bg-surface-container-low dark:bg-white/5 p-1 rounded-md border border-outline-variant dark:border-white/10">
                        {['CONTADO', 'CREDITO'].map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setFormData({...formData, paymentCondition: m as any})}
                                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded transition-all ${formData.paymentCondition === m ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' : 'text-on-surface-variant dark:text-white/40'}`}
                            >{m}</button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-on-surface-variant dark:text-white/60 uppercase tracking-widest ml-1">Tipo Venta</label>
                    <div className="flex bg-surface-container-low dark:bg-white/5 p-1 rounded-md border border-outline-variant dark:border-white/10">
                        {['INTERNA', 'EXTERNA'].map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setFormData({...formData, saleType: m as any})}
                                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded transition-all ${formData.saleType === m ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' : 'text-on-surface-variant dark:text-white/40'}`}
                            >{m}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant dark:text-white/60 uppercase tracking-widest ml-1">Método de Pago</label>
                <div className="flex bg-surface-container-low dark:bg-white/5 p-1 rounded-md border border-outline-variant dark:border-white/10">
                    {['Zelle', 'Pago Móvil', 'Transferencia'].map(m => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setFormData({...formData, paymentMethod: m})}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${formData.paymentMethod === m ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' : 'text-on-surface-variant dark:text-white/40'}`}
                        >{m}</button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant dark:text-white/60 uppercase tracking-widest ml-1">N.º de Referencia</label>
                <input
                    type="text"
                    placeholder="Ej. #998273"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full bg-white dark:bg-white/10 border border-outline-variant dark:border-white/20 rounded-md px-5 py-4 text-sm text-primary dark:text-white outline-none focus:border-accent-sky shadow-level-1"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant dark:text-white/60 uppercase tracking-widest ml-1">Observaciones</label>
                <input
                    type="text"
                    placeholder="Ej. Comisiones Varias"
                    value={formData.observations}
                    onChange={(e) => setFormData({...formData, observations: e.target.value})}
                    className="w-full bg-white dark:bg-white/10 border border-outline-variant dark:border-white/20 rounded-md px-5 py-4 text-sm text-primary dark:text-white outline-none focus:border-accent-sky shadow-level-1"
                />
            </div>
        </div>

        {/* Invoice Preview Block */}
        <div className="space-y-4 pt-4">
            <h2 className="text-xs font-bold text-primary dark:text-secondary uppercase tracking-[0.15em] text-center">Resumen del Documento</h2>
            <div className="bg-white dark:bg-white/5 rounded-lg border border-outline-variant dark:border-white/10 shadow-level-2 p-6 space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-outline-variant/30 dark:border-white/10 pb-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-on-surface-variant dark:text-white/60 uppercase tracking-wider">Cliente</span>
                        <div className="text-sm font-bold text-primary dark:text-white uppercase">{selectedClient?.name || '---'}</div>
                        <div className="text-[9px] font-medium text-on-surface-variant dark:text-white/40">{selectedClient?.rif || '---'}</div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-on-surface-variant dark:text-white/60 uppercase tracking-wider">Monto Total</span>
                        <div className="text-lg font-bold text-primary dark:text-white">${totalUsd.toFixed(2)}</div>
                        <div className="text-[10px] font-bold text-accent-sky">Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[9px] font-bold uppercase tracking-tight">
                    <div>
                        <span className="text-on-surface-variant dark:text-white/60 block">Subtotal</span>
                        <span className="text-primary dark:text-white">${formData.amountUsd.toFixed(2)}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-on-surface-variant dark:text-white/60 block">IVA (16%)</span>
                        <span className="text-primary dark:text-white">${ivaUsd.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-on-surface-variant dark:text-white/60 block text-secondary italic">IGTF (3%)</span>
                        <span className="text-secondary dark:text-secondary font-black">${igtfUsd.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || fetchingRate}
          className="w-full bg-primary dark:bg-secondary text-white font-bold py-4 rounded-md shadow-level-2 active:scale-[0.98] transition-all uppercase tracking-wider text-sm disabled:opacity-50 mt-4"
        >
          {loading ? 'Procesando...' : 'Emitir Factura Digital'}
        </button>
      </main>
      <BottomNav />
    </div>
  );
};

export default AddInvoice;
