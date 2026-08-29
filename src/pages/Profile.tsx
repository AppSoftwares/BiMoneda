import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User details state
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Fetch avatar if exists in profile table or user metadata
        const url = user.user_metadata?.avatar_url;
        if (url) setAvatarUrl(url);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 1. Upload to Supabase Storage (Assumes 'profiles' bucket exists)
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // 3. Update User Metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      alert('Foto de perfil actualizada!');

    } catch (error: any) {
      alert('Error subiendo imagen: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const MenuItem = ({ icon, label, onClick, group, isDestructive = false, rightContent }: { icon: React.ReactNode, label: string, onClick?: () => void, group?: boolean, isDestructive?: boolean, rightContent?: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 bg-white ${group ? 'border-b border-gray-50' : 'rounded-[24px] shadow-sm mb-4'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isDestructive ? 'bg-red-50' : 'bg-[#F8FAFC]'}`}>
          {icon}
        </div>
        <span className={`text-sm font-bold tracking-tight ${isDestructive ? 'text-red-600' : 'text-[#0B2545]'}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {rightContent}
        {!isDestructive && !rightContent && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-200" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0B2545]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <h1 className="text-lg font-black text-[#0B2545]">{t('profile_title')}</h1>
        <div className="w-10"></div>
      </div>

      {/* Header Profile */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          <div className="w-28 h-28 rounded-full border-[3px] border-[#C99A32] p-1.5 shadow-2xl overflow-hidden bg-white">
            <img
              src={avatarUrl || "/logo-1024.png"}
              alt="Profile"
              className={`w-full h-full object-cover rounded-full ${loading ? 'opacity-50 animate-pulse' : ''}`}
            />
          </div>
          <div className="absolute bottom-1 right-1 w-9 h-9 bg-[#C99A32] rounded-full border-[3px] border-white flex items-center justify-center shadow-lg transition-transform group-active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={uploadAvatar} />
        </div>
        <h2 className="mt-5 text-2xl font-black text-[#0B2545] tracking-tight uppercase">
          {user?.email?.split('@')[0] || "USUARIO"}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-black text-[#C99A32] uppercase tracking-[0.15em] bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            PROVEEDOR • ACTIVE
          </span>
        </div>
      </div>

      {/* Menu Groups */}
      <div className="w-full max-w-md mx-auto pb-12">
        <MenuItem
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0B2545]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          label={t('account_settings')}
          onClick={() => alert('Próximamente: Edición de datos del perfil.')}
        />

        <div className="bg-white rounded-[32px] shadow-sm mb-4 overflow-hidden border border-gray-50">
          <MenuItem
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0B2545]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            label={t('privacy_security')}
            group
            onClick={() => alert('Seguridad: Cambiar contraseña habilitado pronto.')}
          />
          <MenuItem
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0B2545]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a4 4 0 115.656 5.656l-1.172 1.172" /></svg>}
            label={t('appearance_theme')}
            group
            rightContent={
              <div className="flex bg-[#F8FAFC] p-1 rounded-xl">
                <button className="px-3 py-1 text-[10px] font-bold bg-white text-[#0B2545] rounded-lg shadow-sm">Light</button>
                <button className="px-3 py-1 text-[10px] font-bold text-gray-400">Dark</button>
              </div>
            }
          />
          <MenuItem
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0B2545]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
            label={t('notifications')}
            onClick={() => alert('Configura tus notificaciones Push.')}
          />
        </div>

        <div className="bg-white rounded-[32px] shadow-sm mb-4 overflow-hidden border border-gray-50">
          <MenuItem
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0B2545]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5a18.022 18.022 0 01-3.827-5.806m1.048 5.806c1.175 1.667 2.679 3.008 4.461 3.858m1.104-3.183a15.02 15.02 0 01-4.659-5.08M12 18c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z" /></svg>}
            label={t('lang_label')}
            group
            rightContent={
              <div className="flex bg-[#F8FAFC] p-1 rounded-xl">
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${language === 'es' ? 'bg-white text-[#0B2545] shadow-sm' : 'text-gray-400'}`}
                >ES</button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white text-[#0B2545] shadow-sm' : 'text-gray-400'}`}
                >EN</button>
              </div>
            }
          />
          <MenuItem
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0B2545]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label={t('help_center')}
            group
          />
          <MenuItem
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0B2545]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" /></svg>}
            label={t('terms_cond')}
          />
        </div>

        <MenuItem
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-6 0v-1m6-11V7a3 3 0 01-6 0v1" /></svg>}
          label={t('logout')}
          isDestructive
        />
      </div>

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-[#0B2545]/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-xs shadow-2xl">
            <h3 className="text-xl font-black text-[#0B2545] text-center mb-2">{t('logout_confirm_title')}</h3>
            <p className="text-sm text-gray-400 text-center mb-8 font-medium">{t('logout_confirm_desc')}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="w-full py-4 text-sm font-black text-white bg-red-600 rounded-2xl shadow-xl shadow-red-200"
              >
                {t('btn_exit')}
              </button>
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="w-full py-4 text-sm font-black text-gray-400"
              >
                {t('btn_cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
