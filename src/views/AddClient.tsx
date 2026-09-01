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
    trial: false
  });

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
      const { error } = await (supabase as any).from('clients').insert([{
        name: formData.name,
        rif: formData.rif.toUpperCase(),
        email: formData.email,
        phone: formData.phone,
        is_active: true
      }]);
      if (error) throw error;
      alert('¡Cliente registrado con éxito!');
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
      <BottomNav />
    </div>
  );
};

export default AddClient;
