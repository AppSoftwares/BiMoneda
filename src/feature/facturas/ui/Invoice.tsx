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

    // Preparation
    const logoBase64 = company?.logo_url ? await getBase64FromUrl(company.logo_url) : null;

    // --- 1. COMPACT HEADER (FIXED OVERLAP & MARGINS) ---
    let y = 15;

    // Logo (Left)
    if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', margin, y, 25, 25); } catch (e) {}
    }

    // Company Details (Center-Left)
    const companyTextX = margin + 30;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 43, 91);
    doc.text(company?.name?.toUpperCase() || "BIMONEDA S.A.", companyTextX, y + 5);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(`RIF: ${company?.rif || "J-12345678-0"}`, companyTextX, y + 9);
    doc.text(`CÓDIGO ACTIVIDAD ECONÓMICA: ${company?.economic_activity_code || "9499"}`, companyTextX, y + 12.5);

    const companyAddr = doc.splitTextToSize(company?.address || "Dirección Fiscal", 70);
    doc.text(companyAddr, companyTextX, y + 16, { align: 'justify', maxWidth: 70 });

    const addrLinesCount = companyAddr.length;
    const contactY = y + 16 + (addrLinesCount * 4.5);
    doc.text(`Teléfono: ${company?.phone || ""} | Correo: ${company?.email || ""}`, companyTextX, contactY);

    // Invoice Meta (Far Right)
    const metaX = pageWidth - 65;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 43, 91);
    doc.text("FACTURA", metaX, y + 5);

    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text(`N° Documento:`, metaX, y + 10);
    doc.text(invoice.invoice_number.toString(), pageWidth - margin, y + 10, { align: 'right' });

    doc.text(`N° de Control:`, metaX, y + 14);
    doc.setTextColor(200, 0, 0); // RED
    doc.setFont("helvetica", "bold");
    doc.text((invoice.control_number || "00-000000").toString(), pageWidth - margin, y + 14, { align: 'right' });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(`Fecha de emisión:`, metaX, y + 18);
    doc.text(`${new Date(invoice.issue_date).toLocaleDateString('es-VE')}`, pageWidth - margin, y + 18, { align: 'right' });

    doc.text(`Hora de emisión:`, metaX, y + 22);
    doc.text(`${(invoice.issue_time || "N/A").toString()}`, pageWidth - margin, y + 22, { align: 'right' });

    // Separator Line
    doc.setDrawColor(220);
    doc.line(margin, 52, pageWidth - margin, 52);

    // --- 2. CLIENT SECTION (STRICT COLUMNS TO AVOID OVERLAP) ---
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

    // Right Column: Moved further left ("rueda ... a la izquierda") to gain space
    // Let's align labels to margin + 110 or so
    const col2X = margin + 110;
    doc.text("RIF/CI:", col2X, clientY);
    doc.setFont("helvetica", "bold");
    doc.text((invoice.clients?.rif || "N/A").toString(), col2X + 25, clientY);

    doc.setFont("helvetica", "normal");
    doc.text("Teléfono:", col2X, clientY + 5);
    doc.text((invoice.clients?.phone || "N/A").toString(), col2X + 25, clientY + 5);

    doc.text("Condición Pago:", col2X, clientY + 10);
    doc.text((invoice.payment_condition || "CONTADO").toString(), col2X + 28, clientY + 10);

    doc.text("Tipo Venta:", col2X, clientY + 15);
    doc.text((invoice.sale_type || "INTERNA").toString(), col2X + 28, clientY + 15);

    // --- 3. ITEMS TABLE (JUSTIFIED) ---
    const tableY = Math.max(clAddrY + (clAddr.length * 4.5), clientY + 20) + 5;
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
      headStyles: { fillColor: [250, 250, 250], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
      columnStyles: {
        '2': { cellWidth: 55, halign: 'justify' }, // JUSTIFIED
        '4': { halign: 'right' },
        '7': { halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    // --- 4. FINANCIAL SUMMARY (ANCHORED TO BOTTOM) ---
    const footerSpace = 55;
    const summaryRows = 4 + (invoice.igtf_usd > 0 ? 1 : 0);
    const summaryBlockHeight = (summaryRows * 5.5) + 12;
    const summaryY = pageHeight - footerSpace - summaryBlockHeight;

    const summaryX = pageWidth - 110;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);

    let sumY = summaryY;
    const rowH = 5.5;

    const summaryItems = [
        { label: "SubTotal", val: invoice.subtotal_usd },
        { label: "Exento", val: 0 },
        { label: "Base Imponible 16%", val: invoice.subtotal_usd },
        { label: "IVA 16%", val: invoice.iva_usd }
    ];
    if (invoice.igtf_usd > 0) summaryItems.push({ label: "IGTF 3%", val: invoice.igtf_usd });

    summaryItems.forEach(item => {
        doc.text(item.label, summaryX, sumY);
        doc.text(`$${item.val.toFixed(2)}`, pageWidth - 60, sumY, { align: 'right' });
        doc.text(`Bs. ${(item.val * invoice.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, pageWidth - margin, sumY, { align: 'right' });
        sumY += rowH;
    });

    // Total Row Highlight
    doc.setFillColor(13, 43, 91);
    doc.rect(summaryX - 5, sumY, 105 + 5, 10, 'F');
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", summaryX, sumY + 6.5);
    doc.text(`$${invoice.total_usd.toFixed(2)}`, pageWidth - 60, sumY + 6.5, { align: 'right' });
    doc.text(`Bs. ${invoice.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, pageWidth - margin - 2, sumY + 6.5, { align: 'right' });

    // --- 5. QR CODE (BIG, BOTTOM LEFT PEQUEÑO AL BORDE) ---
    try {
        const qrData = `RIF:${company?.rif}|CTRL:${invoice.control_number}|TOTAL:${invoice.total_usd}`;
        const qrUrl = await QRCode.toDataURL(qrData);
        // Positioned bottom left near border, size increased (25x25)
        doc.addImage(qrUrl, 'PNG', margin, summaryY, 25, 25);
    } catch (e) {}

    // --- 6. FOOTER (BCV & LEGAL) ---
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

    // Bottom Certification (BiMoneda Branding)
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">Generando factura...</div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center bg-background text-primary">Error: Factura no encontrada</div>;

  return (
    <div className="min-h-screen bg-background pb-12 font-inter text-primary flex flex-col items-center justify-center text-center py-20 opacity-60">
        <svg className="h-20 w-20 mx-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 font-black uppercase tracking-[0.4em] text-xl">Factura Lista</p>
        <p className="text-xs font-bold mt-2 tracking-widest">N.º {invoice.invoice_number}</p>

        <div className="fixed top-4 right-4 flex gap-2">
            <button onClick={handleShare} className="p-3 bg-white text-primary rounded-full shadow-lg active:scale-90 transition-all border border-outline-variant/30">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
               </svg>
            </button>
            <button onClick={handleDownload} className="p-3 bg-primary text-white rounded-full shadow-lg active:scale-90 transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
            </button>
        </div>
    </div>
  );
};

export default Invoice;
