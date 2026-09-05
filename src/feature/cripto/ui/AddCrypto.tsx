import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accounting } from '../viewmodel/AccountingService';
import { useLanguage } from '../../../core/context/LanguageContext';
import { bcv } from '../../../data/repository/BcvService';
import BottomNav from '../../../core/nav/BottomNav';

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
    date: new Date().toISOString().split('T')[0],
    // Binance extra
    binanceOrder: '',
    orderStatus: 'COMPLETADO' as any,
    qtyNet: 0,
    feeCrypto: 0,
    counterpartyNickname: '',
    counterpartyFullName: '',
    paymentMethod: 'Banco de Venezuela',
    showBankReceipt: false,
    bank: 'Banco de Venezuela',
    opNumber: '',
    holder: '',
    sourceMasked: '',
    destMasked: ''
  });

  useEffect(() => {
    const updateRate = async () => {
      try {
        const rate = await bcv.getLatestRate();
        setFormData(prev => ({ ...prev, bcvRate: rate }));
      } catch (e) {}
    };
    updateRate();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await accounting.processOperation({
        ...formData,
        qty: Number(formData.qty),
        priceBs: Number(formData.priceBs),
        bcvRate: Number(formData.bcvRate),
        feeBs: Number(formData.feeBs),
        qtyNet: Number(formData.qtyNet),
        feeCrypto: Number(formData.feeCrypto),
        bankReceipt: formData.showBankReceipt ? {
          bank: formData.bank,
          opNumber: formData.opNumber,
          holder: formData.holder,
          sourceMasked: formData.sourceMasked,
          destMasked: formData.destMasked,
          amountBs: Number(formData.qty) * Number(formData.priceBs),
          date: formData.date
        } : undefined
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
    <div className="min-h-screen bg-background dark:bg-[#0b1c30] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-colors flex flex-col font-inter">
      <header className="bg-white dark:bg-[#0d2b5b] border-b border-gray-100 dark:border-white/10 px-6 h-16 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-white active:scale-90 transition-transform">
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
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${formData.type === 'COMPRA' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400 dark:text-white/40'}`}
                >{t('type_buy')}</button>
                <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'VENTA'})}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${formData.type === 'VENTA' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 dark:text-white/40'}`}
                >{t('type_sell')}</button>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Activo</label>
                        <input type="text" value={formData.asset} readOnly className="w-full bg-gray-100 dark:bg-white/10 rounded-3xl px-6 py-4 text-sm font-black text-primary dark:text-white outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Cantidad</label>
                        <input type="number" step="any" value={formData.qty} onChange={(e) => setFormData({...formData, qty: Number(e.target.value)})} className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 rounded-3xl px-6 py-4 text-sm font-black text-primary dark:text-white outline-none focus:border-secondary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Precio Unitario (Bs)</label>
                    <input type="number" step="any" value={formData.priceBs} onChange={(e) => setFormData({...formData, priceBs: Number(e.target.value)})} className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 rounded-3xl px-6 py-4 text-sm font-black text-primary dark:text-white outline-none focus:border-secondary" />
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">{t('label_binance_order')}</label>
                    <input type="text" placeholder="Ej. 229277..." value={formData.binanceOrder} onChange={(e) => setFormData({...formData, binanceOrder: e.target.value, reference: e.target.value})} className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 rounded-3xl px-6 py-4 text-sm font-bold text-primary dark:text-white outline-none focus:border-secondary" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">{t('label_counterparty')}</label>
                        <input type="text" placeholder="CORPORACION..." value={formData.counterpartyNickname} onChange={(e) => setFormData({...formData, counterpartyNickname: e.target.value})} className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 rounded-3xl px-6 py-4 text-sm font-bold text-primary dark:text-white outline-none focus:border-secondary" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">{t('label_order_status')}</label>
                        <select value={formData.orderStatus} onChange={(e) => setFormData({...formData, orderStatus: e.target.value as any})} className="w-full bg-white dark:bg-white/10 border border-gray-100 dark:border-white/20 rounded-3xl px-6 py-4 text-sm font-bold text-primary dark:text-white outline-none appearance-none">
                            <option value="COMPLETADO">COMPLETADO</option>
                            <option value="ESPERANDO_PAGO">ESPERANDO PAGO</option>
                            <option value="CANCELADO">CANCELADO</option>
                        </select>
                    </div>
                </div>

                {/* Bank Receipt Toggle */}
                <button
                    type="button"
                    onClick={() => setFormData({...formData, showBankReceipt: !formData.showBankReceipt})}
                    className={`w-full py-4 rounded-3xl border-2 border-dashed transition-all flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest ${formData.showBankReceipt ? 'border-accent-gold bg-accent-gold/5 text-accent-gold' : 'border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/20'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {formData.showBankReceipt ? 'Ocultar Datos Bancarios' : t('btn_attach_receipt')}
                </button>

                {formData.showBankReceipt && (
                    <div className="space-y-6 bg-white dark:bg-white/5 p-6 rounded-[32px] border border-accent-gold/20 dark:border-white/10 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest">{t('label_bank')}</label>
                            <input type="text" value={formData.bank} onChange={(e) => setFormData({...formData, bank: e.target.value})} className="w-full bg-gray-50 dark:bg-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-primary dark:text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest">{t('label_op_number')}</label>
                                <input type="text" placeholder="0591..." value={formData.opNumber} onChange={(e) => setFormData({...formData, opNumber: e.target.value})} className="w-full bg-gray-50 dark:bg-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-primary dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest">{t('label_account_holder')}</label>
                                <input type="text" value={formData.holder} onChange={(e) => setFormData({...formData, holder: e.target.value})} className="w-full bg-gray-50 dark:bg-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-primary dark:text-white" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-primary dark:bg-secondary p-8 rounded-[40px] shadow-2xl text-white space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                    <span>Total a Liquidar</span>
                    <span>VES</span>
                </div>
                <div className="text-4xl font-black tracking-tighter">
                    Bs. {(formData.qty * formData.priceBs).toLocaleString('es-VE')}
                </div>
                <p className="text-[9px] font-bold text-accent-gold dark:text-primary uppercase tracking-widest italic">Esta operación no genera IVA ni IGTF según normativa vigente.</p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0B2545] dark:bg-secondary text-white font-black py-6 rounded-[32px] shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition-all uppercase tracking-[0.25em] text-sm disabled:opacity-50"
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
