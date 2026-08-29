import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header Profile Section */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#006495]">Provider Dashboard</h1>
        </div>
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Create Invoice Button */}
        <button className="w-full bg-[#006495] text-white font-semibold py-4 rounded-xl shadow-sm active:opacity-90 transition-opacity">
          Create New Invoice
        </button>

        {/* Monthly Revenue Section */}
        <div>
          <h2 className="text-lg font-bold text-[#006495] mb-3">Monthly Revenue</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#006495] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">USD</div>
                <span className="text-xs font-bold text-[#006495]">USD</span>
              </div>
              <div className="text-xl font-bold text-[#006495]">$4,500.00</div>
              <div className="text-[10px] text-gray-400 mt-1">Total Earned (Nov)</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#006495] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Bs</div>
                <span className="text-xs font-bold text-[#006495]">VEF</span>
              </div>
              <div className="text-xl font-bold text-[#006495]">162,000.00</div>
              <div className="text-[10px] text-gray-400 mt-1">BCV Rate: 36.00 | IGTF Incl.</div>
            </div>
          </div>
        </div>

        {/* Subscription Summary */}
        <div>
          <h2 className="text-lg font-bold text-[#006495] mb-3">Subscription Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 bg-[#006495] rounded-lg flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-xs text-gray-600 mb-1">Active Subscriptions</div>
              <div className="text-2xl font-bold text-[#006495]">312</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 bg-[#006495] rounded-lg flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 11-2 0 1 1 0 012 0zm-1 3a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-xs text-gray-600 mb-1">Pending Payments</div>
              <div className="text-2xl font-bold text-[#006495]">24</div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-[#006495]">Recent Invoices</h2>
            <button className="text-xs font-bold text-blue-500">Ver Todas</button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {[
              { name: "Acme Corp", date: "20-10-2023", amount: "$150.00", status: "Paid" },
              { name: "VeneSoftwares", date: "19-10-2023", amount: "$80.00", status: "Paid" },
              { name: "TechServices CA", date: "18-10-2023", amount: "$210.00", status: "Pending" }
            ].map((inv, i) => (
              <div key={i} className={`p-4 flex justify-between items-center ${i !== 2 ? 'border-b border-gray-50' : ''}`}>
                <div>
                  <div className="font-bold text-[#006495] text-sm">{inv.name}</div>
                  <div className="text-[10px] text-gray-400">#INV-{inv.date} | {inv.status} | {inv.amount}</div>
                </div>
                <div className={inv.status === 'Paid' ? 'text-green-500' : 'text-amber-500'}>
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
}

export default App;
