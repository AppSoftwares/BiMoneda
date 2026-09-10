import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../data/db/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BottomNav from '../../../core/nav/BottomNav';

type Tab = 'diary' | 'ledger' | 'inventory' | 'sales';

const Books: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('diary');
  const [data, setData] = useState<any[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState<any[]>([]);
  const [profitSummary, setProfitSummary] = useState({ profit: 0, loss: 0, net: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'diary') {
                const { data, error } = await supabase.from('ledger_entries').select('*').order('date', { ascending: false });
                if (error) throw error;
                setData(data || []);
            } else if (activeTab === 'inventory') {
                const { data, error } = await supabase.from('inventory_movements').select('*, crypto_operations(*)').order('id', { ascending: false });
                if (error) throw error;
                setData(data || []);

                // Resumen de ganancia/pérdida realizada del período visible
                const profit = (data || [])
                  .filter((m: any) => (m.realized_profit_bs || 0) > 0)
                  .reduce((acc: number, m: any) => acc + m.realized_profit_bs, 0);
                const loss = (data || [])
                  .filter((m: any) => (m.realized_profit_bs || 0) < 0)
                  .reduce((acc: number, m: any) => acc + Math.abs(m.realized_profit_bs), 0);
                setProfitSummary({ profit, loss, net: profit - loss });
            } else if (activeTab === 'ledger') {
                // LIBRO MAYOR real: se agrupan todos los asientos por cuenta
                // (tipo "cuenta T"), mostrando el total Debe, Haber y el saldo
                // de cada cuenta — no una copia del Diario.
                const { data, error } = await supabase.from('ledger_entries').select('*').order('date', { ascending: true });
                if (error) throw error;

                const accounts: Record<string, { debit: number; credit: number }> = {};
                (data || []).forEach((e: any) => {
                    if (!accounts[e.debit_account]) accounts[e.debit_account] = { debit: 0, credit: 0 };
                    if (!accounts[e.credit_account]) accounts[e.credit_account] = { debit: 0, credit: 0 };
                    accounts[e.debit_account].debit += e.amount_bs;
                    accounts[e.credit_account].credit += e.amount_bs;
                });

                const summary = Object.entries(accounts).map(([account, v]) => ({
                    account,
                    debit: v.debit,
                    credit: v.credit,
                    balance: v.debit - v.credit
                })).sort((a, b) => a.account.localeCompare(b.account));

                setLedgerSummary(summary);
            } else if (activeTab === 'sales') {
                // LIBRO DE VENTAS (requerido por el SENIAT): detalle de IVA e
                // IGTF por cada factura emitida.
                const { data, error } = await (supabase as any)
                  .from('invoices')
                  .select('*, clients(name, rif)')
                  .order('issue_date', { ascending: false });
                if (error) throw error;
                setData(data || []);
            }
        } catch (err: any) {
            console.error("Error fetching books data:", err.message);
            alert("Error al cargar los libros: " + err.message);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [activeTab]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const titles: Record<Tab, string> = {
      diary: 'Libro Diario',
      ledger: 'Libro Mayor',
      inventory: 'Libro de Inventario',
      sales: 'Libro de Ventas'
    };
    const title = titles[activeTab];
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
            head: [['Cuenta', 'Debe (Bs)', 'Haber (Bs)', 'Saldo (Bs)']],
            body: ledgerSummary.map(e => [
              e.account,
              e.debit.toLocaleString('es-VE', { minimumFractionDigits: 2 }),
              e.credit.toLocaleString('es-VE', { minimumFractionDigits: 2 }),
              e.balance.toLocaleString('es-VE', { minimumFractionDigits: 2 })
            ]),
            startY: 35,
            styles: { fontSize: 8 }
        });
    } else if (activeTab === 'sales') {
        autoTable(doc, {
            head: [['Fecha', 'N.º Factura', 'Cliente', 'Base (USD)', 'IVA (USD)', 'IGTF (USD)', 'Total (USD)']],
            body: data.map(e => [
              new Date(e.issue_date).toLocaleDateString('es-VE'),
              e.invoice_number,
              e.clients?.name || 'N/A',
              (e.taxable_base_usd || 0).toFixed(2),
              (e.iva_usd || 0).toFixed(2),
              (e.igtf_usd || 0).toFixed(2),
              (e.total_usd || 0).toFixed(2)
            ]),
            startY: 35,
            styles: { fontSize: 7 }
        });
    } else {
        autoTable(doc, {
            head: [['ID', 'Cantidad', 'Costo Prom.', 'Saldo (Bs)', 'Ganancia/Pérdida (Bs)']],
            body: data.map(e => [
              e.id,
              e.balance_qty,
              e.avg_cost,
              (e.balance_value_bs || 0).toLocaleString('es-VE'),
              e.realized_profit_bs != null ? e.realized_profit_bs.toLocaleString('es-VE') : '—'
            ]),
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
        <div className="flex bg-gray-100 dark:bg-white/10 p-1 rounded-2xl mb-8 border dark:border-white/5 overflow-x-auto no-scrollbar">
            {[
                {id: 'diary', label: 'Diario'},
                {id: 'ledger', label: 'Mayor'},
                {id: 'sales', label: 'Ventas'},
                {id: 'inventory', label: 'Inventario'}
            ].map((t) => (
                <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as Tab)}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap px-2 ${activeTab === t.id ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' : 'text-gray-400 dark:text-white/40'}`}
                >{t.label}</button>
            ))}
        </div>

        {activeTab === 'inventory' && !loading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/10 text-center">
              <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Ganancia</div>
              <div className="text-xs font-black text-green-600">Bs. {profitSummary.profit.toLocaleString('es-VE', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-white dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/10 text-center">
              <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Pérdida</div>
              <div className="text-xs font-black text-red-500">Bs. {profitSummary.loss.toLocaleString('es-VE', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-white dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/10 text-center">
              <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Neto</div>
              <div className={`text-xs font-black ${profitSummary.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>Bs. {profitSummary.net.toLocaleString('es-VE', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
        )}

        <button onClick={exportPDF} className="w-full bg-accent-gold dark:bg-secondary text-primary dark:text-white font-black py-5 rounded-3xl mb-8 shadow-xl shadow-amber-900/10 uppercase tracking-widest text-xs active:scale-95 transition-all">Exportar a PDF</button>

        <div className="bg-white dark:bg-white/5 rounded-[40px] border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
            {loading ? (
                <div className="p-10 text-center animate-pulse font-bold uppercase tracking-widest text-gray-300 dark:text-white/20 text-[10px]">Procesando registros...</div>
            ) : activeTab === 'ledger' ? (
                ledgerSummary.length === 0 ? (
                  <div className="p-10 text-center text-gray-300 dark:text-white/20 uppercase font-black text-[10px]">No hay datos en este libro</div>
                ) : ledgerSummary.map((item, i) => (
                  <div key={i} className="p-6 border-b border-gray-50 dark:border-white/5 flex justify-between items-center">
                      <div className="space-y-1">
                          <div className="text-[11px] font-black text-primary dark:text-white uppercase tracking-tight">{item.account}</div>
                          <div className="text-[9px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
                              Debe: {item.debit.toLocaleString('es-VE', { maximumFractionDigits: 0 })} · Haber: {item.credit.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                          </div>
                      </div>
                      <div className={`text-sm font-black ${item.balance >= 0 ? 'text-accent-gold dark:text-secondary' : 'text-red-500'}`}>
                          Bs. {item.balance.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                      </div>
                  </div>
                ))
            ) : data.length === 0 ? (
                <div className="p-10 text-center text-gray-300 dark:text-white/20 uppercase font-black text-[10px]">No hay datos en este libro</div>
            ) : activeTab === 'sales' ? (
                data.map((item, i) => (
                  <div key={i} className="p-6 border-b border-gray-50 dark:border-white/5 flex justify-between items-center">
                      <div className="space-y-1">
                          <div className="text-[11px] font-black text-primary dark:text-white uppercase tracking-tight">#{item.invoice_number} · {item.clients?.name || 'Cliente Final'}</div>
                          <div className="text-[9px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
                              {new Date(item.issue_date).toLocaleDateString('es-VE')} · IVA ${(item.iva_usd || 0).toFixed(2)} · IGTF ${(item.igtf_usd || 0).toFixed(2)}
                          </div>
                      </div>
                      <div className="text-sm font-black text-accent-gold dark:text-secondary">
                          ${(item.total_usd || 0).toFixed(2)}
                      </div>
                  </div>
                ))
            ) : data.map((item, i) => (
                <div key={i} className="p-6 border-b border-gray-50 dark:border-white/5 flex justify-between items-center active:bg-gray-50 dark:active:bg-white/10 transition-colors">
                    <div className="space-y-1">
                        <div className="text-[11px] font-black text-primary dark:text-white uppercase tracking-tight">
                            {activeTab === 'diary' ? `${item.debit_account} → ${item.credit_account}` : 'Movimiento #' + item.id}
                        </div>
                        <div className="text-[9px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
                            {activeTab === 'diary' ? new Date(item.date).toLocaleDateString('es-VE') : (item.realized_profit_bs != null ? `Ganancia/Pérdida: Bs. ${item.realized_profit_bs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}` : 'Inventario')}
                        </div>
                    </div>
                    <div className="text-sm font-black text-accent-gold dark:text-secondary">
                        Bs. {activeTab === 'inventory' ? (item.balance_value_bs || 0).toLocaleString('es-VE') : (item.amount_bs || 0).toLocaleString('es-VE')}
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
