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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Header: Company Info (Left)
    if (company?.logo_url) {
        try {
            doc.addImage(company.logo_url, 'PNG', 20, 15, 30, 30);
        } catch (e) {
            console.error("Logo add failed", e);
        }
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 43, 91);
    doc.text(company?.name?.toUpperCase() || "BIMONEDA S.A.", 55, 22);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(`RIF: ${company?.rif || "J-00000000-0"}`, 55, 27);
    doc.text(`CÓDIGO ACTIVIDAD ECONÓMICA: ${company?.economic_activity_code || "9499"}`, 55, 31);

    const splitAddr = doc.splitTextToSize(company?.address || "Dirección Fiscal de la Empresa", 80);
    doc.text(splitAddr, 55, 36);
    doc.text(`TELÉFONO: ${company?.phone || ""}`, 55, 48);
    doc.text(`EMAIL: ${company?.email || ""}`, 55, 52);

    // 2. Invoice Meta Block (Right)
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageWidth - 85, 15, 65, 45, 1, 1, 'S');

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 43, 91);
    doc.text("FACTURA", pageWidth - 52.5, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("N.º DOCUMENTO:", pageWidth - 80, 38);
    doc.setTextColor(200, 0, 0); // RED
    doc.text(invoice.invoice_number, pageWidth - 25, 38, { align: 'right' });

    doc.setTextColor(0);
    doc.text("N.º CONTROL:", pageWidth - 80, 45);
    doc.setTextColor(200, 0, 0);
    doc.text(invoice.control_number || "00-000000", pageWidth - 25, 45, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`FECHA EMISIÓN: ${new Date(invoice.issue_date).toLocaleDateString('es-VE')}`, pageWidth - 52.5, 53, { align: 'center' });

    // QR Code
    try {
        const qrData = `RIF:${company?.rif}|CTRL:${invoice.control_number}|TOTAL:${invoice.total_usd}`;
        const qrUrl = await QRCode.toDataURL(qrData);
        doc.addImage(qrUrl, 'PNG', pageWidth - 80, 62, 18, 18);
    } catch (e) {
        console.error("QR fail", e);
    }

    // 3. Client Block
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(20, 85, pageWidth - 40, 38, 1, 1, 'F');
    doc.setDrawColor(220);
    doc.roundedRect(20, 85, pageWidth - 40, 38, 1, 1, 'S');

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE / RECEPTOR", 25, 91);

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`NOMBRE/RAZÓN SOCIAL: ${invoice.clients?.name?.toUpperCase() || "CLIENTE FINAL"}`, 25, 97);
    doc.text(`RIF / C.I.: ${invoice.clients?.rif || "N/A"}`, 25, 103);
    doc.text(`TELÉFONO: ${invoice.clients?.phone || "N/A"}`, 130, 103);

    doc.text(`CONDICIÓN PAGO: ${invoice.payment_condition || "CONTADO"}`, 25, 109);
    doc.text(`TIPO VENTA: ${invoice.sale_type || "INTERNA"}`, 130, 109);

    doc.setFontSize(8);
    doc.text("DIRECCIÓN FISCAL:", 25, 115);
    doc.setFont("helvetica", "normal");
    const clAddr = doc.splitTextToSize(invoice.clients?.address || "N/A", pageWidth - 55);
    doc.text(clAddr, 25, 120);

    // 4. Items Table
    autoTable(doc, {
      startY: 130,
      head: [['Cant.', 'Código', 'Concepto / Descripción', 'Unid.', 'Precio Unit.', '% Desc.', 'Alíc.', 'Importe']],
      body: [
        [
            "1.00",
            invoice.item_code || "SERV-01",
            invoice.concept || "Servicio de Suscripción Digital",
            invoice.item_unit || "SERVICIO",
            `$${invoice.subtotal_usd.toFixed(2)}`,
            `${invoice.discount_percent || "0.00"}%`,
            invoice.tax_aliquot || "G",
            `$${invoice.subtotal_usd.toFixed(2)}`
        ]
      ],
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [13, 43, 91], textColor: [255, 255, 255] },
      columnStyles: {
        2: { cellWidth: 60 },
        4: { halign: 'right' },
        7: { halign: 'right' }
      }
    });

    // 5. Financial Summary
    const finalTableY = (doc as any).lastAutoTable.finalY + 10;
    const summaryData = [
        ["SUBTOTAL", `$${invoice.subtotal_usd.toFixed(2)}`, `Bs. ${(invoice.subtotal_usd * invoice.bcv_rate).toLocaleString('es-VE')}`],
        ["EXENTO (0%)", "$0.00", "Bs. 0,00"],
        ["BASE IMPONIBLE (G 16.00%)", `$${invoice.subtotal_usd.toFixed(2)}`, `Bs. ${(invoice.subtotal_usd * invoice.bcv_rate).toLocaleString('es-VE')}`],
        ["IVA (16.00%)", `$${invoice.iva_usd.toFixed(2)}`, `Bs. ${(invoice.iva_usd * invoice.bcv_rate).toLocaleString('es-VE')}`],
    ];
    if (invoice.igtf_usd > 0) {
        summaryData.push(["IGTF DIVISAS (3.00%)", `$${invoice.igtf_usd.toFixed(2)}`, `Bs. ${(invoice.igtf_usd * invoice.bcv_rate).toLocaleString('es-VE')}`]);
    }

    autoTable(doc, {
        startY: finalTableY,
        margin: { left: pageWidth - 120 },
        body: summaryData,
        styles: { fontSize: 7, halign: 'right' },
        columnStyles: { 0: { fontStyle: 'bold', halign: 'left' } },
        theme: 'plain'
    });

    const totalY = (doc as any).lastAutoTable.finalY + 2;
    doc.setFillColor(13, 43, 91);
    doc.rect(pageWidth - 110, totalY, 90, 12, 'F');
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL FACTURA:", pageWidth - 105, totalY + 8);
    doc.text(`$${invoice.total_usd.toFixed(2)}`, pageWidth - 65, totalY + 8, { align: 'right' });
    doc.text(`Bs. ${invoice.total_bs.toLocaleString('es-VE')}`, pageWidth - 25, totalY + 8, { align: 'right' });

    // 6. ELEGANT BCV CARD (Requested Style)
    const bcvCardX = 20;
    const bcvCardY = pageHeight - 58;
    const bcvCardWidth = 90;
    const bcvCardHeight = 25;

    // Card Background and Border (#F8F9FA, #E0E0E0)
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.3);
    doc.roundedRect(bcvCardX, bcvCardY, bcvCardWidth, bcvCardHeight, 2, 2, 'FD');

    // BCV Logo Placeholder (Simulating imgBcvLogo)
    try {
        doc.addImage('/logo-bcv.png', 'PNG', bcvCardX + 5, bcvCardY + 4, 15, 15);
    } catch (e) {
        // Just a circle if image missing
        doc.setFillColor(220);
        doc.circle(bcvCardX + 12.5, bcvCardY + 12.5, 6, 'F');
    }

    // Text Info (#2C3E50, #7F8C8D, #16A085)
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`TASA BCV DEL DÍA: ${invoice.bcv_rate.toFixed(4)} Bs/USD`, bcvCardX + 25, bcvCardY + 8);

    doc.setTextColor(127, 140, 141);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha Valor: ${new Date(invoice.issue_date).toLocaleDateString('es-VE')}`, bcvCardX + 25, bcvCardY + 14);

    doc.setTextColor(22, 160, 133);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(`Monto Ref. USD: $${invoice.total_usd.toFixed(2)}`, bcvCardX + 25, bcvCardY + 21);

    // 7. Legal Footers
    doc.setTextColor(0);
    doc.setFontSize(7.5);
    doc.text(`OBSERVACIONES: ${invoice.observations || "Ninguna."}`, 20, bcvCardY - 8);

    doc.setFontSize(6.5);
    doc.setTextColor(150);
    doc.setFont("helvetica", "italic");
    const legal1 = doc.splitTextToSize(t('legal_igtf_disclaimer'), pageWidth - 40);
    doc.text(legal1, 20, bcvCardY + 32);
    const legal2 = doc.splitTextToSize(t('legal_currency_equivalence'), pageWidth - 40);
    doc.text(legal2, 20, bcvCardY + 40);

    // Signature Overlap
    if (company?.signature_url) {
        doc.addImage(company.signature_url, 'PNG', pageWidth - 60, bcvCardY + 5, 35, 25);
    }

    return doc;
  };

  const handleDownload = async () => {
    const doc = await generatePDF();
    doc.save(`Factura_${invoice.invoice_number}.pdf`);
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
      console.error('Error sharing:', err);
      alert('Error al intentar compartir el archivo.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">Cargando previsualización profesional...</div>;
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

      <main className="p-4 md:p-8 max-w-4xl mx-auto text-center py-20 opacity-50">
        <svg className="h-20 w-20 mx-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 font-black uppercase tracking-[0.3em] text-lg">Documento Generado</p>
        <p className="text-xs font-bold mt-2">N.º Factura: {invoice.invoice_number}</p>
        <p className="text-[10px] uppercase mt-4">Usa los botones superiores para descargar o compartir por WhatsApp/Email.</p>
      </main>
    </div>
  );
};

export default Invoice;
