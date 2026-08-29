import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center overflow-hidden mb-8 border border-gray-100 mt-8">
        <img src="/logo-1024.png" alt="Logo" className="w-14 h-14 object-contain" />
      </div>

      <div className="text-center mb-10 px-4">
        <h2 className="text-2xl font-bold text-[#0B2545]">Recuperar</h2>
        <p className="text-gray-400 text-sm mt-2">Ingresa tu correo para recibir un enlace de restablecimiento</p>
      </div>

      {!sent ? (
        <form onSubmit={handleReset} className="w-full max-w-sm space-y-6">
          <div>
            <label className="text-[10px] font-bold text-[#C99A32] uppercase ml-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="su@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 text-sm text-[#0B2545] focus:ring-2 focus:ring-[#C99A32] transition-all"
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B2545] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>
      ) : (
        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center w-full max-w-sm">
          <p className="text-green-700 text-sm font-medium">
            ¡Enlace enviado! Revisa tu bandeja de entrada para continuar.
          </p>
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        className="mt-8 text-sm font-bold text-gray-400 hover:text-[#0B2545] transition-colors"
      >
        Volver
      </button>
    </div>
  );
};

export default ForgotPassword;
