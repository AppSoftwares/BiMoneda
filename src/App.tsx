import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { supabase } from './lib/db';
import { storage } from './services/StorageService';
import Splash from './views/Splash';
import Login from './views/Login';
import ForgotPassword from './views/ForgotPassword';
import Profile from './views/Profile';
import Dashboard from './views/Dashboard';
import AddInvoice from './views/AddInvoice';
import AddClient from './views/AddClient';
import Clients from './views/Clients';
import EditClient from './views/EditClient';
import Invoices from './views/Invoices';
import Invoice from './views/Invoice';
import Crypto from './views/Crypto';
import AddCrypto from './views/AddCrypto';
import Books from './views/Books';

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
