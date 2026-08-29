import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0B2545]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-black text-[#0B2545]">Generar Factura</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#0B2545]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p className="text-gray-400 font-medium leading-relaxed">
          Esta función se está sincronizando con tus datos de Supabase.
          Próximamente podrás emitir facturas legales SENIAT en segundos.
        </p>
      </div>
    </div>
  );
};

export default CreateInvoice;
