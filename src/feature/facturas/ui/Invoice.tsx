import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../data/db/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
// @ts-ignore
import { Share } from '@capacitor/share';
// @ts-ignore
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useLanguage } from '../../../core/context/LanguageContext';

const Invoice: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: invData } = await supabase
          .from('invoices')
          .select('*, clients(*)')
          .eq('id', id || '')
          .single();

        setInvoice(invData);

        const { data: compData } = await supabase
          .from('company_profile')
          .select('*')
          .single();

        setCompany(compData);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const getBase64FromUrl = async (url: string): Promise<string> => {
    try {
      const data = await fetch(url);
      const blob = await data.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
    } catch (e) {
      return "";
    }
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    const logoBase64 = company?.logo_url ? await getBase64FromUrl(company.logo_url) : null;

    // --- 1. COMPACT HEADER ---
    let headerY = 15;
    if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', margin, headerY, 25, 25); } catch (e) {}
    }
    const companyTextX = margin + 30;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 43, 91);
    doc.text(company?.name?.toUpperCase() || "BIMONEDA S.A.", companyTextX, headerY + 5);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(`RIF: ${company?.rif || "J-12345678-0"}`, companyTextX, headerY + 9);
    doc.text(`CÓDIGO ACTIVIDAD ECONÓMICA: ${company?.economic_activity_code || "9499"}`, companyTextX, headerY + 12.5);
    const companyAddr = doc.splitTextToSize(company?.address || "Dirección Fiscal", 70);
    doc.text(companyAddr, companyTextX, headerY + 16, { align: 'justify', maxWidth: 70 });
    const contactY = headerY + 16 + (companyAddr.length * 4);
    doc.text(`Teléfono: ${company?.phone || ""} | Correo: ${company?.email || ""}`, companyTextX, contactY);

    const metaX = pageWidth - 65;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 43, 91);
    doc.text("FACTURA", metaX, headerY + 5);
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text(`N° Documento:`, metaX, headerY + 10);
    doc.text(invoice.invoice_number.toString(), pageWidth - margin, headerY + 10, { align: 'right' });
    doc.text(`N° de Control:`, metaX, headerY + 14);
    doc.setTextColor(200, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text((invoice.control_number || "00-000000").toString(), pageWidth - margin, headerY + 14, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(`Fecha de emisión:`, metaX, headerY + 18);
    doc.text(`${new Date(invoice.issue_date).toLocaleDateString('es-VE')}`, pageWidth - margin, headerY + 18, { align: 'right' });
    doc.text(`Hora de emisión:`, metaX, headerY + 22);
    doc.text(`${(invoice.issue_time || "N/A").toString()}`, pageWidth - margin, headerY + 22, { align: 'right' });

    doc.setDrawColor(220);
    doc.line(margin, 52, pageWidth - margin, 52);

    // --- 2. CLIENT SECTION ---
    let clientY = 58;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text("Nombre ó Razón Social:", margin, clientY);
    doc.setFont("helvetica", "bold");
    const clName = doc.splitTextToSize((invoice.clients?.name || "CLIENTE FINAL").toString(), 65);
    doc.text(clName, margin + 35, clientY);
    const clAddrY = clientY + (clName.length * 4.5);
    doc.setFont("helvetica", "normal");
    doc.text("Domicilio Fiscal:", margin, clAddrY);
    const clAddr = doc.splitTextToSize((invoice.clients?.address || "N/A").toString(), 65);
    doc.text(clAddr, margin + 35, clAddrY, { align: 'justify', maxWidth: 65 });

    const col2X = pageWidth - margin - 55;
    doc.text("RIF/CI:", col2X, clientY);
    doc.setFont("helvetica", "bold");
    doc.text((invoice.clients?.rif || "N/A").toString(), pageWidth - margin, clientY, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.text("Teléfono:", col2X, clientY + 5);
    doc.text((invoice.clients?.phone || "N/A").toString(), pageWidth - margin, clientY + 5, { align: 'right' });
    doc.text("Condición Pago:", col2X, clientY + 10);
    doc.text((invoice.payment_condition || "CONTADO").toString(), pageWidth - margin, clientY + 10, { align: 'right' });
    doc.text("Tipo Venta:", col2X, clientY + 15);
    doc.text((invoice.sale_type || "INTERNA").toString(), pageWidth - margin, clientY + 15, { align: 'right' });

    // --- 3. ITEMS TABLE ---
    const tableY = Math.max(clAddrY + (clAddr.length * 4.5), clientY + 22) + 5;
    autoTable(doc, {
      startY: tableY,
      head: [['Cant.', 'Código', 'Descripción del Concepto / Servicio', 'Unid.', 'P. Unit.', '% Desc.', 'Alíc.', 'Importe']],
      body: [
        [
            "1.00",
            (invoice.item_code || "SERV-01").toString(),
            (invoice.concept || "Servicio Digital").toString(),
            (invoice.item_unit || "SERVICIO").toString(),
            `$${invoice.subtotal_usd.toFixed(2)}`,
            `${(invoice.discount_percent || "0.00").toString()}%`,
            (invoice.tax_aliquot || "G").toString(),
            `$${invoice.subtotal_usd.toFixed(2)}`
        ]
      ],
      styles: { fontSize: 7.5, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [248, 248, 248], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
      columnStyles: {
        '2': { cellWidth: 55, halign: 'justify' },
        '4': { halign: 'right' },
        '7': { halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    // --- 4. FINANCIAL SUMMARY (ANCHORED TO BOTTOM) ---
    const footerSpace = 60;
    const summaryRows = 4 + (invoice.igtf_usd > 0 ? 1 : 0);
    const summaryBlockHeight = (summaryRows * 5.5) + 12;
    const summaryY = pageHeight - footerSpace - summaryBlockHeight;
    const summaryX = pageWidth - 110;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    let sumY = summaryY;
    const rowH = 5.5;
    const items = [
        { label: "SubTotal", val: invoice.subtotal_usd },
        { label: "Exento", val: 0 },
        { label: "Base Imponible 16%", val: invoice.subtotal_usd },
        { label: "IVA 16%", val: invoice.iva_usd }
    ];
    if (invoice.igtf_usd > 0) items.push({ label: "IGTF 3%", val: invoice.igtf_usd });
    items.forEach(item => {
        doc.text(item.label, summaryX, sumY);
        doc.text(`$${item.val.toFixed(2)}`, pageWidth - 60, sumY, { align: 'right' });
        doc.text(`Bs. ${(item.val * invoice.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, pageWidth - margin, sumY, { align: 'right' });
        sumY += rowH;
    });
    doc.setFillColor(13, 43, 91);
    doc.rect(pageWidth - 115, sumY, 100, 10, 'F');
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", pageWidth - 110, sumY + 7);
    doc.text(`$${invoice.total_usd.toFixed(2)}`, pageWidth - 60, sumY + 7, { align: 'right' });
    doc.text(`Bs. ${invoice.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, pageWidth - margin - 2, sumY + 7, { align: 'right' });

    // --- 5. QR CODE (BOTTOM LEFT) ---
    try {
        const qrData = `RIF:${company?.rif}|CTRL:${invoice.control_number}|TOTAL:${invoice.total_usd}`;
        const qrUrl = await QRCode.toDataURL(qrData);
        doc.addImage(qrUrl, 'PNG', margin, summaryY, 25, 25);
    } catch (e) {}

    // --- 6. FOOTER ---
    const footerStartY = pageHeight - 42;
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Tipo de cambio BCV a la fecha de emisión: ${invoice.bcv_rate.toFixed(4)} Bs/USD`, margin, footerStartY);
    doc.text(`OBSERVACIONES: ${(invoice.observations || "Ninguna.").toString()}`, margin, footerStartY + 5);
    doc.setFontSize(6.5);
    doc.setTextColor(150);
    doc.setFont("helvetica", "italic");
    const disclaimer1 = t('legal_igtf_disclaimer');
    const disclaimer2 = t('legal_currency_equivalence');
    const lines1 = doc.splitTextToSize(disclaimer1, pageWidth - 30);
    doc.text(lines1, margin, footerStartY + 12);
    const lines2 = doc.splitTextToSize(disclaimer2, pageWidth - 30);
    doc.text(lines2, margin, footerStartY + 12 + (lines1.length * 3.5));
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    const certText = `Documento generado digitalmente por BiMoneda. Numeración de control interna — pendiente de autorización de Imprenta Digital SENIAT.`;
    doc.text(doc.splitTextToSize(certText, pageWidth - 40), pageWidth / 2, pageHeight - 8, { align: 'center' });

    return doc;
  };

  const handleDownload = async () => {
    try {
        const doc = await generatePDF();
        doc.save(`Factura_${invoice.invoice_number}.pdf`);
    } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Error al generar el PDF.");
    }
  };

  const handleShare = async () => {
    try {
      const doc = await generatePDF();
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const fileName = `Factura_${invoice.invoice_number}.pdf`;
      const result = await Filesystem.writeFile({ path: fileName, data: pdfBase64, directory: Directory.Cache });
      await Share.share({ title: 'Compartir Factura', text: `Factura Digital ${invoice.invoice_number}`, url: result.uri, dialogTitle: 'Enviar Factura' });
    } catch (err) {
      const doc = await generatePDF();
      doc.save(`Factura_${invoice.invoice_number}.pdf`);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#0b1c30] text-primary dark:text-white font-bold transition-colors">Cargando...</div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#0b1c30] text-primary dark:text-white transition-colors">Factura no encontrada</div>;

  return (
    <div className="min-h-screen bg-background dark:bg-[#0b1c30] pb-32 font-inter text-primary dark:text-white transition-colors">
      <header className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-[#0d2b5b]/90 backdrop-blur-md border-b border-outline-variant/30 dark:border-white/10 px-6 h-20 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-3 bg-surface-container-low dark:bg-white/10 text-primary dark:text-white rounded-xl border border-outline-variant/30 dark:border-white/10 active:scale-90 transition-all shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex gap-3">
          <button onClick={handleShare} className="p-3 bg-surface-container-low dark:bg-white/10 text-primary dark:text-white rounded-xl border border-outline-variant/30 dark:border-white/10 active:scale-90 transition-all shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button onClick={handleDownload} className="p-3 bg-primary dark:bg-secondary text-white rounded-xl shadow-lg active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-6 pt-24 space-y-4">
        <div className="bg-white dark:bg-white/5 rounded-lg border border-outline-variant dark:border-white/10 shadow-level-2 p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <img src={company?.logo_url || "/logo-1024.png"} className="h-12 w-12 object-contain mb-2" />
              <h1 className="text-sm font-bold text-primary dark:text-white uppercase">{company?.name}</h1>
              <p className="text-[10px] text-on-surface-variant dark:text-white/40 font-medium uppercase tracking-widest">RIF: {company?.rif}</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-black text-primary dark:text-secondary tracking-tighter">FACTURA</h2>
              <p className="text-[10px] font-bold text-red-600 dark:text-red-400">N.º {invoice.invoice_number}</p>
              <p className="text-[10px] text-on-surface-variant dark:text-white/40 font-medium">{new Date(invoice.issue_date).toLocaleDateString('es-VE')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[10px] pt-4 border-t border-outline-variant/30 dark:border-white/10">
            <div className="space-y-2">
              <span className="font-bold text-on-surface-variant dark:text-white/60 uppercase tracking-widest block">Cliente</span>
              <p className="font-bold text-primary dark:text-white uppercase">{invoice.clients?.name}</p>
              <p className="text-on-surface-variant dark:text-white/40 leading-tight">{invoice.clients?.address}</p>
            </div>
            <div className="space-y-1 text-right dark:text-white/60">
              <p><span className="font-bold">RIF:</span> {invoice.clients?.rif}</p>
              <p><span className="font-bold">TEL:</span> {invoice.clients?.phone}</p>
              <p><span className="font-bold uppercase tracking-tighter">Condición:</span> {invoice.payment_condition}</p>
            </div>
          </div>

          <div className="pt-4">
            <div className="bg-surface-container-low dark:bg-white/10 p-3 rounded-t-md flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-white/60">
              <span>Descripción</span>
              <span>Total</span>
            </div>
            <div className="p-4 border-x border-b border-outline-variant/30 dark:border-white/10 rounded-b-md space-y-2">
              <p className="text-[10px] leading-relaxed text-primary dark:text-white">{invoice.concept}</p>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[9px] font-bold text-on-surface-variant dark:text-white/40">1.00 x ${invoice.subtotal_usd.toFixed(2)}</span>
                <span className="text-sm font-bold text-primary dark:text-white">${invoice.subtotal_usd.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <div className="flex justify-between text-[10px] font-bold uppercase text-on-surface-variant dark:text-white/60">
              <span>Base Imponible 16%</span>
              <span>${invoice.subtotal_usd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase text-on-surface-variant dark:text-white/60">
              <span>I.V.A. 16%</span>
              <span>${invoice.iva_usd.toFixed(2)}</span>
            </div>
            {invoice.igtf_usd > 0 && (
              <div className="flex justify-between text-[10px] font-bold uppercase text-secondary">
                <span>I.G.T.F. 3%</span>
                <span>${invoice.igtf_usd.toFixed(2)}</span>
              </div>
            )}
            <div className="bg-primary dark:bg-[#0d2b5b] p-4 rounded-xl flex justify-between items-center text-white mt-4 shadow-lg">
              <span className="text-sm font-bold uppercase tracking-widest">TOTAL</span>
              <div className="text-right">
                <div className="text-xl font-black">${invoice.total_usd.toFixed(2)}</div>
                <div className="text-[9px] font-bold text-secondary uppercase italic">Bs. {invoice.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-on-surface-variant dark:text-white/40 italic font-medium pt-4 text-center border-t border-outline-variant/20 dark:border-white/10">
            Tipo de cambio BCV a la fecha de emisión: {invoice.bcv_rate.toFixed(4)} Bs/USD
          </p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
