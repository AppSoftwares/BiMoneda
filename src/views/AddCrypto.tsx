import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accounting } from '../services/AccountingService';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const AddCrypto: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'COMPRA' as 'COMPRA' | 'VENTA',
    asset: 'USDT',
    qty: 0,
    priceBs: 0,
    bcvRate: 36.00,
    platform: 'Binance P2P',
    reference: '',
    feeBs: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await accounting.processOperation({
        ...formData,
        qty: Number(formData.qty),
        priceBs: Number(formData.priceBs),
        bcvRate: Number(formData.bcvRate),
        feeBs: Number(formData.feeBs)
      });
      alert('Operación contable registrada con éxito');
      navigate('/crypto');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-[#050c1a] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-colors flex flex-col">
      <header className="bg-white dark:bg-primary border-b border-gray-100 dark:border-white/10 px-6 h-16 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-white">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-black text-primary dark:text-white uppercase tracking-tight">Nueva Operación P2P</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 p-6 max-w-md mx-auto w-full pb-32">
        <form onSubmit={handleSave} className="space-y-8">
            <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'COMPRA'})}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${formData.type === 'COMPRA' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400'}`}
                >{t('type_buy')}</button>
                <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'VENTA'})}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${formData.type === 'VENTA' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400'}`}
                >{t('type_sell')}</button>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Activo</label>
                        <input type="text" value={formData.asset} readOnly className="w-full bg-gray-100 dark:bg-white/5 rounded-3xl px-6 py-4 text-sm font-black text-primary dark:text-white outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Cantidad</label>
                        <input type="number" step="any" value={formData.qty} onChange={(e) => setFormData({...formData, qty: Number(e.target.value)})} className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 rounded-3xl px-6 py-4 text-sm font-black text-primary dark:text-white outline-none" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Precio Unitario (Bs)</label>
                    <input type="number" step="any" value={formData.priceBs} onChange={(e) => setFormData({...formData, priceBs: Number(e.target.value)})} className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 rounded-3xl px-6 py-4 text-sm font-black text-primary dark:text-white outline-none" />
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Ref / Orden</label>
                    <input type="text" placeholder="Ej. #202311..." value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 rounded-3xl px-6 py-4 text-sm font-bold text-primary dark:text-white outline-none" required />
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Plataforma</label>
                    <select value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 rounded-3xl px-6 py-4 text-sm font-bold text-primary dark:text-white outline-none appearance-none">
                        <option value="Binance P2P">Binance P2P</option>
                        <option value="El Dorado">El Dorado</option>
                        <option value="Reserve">Reserve</option>
                    </select>
                </div>
            </div>

            <div className="bg-primary p-8 rounded-[40px] shadow-2xl text-white space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                    <span>Total a Liquidar</span>
                    <span>VEF</span>
                </div>
                <div className="text-4xl font-black tracking-tighter">
                    Bs. {(formData.qty * formData.priceBs).toLocaleString()}
                </div>
                <p className="text-[9px] font-bold text-accent-gold uppercase tracking-widest italic">Esta operación no genera IVA ni IGTF según normativa vigente.</p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0B2545] text-white font-black py-6 rounded-[32px] shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition-all uppercase tracking-[0.25em] text-sm disabled:opacity-50"
            >
                {loading ? 'Procesando...' : 'Confirmar y Contabilizar'}
            </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
};

export default AddCrypto;
