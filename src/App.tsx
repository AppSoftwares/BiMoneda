import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { supabase } from './lib/supabaseClient';
import Splash from './pages/Splash';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth state changes (login, logout, etc.)
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
    <LanguageProvider>
      <Router>
        <Routes>
          {/* If logged in, "/" redirects to Dashboard. If not, shows Splash */}
          <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Splash />} />

          {/* Auth Routes */}
          <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={session ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/create-invoice" element={session ? <CreateInvoice /> : <Navigate to="/login" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
