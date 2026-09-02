import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../data/db/supabase';
import { useLanguage } from '../../../core/context/LanguageContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BottomNav from '../../../core/nav/BottomNav';

const Crypto: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [ops, setOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOps = async () => {
      const { data } = await supabase
        .from('crypto_operations')
        .select('*')
        .order('date', { ascending: false });
      setOps(data || []);
      setLoading(false);
    };
    fetchOps();
  }, []);

  const maskName = (name: string) => {
    if (!name) return '---';
    if (name.length <= 4) return name + '***';
    return name.substring(0, 4) + '***' + (name.length > 8 ? name.substring(name.length - 2) : '');
  };

  const exportReport = (op: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(11, 37, 69); // Primary color
    doc.text("INFORME TÉCNICO-LEGAL P2P", pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Operación N.º: ${op.order_number_binance || op.id.substring(0, 8)}`, pageWidth / 2, 28, { align: 'center' });

    // Legal Body
    doc.setFontSize(12);
    doc.setTextColor(0);
    const splitText = doc.splitTextToSize(t('legal_tech_report_text'), pageWidth - 40);
    doc.text(splitText, 20, 45);

    // Operation Details
    autoTable(doc, {
      startY: 70,
      head: [['Concepto', 'Detalle']],
      body: [
        ['Activo', op.asset],
        ['Tipo', op.type === 'COMPRA' ? t('type_buy') : t('type_sell')],
        ['Cantidad', op.amount_crypto.toString()],
        ['Precio (Bs)', op.unit_price_bs.toLocaleString('es-VE')],
        ['Total (Bs)', op.total_amount_bs.toLocaleString('es-VE')],
        ['Fecha', new Date(op.date).toLocaleDateString('es-VE')],
        ['Plataforma', op.platform],
        ['Binance Order', op.order_number_binance || 'N/A'],
        ['Contraparte', op.counterparty_nickname || '---']
      ],
      theme: 'striped',
      headStyles: { fillColor: [11, 37, 69] }
    });

    // Legal Reference
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(9);
    doc.setTextColor(120);
    const refText = doc.splitTextToSize(t('legal_reference_block'), pageWidth - 40);
    doc.text(refText, 20, finalY);

    // Disclaimer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const discText = doc.splitTextToSize(t('legal_report_disclaimer'), pageWidth - 40);
    doc.text(discText, 20, finalY + 25);

    // Certification of Income Page
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICACIÓN DE INGRESOS (CRIPTO)", pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const certText = `Se certifica que el usuario ha recibido la cantidad de Bs. ${op.total_amount_bs.toLocaleString('es-VE')} producto de la liquidación de ${op.amount_crypto} ${op.asset} en la plataforma ${op.platform} con fecha ${new Date(op.date).toLocaleDateString('es-VE')}.`;
    const certSplit = doc.splitTextToSize(certText, pageWidth - 40);
    doc.text(certSplit, 20, 40);

    doc.save(`Informe_P2P_${op.order_number_binance || 'op'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-[#050c1a] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-colors flex flex-col">
      <header className="bg-white dark:bg-primary border-b border-gray-100 dark:border-white/10 px-6 h-20 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <h1 className="text-xl font-black text-primary dark:text-white uppercase tracking-tight">{t('crypto_title')}</h1>
        <button
          onClick={() => navigate('/books')}
          className="bg-accent-gold/10 text-accent-gold p-2 rounded-xl border border-accent-gold/20 active:scale-90 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
      </header>

      <main className="flex-1 p-6 space-y-6 pb-32 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate('/add-crypto')}
          className="w-full bg-primary text-white font-black py-5 rounded-[24px] shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-sm"
        >
          {t('btn_reg_op')}
        </button>

        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] ml-2">{t('p2p_history')}</h2>
          <div className="bg-white dark:bg-white/5 rounded-[40px] border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
            {loading ? (
                <div className="p-10 text-center animate-pulse text-gray-300 font-bold uppercase tracking-widest text-[10px]">{t('syncing')}</div>
            ) : ops.length === 0 ? (
                <div className="p-10 text-center text-gray-300 font-bold uppercase tracking-widest text-[10px]">{t('no_ops_found')}</div>
            ) : ops.map((op) => (
                <div key={op.id} className="p-6 border-b border-gray-50 dark:border-white/5 flex justify-between items-center active:bg-gray-50 transition-colors">
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase ${op.type === 'COMPRA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {op.type === 'COMPRA' ? t('type_buy') : t('type_sell')}
                        </span>
                        <span className="font-black text-primary dark:text-white uppercase tracking-tighter">{op.asset}</span>
                        <span className="text-[10px] font-black text-accent-gold opacity-60">|</span>
                        <span className="text-[11px] font-black text-primary dark:text-white tracking-tight uppercase">{maskName(op.counterparty_nickname || op.counterparty_full_name)}</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <span>{new Date(op.date).toLocaleDateString('es-VE')}</span>
                        <span className="opacity-30">|</span>
                        <span>{op.platform}</span>
                        {op.order_status === 'ESPERANDO_PAGO' && (
                            <span className="bg-amber-100 text-amber-700 text-[8px] px-1.5 py-0.5 rounded-md font-black animate-pulse uppercase">{t('status_pending')}</span>
                        )}
                      </div>
                   </div>
                   <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-sm font-black text-primary dark:text-white">${op.amount_crypto.toFixed(2)}</div>
                      <div className="text-[9px] font-bold text-accent-gold uppercase italic">Bs. {op.total_amount_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); exportReport(op); }}
                        className="bg-primary text-white p-1.5 rounded-lg active:scale-90 transition-transform"
                        title="Exportar Informe"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                   </div>
                </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Crypto;
