import React from 'react';
import { useNavigate } from 'react-router-dom';

const Splash: React.FC = () => {
  const navigate = useNavigate();
  const version = "1.0.1"; // Idealmente de package.json o variables de entorno

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-between p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col items-center mt-12">
        <div className="w-32 h-32 bg-white rounded-3xl shadow-lg flex items-center justify-center overflow-hidden mb-4 border border-gray-100">
           <img src="/logo-1024.png" alt="FacturaPro VE" className="w-24 h-24 object-contain" />
        </div>
        <span className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">versión {version}</span>
      </div>

      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-[#0B2545] leading-tight">
          Tu facturación en su versión<br />más inteligente.
        </h1>
        <div className="w-12 h-1 bg-[#C99A32] mx-auto my-6 rounded-full"></div>
        <p className="text-sm text-gray-500 leading-relaxed px-4">
          La plataforma integral que simplifica tu facturación digital,
          gestión de divisas USD/Bs, tasa BCV y cumplimiento legal SENIAT.
        </p>
      </div>

      <button
        onClick={() => navigate('/login')}
        className="w-full max-w-sm bg-gradient-to-r from-[#C99A32] to-[#F4CA6E] text-[#0B2545] font-bold py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-all uppercase tracking-wider text-sm"
      >
        INGRESAR / INICIAR SESIÓN
      </button>
    </div>
  );
};

export default Splash;
