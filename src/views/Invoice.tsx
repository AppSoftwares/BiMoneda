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

    // Company Header
    doc.setFontSize(18);
    doc.setTextColor(13, 43, 91);
    doc.text(company?.name || "BiMoneda S.A.", 20, 20);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`RIF: ${company?.rif || "J-00000000-0"}`, 20, 26);
    doc.text(company?.address || "Caracas, Venezuela", 20, 31);
    doc.text(`Tel: ${company?.phone || ""}`, 20, 36);

    // Invoice Meta
    doc.setFontSize(22);
    doc.setTextColor(13, 43, 91);
    doc.text("FACTURA", pageWidth - 20, 25, { align: 'right' });

    doc.setFontSize(10);
    doc.text(`N.º: ${invoice.invoice_number}`, pageWidth - 20, 32, { align: 'right' });
    doc.text(`Fecha: ${new Date(invoice.issue_date).toLocaleDateString()}`, pageWidth - 20, 38, { align: 'right' });

    // Client Info
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 50, pageWidth - 40, 30, 'F');
    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.text("CLIENTE:", 25, 58);
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(invoice.clients?.name || "Cliente Final", 25, 65);
    doc.setFontSize(9);
    doc.text(`RIF/CI: ${invoice.clients?.rif || "N/A"}`, 25, 71);

    // Items Table
    autoTable(doc, {
      startY: 90,
      head: [['Descripción', 'Monto USD', 'Monto Bs']],
      body: [
        [
            invoice.concept || "Servicios Profesionales",
            `$${invoice.subtotal_usd.toFixed(2)}`,
            `Bs. ${(invoice.subtotal_usd * invoice.bcv_rate).toLocaleString('es-VE')}`
        ]
      ],
      headStyles: { fillColor: [13, 43, 91] },
      theme: 'striped'
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal: $${invoice.subtotal_usd.toFixed(2)}`, pageWidth - 25, finalY, { align: 'right' });
    doc.text(`IVA (16%): $${invoice.iva_usd.toFixed(2)}`, pageWidth - 25, finalY + 6, { align: 'right' });
    if (invoice.igtf_usd > 0) {
        doc.text(`IGTF (3%): $${invoice.igtf_usd.toFixed(2)}`, pageWidth - 25, finalY + 12, { align: 'right' });
    }

    doc.setFontSize(14);
    doc.setTextColor(13, 43, 91);
    doc.text(`TOTAL: $${invoice.total_usd.toFixed(2)}`, pageWidth - 25, finalY + 22, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`(Bs. ${invoice.total_bs.toLocaleString()})`, pageWidth - 25, finalY + 28, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("DOCUMENTO EMITIDO SEGÚN PROVIDENCIA SENIAT", pageWidth / 2, 280, { align: 'center' });

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
