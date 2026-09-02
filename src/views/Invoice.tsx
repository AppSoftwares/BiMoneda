import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
// @ts-ignore
import { Share } from '@capacitor/share';
// @ts-ignore
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useLanguage } from '../context/LanguageContext';

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

    // Prepare data
    const logoBase64 = company?.logo_url ? await getBase64FromUrl(company.logo_url) : null;

    // --- 1. COMPACT HEADER (GRID STYLE) ---
    // Logo & Company Info (Left/Center)
    if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', margin, 12, 28, 28); } catch (e) {}
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 43, 91); // Navy BIMONEDA
    doc.text(company?.name?.toUpperCase() || "BIMONEDA S.A.", 48, 18);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(`RIF: ${company?.rif || "J-00000000-0"}`, 48, 22);
    doc.text(`CÓDIGO ACTIVIDAD ECONÓMICA: ${company?.economic_activity_code || "9499"}`, 48, 25.5);

    const emitterAddr = doc.splitTextToSize(company?.address || "Dirección Fiscal", 70);
    doc.text(emitterAddr, 48, 29);
    doc.text(`TELÉFONO: ${company?.phone || ""}  |  EMAIL: ${company?.email || ""}`, 48, 37);

    // Meta Info Block (Far Right)
    const metaX = pageWidth - 65;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 43, 91);
    doc.text("FACTURA", metaX, 18);

    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text("N.º DOCUMENTO:", metaX, 24);
    doc.setTextColor(200, 0, 0); // RED
    doc.text(invoice.invoice_number.toString(), pageWidth - margin, 24, { align: 'right' });

    doc.setTextColor(0);
    doc.text("N.º CONTROL:", metaX, 28);
    doc.setTextColor(200, 0, 0); // RED
    doc.text((invoice.control_number || "00-000000").toString(), pageWidth - margin, 28, { align: 'right' });

    doc.setTextColor(80);
    doc.setFont("helvetica", "normal");
    doc.text(`FECHA EMISIÓN:`, metaX, 32);
    doc.setTextColor(0);
    doc.text(`${new Date(invoice.issue_date).toLocaleDateString('es-VE')}`, pageWidth - margin, 32, { align: 'right' });

    doc.setTextColor(80);
    doc.text(`HORA EMISIÓN:`, metaX, 36);
    doc.setTextColor(0);
    doc.text(`${(invoice.issue_time || "N/A").toString()}`, pageWidth - margin, 36, { align: 'right' });

    // Tiny QR in corner
    try {
        const qrData = `RIF:${company?.rif}|CTRL:${invoice.control_number}|TOTAL:${invoice.total_usd}`;
        const qrUrl = await QRCode.toDataURL(qrData);
        doc.addImage(qrUrl, 'PNG', pageWidth - margin - 15, 38, 15, 15);
    } catch (e) {}

    // Separator line
    doc.setDrawColor(230);
    doc.line(margin, 52, pageWidth - margin, 52);

    // --- 2. CLIENT BLOCK ---
    let yPos = 60;
    doc.setFontSize(7.5);
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE / RECEPTOR", margin, yPos);

    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text("NOMBRE / RAZÓN SOCIAL:", margin, yPos);
    doc.setFont("helvetica", "bold");
    doc.text((invoice.clients?.name?.toUpperCase() || "CLIENTE FINAL").toString(), margin + 45, yPos);

    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.text("DOMICILIO FISCAL:", margin, yPos);
    const clientAddrLines = doc.splitTextToSize((invoice.clients?.address || "N/A").toString(), 85);
    doc.text(clientAddrLines, margin + 45, yPos);

    const col2X = pageWidth / 2 + 15;
    let yPos2 = 65;
    doc.text("RIF / C.I.:", col2X, yPos2);
    doc.setFont("helvetica", "bold");
    doc.text((invoice.clients?.rif || "N/A").toString(), col2X + 35, yPos2, { align: 'right' });

    yPos2 += 5;
    doc.setFont("helvetica", "normal");
    doc.text("TELÉFONO:", col2X, yPos2);
    doc.text((invoice.clients?.phone || "N/A").toString(), col2X + 35, yPos2, { align: 'right' });

    yPos2 += 5;
    doc.text("CONDICIÓN PAGO:", col2X, yPos2);
    doc.text((invoice.payment_condition || "CONTADO").toString(), col2X + 35, yPos2, { align: 'right' });

    yPos2 += 5;
    doc.text("TIPO VENTA:", col2X, yPos2);
    doc.text((invoice.sale_type || "INTERNA").toString(), col2X + 35, yPos2, { align: 'right' });

    // --- 3. ITEMS TABLE ---
    autoTable(doc, {
      startY: yPos + (clientAddrLines.length * 4) + 5,
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
      headStyles: { fillColor: [13, 43, 91], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        '2': { cellWidth: 55 },
        '4': { halign: 'right' },
        '7': { halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    // --- 4. FINANCIAL SUMMARY ---
    const summaryY = (doc as any).lastAutoTable.finalY + 8;
    const summaryData = [
        ["SubTotal", `$${invoice.subtotal_usd.toFixed(2)}`, `Bs. ${(invoice.subtotal_usd * invoice.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`],
        ["Exento", "$0.00", "Bs. 0,00"],
        ["Base Imponible 16%", `$${invoice.subtotal_usd.toFixed(2)}`, `Bs. ${(invoice.subtotal_usd * invoice.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`],
        ["IVA 16%", `$${invoice.iva_usd.toFixed(2)}`, `Bs. ${(invoice.iva_usd * invoice.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`],
    ];
    if (invoice.igtf_usd > 0) {
        summaryData.push(["IGTF 3%", `$${invoice.igtf_usd.toFixed(2)}`, `Bs. ${(invoice.igtf_usd * invoice.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`]);
    }

    autoTable(doc, {
        startY: summaryY,
        margin: { left: pageWidth - 120 },
        body: summaryData,
        styles: { fontSize: 8, halign: 'right', cellPadding: 1.5, font: 'helvetica' },
        columnStyles: {
            '0': { fontStyle: 'bold', halign: 'left', cellWidth: 40 },
            '1': { cellWidth: 30 },
            '2': { cellWidth: 35 }
        },
        theme: 'plain'
    });

    // Total Row
    const totalY = (doc as any).lastAutoTable.finalY + 2;
    doc.setFillColor(13, 43, 91);
    doc.rect(pageWidth - 120, totalY, 105, 10, 'F');
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", pageWidth - 115, totalY + 6.5);
    doc.text(`$${invoice.total_usd.toFixed(2)}`, pageWidth - 60, totalY + 6.5, { align: 'right' });
    doc.text(`Bs. ${invoice.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, totalY + 6.5, { align: 'right' });

    // --- 5. FOOTER ---
    const footerY = pageHeight - 50;
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`Tipo de cambio BCV a la fecha de emisión: ${invoice.bcv_rate.toFixed(4)} Bs/USD`, margin, footerY);

    doc.setFontSize(7.5);
    doc.text(`OBSERVACIONES: ${(invoice.observations || "Ninguna.").toString()}`, margin, footerY + 6);

    doc.setFontSize(6.5);
    doc.setTextColor(130);
    doc.setFont("helvetica", "italic");
    const legal1 = doc.splitTextToSize(t('legal_igtf_disclaimer'), pageWidth - 30);
    doc.text(legal1, margin, pageHeight - 32);
    const legal2 = doc.splitTextToSize(t('legal_currency_equivalence'), pageWidth - 30);
    doc.text(legal2, margin, pageHeight - 24);

    const certY = pageHeight - 10;
    doc.setFontSize(6.5);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    const certInfo = company?.cert_provider_name
        ? `PROVEEDOR DE CERTIFICADOS ${company.cert_provider_name} ${company.cert_provider_rif}. Providencia ${company.cert_provider_providence}.`
        : "Documento generado digitalmente por FacturaPro VE. Numeración de control interna — pendiente de autorización de Imprenta Digital SENIAT.";
    doc.text(doc.splitTextToSize(certInfo, pageWidth - 40), pageWidth / 2, certY, { align: 'center' });

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

      const result = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Cache
      });

      await Share.share({
        title: 'Compartir Factura',
        text: `Factura Digital ${invoice.invoice_number}`,
        url: result.uri,
        dialogTitle: 'Enviar Factura'
      });
    } catch (err) {
      const doc = await generatePDF();
      doc.save(`Factura_${invoice.invoice_number}.pdf`);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">Generando documento compacto...</div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center bg-background">Factura no encontrada</div>;

  return (
    <div className="min-h-screen bg-background pb-12 font-inter text-primary">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-outline-variant/30 px-6 h-16 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary active:scale-90 transition-transform flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-bold uppercase tracking-tight">Factura Legal</span>
        </button>
        <div className="flex gap-2">
            <button onClick={handleShare} className="p-2 bg-surface-container-low text-primary rounded-lg border border-outline-variant/30 active:scale-90 transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
               </svg>
            </button>
            <button onClick={handleDownload} className="p-2 bg-primary text-white rounded-lg active:scale-90 transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
            </button>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-4xl mx-auto text-center py-20 opacity-60">
        <svg className="h-20 w-20 mx-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 font-black uppercase tracking-[0.4em] text-xl">Factura Lista</p>
        <p className="text-xs font-bold mt-2 tracking-widest">N.º {invoice.invoice_number}</p>
        <div className="mt-12 bg-white p-6 rounded-xl border border-outline-variant/30 text-left space-y-4 max-w-sm mx-auto shadow-sm">
            <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                <span>Cliente</span>
                <span className="text-primary">{invoice.clients?.name}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-t border-outline-variant/20 pt-2">
                <span>Total USD</span>
                <span className="text-primary font-black">${invoice.total_usd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                <span>Total VES</span>
                <span className="text-secondary font-black">Bs. {invoice.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Invoice;
