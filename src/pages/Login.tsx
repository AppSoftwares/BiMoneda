import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.' : error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center overflow-hidden mb-8 border border-gray-100 mt-8">
        <img src="/logo-1024.png" alt="Logo" className="w-14 h-14 object-contain" />
      </div>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-[#0B2545]">Iniciar Sesión</h2>
        <p className="text-gray-400 text-sm">Ingresa tus credenciales</p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
        <div>
          <label className="text-[10px] font-bold text-[#C99A32] uppercase ml-1">Correo Electrónico</label>
          <input
            type="email"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 text-sm text-[#0B2545] focus:ring-2 focus:ring-[#C99A32] transition-all"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-[#C99A32] uppercase ml-1">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 text-sm text-[#0B2545] focus:ring-2 focus:ring-[#C99A32] transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0B2545] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-sm disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <button
        onClick={() => navigate('/forgot-password')}
        className="mt-6 text-sm font-bold text-[#C99A32] hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </button>
    </div>
  );
};

export default Login;
