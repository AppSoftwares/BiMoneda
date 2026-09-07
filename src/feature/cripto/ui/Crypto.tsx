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
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const dateStr = new Date(op.date).toLocaleDateString('es-VE');

    // Colors
    const colorBlue: [number, number, number] = [31, 74, 122];
    const colorTableBg: [number, number, number] = [238, 243, 250];
    const colorTableBorder: [number, number, number] = [201, 214, 232];
    const colorText: [number, number, number] = [26, 26, 26];

    // 1. Background & Borders
    doc.setFillColor(253, 252, 248);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Outer double border
    doc.setDrawColor(colorBlue[0], colorBlue[1], colorBlue[2]);
    doc.setLineWidth(0.8);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'D');
    doc.setLineWidth(0.2);
    doc.rect(6.5, 6.5, pageWidth - 13, pageHeight - 13, 'D');

    // 2. Watermark
    doc.saveGraphicsState();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(66);
    doc.setTextColor(colorBlue[0], colorBlue[1], colorBlue[2]);
    (doc as any).setGState(new (doc as any).GState({ opacity: 0.06 }));
    doc.text("INFORME P2P", pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 332
    });
    doc.restoreGraphicsState();

    // 3. Header
    let y = 25;
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(colorText[0], colorText[1], colorText[2]);
    doc.text("Informe de Operación Comercial — P2P", pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.setFont("times", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(68, 68, 68);
    doc.text("Certificación de Ingresos por Liquidación de Activos Digitales", pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setDrawColor(colorBlue[0], colorBlue[1], colorBlue[2]);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    // Doc Meta
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.setTextColor(colorBlue[0], colorBlue[1], colorBlue[2]);
    doc.text(`N.° de Operación: ${op.order_number_binance || op.id.substring(0, 12).toUpperCase()}`, 20, y);
    doc.text(`Fecha de emisión: ${dateStr}`, pageWidth - 20, y, { align: 'right' });
    y += 10;

    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Helper for sections
    const drawSection = (title: string) => {
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(colorBlue[0], colorBlue[1], colorBlue[2]);
      doc.text(title, margin, y);
      y += 2;
      doc.setDrawColor(colorTableBorder[0], colorTableBorder[1], colorTableBorder[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    // I. Marco Legal
    drawSection("I. Marco Legal Aplicable");
    doc.setFont("times", "normal");
    doc.setFontSize(9.7);
    doc.setTextColor(colorText[0], colorText[1], colorText[2]);
    const introText = "Se deja constancia que la actividad comercial de intercambio de criptoactivos aquí descrita se encuentra amparada bajo el marco legal vigente de la República Bolivariana de Venezuela, en cumplimiento de los principios de transparencia y licitud de fondos, conforme al Decreto Constituyente sobre el Sistema Integral de Criptoactivos y la Providencia SUNACRIP N.° 008-2019 (Gaceta Oficial N.° 41.578).";
    const splitIntro = doc.splitTextToSize(introText, maxWidth);
    doc.text(splitIntro, margin, y, { align: 'justify' });
    y += splitIntro.length * 4.5 + 4;

    // II. Detalle de la Operación
    drawSection("II. Detalle de la Operación");
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 9.5, font: 'times', cellPadding: 2, lineColor: colorTableBorder },
      columnStyles: {
        0: { fillColor: colorTableBg, textColor: colorBlue, fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 45 },
        2: { fillColor: colorTableBg, textColor: colorBlue, fontStyle: 'bold', cellWidth: 40 },
        3: { cellWidth: 45 }
      },
      body: [
        ['Activo', op.asset, 'Tipo de operación', op.type === 'COMPRA' ? 'Compra' : 'Venta'],
        ['Cantidad', `${op.amount_crypto} USDT`, 'Precio unitario', `Bs. ${op.unit_price_bs.toLocaleString('es-VE')}`],
        ['Total', `Bs. ${op.total_amount_bs.toLocaleString('es-VE')}`, 'Fecha', dateStr],
        ['Plataforma', op.platform, 'N.° de orden', op.order_number_binance || 'N/A']
      ]
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // III. Proceso Operativo
    drawSection("III. Proceso Operativo");
    doc.setFontSize(9.5);
    const steps = [
      "1. Registro y verificación: cuenta creada bajo protocolos KYC y prevención de lavado de dinero (AML).",
      "2. Depósito de fondos: transferencia de fondos en moneda local o activos digitales al Exchange.",
      "3. Intercambio: ejecución de compra/venta de activos digitales según condiciones de mercado.",
      "4. Retiro de fondos: conversión y transferencia a cuentas bancarias nacionales o billeteras digitales."
    ];
    steps.forEach(step => {
      const splitStep = doc.splitTextToSize(step, maxWidth - 5);
      doc.text(splitStep, margin + 5, y);
      y += splitStep.length * 4.5;
    });
    y += 2;
    const platText = "Las plataformas utilizadas operan bajo estándares de seguridad y trazabilidad, encontrándose en algunos casos registradas ante la Superintendencia Nacional de Criptoactivos y Actividades Conexas (SUNACRIP), conforme al Sistema Integral de Criptoactivos (SIC).";
    const splitPlat = doc.splitTextToSize(platText, maxWidth);
    doc.text(splitPlat, margin, y, { align: 'justify' });
    y += splitPlat.length * 4.5 + 4;

    // IV. Destino de Fondos
    drawSection("IV. Destino de los Fondos y Obligaciones Fiscales");
    const taxText = "Las ganancias obtenidas son reinvertidas parcialmente, liquidándose el resto a moneda fiduciaria para su uso en la economía tradicional. El declarante manifiesta estar en conocimiento de sus obligaciones fiscales, incluyendo la eventual aplicación del IGTF y demás tributos aplicables conforme a la ley venezolana. El destino de los fondos corresponde a gastos personales y familiares (servicios, alimentación, salud).";
    const splitTax = doc.splitTextToSize(taxText, maxWidth);
    doc.text(splitTax, margin, y, { align: 'justify' });
    y += splitTax.length * 4.5 + 8;

    // V. Certificación
    doc.setDrawColor(colorBlue[0], colorBlue[1], colorBlue[2]);
    doc.setLineWidth(0.2);
    doc.setFillColor(245, 248, 252);
    doc.rect(margin, y, maxWidth, 18, 'FD');
    y += 5;
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.setTextColor(colorBlue[0], colorBlue[1], colorBlue[2]);
    doc.text("V. Certificación de Ingresos (Cripto)", margin + 5, y);
    y += 5;
    doc.setFont("times", "normal");
    doc.setFontSize(9.3);
    doc.setTextColor(colorText[0], colorText[1], colorText[2]);
    const certText = `Se certifica que el usuario ha recibido la cantidad de Bs. ${op.total_amount_bs.toLocaleString('es-VE')} producto de la liquidación de ${op.amount_crypto} USDT en la plataforma ${op.platform} con fecha ${dateStr}.`;
    doc.text(doc.splitTextToSize(certText, maxWidth - 10), margin + 5, y);
    y += 15;

    // Signature/Base
    doc.setFontSize(9);
    doc.setTextColor(68, 68, 68);
    doc.text("Base normativa: Decreto Constituyente sobre el Sistema Integral de Criptoactivos", pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text("y Providencia SUNACRIP N.° 008-2019 (Gaceta Oficial N.° 41.578).", pageWidth / 2, y, { align: 'center' });

    // Footer
    y = pageHeight - 25;
    doc.setDrawColor(159, 179, 204);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
    doc.setFontSize(7.3);
    doc.setTextColor(102, 102, 102);
    doc.setFont("times", "italic");
    const footerText = t('legal_report_disclaimer');
    const splitFooter = doc.splitTextToSize(footerText, maxWidth);
    doc.text(splitFooter, margin, y, { align: 'center' });

    doc.save(`Informe_P2P_${op.order_number_binance || op.id.substring(0, 12).toUpperCase()}.pdf`);
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
