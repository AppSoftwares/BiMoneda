import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../data/db/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BottomNav from '../../../core/nav/BottomNav';

const Books: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'diary' | 'ledger' | 'inventory'>('diary');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'diary') {
            const { data } = await supabase.from('ledger_entries').select('*').order('date', { ascending: false });
            setData(data || []);
        } else if (activeTab === 'inventory') {
            const { data } = await supabase.from('inventory_movements').select('*, crypto_operations(*)').order('id', { ascending: false });
            setData(data || []);
        } else if (activeTab === 'ledger') {
            // Standard ledger view
            const { data } = await supabase.from('ledger_entries').select('*').order('date', { ascending: true });
            setData(data || []);
        }
        setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const title = `Libro ${activeTab === 'diary' ? 'Diario' : activeTab === 'ledger' ? 'Mayor' : 'de Inventario'}`;
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`BiMoneda - Smart Finance`, 14, 28);

    if (activeTab === 'diary') {
        autoTable(doc, {
            head: [['Fecha', 'Cta. Debe', 'Cta. Haber', 'Monto (Bs)']],
            body: data.map(e => [new Date(e.date).toLocaleDateString('es-VE'), e.debit_account, e.credit_account, e.amount_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })]),
            startY: 35,
            styles: { fontSize: 8 }
        });
    } else if (activeTab === 'ledger') {
        autoTable(doc, {
            head: [['Fecha', 'Cuenta', 'Monto (Bs)']],
            body: data.map(e => [new Date(e.date).toLocaleDateString('es-VE'), e.debit_account, e.amount_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })]),
            startY: 35,
            styles: { fontSize: 8 }
        });
    } else {
        autoTable(doc, {
            head: [['ID', 'Cantidad', 'Costo Prom.', 'Saldo (Bs)']],
            body: data.map(e => [e.id, e.balance_qty, e.avg_cost, e.balance_value_bs.toLocaleString('es-VE')]),
            startY: 35,
            styles: { fontSize: 8 }
        });
    }
    doc.save(`${title.replace(/ /g, '_')}_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0b1c30] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col transition-colors">
      <header className="px-6 py-5 flex items-center gap-4 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#0d2b5b] sticky top-0 z-40 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-primary dark:text-white active:scale-90 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
        </button>
        <h1 className="text-lg font-black text-primary dark:text-white uppercase tracking-tight">Libros Contables</h1>
      </header>

      <main className="flex-1 p-6 pb-32 max-w-md mx-auto w-full">
        <div className="flex bg-gray-100 dark:bg-white/10 p-1 rounded-2xl mb-8 border dark:border-white/5">
            {[
                {id: 'diary', label: 'Diario'},
                {id: 'ledger', label: 'Mayor'},
                {id: 'inventory', label: 'Inventario'}
            ].map((t) => (
                <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === t.id ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' : 'text-gray-400 dark:text-white/40'}`}
                >{t.label}</button>
            ))}
        </div>

        <button onClick={exportPDF} className="w-full bg-accent-gold dark:bg-secondary text-primary dark:text-white font-black py-5 rounded-3xl mb-8 shadow-xl shadow-amber-900/10 uppercase tracking-widest text-xs active:scale-95 transition-all">Exportar a PDF</button>

        <div className="bg-white dark:bg-white/5 rounded-[40px] border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
            {loading ? (
                <div className="p-10 text-center animate-pulse font-bold uppercase tracking-widest text-gray-300 dark:text-white/20 text-[10px]">Procesando registros...</div>
            ) : data.length === 0 ? (
                <div className="p-10 text-center text-gray-300 dark:text-white/20 uppercase font-black text-[10px]">No hay datos en este libro</div>
            ) : data.map((item, i) => (
                <div key={i} className="p-6 border-b border-gray-50 dark:border-white/5 flex justify-between items-center active:bg-gray-50 dark:active:bg-white/10 transition-colors">
                    <div className="space-y-1">
                        <div className="text-[11px] font-black text-primary dark:text-white uppercase tracking-tight">
                            {activeTab === 'diary' || activeTab === 'ledger' ? item.debit_account : 'Movimiento #' + item.id}
                        </div>
                        <div className="text-[9px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
                            {activeTab === 'diary' || activeTab === 'ledger' ? new Date(item.date).toLocaleDateString('es-VE') : 'Inventario'}
                        </div>
                    </div>
                    <div className="text-sm font-black text-accent-gold dark:text-secondary">
                        Bs. {activeTab === 'inventory' ? item.avg_cost.toLocaleString('es-VE') : item.amount_bs.toLocaleString('es-VE')}
                    </div>
                </div>
            ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Books;
