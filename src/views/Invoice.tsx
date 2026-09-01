import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// @ts-ignore
import { Share } from '@capacitor/share';
// @ts-ignore
import { Filesystem, Directory } from '@capacitor/filesystem';

const Invoice: React.FC = () => {
  const navigate = useNavigate();
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

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Professional Header (Grid Style)
    if (company?.logo_url) {
        doc.addImage(company.logo_url, 'PNG', 20, 15, 30, 30);
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 43, 91);
    doc.text(company?.name?.toUpperCase() || "BIMONEDA S.A.", 55, 25);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(`RIF: ${company?.rif || "J-00000000-0"}`, 55, 31);
    const splitAddress = doc.splitTextToSize(company?.address || "Dirección Fiscal de la Empresa", 80);
    doc.text(splitAddress, 55, 36);
    doc.text(`Teléfono: ${company?.phone || ""}`, 55, 48);

    // Invoice Info Box (Top Right)
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.roundedRect(pageWidth - 85, 15, 65, 45, 2, 2);

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 43, 91);
    doc.text("FACTURA", pageWidth - 52.5, 28, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("N.º FACTURA:", pageWidth - 80, 40);
    doc.setTextColor(200, 0, 0);
    doc.text(invoice.invoice_number, pageWidth - 25, 40, { align: 'right' });

    doc.setTextColor(0);
    doc.text("N.º CONTROL:", pageWidth - 80, 48);
    doc.setTextColor(200, 0, 0);
    doc.text(invoice.control_number || "00-000000", pageWidth - 25, 48, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`FECHA: ${new Date(invoice.issue_date).toLocaleDateString('es-VE')}`, pageWidth - 52.5, 56, { align: 'center' });

    // 2. Client Details (Full Width Box)
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(20, 65, pageWidth - 40, 35, 1, 1, 'F');
    doc.setDrawColor(220);
    doc.roundedRect(20, 65, pageWidth - 40, 35, 1, 1, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");
    doc.text("RAZÓN SOCIAL / NOMBRE:", 25, 72);
    doc.text("RIF / C.I.:", 130, 72);

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(invoice.clients?.name?.toUpperCase() || "CLIENTE FINAL", 25, 78);
    doc.text(invoice.clients?.rif || "N/A", 130, 78);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("DIRECCIÓN FISCAL:", 25, 86);
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    const clientAddress = invoice.clients?.address || "Sin dirección registrada";
    doc.text(doc.splitTextToSize(clientAddress, pageWidth - 55), 25, 92);

    // 3. Items Table (Professional Layout)
    autoTable(doc, {
      startY: 105,
      head: [['CANT', 'DESCRIPCIÓN / CONCEPTO', 'P. UNIT USD', 'IVA', 'SUBTOTAL USD']],
      body: [
        [
            "1.00",
            invoice.concept || "Servicio de Suscripción",
            `$${invoice.subtotal_usd.toFixed(2)}`,
            "16%",
            `$${invoice.subtotal_usd.toFixed(2)}`
        ]
      ],
      styles: { fontSize: 8, cellPadding: 4, font: 'helvetica' },
      headStyles: { fillColor: [13, 43, 91], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left' },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 35 }
      }
    });

    // 4. Summary and Taxes
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(100);

    const labelX = pageWidth - 100;
    const valueX = pageWidth - 20;

    doc.text("SUBTOTAL:", labelX, finalY);
    doc.text(`$${invoice.subtotal_usd.toFixed(2)}`, valueX, finalY, { align: 'right' });

    doc.text("BASE IMPONIBLE (G 16.00%):", labelX, finalY + 6);
    doc.text(`$${invoice.subtotal_usd.toFixed(2)}`, valueX, finalY + 6, { align: 'right' });

    doc.text("IVA (16.00%):", labelX, finalY + 12);
    doc.text(`$${invoice.iva_usd.toFixed(2)}`, valueX, finalY + 12, { align: 'right' });

    if (invoice.igtf_usd > 0) {
        doc.text("IGTF DIVISAS (3.00%):", labelX, finalY + 18);
        doc.text(`$${invoice.igtf_usd.toFixed(2)}`, valueX, finalY + 18, { align: 'right' });
    }

    // Grand Total Block
    const totalBoxY = finalY + (invoice.igtf_usd > 0 ? 24 : 18);
    doc.setFillColor(13, 43, 91);
    doc.rect(pageWidth - 105, totalBoxY, 85, 20, 'F');

    doc.setTextColor(255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL FACTURA (USD):", pageWidth - 100, totalBoxY + 12);
    doc.setFontSize(16);
    doc.text(`$${invoice.total_usd.toFixed(2)}`, pageWidth - 25, totalBoxY + 12.5, { align: 'right' });

    // Bolivares Label
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("MONTO TOTAL EXPRESADO EN BOLÍVARES (VES):", pageWidth - 105, totalBoxY + 28);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Bs. ${invoice.total_bs.toLocaleString('es-VE')}`, pageWidth - 25, totalBoxY + 36, { align: 'right' });

    // 5. BCV Rate and Legal Disclaimer
    const footerY = 270;
    doc.setDrawColor(200);
    doc.line(20, footerY, pageWidth - 20, footerY);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text(`TASA BCV DEL DÍA: ${invoice.bcv_rate.toFixed(4)} Bs/USD`, 20, footerY + 6);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha Valor: ${new Date(invoice.issue_date).toLocaleDateString('es-VE')}`, 20, footerY + 11);

    doc.setFontSize(7);
    doc.setTextColor(150);
    const legalNotice = "DOCUMENTO EMITIDO SEGÚN PROVIDENCIA SENIAT SNAT/2024/000102. ESTE COMPROBANTE DIGITAL ES VÁLIDO Y EXIGIBLE CONFORME A LA LEY SOBRE MENSAJES DE DATOS Y FIRMAS ELECTRÓNICAS. FIRMADO ELECTRÓNICAMENTE POR BIMONEDA APP.";
    doc.text(doc.splitTextToSize(legalNotice, pageWidth - 50), pageWidth / 2, footerY + 20, { align: 'center' });

    // Signature/Seal
    if (company?.signature_url) {
        doc.addImage(company.signature_url, 'PNG', (pageWidth / 2) - 15, footerY - 45, 30, 25);
        doc.setFontSize(7);
        doc.text("FIRMA AUTORIZADA Y SELLO DIGITAL", pageWidth / 2, footerY - 15, { align: 'center' });
    }

    return doc;
  };

  const handleDownload = () => {
    const doc = generatePDF();
    doc.save(`Factura_${invoice.invoice_number}.pdf`);
  };

  const handleShare = async () => {
    try {
      const doc = generatePDF();
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background">Cargando...</div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center bg-background">Factura no encontrada</div>;

  return (
    <div className="min-h-screen bg-background transition-colors pb-12 font-inter">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-outline-variant/30 px-6 h-16 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary active:scale-90 transition-transform flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-bold uppercase tracking-tight">Detalle de Factura</span>
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
        <div className="bg-white rounded-xl shadow-level-2 border border-outline-variant/30 p-6 md:p-10 relative overflow-hidden">
          {/* Visual Preview */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-surface-container-low rounded-xl flex items-center justify-center p-2 border border-outline-variant/20">
                   <img src={company?.logo_url || "/logo-1024.png"} className="w-full h-full object-contain" />
                </div>
                <div>
                   <h1 className="text-xl font-bold text-primary uppercase leading-tight">{company?.name}</h1>
                   <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Facturación Inteligente</p>
                </div>
              </div>
              <div className="text-[10px] font-medium text-on-surface-variant leading-relaxed uppercase">
                RIF: {company?.rif}<br/>
                {company?.address}<br/>
                Teléfono: {company?.phone}<br/>
                Email: {company?.email}
              </div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/30 min-w-[280px]">
              <h2 className="text-xl font-bold text-primary uppercase tracking-tighter mb-4 border-b border-outline-variant/30 pb-2">FACTURA</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-on-surface-variant font-bold">N.º DOCUMENTO:</span>
                  <span className="font-bold text-primary">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-on-surface-variant font-bold">FECHA EMISIÓN:</span>
                  <span className="font-bold text-primary">{new Date(invoice.issue_date).toLocaleDateString('es-VE')}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-on-surface-variant font-bold">N.º CONTROL:</span>
                  <span className="font-bold text-red-600">{invoice.control_number}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-5">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Cliente:</span>
                <span className="text-sm font-bold text-primary uppercase">{invoice.clients?.name}</span>
             </div>
             <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-5">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">RIF/CI:</span>
                <span className="text-sm font-bold text-primary">{invoice.clients?.rif}</span>
             </div>
          </div>

          <div className="mb-10 border border-outline-variant/30 rounded-lg overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-surface-container-low border-b border-outline-variant/30">
                      <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Descripción</th>
                      <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase text-right">USD</th>
                      <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase text-right">Bs</th>
                   </tr>
                </thead>
                <tbody>
                   <tr className="border-b border-outline-variant/10">
                      <td className="p-4 text-xs font-medium text-primary uppercase">{invoice.concept || "Servicios de Suscripción"}</td>
                      <td className="p-4 text-xs font-bold text-primary text-right">${invoice.subtotal_usd.toFixed(2)}</td>
                      <td className="p-4 text-xs font-bold text-primary text-right">Bs. {(invoice.subtotal_usd * invoice.bcv_rate).toLocaleString('es-VE')}</td>
                   </tr>
                </tbody>
             </table>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-10">
             <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">Tasa BCV:</span>
                <span className="text-lg font-bold text-primary">{invoice.bcv_rate.toFixed(4)}</span>
             </div>
             <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-on-surface-variant font-bold">SUBTOTAL:</span>
                   <span className="font-bold text-primary">${invoice.subtotal_usd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-on-surface-variant font-bold">IVA (16%):</span>
                   <span className="font-bold text-primary">${invoice.iva_usd.toFixed(2)}</span>
                </div>
                {invoice.igtf_usd > 0 && (
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-on-surface-variant font-bold">IGTF (3%):</span>
                        <span className="font-bold text-primary">${invoice.igtf_usd.toFixed(2)}</span>
                    </div>
                )}
                <div className="bg-primary p-6 rounded-xl flex justify-between items-center text-white shadow-lg">
                   <span className="text-sm font-bold uppercase tracking-widest">TOTAL:</span>
                   <div className="text-right">
                      <div className="text-2xl font-bold">${invoice.total_usd.toFixed(2)}</div>
                      <div className="text-[10px] font-bold text-secondary uppercase italic">Bs. {invoice.total_bs.toLocaleString('es-VE')}</div>
                   </div>
                </div>
             </div>
          </div>

          {company?.signature_url && (
            <div className="flex flex-col items-center gap-2 mt-10 border-t border-outline-variant/10 pt-10">
                <img src={company.signature_url} className="h-24 object-contain" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Firma Autorizada</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Invoice;
