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

    // 1. Header: Company Info (Left)
    if (company?.logo_url) {
        try {
            doc.addImage(company.logo_url, 'PNG', 20, 15, 35, 35);
        } catch (e) {
            console.error("Logo add failed", e);
        }
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 43, 91);
    doc.text(company?.name?.toUpperCase() || "BIMONEDA S.A.", 60, 22);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(`RIF: ${company?.rif || "J-00000000-0"}`, 60, 27);
    doc.text(`CÓDIGO ACTIVIDAD ECONÓMICA: ${company?.economic_activity_code || "9499"}`, 60, 31);

    const splitAddr = doc.splitTextToSize(company?.address || "Dirección Fiscal de la Empresa", 80);
    doc.text(splitAddr, 60, 36);
    doc.text(`TELÉFONO: ${company?.phone || ""}`, 60, 48);
    doc.text(`EMAIL: ${company?.email || ""}`, 60, 52);

    // 2. Invoice Meta Block (Right)
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageWidth - 85, 15, 65, 48, 1, 1, 'S');

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
    doc.text(`HORA EMISIÓN: ${invoice.issue_time || "N/A"}`, pageWidth - 52.5, 57, { align: 'center' });

    // QR Code for Verification
    try {
        const qrData = `RIF:${company?.rif}|CTRL:${invoice.control_number}|TOTAL:${invoice.total_usd}`;
        const qrUrl = await QRCode.toDataURL(qrData);
        doc.addImage(qrUrl, 'PNG', pageWidth - 80, 65, 20, 20);
    } catch (e) {
        console.error("QR fail", e);
    }

    // 3. Client Block (Styled)
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(20, 88, pageWidth - 40, 42, 1, 1, 'F');
    doc.setDrawColor(220);
    doc.roundedRect(20, 88, pageWidth - 40, 42, 1, 1, 'S');

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE / RECEPTOR", 25, 94);

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`NOMBRE/RAZÓN SOCIAL: ${invoice.clients?.name?.toUpperCase() || "CLIENTE FINAL"}`, 25, 100);
    doc.text(`RIF / C.I.: ${invoice.clients?.rif || "N/A"}`, 25, 106);
    doc.text(`TELÉFONO: ${invoice.clients?.phone || "N/A"}`, 130, 106);

    doc.text(`CONDICIÓN PAGO: ${invoice.payment_condition || "CONTADO"}`, 25, 112);
    doc.text(`TIPO VENTA: ${invoice.sale_type || "INTERNA"}`, 130, 112);

    doc.setFontSize(8);
    doc.text("DIRECCIÓN FISCAL:", 25, 118);
    doc.setFont("helvetica", "normal");
    const clAddr = doc.splitTextToSize(invoice.clients?.address || "N/A", pageWidth - 55);
    doc.text(clAddr, 25, 123);

    // 4. Items Table
    autoTable(doc, {
      startY: 135,
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

    // 5. Financial Summary (Dual Currency)
    const finalY = (doc as any).lastAutoTable.finalY + 10;
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
        startY: finalY,
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

    // 6. Observations and Legal
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.text(`OBSERVACIONES: ${invoice.observations || "Ninguna."}`, 20, totalY + 25);

    // Certification Block
    const certY = totalY + 35;
    doc.setFontSize(7);
    doc.setTextColor(100);
    if (company?.cert_provider_name) {
        const certInfo = `PROVEEDOR DE CERTIFICADOS ${company.cert_provider_name} ${company.cert_provider_rif}. Providencia ${company.cert_provider_providence}. Rango Control: ${company.control_range_from} - ${company.control_range_to}.`;
        doc.text(doc.splitTextToSize(certInfo, pageWidth - 40), 20, certY);
    } else {
        doc.text("Documento generado digitalmente por FacturaPro VE. Numeración de control interna del emisor — pendiente de autorización de Imprenta Digital SENIAT.", 20, certY);
    }

    // Legal Footers from Strings
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "italic");
    const igtfText = doc.splitTextToSize(t('legal_igtf_disclaimer'), pageWidth - 40);
    doc.text(igtfText, 20, certY + 12);

    const equivText = doc.splitTextToSize(t('legal_currency_equivalence'), pageWidth - 40);
    doc.text(equivText, 20, certY + 22);

    // Signature Overlap
    if (company?.signature_url) {
        doc.addImage(company.signature_url, 'PNG', pageWidth - 60, certY - 15, 30, 20);
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
    <div className="min-h-screen bg-background pb-12 font-inter">
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

      <main className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-level-2 border border-outline-variant/30 p-6 md:p-10 relative">
          <div className="text-center py-10 opacity-30">
            <svg className="h-20 w-20 mx-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 font-bold uppercase tracking-[0.3em]">Previsualización Profesional PDF</p>
            <p className="text-xs">Usa los botones de arriba para descargar o enviar el documento real.</p>
          </div>

          {/* Detailed Summary for App View */}
          <div className="mt-10 space-y-4 border-t border-outline-variant/20 pt-10">
            <div className="flex justify-between">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Cliente</span>
                <span className="text-sm font-bold text-primary">{invoice.clients?.name}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Monto Total</span>
                <span className="text-sm font-bold text-primary">${invoice.total_usd.toFixed(2)} / Bs. {invoice.total_bs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">N.º Control</span>
                <span className="text-sm font-bold text-red-600">{invoice.control_number}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Invoice;
