import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BottomNav from '../components/BottomNav';

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
        }
        setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Libro ${activeTab === 'diary' ? 'Diario' : activeTab === 'ledger' ? 'Mayor' : 'de Inventario'} - Fiora`, 14, 15);

    if (activeTab === 'diary') {
        autoTable(doc, {
            head: [['Fecha', 'Debe', 'Haber', 'Monto (Bs)']],
            body: data.map(e => [new Date(e.date).toLocaleDateString(), e.debit_account, e.credit_account, e.amount_bs.toLocaleString()]),
            startY: 25
        });
    }
    doc.save(`Libro_${activeTab}_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col transition-colors">
      <header className="px-6 py-5 flex items-center gap-4 border-b border-gray-100 bg-white sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="text-primary active:scale-90 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
        </button>
        <h1 className="text-lg font-black text-primary uppercase tracking-tight">Libros Contables</h1>
      </header>

      <main className="flex-1 p-6 pb-32">
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
            {['diary', 'ledger', 'inventory'].map((t) => (
                <button
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === t ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                >{t}</button>
            ))}
        </div>

        <button onClick={exportPDF} className="w-full bg-accent-gold text-primary font-black py-5 rounded-3xl mb-8 shadow-xl shadow-amber-900/10 uppercase tracking-widest text-xs active:scale-95 transition-all">Exportar a PDF</button>

        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
            {loading ? (
                <div className="p-10 text-center animate-pulse font-bold uppercase tracking-widest text-gray-300 text-[10px]">Procesando registros...</div>
            ) : data.length === 0 ? (
                <div className="p-10 text-center text-gray-300 uppercase font-black text-[10px]">No hay datos en este libro</div>
            ) : data.map((item, i) => (
                <div key={i} className="p-6 border-b border-gray-50 flex justify-between items-center active:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                        <div className="text-[11px] font-black text-primary uppercase tracking-tight">{activeTab === 'diary' ? item.debit_account : 'Movimiento #' + item.id}</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{activeTab === 'diary' ? new Date(item.date).toLocaleDateString() : 'Inventario'}</div>
                    </div>
                    <div className="text-sm font-black text-accent-gold">Bs. {activeTab === 'diary' ? item.amount_bs.toLocaleString() : item.avg_cost.toLocaleString()}</div>
                </div>
            ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Books;
