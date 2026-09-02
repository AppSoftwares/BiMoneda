import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './core/context/LanguageContext';
import { ThemeProvider } from './core/context/ThemeContext';
import { supabase } from './data/db/supabase';
import { storage } from './core/util/StorageService';
import Splash from './feature/auth/ui/Splash';
import Login from './feature/auth/ui/Login';
import ForgotPassword from './feature/auth/ui/ForgotPassword';
import Profile from './feature/settings/ui/Profile';
import Dashboard from './feature/dashboard/ui/Dashboard';
import AddInvoice from './feature/facturas/ui/AddInvoice';
import AddClient from './feature/clientes/ui/AddClient';
import Clients from './feature/clientes/ui/Clients';
import EditClient from './feature/clientes/ui/EditClient';
import Invoices from './feature/facturas/ui/Invoices';
import Invoice from './feature/facturas/ui/Invoice';
import Crypto from './feature/cripto/ui/Crypto';
import AddCrypto from './feature/cripto/ui/AddCrypto';
import Books from './feature/cripto/ui/Books';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.initialize();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0B2545] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Splash />} />
            <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={session ? <Profile /> : <Navigate to="/login" replace />} />
            <Route path="/add-invoice" element={session ? <AddInvoice /> : <Navigate to="/login" replace />} />
            <Route path="/clients" element={session ? <Clients /> : <Navigate to="/login" replace />} />
            <Route path="/add-client" element={session ? <AddClient /> : <Navigate to="/login" replace />} />
            <Route path="/edit-client/:id" element={session ? <EditClient /> : <Navigate to="/login" replace />} />
            <Route path="/invoices" element={session ? <Invoices /> : <Navigate to="/login" replace />} />
            <Route path="/invoice/:id" element={session ? <Invoice /> : <Navigate to="/login" replace />} />

            {/* Crypto Module */}
            <Route path="/crypto" element={session ? <Crypto /> : <Navigate to="/login" replace />} />
            <Route path="/add-crypto" element={session ? <AddCrypto /> : <Navigate to="/login" replace />} />
            <Route path="/books" element={session ? <Books /> : <Navigate to="/login" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
