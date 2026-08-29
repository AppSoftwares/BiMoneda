import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dbStatus, setDbStatus] = useState<'Checking...' | 'Connected' | 'Error'>('Checking...');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('invoices').select('count', { count: 'exact', head: true });
        if (error) throw error;
        setDbStatus('Connected');
      } catch (err) {
        console.error('Supabase connection error:', err);
        setDbStatus('Error');
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header Profile Section */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]">Provider Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${dbStatus === 'Connected' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Database: {dbStatus}</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0B2545]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Create Invoice Button */}
        <button
          onClick={() => navigate('/create-invoice')}
          className="w-full bg-[#0B2545] text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
        >
          {t('btn_create_inv')}
        </button>

        {/* Monthly Revenue Section */}
        <div>
          <h2 className="text-lg font-bold text-[#0B2545] mb-4">Monthly Revenue</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#0B2545] text-white text-[9px] font-bold px-2 py-1 rounded-lg">USD</div>
                <span className="text-xs font-bold text-[#0B2545]">USD</span>
              </div>
              <div className="text-xl font-bold text-[#0B2545] tracking-tight">$4,500.00</div>
              <div className="text-[10px] font-medium text-gray-400 mt-2">Total Earned (Nov)</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#C99A32] text-white text-[9px] font-bold px-2 py-1 rounded-lg">Bs</div>
                <span className="text-xs font-bold text-[#0B2545]">VEF</span>
              </div>
              <div className="text-xl font-bold text-[#0B2545] tracking-tight">162,000.00</div>
              <div className="text-[10px] font-medium text-gray-400 mt-2 italic">BCV Rate: 36.00</div>
            </div>
          </div>
        </div>

        {/* Subscription Summary */}
        <div>
          <h2 className="text-lg font-bold text-[#0B2545] mb-4">Subscription Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-50 shadow-sm">
              <div className="w-9 h-9 bg-[#0B2545] rounded-xl flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Active Subscriptions</div>
              <div className="text-2xl font-bold text-[#0B2545]">312</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-50 shadow-sm">
              <div className="w-9 h-9 bg-[#C99A32] rounded-xl flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0zm-1 3a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Pending Payments</div>
              <div className="text-2xl font-bold text-[#0B2545]">24</div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#0B2545]">Recent Invoices</h2>
            <button className="text-xs font-bold text-[#C99A32] uppercase tracking-wider">Ver Todas</button>
          </div>
          <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
            {[
              { name: "Acme Corp", date: "20-10-2023", amount: "$150.00", status: "Paid" },
              { name: "VeneSoftwares", date: "19-10-2023", amount: "$80.00", status: "Paid" },
              { name: "TechServices CA", date: "18-10-2023", amount: "$210.00", status: "Pending" }
            ].map((inv, i) => (
              <div key={i} className={`p-5 flex justify-between items-center ${i !== 2 ? 'border-b border-gray-50' : ''}`}>
                <div>
                  <div className="font-bold text-[#0B2545] text-[15px]">{inv.name}</div>
                  <div className="text-[10px] font-medium text-gray-400 mt-0.5">#INV-{inv.date} | <span className={inv.status === 'Paid' ? 'text-blue-500' : 'text-amber-500'}>{inv.status}</span> | {inv.amount}</div>
                </div>
                <div className={inv.status === 'Paid' ? 'text-[#0B2545]' : 'text-amber-500'}>
                  {inv.status === 'Paid' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
