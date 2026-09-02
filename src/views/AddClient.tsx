import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const AddClient: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rif: '',
    email: '',
    phone: '',
    address: '',
    trial: false,
    subscriptions: [] as any[]
  });

  const generateDescription = (app: string, periodicity: string) => {
    const appLabel = app === 'CONDOMINIO' ? 'Condominio' : app === 'EASY_GO' ? 'Easy Go' : 'BiMoneda';
    const perLabel = periodicity.toLowerCase();
    return `Pago periódico de servicios de suscripción activa modelo de cobro ${perLabel} para acceder a contenido, funciones o servicios continuos dentro de la App móvil ${appLabel}.`;
  };

  const calculateNextBilling = (date: Date, periodicity: string) => {
    const next = new Date(date);
    if (periodicity === 'SEMANAL') next.setDate(next.getDate() + 7);
    else if (periodicity === 'MENSUAL') next.setMonth(next.getMonth() + 1);
    else if (periodicity === 'SEMESTRAL') next.setMonth(next.getMonth() + 6);
    else if (periodicity === 'ANUAL') next.setFullYear(next.getFullYear() + 1);
    return next.toISOString().split('T')[0];
  };

  const addSubSlot = () => {
    setFormData({
      ...formData,
      subscriptions: [...formData.subscriptions, { app: 'BIMONEDA', periodicity: 'MENSUAL', amount: 0 }]
    });
  };

  const validateRif = (rif: string) => {
    const regex = /^[VEJGP]-[0-9]{8}-[0-9]$/i;
    return regex.test(rif);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRif(formData.rif)) {
      return alert('Formato de RIF inválido. Use V-12345678-9');
    }
    setLoading(true);
    try {
      const { data: client, error } = await (supabase as any).from('clients').insert([{
        name: formData.name,
        rif: formData.rif.toUpperCase(),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        is_active: true
      }]).select().single();

      if (error) throw error;

      if (formData.subscriptions.length > 0) {
        const subsToInsert = formData.subscriptions.map(s => ({
          client_id: client.id,
          app_product: s.app,
          periodicity: s.periodicity,
          amount_usd: Number(s.amount),
          billable_description: generateDescription(s.app, s.periodicity),
          next_billing_date: calculateNextBilling(new Date(), s.periodicity),
          status: 'ACTIVA'
        }));
        const { error: subError } = await (supabase as any).from('client_subscriptions').insert(subsToInsert);
        if (subError) throw subError;
      }

      alert('¡Cliente y suscripciones registrados con éxito!');
      navigate('/dashboard');
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
        <h1 className="text-lg font-bold text-primary tracking-tight">{t('register_client_title')}</h1>
      </header>

      <main className="p-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('client_name_label')}</label>
              <input
                type="text"
                placeholder="Ej. Inversiones 2024 C.A."
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary focus:border-accent-sky focus:ring-4 focus:ring-accent-sky/10 outline-none transition-all shadow-level-1"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('rif_label')}</label>
              <input
                type="text"
                placeholder="V-12345678-9"
                value={formData.rif}
                onChange={(e) => setFormData({...formData, rif: e.target.value})}
                className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary focus:border-accent-sky focus:ring-4 focus:ring-accent-sky/10 outline-none transition-all shadow-level-1"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Dirección Fiscal</label>
              <textarea
                placeholder="Ej. Av. Francisco de Miranda, Edif. Torre Caracas..."
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary focus:border-accent-sky focus:ring-4 focus:ring-accent-sky/10 outline-none transition-all shadow-level-1"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('email_label')}</label>
              <input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary focus:border-accent-sky focus:ring-4 focus:ring-accent-sky/10 outline-none transition-all shadow-level-1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('phone_label')}</label>
              <input
                type="tel"
                placeholder="+58 412-0000000"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary focus:border-accent-sky focus:ring-4 focus:ring-accent-sky/10 outline-none transition-all shadow-level-1"
              />
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Suscripción</h3>
                <button type="button" onClick={addSubSlot} className="text-[10px] font-bold text-secondary uppercase tracking-widest">+ Agregar otra</button>
              </div>

              {formData.subscriptions.map((sub, index) => (
                <div key={index} className="bg-white border border-outline-variant rounded-lg p-5 space-y-4 shadow-sm relative">
                  <button
                    type="button"
                    onClick={() => {
                      const newSubs = [...formData.subscriptions];
                      newSubs.splice(index, 1);
                      setFormData({ ...formData, subscriptions: newSubs });
                    }}
                    className="absolute top-2 right-2 text-red-400 p-1"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">App</label>
                      <select
                        value={sub.app}
                        onChange={e => {
                          const newSubs = [...formData.subscriptions];
                          newSubs[index].app = e.target.value;
                          setFormData({ ...formData, subscriptions: newSubs });
                        }}
                        className="w-full bg-surface-container-low p-2.5 rounded text-xs font-bold text-primary"
                      >
                        <option value="CONDOMINIO">Condominio</option>
                        <option value="EASY_GO">Easy Go</option>
                        <option value="BIMONEDA">BiMoneda</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Monto (USD)</label>
                      <input
                        type="number"
                        value={sub.amount}
                        onChange={e => {
                          const newSubs = [...formData.subscriptions];
                          newSubs[index].amount = e.target.value;
                          setFormData({ ...formData, subscriptions: newSubs });
                        }}
                        className="w-full bg-surface-container-low p-2.5 rounded text-xs font-bold text-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Periodicidad</label>
                    <div className="flex bg-surface-container-low p-1 rounded border border-outline-variant/30 overflow-x-auto gap-1">
                        {['SEMANAL', 'MENSUAL', 'SEMESTRAL', 'ANUAL'].map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => {
                                  const newSubs = [...formData.subscriptions];
                                  newSubs[index].periodicity = p;
                                  setFormData({ ...formData, subscriptions: newSubs });
                                }}
                                className={`flex-1 min-w-[70px] py-2 text-[8px] font-bold uppercase rounded transition-all ${sub.periodicity === p ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
                            >{p}</button>
                        ))}
                    </div>
                  </div>
                </div>
              ))}

              {formData.subscriptions.length === 0 && (
                <div className="bg-surface-container-low border border-dashed border-outline-variant p-6 rounded-lg text-center">
                   <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest">Sin suscripciones iniciales</p>
                </div>
              )}
            </div>

            <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant flex items-center justify-between shadow-level-1">
              <div className="space-y-1">
                  <span className="text-sm font-bold text-primary">Enable 1-Month Free Trial</span>
                  <p className="text-[10px] text-on-surface-variant font-medium uppercase leading-tight">Enjoy all features. No credit card required.</p>
              </div>
              <button
                  type="button"
                  onClick={() => setFormData({...formData, trial: !formData.trial})}
                  className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${formData.trial ? 'bg-accent-sky' : 'bg-outline-variant'}`}
              >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${formData.trial ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-4 rounded-md shadow-level-2 active:scale-[0.98] transition-all uppercase tracking-wider text-sm disabled:opacity-50"
          >
            {loading ? 'Procesando...' : t('btn_register')}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
};

export default AddClient;
