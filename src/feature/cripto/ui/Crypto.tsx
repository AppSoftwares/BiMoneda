import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../data/db/supabase';
import { useLanguage } from '../../../core/context/LanguageContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BottomNav from '../../../core/nav/BottomNav';

import { accounting } from '../viewmodel/AccountingService';

const Crypto: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [ops, setOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchOps();
  }, [filterMonth, filterYear]);

  const fetchOps = async () => {
    setLoading(true);
    // Calcular rango de fechas para el filtro
    const startDate = new Date(filterYear, filterMonth - 1, 1).toISOString();
    const endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59).toISOString();

    const { data } = await supabase
      .from('crypto_operations')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    setOps(data || []);
    setLoading(false);
  };

  const handleDeleteOp = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta operación? Esta acción no se puede deshacer.')) return;
    try {
        const { error } = await supabase.from('crypto_operations').delete().eq('id', id);
        if (error) throw error;
        setOps(ops.filter(o => o.id !== id));
        alert('Operación eliminada correctamente.');
    } catch (err: any) {
        alert('Error al eliminar: ' + err.message);
    }
  };

  const handleSyncBinance = async () => {
    setLoading(true);
    try {
        const count = await accounting.syncWithBinance();
        alert(`Sincronización completada. Se importaron ${count} nuevas operaciones.`);
        fetchOps();
    } catch (err: any) {
        alert('Error de Sincronización: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  const maskName = (name: string) => {
    if (!name) return '---';
    return name; // No masking as per new requirement
  };

  const exportIndividualReport = (op: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. HEADER
    doc.setFontSize(16);
    doc.setTextColor(11, 37, 69);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME OPERACIÓN - P2P", pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Operación N°: ${op.order_number_binance || op.id.substring(0, 12).toUpperCase()}`, pageWidth / 2, 29, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const introText = "Por medio de la presente se deja constancia que la actividad comercial de intercambio de criptoactivos realizada por el usuario se encuentra amparada bajo el marco legal vigente de la República Bolivariana de Venezuela, cumpliendo con los principios de transparencia y licitud de fondos.";
    const splitIntro = doc.splitTextToSize(introText, pageWidth - 40);
    doc.text(splitIntro, 20, 42, { align: 'justify', maxWidth: pageWidth - 40 });

    // 2. TABLE
    autoTable(doc, {
      startY: 55,
      head: [['Concepto', 'Detalle']],
      body: [
        ['Activo', op.asset],
        ['Tipo', op.type === 'COMPRA' ? 'Compra' : 'Venta'],
        ['Cantidad', `${op.amount_crypto}`],
        ['Precio (Bs)', `${op.unit_price_bs.toLocaleString('es-VE')}`],
        ['Total (Bs)', `${op.total_amount_bs.toLocaleString('es-VE')}`],
        ['Fecha', new Date(op.date).toLocaleDateString('es-VE')],
        ['Plataforma', op.platform],
        ['Binance Order', op.order_number_binance || 'N/A'],
        ['Contraparte', op.counterparty_nickname || op.counterparty_full_name || 'N/A']
      ],
      theme: 'grid',
      headStyles: { fillColor: [11, 37, 69], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        '1': { halign: 'justify' }
      }
    });

    // 3. LEGAL PARAGRAPHS
    let y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(8.5);
    const lineHeight = 4;

    const p1 = "Las operaciones se realizan a través de plataformas digitales especializadas (Exchange Binance), tanto nacionales como internacionales, que permiten la conversión entre activos digitales y monedas fiducias. El proceso operativo incluye:\n\n• Registro y verificación: Se crea una cuenta en la plataforma, cumpliendo con los protocolos de verificación de identidad (KYC) y prevención de lavado de dinero (AML).\n• Depósito de fondos: Se transfieren fondos en moneda local o activos digitales a la cuenta del Exchange.\n• Intercambio: Se ejecutan operaciones de compra o venta de activos digitales según las condiciones del mercado.\n\n- Retiro de fondos: Los fondos convertidos pueden retirarse a cuentas bancarias nacionales o billeteras digitales, según disponibilidad y regulación vigente.";
    const splitP1 = doc.splitTextToSize(p1, pageWidth - 40);
    doc.text(splitP1, 20, y, { align: 'justify', maxWidth: pageWidth - 40 });
    y += splitP1.length * lineHeight + 4;

    const p2 = "Estas plataformas operan bajo estándares de seguridad y trazabilidad, y en algunos casos están registradas ante la Superintendencia Nacional de Criptoactivos y Actividades Conexas (SUNACRIP), conforme al Sistema Integral de Criptoactivos (SIC).";
    const splitP2 = doc.splitTextToSize(p2, pageWidth - 40);
    doc.text(splitP2, 20, y, { align: 'justify', maxWidth: pageWidth - 40 });
    y += splitP2.length * lineHeight + 4;

    const p3 = "Es importante señalar que estas ganancias son reinvertidas en parte, y el resto es liquidado a moneda fiduciaria a través de las plataformas de intercambio para su uso en la economía tradicional. Aunado a esto, estoy consciente de las obligaciones fiscales; incluyendo la potencial aplicación del IGTF y cualquier otro tributo que la ley venezolana establezca. Mi actividad está amparada por la normativa vigente, incluyendo el Decreto Constituyente sobre Criptoactivos. El destino de estos fondos es para cubrir gastos personales y familiares, tales como servicios, alimentación y salud. Esta declaración tiene como propósito garantizar la transparencia de mis operaciones financieras y contribuir a un ecosistema seguro y conforme a derecho.";
    const splitP3 = doc.splitTextToSize(p3, pageWidth - 40);
    doc.text(splitP3, 20, y, { align: 'justify', maxWidth: pageWidth - 40 });
    y += splitP3.length * lineHeight + 8;

    // 4. CERTIFICATION
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICACIÓN DE INGRESOS (CRIPTO)", 20, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const certText = `Se certifica que el usuario ha recibido la cantidad de Bs. ${op.total_amount_bs.toLocaleString('es-VE')} producto de la liquidación de ${op.amount_crypto} ${op.asset} en la plataforma ${op.platform} con fecha ${new Date(op.date).toLocaleDateString('es-VE')}.`;
    doc.text(doc.splitTextToSize(certText, pageWidth - 40), 20, y);
    y += 12;

    // 5. FOOTER REFERENCES
    doc.setFontSize(7.5);
    const refText = "Decreto Constituyente sobre el Sistema Integral de Criptoactivos y Providencia SUNACRIP N.º 008-2019 (Gaceta Oficial N.º 41.578).";
    doc.text(doc.splitTextToSize(refText, pageWidth - 40), 20, y, { align: 'justify', maxWidth: pageWidth - 40 });
    y += 8;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    const discText = "Este documento es generado como apoyo contable/administrativo con base en los datos registrados por el usuario. No constituye asesoría legal, contable ni tributaria.";
    doc.text(doc.splitTextToSize(discText, pageWidth - 40), 20, y, { align: 'justify', maxWidth: pageWidth - 40 });

    doc.save(`Informe_P2P_${op.order_number_binance || 'OP'}.pdf`);

    doc.save(`Informe_P2P_${op.order_number_binance || 'OP'}.pdf`);
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
        {/* Filtro de Fecha */}
        <div className="bg-white dark:bg-white/5 p-4 rounded-[24px] border border-gray-100 dark:border-white/10 shadow-sm flex gap-3 items-center">
            <div className="flex-1">
                <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-white/5 p-3 rounded-xl text-[10px] font-black uppercase dark:text-white outline-none">
                    {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es', {month: 'long'}).toUpperCase()}</option>)}
                </select>
            </div>
            <div className="flex-1">
                <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-white/5 p-3 rounded-xl text-[10px] font-black uppercase dark:text-white outline-none">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
        </div>

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

        <div className="flex gap-3">
            <button
              onClick={() => navigate('/add-crypto')}
              className="flex-[2] bg-primary dark:bg-secondary text-white font-black py-5 rounded-[24px] shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-[10px]"
            >
              {t('btn_reg_op')}
            </button>
            <button
              onClick={handleSyncBinance}
              disabled={loading}
              className="flex-1 bg-accent-gold text-primary font-black py-5 rounded-[24px] shadow-2xl active:scale-[0.98] transition-all uppercase tracking-[0.1em] text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sinc.
            </button>
        </div>

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
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); exportIndividualReport(op); }}
                          className="bg-primary dark:bg-secondary text-white p-2 rounded-lg active:scale-90 transition-transform shadow-md"
                          title="Exportar Recibo"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteOp(op.id); }}
                          className="bg-red-500 text-white p-2 rounded-lg active:scale-90 transition-transform shadow-md"
                          title="Eliminar Operación"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
