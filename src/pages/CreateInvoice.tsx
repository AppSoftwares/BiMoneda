import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);

  const InvoicePreview = () => (
    <div className="bg-white dark:bg-white/5 rounded-[40px] shadow-2xl border border-gray-100 dark:border-white/10 p-6 relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-64 h-64 text-primary" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.363.242.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.692C6.603 6.269 6 7.05 6 8c0 .95.603 1.731 1.324 2.216.5.337 1.057.559 1.676.692v1.183a4.535 4.535 0 00-1.676.692C6.603 13.269 6 14.05 6 15c0 .95.603 1.731 1.324 2.216A1 1 0 008 19c0-1.114.07-1.34.433-1.582.155-.103.346-.196.567-.267V18a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.692c.72-.485 1.324-1.266 1.324-2.216 0-.95-.603-1.731-1.324-2.216a4.535 4.535 0 00-1.676-.692V11.1c.22-.071.412-.164.567-.267.363-.242.433-.468.433-.582 0-.114-.07-.34-.433-.582a2.305 2.305 0 01-.567-.267V5a1 1 0 10-2 0v.092c-.619.133-1.176.355-1.676.692A1 1 0 0010 5z" clipRule="evenodd" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-primary dark:text-white uppercase tracking-tighter">FacturaPro VE App</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Digital Solutions CA</p>
          </div>
          <div className="bg-primary/5 dark:bg-white/10 px-4 py-2 rounded-2xl border border-primary/10">
            <span className="text-[11px] font-black text-primary dark:text-white uppercase tracking-widest">Nº 108991</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] font-black text-accent-gold uppercase tracking-widest block mb-1">Fecha Emisión</span>
              <p className="text-xs font-bold text-primary dark:text-white uppercase tracking-tight">06/04/2026</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black text-accent-gold uppercase tracking-widest block mb-1">Tasa BCV</span>
              <p className="text-xs font-bold text-primary dark:text-white tracking-tight">47,05 Bs/USD</p>
            </div>
          </div>

          <div className="border-t border-b border-gray-50 dark:border-white/5 py-6 space-y-3">
             <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Subtotal</span>
                <span className="text-primary dark:text-white font-black">$100.00</span>
             </div>
             <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-widest">IVA (16%)</span>
                <span className="text-primary dark:text-white font-black">$16.00</span>
             </div>
             <div className="flex justify-between text-base pt-2">
                <span className="text-primary dark:text-accent-gold font-black uppercase tracking-widest">Total</span>
                <div className="text-right">
                    <div className="text-primary dark:text-white font-black tracking-tighter text-xl">$116.00</div>
                    <div className="text-[10px] text-accent-gold font-bold uppercase tracking-widest italic">Bs. 5,457.80</div>
                </div>
             </div>
          </div>

          <div className="bg-blue-50 dark:bg-white/5 p-5 rounded-3xl border border-blue-100 dark:border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.946-3.076 9.185-7.384 10.856L10 18l-.616-.243C5.076 16.085 2 11.846 2 7.001c0-.681.057-1.35.166-2.002zm11.703 3.707L9 13.586 7.131 11.707a1 1 0 10-1.414 1.414l2.586 2.586a1 1 0 001.414 0l5.414-5.414a1 1 0 00-1.414-1.414z" clipRule="evenodd" />
                </svg>
            </div>
            <p className="text-[10px] font-bold text-primary dark:text-white/80 uppercase leading-relaxed tracking-wider">Documento certificado y verificado legalmente ante el SENIAT</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-[#050c1a] transition-colors pb-12">
      <header className="sticky top-0 z-40 bg-white dark:bg-primary border-b border-gray-100 dark:border-white/10 px-6 h-20 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-white active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-black text-primary dark:text-white uppercase tracking-tight">Nueva Factura Digital</h1>
        <div className="w-10"></div>
      </header>

      <main className="p-6 space-y-8 max-w-md mx-auto">
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Seleccionar Cliente</label>
                <div className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/20 rounded-[24px] px-6 py-5 text-sm text-primary dark:text-white flex justify-between items-center cursor-pointer">
                    <span className="font-bold">Servicios Tecnológicos CA</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-black text-accent-gold uppercase ml-1 tracking-widest">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                    {['Zelle', 'Pago Móvil', 'Transfer'].map(method => (
                        <button key={method} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${method === 'Zelle' ? 'bg-primary text-white border-primary shadow-lg shadow-blue-900/20' : 'bg-white dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/10'}`}>
                            {method}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="space-y-4 pt-4">
            <h2 className="text-sm font-black text-primary dark:text-accent-gold uppercase tracking-[0.2em] ml-2">Vista Previa</h2>
            <InvoicePreview />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
            <button className="bg-green-500 text-white font-black py-5 rounded-[24px] shadow-xl shadow-green-900/20 active:scale-95 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                WhatsApp
            </button>
            <button className="bg-blue-500 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-900/20 active:scale-95 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Correo
            </button>
        </div>
      </main>
    </div>
  );
};

export default CreateInvoice;
