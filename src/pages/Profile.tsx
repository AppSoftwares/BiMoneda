import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Datos mock para visualización rápida (esto debería venir de Supabase/Contexto)
  const userData = {
    name: "JESÚS PIRELA",
    role: "PROVEEDOR",
    company: "VeneSoftwares CA",
    avatar: "/FacturaProVE_Logo/FacturaProVE_preview.png"
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const MenuItem = ({ icon, label, group, isDestructive = false }: { icon: React.ReactNode, label: string, group?: boolean, isDestructive?: boolean }) => (
    <button
      onClick={isDestructive ? () => setShowLogoutDialog(true) : undefined}
      className={`w-full flex items-center justify-between p-4 bg-white ${group ? 'border-b border-gray-50' : 'rounded-2xl shadow-sm mb-4'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDestructive ? 'bg-red-50' : 'bg-gray-50'}`}>
          {icon}
        </div>
        <span className={`text-sm font-semibold ${isDestructive ? 'text-red-600' : 'text-[#0B2545]'}`}>{label}</span>
      </div>
      {!isDestructive && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0B2545]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Header Profile */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-[#C99A32] p-1 shadow-xl overflow-hidden bg-white">
            <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#C99A32] rounded-full border-2 border-white flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <h2 className="mt-4 text-xl font-bold text-[#0B2545] tracking-tight">{userData.name}</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
          {userData.role} • {userData.company}
        </p>
      </div>

      {/* Menu Groups */}
      <div className="w-full max-w-md mx-auto">
        <MenuItem
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0B2545]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}
          label="Configuración de Cuenta"
        />

        <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden border border-gray-50">
          <MenuItem
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0B2545]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
            label="Privacidad y Seguridad"
            group
          />
          <MenuItem
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0B2545]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" /></svg>}
            label="Apariencia y Tema"
            group
          />
          <MenuItem
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0B2545]" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>}
            label="Notificaciones"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden border border-gray-50">
          <MenuItem
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0B2545]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>}
            label="Centro de Ayuda"
            group
          />
          <MenuItem
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0B2545]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>}
            label="Términos y Condiciones"
          />
        </div>

        <MenuItem
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>}
          label="Cerrar Sesión"
          isDestructive
        />
      </div>

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
            <h3 className="text-lg font-bold text-[#0B2545] text-center mb-2">¿Cerrar Sesión?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">¿Estás seguro que deseas salir de tu cuenta?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 py-3 text-sm font-bold text-gray-400 bg-gray-50 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-xl shadow-lg shadow-red-200"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
