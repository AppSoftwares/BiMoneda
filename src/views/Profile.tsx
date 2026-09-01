import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import BottomNav from '../components/BottomNav';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
        const { data } = await supabase.from('company_profile').select('*').single();
        if (data) setProfile(data);
        setLoading(false);
    };
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-background font-inter pb-32">
      <header className="bg-white px-6 h-20 flex items-center justify-between shadow-level-1 sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 text-primary active:scale-90 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h1 className="text-xl font-bold text-primary tracking-tight">Settings & Profile</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold">
            {profile?.name?.substring(0,1) || 'B'}
        </div>
      </header>

      <main className="p-6 space-y-10 max-w-md mx-auto">
        {/* App Settings */}
        <section className="space-y-4">
            <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">App Settings</h2>
            <div className="bg-white rounded-lg border border-outline-variant shadow-level-1 overflow-hidden">
                <div className="p-5 flex justify-between items-center border-b border-outline-variant/30">
                    <span className="text-sm font-bold text-primary">Appearance</span>
                    <div className="flex bg-surface-container-low p-1 rounded-md border border-outline-variant">
                        <button
                            onClick={() => theme !== 'light' && toggleTheme()}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${theme === 'light' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
                        >Light</button>
                        <button
                            onClick={() => theme !== 'dark' && toggleTheme()}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${theme === 'dark' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
                        >Dark</button>
                    </div>
                </div>
                <div className="p-5 flex justify-between items-center">
                    <span className="text-sm font-bold text-primary">Language</span>
                    <div className="flex bg-surface-container-low p-1 rounded-md border border-outline-variant">
                        <button
                            onClick={() => setLanguage('es')}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${language === 'es' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
                        >Spanish</button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
                        >English</button>
                    </div>
                </div>
            </div>
        </section>

        {/* Company Profile */}
        <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Company Profile</h2>
                <button className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline">Edit</button>
            </div>
            <div className="bg-white rounded-lg border border-outline-variant shadow-level-1 p-6 space-y-6">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-16 h-16 bg-surface-container-low rounded-lg border border-outline-variant/30 flex items-center justify-center p-2 relative">
                        <img src={profile?.logo_url || "/logo-1024.png"} className="w-full h-full object-contain opacity-50" />
                        <button className="absolute -bottom-1 -right-1 bg-white border border-outline-variant p-1 rounded-md shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.207V17h2.793l8.414-8.414-2.828-2.828z" />
                            </svg>
                        </button>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-primary uppercase">{profile?.name || 'BiMoneda S.A.'}</div>
                        <div className="text-[10px] font-medium text-on-surface-variant tracking-wider uppercase">RIF: {profile?.rif || '---'}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 pt-2">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Address</span>
                        <div className="text-xs font-medium text-primary leading-relaxed">{profile?.address || '---'}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Phone</span>
                            <div className="text-xs font-medium text-primary">{profile?.phone || '---'}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Email</span>
                            <div className="text-xs font-medium text-primary truncate">{profile?.email || '---'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Digital Signature */}
        <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Digital Signature</h2>
                <button className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline">Upload</button>
            </div>
            <div className="bg-white rounded-lg border-2 border-dashed border-outline-variant/50 p-8 flex flex-col items-center justify-center min-h-[120px]">
                {profile?.signature_url ? (
                    <img src={profile.signature_url} className="max-h-20 object-contain" />
                ) : (
                    <div className="text-center space-y-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-outline-variant mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest">No signature uploaded</span>
                    </div>
                )}
            </div>
        </section>

        <button
            onClick={() => supabase.auth.signOut()}
            className="w-full py-4 border border-error/30 text-error text-[11px] font-bold uppercase tracking-[0.2em] rounded-md hover:bg-error/5 transition-all"
        >
            Logout Account
        </button>
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
