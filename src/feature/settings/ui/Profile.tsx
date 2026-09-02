import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../data/db/supabase';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useTheme } from '../../../core/context/ThemeContext';
import BottomNav from '../../../core/nav/BottomNav';

type ProfileSection = 'main' | 'account' | 'security' | 'appearance' | 'notifications' | 'help' | 'legal' | 'company';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<ProfileSection>('main');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // File Input Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const companyLogoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Edit Company Profile State
  const [editCompany, setEditCompany] = useState({
    name: '',
    rif: '',
    address: '',
    phone: '',
    email: '',
    economic_activity_code: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setAvatarUrl(user.user_metadata?.avatar_url || null);
      }

      const { data: compData } = await (supabase as any).from('company_profile').select('*').single();
      if (compData) {
        setProfile(compData);
        setEditCompany({
          name: compData.name || '',
          rif: compData.rif || '',
          address: compData.address || '',
          phone: compData.phone || '',
          email: compData.email || '',
          economic_activity_code: compData.economic_activity_code || '9499'
        });
      }
    };
    fetchData();
  }, []);

  const handleUpdateCompany = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const payload = {
        name: editCompany.name,
        rif: editCompany.rif.toUpperCase(),
        address: editCompany.address,
        phone: editCompany.phone,
        email: editCompany.email,
        economic_activity_code: editCompany.economic_activity_code,
        updated_at: new Date().toISOString()
      };

      const { error } = await (supabase as any)
        .from('company_profile')
        .update(payload)
        .eq('id', profile.id);

      if (error) throw error;
      setProfile({ ...profile, ...payload });
      alert('¡Perfil de empresa actualizado con éxito!');
      setActiveSection('main');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>, bucket: string, field: string) => {
    try {
      setLoading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'anon'}-${field}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);

      if (bucket === 'profiles' && field === 'avatar') {
        await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
        setAvatarUrl(publicUrl);
      } else if (bucket === 'profiles' && field === 'logo') {
        await (supabase as any).from('company_profile').update({ logo_url: publicUrl }).eq('id', profile.id);
        setProfile({ ...profile, logo_url: publicUrl });
      } else if (bucket === 'signatures') {
        await (supabase as any).from('company_profile').update({ signature_url: publicUrl }).eq('id', profile.id);
        setProfile({ ...profile, signature_url: publicUrl });
      }

      alert('¡Archivo actualizado con éxito!');
    } catch (error: any) {
      console.error("Upload error:", error);
      alert('Error al subir archivo: ' + error.message);
    } finally {
      setLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const MenuItem = ({ icon, label, onClick, color = 'text-primary' }: any) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between p-5 active:bg-surface-container-low transition-all border-b border-outline-variant/20 last:border-0"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
          {icon}
        </div>
        <span className={`text-sm font-bold ${color} tracking-tight`}>{label}</span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-outline" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </button>
  );

  const SubHeader = ({ title }: { title: string }) => (
    <header className="bg-white px-6 h-20 flex items-center gap-4 shadow-level-1 sticky top-0 z-50">
      <button type="button" onClick={() => setActiveSection('main')} className="p-2 text-primary active:scale-90 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="text-xl font-bold text-primary tracking-tight">{title}</h1>
    </header>
  );

  return (
    <div className="min-h-screen bg-background font-inter pb-32">
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'profiles', 'avatar')} />
      <input type="file" ref={companyLogoInputRef} className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'profiles', 'logo')} />
      <input type="file" ref={signatureInputRef} className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'signatures', 'signature_url')} />

      {activeSection === 'main' && (
        <>
          <div className="bg-surface-container-low pt-12 pb-10 flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-primary p-1 shadow-2xl bg-white overflow-hidden">
                <img src={avatarUrl || "/logo-1024.png"} className="w-full h-full object-cover rounded-full" />
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-10 h-10 bg-white rounded-full border border-primary flex items-center justify-center shadow-lg active:scale-90 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <h2 className="mt-6 text-3xl font-black text-primary uppercase tracking-tighter italic text-center px-4">
              {profile?.name || user?.email?.split('@')[0] || 'ADMIN'}
            </h2>
            <p className="mt-1 text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.3em] opacity-60">
              PROVEEDOR • {profile?.address?.split(',')[0] || 'VENEZUELA'}
            </p>
          </div>

          <main className="p-6 space-y-6 max-w-md mx-auto -mt-6">
            <div className="bg-white rounded-xl shadow-level-1 border border-outline-variant overflow-hidden">
              <MenuItem label={t('company_profile')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} onClick={() => setActiveSection('company')} />
              <MenuItem label={t('account_settings')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} onClick={() => setActiveSection('account')} />
              <MenuItem label={t('privacy_security')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} onClick={() => setActiveSection('security')} />
              <MenuItem label={t('appearance_theme')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>} onClick={() => setActiveSection('appearance')} />
              <MenuItem label={t('notifications')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>} onClick={() => setActiveSection('notifications')} />
            </div>

            <div className="bg-white rounded-xl shadow-level-1 border border-outline-variant overflow-hidden">
              <MenuItem label={t('help_center')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} onClick={() => setActiveSection('help')} />
              <MenuItem label={t('terms_cond')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" /></svg>} onClick={() => setActiveSection('legal')} />
              <MenuItem label={t('logout')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-6 0v-1m6-11V7a3 3 0 01-6 0v1" /></svg>} onClick={() => supabase.auth.signOut()} color="text-error" />
            </div>
          </main>
        </>
      )}

      {activeSection === 'company' && (
        <>
          <SubHeader title={t('company_profile')} />
          <main className="p-6 space-y-8 max-w-md mx-auto pb-32">
            <div className="bg-white rounded-lg border border-outline-variant shadow-level-1 p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2 border-b border-outline-variant/20 pb-4">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest block">RIF (Editable)</span>
                  <input value={editCompany.rif} onChange={e => setEditCompany({...editCompany, rif: e.target.value})} className="w-full text-sm font-bold text-primary bg-surface-container-low p-3 rounded-md outline-none border border-transparent focus:border-secondary" placeholder="Ej. J-12345678-9" />
                </div>
                <div className="space-y-2 border-b border-outline-variant/20 pb-4">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest block">Nombre / Razón Social</span>
                  <input value={editCompany.name} onChange={e => setEditCompany({...editCompany, name: e.target.value})} className="w-full text-sm font-bold text-primary bg-surface-container-low p-3 rounded-md outline-none border border-transparent focus:border-secondary" />
                </div>
                <div className="space-y-2 border-b border-outline-variant/20 pb-4">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest block">Dirección Fiscal</span>
                  <textarea value={editCompany.address} onChange={e => setEditCompany({...editCompany, address: e.target.value})} className="w-full text-xs font-medium text-primary bg-surface-container-low p-3 rounded-md outline-none border border-transparent focus:border-secondary" rows={3} placeholder="Ingresa la dirección fiscal completa..." />
                </div>
                <div className="grid grid-cols-2 gap-4 border-b border-outline-variant/20 pb-4">
                   <div className="space-y-1">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest block">Teléfono</span>
                      <input value={editCompany.phone} onChange={e => setEditCompany({...editCompany, phone: e.target.value})} className="w-full text-xs font-bold text-primary bg-surface-container-low p-3 rounded-md outline-none" />
                   </div>
                   <div className="space-y-1">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest block">Email</span>
                      <input value={editCompany.email} onChange={e => setEditCompany({...editCompany, email: e.target.value})} className="w-full text-xs font-bold text-primary bg-surface-container-low p-3 rounded-md outline-none" />
                   </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                   <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Logo Empresa</span>
                   <div className="flex items-center gap-3">
                      {profile?.logo_url && <img src={profile.logo_url} className="w-8 h-8 rounded object-contain border border-outline-variant/30" />}
                      <button
                        type="button"
                        onClick={() => companyLogoInputRef.current?.click()}
                        className="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-1 bg-surface-container-low rounded border border-secondary/30 active:scale-95 transition-all"
                      >Cambiar Logo</button>
                   </div>
                </div>
              </div>

              <button type="button" onClick={handleUpdateCompany} disabled={loading} className="w-full py-4 bg-primary text-white font-bold rounded-md shadow-md active:scale-95 transition-all text-xs uppercase tracking-widest">
                {loading ? '...' : t('save_changes')}
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest ml-1">{t('digital_signature')}</h3>
              <div className="bg-white rounded-lg border-2 border-dashed border-outline-variant/50 p-8 flex flex-col items-center justify-center min-h-[160px]">
                {profile?.signature_url ? (
                  <div className="relative group">
                    <img src={profile.signature_url} className="max-h-24 object-contain" />
                    <button type="button" onClick={() => signatureInputRef.current?.click()} className="absolute -top-4 -right-4 bg-white border border-outline-variant p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.207V17h2.793l8.414-8.414-2.828-2.828z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-outline-variant mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <button type="button" onClick={() => signatureInputRef.current?.click()} className="px-6 py-2.5 bg-surface-container-low text-secondary text-[10px] font-bold uppercase rounded border border-secondary/30 active:scale-95 transition-all">
                      {t('upload_signature')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        </>
      )}

      {activeSection === 'account' && (
        <>
          <SubHeader title={t('account_settings')} />
          <main className="p-6 space-y-8 max-w-md mx-auto">
             <div className="bg-white rounded-lg border border-outline-variant shadow-level-1 overflow-hidden">
                <div className="p-5 space-y-6">
                   <div className="space-y-2">
                      <h3 className="text-lg font-bold text-primary tracking-tight">Actualizar Correo</h3>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Dirección de Correo</label>
                        <input value={user?.email || ''} readOnly className="w-full bg-surface-container-low p-4 rounded-md text-sm font-medium text-primary border border-transparent" />
                      </div>
                      <button type="button" className="w-full py-3.5 bg-secondary text-white font-bold rounded-md text-xs uppercase tracking-widest mt-2 active:scale-95 transition-all">Guardar Cambios</button>
                   </div>

                   <div className="h-px bg-outline-variant/30"></div>

                   <div className="space-y-4">
                      <h3 className="text-lg font-bold text-primary tracking-tight">Cambiar Contraseña</h3>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Contraseña Actual</label>
                          <div className="relative">
                            <input type="password" placeholder="••••••••" className="w-full bg-surface-container-low p-4 rounded-md text-sm" />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nueva Contraseña</label>
                          <input type="password" placeholder="Mín. 8 caracteres" className="w-full bg-surface-container-low p-4 rounded-md text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
                          <input type="password" placeholder="Repita la nueva contraseña" className="w-full bg-surface-container-low p-4 rounded-md text-sm" />
                        </div>
                      </div>
                      <button type="button" className="w-full py-3.5 bg-secondary text-white font-bold rounded-md text-xs uppercase tracking-widest mt-2">Actualizar Contraseña</button>
                   </div>
                </div>
             </div>
             <p className="px-2 text-[11px] text-on-surface-variant leading-relaxed opacity-60">Para proteger su privacidad, nunca comparta sus credenciales de acceso con terceros.</p>
          </main>
        </>
      )}

      {activeSection === 'security' && (
        <>
          <SubHeader title={t('privacy_security')} />
          <main className="p-6 space-y-8 max-w-md mx-auto">
             <div className="space-y-2">
                <p className="text-sm font-medium text-on-surface-variant px-1">Controla qué información compartes y cómo proteges tu cuenta.</p>
                <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest pt-4 ml-1">Seguridad de la Cuenta</h3>
             </div>
             <div className="bg-white rounded-xl shadow-level-1 border border-outline-variant overflow-hidden">
                <MenuItem label="Cambiar Contraseña" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
                <div className="p-5 flex items-center justify-between border-b border-outline-variant/20">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 20a10.003 10.003 0 006.235-2.397l.054.09a10.003 10.003 0 01-2.753-9.57M12 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
                      <div>
                        <div className="text-sm font-bold text-primary">Biometría</div>
                        <div className="text-[10px] text-on-surface-variant">Acceder con FaceID / Huella</div>
                      </div>
                   </div>
                   <div className="w-12 h-6 bg-outline-variant rounded-full relative p-1 transition-all"><div className="w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                </div>
                <MenuItem label="Verificación en 2 pasos" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
                <MenuItem label="Dispositivos Activos" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
             </div>

             <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest ml-1">Legal</h3>
             <div className="bg-white rounded-xl shadow-level-1 border border-outline-variant overflow-hidden">
                <MenuItem label="Política de Privacidad" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" /></svg>} />
                <MenuItem label="Términos y Condiciones" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>} />
             </div>
          </main>
        </>
      )}

      {activeSection === 'appearance' && (
        <>
          <SubHeader title={t('appearance_theme')} />
          <main className="p-6 space-y-8 max-w-md mx-auto">
             <div className="bg-white rounded-xl shadow-level-1 border border-outline-variant overflow-hidden">
                <div className="p-6 flex items-center justify-between border-b border-outline-variant/20">
                   <div>
                      <div className="text-base font-bold text-primary">Modo Oscuro</div>
                      <div className="text-xs text-on-surface-variant opacity-60">Ahorra batería y descansa la vista</div>
                   </div>
                   <button type="button" onClick={toggleTheme} className={`w-14 h-7 rounded-full p-1 transition-all ${theme === 'dark' ? 'bg-secondary' : 'bg-outline-variant'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}></div>
                   </button>
                </div>
                <div className="p-6 flex items-center justify-between">
                   <div>
                      <div className="text-base font-bold text-primary">Idioma</div>
                      <div className="text-xs text-on-surface-variant opacity-60">Selecciona tu idioma preferido</div>
                   </div>
                   <div className="flex bg-surface-container-low p-1 rounded-md border border-outline-variant">
                      <button type="button" onClick={() => setLanguage('es')} className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${language === 'es' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}>ES</button>
                      <button type="button" onClick={() => setLanguage('en')} className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}>EN</button>
                   </div>
                </div>
             </div>
          </main>
        </>
      )}

      {activeSection === 'notifications' && (
        <>
          <SubHeader title={t('notifications')} />
          <main className="p-6 space-y-8 max-w-md mx-auto text-center">
             <p className="text-sm font-medium text-on-surface-variant px-4">Gestiona cómo quieres recibir las alertas de tu comunidad.</p>
             <div className="bg-white rounded-2xl shadow-level-1 border border-outline-variant p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                   <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div>
                   <div>
                      <div className="text-sm font-bold text-primary">Permitir Notificaciones</div>
                      <div className="text-[10px] text-on-surface-variant">Alertas de pagos y comunidad</div>
                   </div>
                </div>
                <div className="w-14 h-7 bg-secondary rounded-full p-1 flex items-center justify-end"><div className="w-5 h-5 bg-white rounded-full shadow-md"></div></div>
             </div>

             <div className="bg-white rounded-2xl shadow-level-1 border border-outline-variant p-6 space-y-6">
                <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest text-left">Ajustes de Sonido</h3>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg></div>
                      <div>
                         <div className="text-sm font-bold text-primary">Sonido de Alerta</div>
                         <div className="text-[10px] text-on-surface-variant">Activado</div>
                      </div>
                   </div>
                   <div className="w-12 h-6 bg-secondary rounded-full p-1 flex items-center justify-end"><div className="w-4 h-4 bg-white rounded-full shadow-md"></div></div>
                </div>
                <div className="space-y-4 pt-2">
                   <div className="flex justify-between text-[11px] font-bold text-primary">
                      <span>Volumen del Tono</span>
                      <span>70%</span>
                   </div>
                   <div className="w-full h-1 bg-surface-container-low rounded-full relative">
                      <div className="absolute inset-0 bg-secondary w-[70%] rounded-full"></div>
                      <div className="absolute top-1/2 left-[70%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary border-4 border-white rounded-full shadow-md"></div>
                   </div>
                   <div className="flex justify-between text-on-surface-variant opacity-40"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg></div>
                </div>
             </div>

             <div className="bg-surface-container-low p-4 rounded-xl flex gap-3 text-left">
                <svg className="h-5 w-5 text-secondary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-[10px] font-medium text-on-surface-variant leading-relaxed uppercase tracking-wider">Recomendamos mantener las notificaciones activas para no perderse avisos críticos de seguridad o vencimientos de pagos.</p>
             </div>
          </main>
        </>
      )}

      {activeSection === 'help' && (
        <>
          <SubHeader title={t('help_center')} />
          <main className="p-6 space-y-8 max-w-md mx-auto text-center">
             <p className="text-sm font-medium text-on-surface-variant px-4">¿En qué podemos ayudarte hoy?</p>
             <div className="bg-white rounded-2xl shadow-level-1 border border-outline-variant overflow-hidden">
                <MenuItem label="Centro de Ayuda" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" /></svg>} />
                <MenuItem label="Enviar Comentario" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>} />
                <MenuItem label="Realizar un Reclamo" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
             </div>

             <div className="bg-white rounded-3xl shadow-level-2 border border-outline-variant p-8 space-y-6">
                <div className="space-y-1">
                   <h3 className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">Contacto Directo</h3>
                   <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest opacity-60">Lunes a Viernes: 8:00 AM - 5:00 PM</p>
                </div>
                <button type="button" className="w-full py-4 bg-primary text-white font-bold rounded-md shadow-md text-xs uppercase tracking-widest active:scale-95 transition-all">Llamar a Administración</button>
             </div>
          </main>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Profile;
