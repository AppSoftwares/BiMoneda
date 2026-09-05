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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchOps();
  }, []);

  const fetchOps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('crypto_operations')
      .select('*')
      .order('date', { ascending: false });
    setOps(data || []);
    setLoading(false);
  };

  const maskName = (name: string) => {
    if (!name) return '---';
    if (name.length <= 4) return name + '***';
    return name.substring(0, 4) + '***' + (name.length > 8 ? name.substring(name.length - 2) : '');
  };

  const exportIndividualReport = (op: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Model: INFORME OPERACIÓN - P2P
    doc.setFontSize(20);
    doc.setTextColor(11, 37, 69);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME DE OPERACIÓN DIGITAL P2P", pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Comprobante N.º: ${op.order_number_binance || op.id.substring(0, 12).toUpperCase()}`, pageWidth / 2, 33, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(0);
    const splitText = doc.splitTextToSize(t('legal_tech_report_text'), pageWidth - 40);
    doc.text(splitText, 20, 50);

    autoTable(doc, {
      startY: 75,
      head: [['ESPECIFICACIÓN', 'DETALLE DE LA TRANSACCIÓN']],
      body: [
        ['ACTIVO DIGITAL', op.asset],
        ['TIPO DE OPERACIÓN', op.type === 'COMPRA' ? 'ADQUISICIÓN (COMPRA)' : 'LIQUIDACIÓN (VENTA)'],
        ['CANTIDAD TOTAL', `${op.amount_crypto} ${op.asset}`],
        ['PRECIO UNITARIO', `Bs. ${op.unit_price_bs.toLocaleString('es-VE')}`],
        ['MONTO LIQUIDADO', `Bs. ${op.total_amount_bs.toLocaleString('es-VE')}`],
        ['TASA BCV APLICADA', `${op.bcv_rate.toFixed(4)} Bs/USD`],
        ['FECHA DE VALOR', new Date(op.date).toLocaleDateString('es-VE')],
        ['PLATAFORMA', op.platform.toUpperCase()],
        ['ID DE ORDEN', op.order_number_binance || 'N/A'],
        ['CONTRAPARTE', maskName(op.counterparty_nickname || op.counterparty_full_name)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [11, 37, 69], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setTextColor(120);
    const refText = doc.splitTextToSize(t('legal_reference_block'), pageWidth - 40);
    doc.text(refText, 20, finalY);

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const discText = doc.splitTextToSize(t('legal_report_disclaimer'), pageWidth - 40);
    doc.text(discText, 20, finalY + 25);

    doc.save(`Recibo_P2P_${op.order_number_binance || 'OP'}.pdf`);
  };

  const exportHistory = (format: 'PDF' | 'CSV') => {
    const filtered = ops.filter(op => {
        const d = new Date(op.date);
        return (d.getMonth() + 1 === exportMonth) && (d.getFullYear() === exportYear);
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (filtered.length === 0) return alert('No hay datos para el período seleccionado');

    if (format === 'CSV') {
        let csv = 'Fecha,Tipo,Activo,Cantidad,Precio Bs,Total Bs,Plataforma,Referencia\n';
        filtered.forEach(op => {
            csv += `${op.date},${op.type},${op.asset},${op.amount_crypto},${op.unit_price_bs},${op.total_amount_bs},${op.platform},${op.order_number_binance || op.reference}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Historial_P2P_${exportMonth}_${exportYear}.csv`;
        link.click();
    } else {
        const doc = new jsPDF();
        doc.text(`Historial de Órdenes P2P - ${exportMonth}/${exportYear}`, 14, 15);
        autoTable(doc, {
            head: [['Fecha', 'Tipo', 'Activo', 'Cant.', 'Total (Bs)']],
            body: filtered.map(op => [new Date(op.date).toLocaleDateString(), op.type, op.asset, op.amount_crypto, op.total_amount_bs.toLocaleString('es-VE')]),
            startY: 25
        });
        doc.save(`Historial_P2P_${exportMonth}_${exportYear}.pdf`);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-[#050c1a] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-colors flex flex-col">
      <header className="bg-white dark:bg-[#0d2b5b] border-b border-gray-100 dark:border-white/10 px-6 h-20 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <h1 className="text-xl font-black text-primary dark:text-white uppercase tracking-tight">{t('crypto_title')}</h1>
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="bg-primary dark:bg-secondary text-white p-2.5 rounded-xl active:scale-90 transition-transform shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </header>

      <main className="flex-1 p-6 space-y-6 pb-32 max-w-md mx-auto w-full">
        {showExportMenu && (
            <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-primary/10 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4">
                <h3 className="text-xs font-black text-primary dark:text-white uppercase tracking-widest mb-4">Exportar Historial</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <select value={exportMonth} onChange={e => setExportMonth(Number(e.target.value))} className="bg-gray-100 dark:bg-white/10 p-3 rounded-xl text-xs font-bold dark:text-white">
                        {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es', {month: 'long'}).toUpperCase()}</option>)}
                    </select>
                    <select value={exportYear} onChange={e => setExportYear(Number(e.target.value))} className="bg-gray-100 dark:bg-white/10 p-3 rounded-xl text-xs font-bold dark:text-white">
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => exportHistory('PDF')} className="flex-1 bg-primary text-white py-3 rounded-xl text-[10px] font-black uppercase">PDF</button>
                    <button onClick={() => exportHistory('CSV')} className="flex-1 bg-secondary text-white py-3 rounded-xl text-[10px] font-black uppercase">CSV/Excel</button>
                </div>
            </div>
        )}

        <button
          onClick={() => navigate('/add-crypto')}
          className="w-full bg-primary dark:bg-secondary text-white font-black py-5 rounded-[24px] shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-sm"
        >
          {t('btn_reg_op')}
        </button>

        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] ml-2">{t('p2p_history')}</h2>
          <div className="bg-white dark:bg-white/5 rounded-[40px] border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
            {loading ? (
                <div className="p-10 text-center animate-pulse text-gray-300 dark:text-white/20 font-bold uppercase tracking-widest text-[10px]">{t('syncing')}</div>
            ) : ops.length === 0 ? (
                <div className="p-10 text-center text-gray-300 dark:text-white/20 font-bold uppercase tracking-widest text-[10px]">{t('no_ops_found')}</div>
            ) : ops.map((op) => (
                <div key={op.id} className="p-6 border-b border-gray-50 dark:border-white/5 flex justify-between items-center active:bg-gray-50 dark:active:bg-white/10 transition-colors">
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase ${op.type === 'COMPRA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {op.type === 'COMPRA' ? t('type_buy') : t('type_sell')}
                        </span>
                        <span className="font-black text-primary dark:text-white uppercase tracking-tighter">{op.asset}</span>
                        <span className="text-[10px] font-black text-accent-gold opacity-60">|</span>
                        <span className="text-[11px] font-black text-primary dark:text-white tracking-tight uppercase">{maskName(op.counterparty_nickname || op.counterparty_full_name)}</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest flex items-center gap-2">
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
                        onClick={(e) => { e.stopPropagation(); exportIndividualReport(op); }}
                        className="bg-primary dark:bg-secondary text-white p-1.5 rounded-lg active:scale-90 transition-transform shadow-md"
                        title="Exportar Recibo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
