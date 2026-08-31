import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/db';

const Invoice: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Invoice with Client
        const { data: invData } = await supabase
          .from('invoices')
          .select('*, clients(*)')
          .eq('id', id || '')
          .single();

        setInvoice(invData);

        // Fetch Company Profile
        const { data: compData } = await supabase
          .from('company_profile')
          .select('*')
          .single();

        setCompany(compData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface-bright">Cargando previsualización...</div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center bg-surface-bright">Factura no encontrada</div>;

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-[#050c1a] transition-colors pb-12">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-primary border-b border-gray-100 dark:border-white/10 px-6 h-16 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-white active:scale-90 transition-transform flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-black uppercase tracking-tight">Vista Previa de Factura y Detalle Legal</span>
        </button>
        <button className="text-primary dark:text-white">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
           </svg>
        </button>
      </header>

      <main className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-6 md:p-10 relative overflow-hidden">

          {/* Sello de Validación */}
          {invoice.status === 'PAID' && (
            <div className="absolute top-40 right-[-40px] rotate-45 z-0 opacity-10 pointer-events-none">
               <div className="flex flex-col items-center border-4 border-primary p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-black text-xs text-primary mt-2">FIRMADO Y VERIFICADO DIGITALMENTE</span>
               </div>
            </div>
          )}

          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 relative z-10">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center p-1 shadow-lg overflow-hidden">
                   <img src={company?.logo_url || "/logo-1024.png"} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                   <h1 className="text-xl font-black text-primary uppercase leading-tight">{company?.name || 'BIMONEDA S.A.'}</h1>
                   <p className="text-[10px] font-bold text-accent-gold uppercase tracking-[0.2em]">Factura Flow Pro</p>
                </div>
              </div>
              <div className="text-[11px] font-medium text-gray-500 leading-relaxed uppercase tracking-wider">
                RIF: {company?.rif || 'J-00000000-0'}<br/>
                {company?.address || 'Dirección de la empresa'}<br/>
                Teléfono: {company?.phone || '0000-0000000'}<br/>
                Email: {company?.email || 'admin@bimoneda.app'}
              </div>
            </div>

            {/* Invoice Meta Card */}
            <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-gray-100 min-w-[280px] shadow-sm">
              <h2 className="text-2xl font-black text-primary uppercase tracking-tighter mb-4 border-b border-gray-200 pb-2">FACTURA</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 font-black uppercase tracking-widest">N.º de Documento:</span>
                  <span className="font-black text-primary">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 font-black uppercase tracking-widest">Fecha de Emisión:</span>
                  <span className="font-bold text-gray-700">{new Date(invoice.issue_date).toLocaleDateString('es-VE')}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 font-black uppercase tracking-widest">Hora de Emisión:</span>
                  <span className="font-bold text-gray-700">{new Date(invoice.issue_date).toLocaleTimeString('es-VE')}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 font-black uppercase tracking-widest">N.º de Control:</span>
                  <span className="font-black text-red-600">{invoice.control_number}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sello de Validez Legal */}
          <div className="mb-10 bg-primary/5 border border-primary/10 rounded-2xl p-6 relative z-10">
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-accent-gold to-accent-gold-light rounded-full flex items-center justify-center shadow-lg shadow-amber-900/20">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                   </svg>
                </div>
                <div className="space-y-1">
                   <h3 className="text-[11px] font-black text-primary uppercase tracking-widest">FIRMA DIGITAL Y SELLADO DE TIEMPO CON VALIDEZ LEGAL</h3>
                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">FIRMADO Y VERIFICADO DIGITALMENTE</p>
                </div>
             </div>
          </div>

          {/* Client Details Block */}
          <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
             <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nombre ó Razón Social:</span>
                <span className="text-sm font-black text-primary uppercase">{invoice.clients?.name || 'CLIENTE FINAL'}</span>
             </div>
             <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Condición de Pago:</span>
                <span className="text-sm font-black text-primary uppercase">{invoice.payment_method || 'CONTADO'}</span>
             </div>
             <div className="md:col-span-2 bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Domicilio Fiscal:</span>
                <span className="text-[11px] font-bold text-gray-600 uppercase leading-relaxed">{invoice.clients?.address || 'N/A'}</span>
             </div>
             <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">RIF/CI:</span>
                <span className="text-sm font-black text-primary">{invoice.clients?.rif || 'V-00000000'}</span>
             </div>
             <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Teléfono:</span>
                <span className="text-sm font-black text-primary">{invoice.clients?.phone || 'N/A'}</span>
             </div>
          </div>

          {/* Items Table */}
          <div className="mb-10 border border-gray-100 rounded-2xl overflow-hidden relative z-10">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-[#F8FAFC] border-b border-gray-100">
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">USD</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Bs</th>
                   </tr>
                </thead>
                <tbody>
                   <tr className="border-b border-gray-50">
                      <td className="p-4 text-xs font-bold text-primary uppercase">Suscripción de Software - T4 2023</td>
                      <td className="p-4 text-xs font-black text-primary text-right">${invoice.subtotal_usd.toFixed(2)}</td>
                      <td className="p-4 text-xs font-black text-primary text-right">Bs. {(invoice.subtotal_usd * invoice.bcv_rate).toLocaleString('es-VE')}</td>
                   </tr>
                </tbody>
             </table>
          </div>

          {/* Totals Block */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-10 relative z-10">
             <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">Tasa BCV del día:</span>
                <span className="text-lg font-black text-primary">{invoice.bcv_rate.toFixed(4)}</span>
             </div>
             <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-gray-400 font-black uppercase tracking-widest">Subtotal:</span>
                   <span className="font-black text-primary">${invoice.subtotal_usd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-gray-400 font-black uppercase tracking-widest">IVA (16%):</span>
                   <span className="font-black text-primary">${invoice.iva_usd.toFixed(2)}</span>
                </div>
                <div className="bg-primary p-6 rounded-2xl flex justify-between items-center text-white shadow-xl">
                   <span className="text-sm font-black uppercase tracking-widest">TOTAL:</span>
                   <div className="text-right">
                      <div className="text-2xl font-black">${invoice.total_usd.toFixed(2)}</div>
                      <div className="text-[10px] font-bold text-accent-gold uppercase tracking-widest italic">Bs. {invoice.total_bs.toLocaleString('es-VE')}</div>
                   </div>
                </div>
             </div>
          </div>

          {/* Legal Footer */}
          <footer className="space-y-6 pt-10 border-t border-gray-100 relative z-10">
             <div className="bg-accent-gold/5 p-4 rounded-2xl text-center">
                <span className="text-sm font-black text-primary uppercase tracking-widest">Gracias por confiar en nosotros, su suscripción está activa</span>
             </div>
             <div className="space-y-4 text-[9px] font-medium text-gray-400 text-justify leading-relaxed uppercase tracking-wider">
                <p>LICENCIA DE USO: Este documento se rige por los términos y condiciones del servicio. Consulte el Acuerdo de Usuario.</p>
                <p>Este documento digital es válido y exigible conforme a la Ley sobre Mensajes de Datos y Firmas Electrónicas (LMDSE, Gaceta Oficial N.º 37.076, 2001).</p>
                <p className="text-center font-black text-gray-300">DOCUMENTO EMITIDO DE ACUERDO A LO DISPUESTO EN LA PROVIDENCIA ADMINISTRATIVA SNAT/2024/000102 DE FECHA 17/10/2024</p>
             </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Invoice;
