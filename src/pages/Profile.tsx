import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import BottomNav from '../components/BottomNav';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setAvatarUrl(user.user_metadata?.avatar_url || null);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Check if bucket exists via metadata request (simulated)
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('bucket not found')) {
            throw new Error('El contenedor "profiles" no existe en Supabase Storage. Por favor, créalo como Público.');
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(filePath);

      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      setAvatarUrl(publicUrl);
      alert('¡Foto de perfil actualizada!');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const GroupTitle = ({ children }: { children: string }) => (
    <h2 className="text-sm font-black text-primary dark:text-accent-gold uppercase tracking-[0.15em] mb-3 ml-2">{children}</h2>
  );

  const SettingRow = ({ label, children, isLast = false }: { label: string, children: React.ReactNode, isLast?: boolean }) => (
    <div className={`flex items-center justify-between p-5 ${!isLast ? 'border-b border-gray-100 dark:border-white/5' : ''}`}>
      <span className="text-sm font-bold text-primary dark:text-white/80">{label}</span>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-bright dark:bg-[#050c1a] transition-colors pb-32">
      {/* Header */}
      <header className="bg-white dark:bg-primary sticky top-0 z-40 border-b border-gray-100 dark:border-white/10 px-6 py-5 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-white active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-black text-primary dark:text-white uppercase tracking-tight">{t('profile_title')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="p-6 space-y-10 max-w-md mx-auto">
        {/* User Profile Info */}
        <div className="flex flex-col items-center">
            <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <div className="w-32 h-32 rounded-full border-4 border-accent-gold p-1 shadow-2xl bg-white overflow-hidden transform group-active:scale-95 transition-all">
                    <img src={avatarUrl || "/logo-1024.png"} alt="Avatar" className={`w-full h-full object-cover rounded-full ${loading ? 'animate-pulse opacity-50' : ''}`} />
                </div>
                <div className="absolute bottom-1 right-1 w-10 h-10 bg-accent-gold rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={uploadAvatar} />
            </div>
            <h3 className="mt-5 text-2xl font-black text-primary dark:text-white uppercase tracking-tight">
                {user?.email?.split('@')[0] || "ADMIN"}
            </h3>
            <span className="mt-1 text-[10px] font-black text-accent-gold uppercase tracking-[0.2em] bg-accent-gold/10 px-4 py-1.5 rounded-full border border-accent-gold/20">
                PROVEEDOR • ACTIVE
            </span>
        </div>

        {/* App Settings Group */}
        <div className="space-y-3">
          <GroupTitle>{t('appearance_theme')}</GroupTitle>
          <div className="bg-white dark:bg-white/5 rounded-4xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
            <SettingRow label="Modo Visual">
              <div className="flex bg-gray-100 dark:bg-white/10 p-1.5 rounded-2xl">
                <button
                  onClick={() => theme !== 'light' && toggleTheme()}
                  className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${theme === 'light' ? 'bg-white text-primary shadow-md' : 'text-gray-400'}`}
                >Light</button>
                <button
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${theme === 'dark' ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}
                >Dark</button>
              </div>
            </SettingRow>
            <SettingRow label={t('lang_label')} isLast>
                <div className="flex bg-gray-100 dark:bg-white/10 p-1.5 rounded-2xl">
                    <button onClick={() => setLanguage('es')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${language === 'es' ? 'bg-white text-primary shadow-md' : 'text-gray-400'}`}>ES</button>
                    <button onClick={() => setLanguage('en')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${language === 'en' ? 'bg-white text-primary shadow-md' : 'text-gray-400'}`}>EN</button>
                </div>
            </SettingRow>
          </div>
        </div>

        {/* Support Group */}
        <div className="space-y-3">
          <GroupTitle>Soporte y Legal</GroupTitle>
          <div className="bg-white dark:bg-white/5 rounded-4xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
            <SettingRow label={t('help_center')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </SettingRow>
            <SettingRow label={t('terms_cond')} isLast>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </SettingRow>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="w-full p-6 bg-red-50 dark:bg-red-950/20 rounded-4xl border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-6 0v-1m6-11V7a3 3 0 01-6 0v1" />
          </svg>
          <span className="text-base font-black text-red-600 uppercase tracking-widest">{t('logout')}</span>
        </button>
      </main>

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-md flex items-center justify-center p-8 z-50 animate-fade-in">
          <div className="bg-white dark:bg-primary rounded-5xl p-10 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-white/10">
            <h3 className="text-2xl font-black text-primary dark:text-white text-center mb-3 uppercase tracking-tighter">{t('logout_confirm_title')}</h3>
            <p className="text-sm text-gray-400 text-center mb-10 font-bold uppercase tracking-widest">{t('logout_confirm_desc')}</p>
            <div className="flex flex-col gap-4">
              <button onClick={handleLogout} className="w-full py-5 text-sm font-black text-white bg-red-600 rounded-[24px] shadow-xl shadow-red-200 dark:shadow-none uppercase tracking-[0.2em]">{t('btn_exit')}</button>
              <button onClick={() => setShowLogoutDialog(false)} className="w-full py-5 text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{t('btn_cancel')}</button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
};

export default Profile;
