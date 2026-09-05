import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../data/db/supabase';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useTheme } from '../../../core/context/ThemeContext';
import jsPDF from 'jspdf';
import BottomNav from '../../../core/nav/BottomNav';

type ProfileSection = 'main' | 'account' | 'security' | 'appearance' | 'notifications' | 'help' | 'legal' | 'company' | 'binance';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<ProfileSection>('main');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Binance API State
  const [binanceKey, setBinanceKey] = useState(import.meta.env.VITE_BINANCE_API_KEY || '');
  const [binanceSecret, setBinanceSecret] = useState('');

  // Password Change State
  const [passwords, setPasswordData] = useState({ current: '', new: '', confirm: '' });

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
        if (user.user_metadata?.binance_key) setBinanceKey(user.user_metadata.binance_key);
        if (user.user_metadata?.binance_secret) setBinanceSecret(user.user_metadata.binance_secret);
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

  const handleSaveBinanceAPI = async () => {
    setLoading(true);
    try {
        const { error } = await supabase.auth.updateUser({
            data: { binance_key: binanceKey, binance_secret: binanceSecret }
        });
        if (error) throw error;
        alert('API de Binance guardada correctamente (Solo Lectura)');
    } catch (err: any) {
        alert('Error: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwords.new !== passwords.confirm) return alert('Las contraseñas no coinciden');
    setLoading(true);
    try {
        const { error } = await supabase.auth.updateUser({ password: passwords.new });
        if (error) throw error;
        alert('Contraseña actualizada correctamente');
        setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err: any) {
        alert('Error: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  const generateDeclarationLetter = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CARTA DE DECLARACIÓN DE ORIGEN Y MOVIMIENTOS LÍCITO DE FONDOS", pageWidth/2, 25, { align: 'center' });
    doc.text("VINCULADOS A LA ACTIVIDAD DE ACTIVOS DIGITALES", pageWidth/2, 32, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const bodyText = `Yo, ${profile?.name || '________________'}, titular de la Cédula de Identidad / RIF N.º ${profile?.rif || '________________'}, en mi carácter de usuario de la plataforma BiMoneda, declaro bajo fe de juramento que los fondos utilizados para mis operaciones con activos digitales (Criptoactivos) provienen de actividades lícitas y de mi giro comercial declarado.\n\nEste documento se emite como un BORRADOR TÉCNICO PARA REVISIÓN CONTABLE, basado en el historial de operaciones registrado en la aplicación BiMoneda hasta la fecha ${new Date().toLocaleDateString('es-VE')}.\n\nCertifico que las transacciones detalladas en mis libros contables digitales corresponden a la realidad de mis operaciones P2P y liquidaciones de activos. Los mismos son producto de mi actividad económica y no guardan relación con fondos de procedencia ilícita ni legitimación de capitales.`;

    const splitText = doc.splitTextToSize(bodyText, pageWidth - 40);
    doc.text(splitText, 20, 50);

    doc.text("__________________________", pageWidth/2, 140, { align: 'center' });
    doc.text("Firma del Declarante", pageWidth/2, 145, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("NOTA: Este documento debe ser validado, firmado y sellado por un Contador Público Colegiado para su presentación legal.", pageWidth/2, 160, { align: 'center' });

    doc.save("Declaracion_Fondos_Licitos_BiMoneda.pdf");
  };

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>, bucket: string, field: string) => {
    try {
      setLoading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'anon'}-${field}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
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
      alert('Error al subir archivo: ' + error.message);
    } finally {
      setLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const MenuItem = ({ icon, label, onClick, color = 'text-primary dark:text-white' }: any) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between p-5 active:bg-surface-container-low dark:active:bg-white/10 transition-all border-b border-outline-variant/20 dark:border-white/10 last:border-0"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-surface-container-low dark:bg-white/10 flex items-center justify-center text-secondary">
          {icon}
        </div>
        <span className={`text-sm font-bold ${color} tracking-tight uppercase`}>{label}</span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-outline dark:text-white/20" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </button>
  );

  const SubHeader = ({ title }: { title: string }) => (
    <header className="bg-white dark:bg-[#0d2b5b] px-6 h-20 flex items-center gap-4 shadow-level-1 sticky top-0 z-50 border-b dark:border-white/10">
      <button type="button" onClick={() => setActiveSection('main')} className="p-2 text-primary dark:text-white active:scale-90 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="text-xl font-bold text-primary dark:text-white tracking-tight uppercase">{title}</h1>
    </header>
  );

  return (
    <div className="min-h-screen bg-background dark:bg-[#0b1c30] font-inter pb-32 transition-colors">
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'profiles', 'avatar')} />
      <input type="file" ref={companyLogoInputRef} className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'profiles', 'logo')} />
      <input type="file" ref={signatureInputRef} className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'signatures', 'signature_url')} />

      {activeSection === 'main' && (
        <>
          <div className="bg-surface-container-low dark:bg-[#0d2b5b] pt-12 pb-10 flex flex-col items-center shadow-sm">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-primary dark:border-secondary p-1 shadow-2xl bg-white dark:bg-primary overflow-hidden">
                <img src={avatarUrl || "/logo-1024.png"} className="w-full h-full object-cover rounded-full" />
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-10 h-10 bg-white dark:bg-secondary rounded-full border border-primary dark:border-white/20 flex items-center justify-center shadow-lg active:scale-90 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <h2 className="mt-6 text-3xl font-black text-primary dark:text-white uppercase tracking-tighter italic text-center px-4">
              {profile?.name || user?.email?.split('@')[0] || 'ADMIN'}
            </h2>
            <p className="mt-1 text-[11px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-[0.3em] opacity-60">
              PROVEEDOR • {profile?.address?.split(',')[0] || 'VENEZUELA'}
            </p>
          </div>

          <main className="p-6 space-y-6 max-w-md mx-auto -mt-6">
            <div className="bg-white dark:bg-white/5 rounded-3xl shadow-level-1 border border-outline-variant dark:border-white/10 overflow-hidden">
              <MenuItem label={t('company_profile')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} onClick={() => setActiveSection('company')} />
              <MenuItem label={t('account_settings')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} onClick={() => setActiveSection('account')} />
              <MenuItem label={t('privacy_security')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} onClick={() => setActiveSection('security')} />
              <MenuItem label="Integración Binance" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} onClick={() => setActiveSection('binance')} />
              <MenuItem label={t('appearance_theme')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>} onClick={() => setActiveSection('appearance')} />
              <MenuItem label={t('notifications')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>} onClick={() => setActiveSection('notifications')} />
            </div>

            <div className="bg-white dark:bg-white/5 rounded-3xl shadow-level-1 border border-outline-variant dark:border-white/10 overflow-hidden">
              <MenuItem label={t('help_center')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} onClick={() => setActiveSection('help')} />
              <MenuItem label={t('terms_cond')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" /></svg>} onClick={() => setActiveSection('legal')} />
              <MenuItem label={t('logout')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-6 0v-1m6-11V7a3 3 0 01-6 0v1" /></svg>} onClick={() => supabase.auth.signOut()} color="text-red-500" />
            </div>
          </main>
        </>
      )}

      {activeSection === 'company' && (
        <>
          <SubHeader title={t('company_profile')} />
          <main className="p-6 space-y-8 max-w-md mx-auto pb-32">
            <div className="bg-white dark:bg-white/5 rounded-3xl border border-outline-variant dark:border-white/10 shadow-level-1 p-8 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2 border-b border-outline-variant/20 dark:border-white/10 pb-4">
                  <span className="text-[11px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-widest block">RIF (Editable)</span>
                  <input value={editCompany.rif} onChange={e => setEditCompany({...editCompany, rif: e.target.value})} className="w-full text-sm font-bold text-primary dark:text-white bg-surface-container-low dark:bg-white/10 p-3 rounded-md outline-none" />
                </div>
                <div className="space-y-2 border-b border-outline-variant/20 dark:border-white/10 pb-4">
                  <span className="text-[11px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-widest block">Nombre / Razón Social</span>
                  <input value={editCompany.name} onChange={e => setEditCompany({...editCompany, name: e.target.value})} className="w-full text-sm font-bold text-primary dark:text-white bg-surface-container-low dark:bg-white/10 p-3 rounded-md outline-none" />
                </div>
                <div className="space-y-2 border-b border-outline-variant/20 dark:border-white/10 pb-4">
                  <span className="text-[11px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-widest block">Dirección Fiscal</span>
                  <textarea value={editCompany.address} onChange={e => setEditCompany({...editCompany, address: e.target.value})} className="w-full text-xs font-medium text-primary dark:text-white bg-surface-container-low dark:bg-white/10 p-3 rounded-md outline-none" rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-outline-variant/20 dark:border-white/10 pb-4">
                   <div className="space-y-2">
                      <span className="text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-widest block">Teléfono</span>
                      <input value={editCompany.phone} onChange={e => setEditCompany({...editCompany, phone: e.target.value})} className="w-full text-xs font-bold text-primary dark:text-white bg-surface-container-low dark:bg-white/10 p-3 rounded-md" />
                   </div>
                   <div className="space-y-2">
                      <span className="text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-widest block">Email</span>
                      <input value={editCompany.email} onChange={e => setEditCompany({...editCompany, email: e.target.value})} className="w-full text-xs font-bold text-primary dark:text-white bg-surface-container-low dark:bg-white/10 p-3 rounded-md" />
                   </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                   <span className="text-[11px] font-bold text-on-surface-variant dark:text-white/40 uppercase tracking-widest">Logo Empresa</span>
                   <div className="flex items-center gap-3">
                      {profile?.logo_url && <img src={profile.logo_url} className="w-10 h-10 rounded-lg object-contain border dark:border-white/20" />}
                      <button type="button" onClick={() => companyLogoInputRef.current?.click()} className="px-4 py-2 bg-surface-container-low dark:bg-white/10 text-secondary text-[10px] font-black uppercase rounded-xl border dark:border-white/10 active:scale-95 transition-all">Cambiar Logo</button>
                   </div>
                </div>
              </div>

              <button type="button" onClick={handleUpdateCompany} disabled={loading} className="w-full py-5 bg-primary dark:bg-secondary text-white font-black rounded-2xl shadow-xl active:scale-[0.98] transition-all text-xs uppercase tracking-[0.2em]">
                {loading ? '...' : t('save_changes')}
              </button>
            </div>

            <div className="space-y-4">
               <h3 className="text-xs font-black text-primary dark:text-white uppercase tracking-widest ml-2">Firma Digital</h3>
               <div className="bg-white dark:bg-white/5 rounded-3xl border-2 border-dashed border-outline-variant dark:border-white/10 p-8 flex flex-col items-center justify-center min-h-[160px]">
                 {profile?.signature_url ? (
                   <div className="relative group">
                     <img src={profile.signature_url} className="max-h-24 object-contain" />
                     <button onClick={() => signatureInputRef.current?.click()} className="absolute -top-4 -right-4 bg-white dark:bg-secondary border border-outline-variant p-2 rounded-full shadow-md active:scale-90">
                        <svg className="h-4 w-4 text-primary dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                     </button>
                   </div>
                 ) : (
                   <button type="button" onClick={() => signatureInputRef.current?.click()} className="px-8 py-3 bg-surface-container-low dark:bg-white/10 text-secondary font-black uppercase text-[10px] rounded-xl border dark:border-white/10 active:scale-95">Subir Firma</button>
                 )}
               </div>
            </div>
          </main>
        </>
      )}

      {activeSection === 'binance' && (
        <>
          <SubHeader title="Integración Binance" />
          <main className="p-6 space-y-8 max-w-md mx-auto">
             <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-outline-variant dark:border-white/10 shadow-level-1 space-y-6">
                <h3 className="text-xs font-black text-primary dark:text-white uppercase tracking-widest border-b dark:border-white/10 pb-2">Configuración API</h3>
                <div className="space-y-6">
                    <p className="text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase leading-tight">Configura tu API de Binance (Solo Lectura) para sincronizar libros contables automáticamente.</p>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Binance API Key</label>
                        <input type="text" value={binanceKey} onChange={e => setBinanceKey(e.target.value)} className="w-full bg-surface-container-low dark:bg-white/10 p-4 rounded-xl text-xs font-bold text-primary dark:text-white outline-none" placeholder="Ingresa tu Key..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Binance API Secret</label>
                        <input type="password" value={binanceSecret} onChange={e => setBinanceSecret(e.target.value)} className="w-full bg-surface-container-low dark:bg-white/10 p-4 rounded-xl text-xs font-bold text-primary dark:text-white outline-none" placeholder="••••••••••••" />
                    </div>
                    <button onClick={handleSaveBinanceAPI} className="w-full py-4 bg-primary dark:bg-secondary text-white font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg">Guardar Credenciales</button>
                </div>
             </div>

             <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-outline-variant dark:border-white/10 shadow-level-1 space-y-6">
                <h3 className="text-xs font-black text-primary dark:text-white uppercase tracking-widest border-b dark:border-white/10 pb-2">Generar Documentos</h3>
                <div className="space-y-4">
                    <p className="text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase">Certifica el origen lícito de tus operaciones digitales.</p>
                    <button onClick={generateDeclarationLetter} className="w-full flex items-center justify-between p-5 bg-surface-container-low dark:bg-white/5 rounded-2xl border dark:border-white/10 active:scale-95 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                            <svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" /></svg>
                            <span className="text-[10px] font-black text-primary dark:text-white uppercase">Carta de Declaración (Borrador)</span>
                        </div>
                        <svg className="h-4 w-4 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
             </div>
          </main>
        </>
      )}

      {activeSection === 'account' && (
        <>
          <SubHeader title={t('account_settings')} />
          <main className="p-6 space-y-8 max-w-md mx-auto">
             <div className="bg-white dark:bg-white/5 rounded-3xl border border-outline-variant dark:border-white/10 shadow-level-1 overflow-hidden p-8 space-y-10">
                <div className="space-y-6">
                   <h3 className="text-xl font-black text-primary dark:text-white tracking-tight uppercase">Actualizar Correo</h3>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Dirección de Correo</label>
                     <input value={user?.email || ''} readOnly className="w-full bg-surface-container-low dark:bg-white/10 p-5 rounded-2xl text-sm font-bold text-primary dark:text-white border-0" />
                   </div>
                   <button className="w-full py-4 bg-primary dark:bg-secondary text-white font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md">Guardar Cambios</button>
                </div>

                <div className="h-px bg-outline-variant/30 dark:bg-white/10"></div>

                <div className="space-y-6">
                   <h3 className="text-xl font-black text-primary dark:text-white tracking-tight uppercase">Cambiar Contraseña</h3>
                   <div className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Contraseña Actual</label>
                       <input type="password" value={passwords.current} onChange={e => setPasswordData({...passwords, current: e.target.value})} className="w-full bg-surface-container-low dark:bg-white/10 p-5 rounded-2xl text-sm text-primary dark:text-white" placeholder="••••••••" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Nueva Contraseña</label>
                       <input type="password" value={passwords.new} onChange={e => setPasswordData({...passwords, new: e.target.value})} className="w-full bg-surface-container-low dark:bg-white/10 p-5 rounded-2xl text-sm text-primary dark:text-white" placeholder="Mín. 8 caracteres" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
                       <input type="password" value={passwords.confirm} onChange={e => setPasswordData({...passwords, confirm: e.target.value})} className="w-full bg-surface-container-low dark:bg-white/10 p-5 rounded-2xl text-sm text-primary dark:text-white" placeholder="Repita la nueva contraseña" />
                     </div>
                   </div>
                   <button onClick={handleUpdatePassword} className="w-full py-4 bg-primary dark:bg-secondary text-white font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md">Actualizar Contraseña</button>
                </div>
             </div>
             <p className="px-6 text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase leading-relaxed text-center italic">Para proteger su privacidad, nunca comparta sus credenciales de acceso con terceros.</p>
          </main>
        </>
      )}

      {activeSection === 'security' && (
        <>
          <SubHeader title={t('privacy_security')} />
          <main className="p-6 space-y-8 max-w-md mx-auto">
             <div className="space-y-2">
                <p className="text-[11px] font-bold text-on-surface-variant dark:text-white/40 uppercase px-4 leading-relaxed">Controla qué información compartes y cómo proteges tu cuenta.</p>
                <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest pt-6 ml-4">Seguridad de la Cuenta</h3>
             </div>
             <div className="bg-white dark:bg-white/5 rounded-3xl shadow-level-1 border border-outline-variant dark:border-white/10 overflow-hidden">
                <MenuItem label="Cambiar Contraseña" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} onClick={() => setActiveSection('account')} />
                <MenuItem label="Biometría" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 20a10.003 10.003 0 006.235-2.397l.054.09a10.003 10.003 0 01-2.753-9.57M12 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} onClick={() => alert('Próximamente')} />
                <MenuItem label="Verificación en 2 pasos" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} onClick={() => alert('Próximamente')} />
                <MenuItem label="Dispositivos Activos" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} onClick={() => alert('Sesión actual activa')} />
             </div>

             <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest ml-4">Legal</h3>
             <div className="bg-white dark:bg-white/5 rounded-3xl shadow-level-1 border border-outline-variant dark:border-white/10 overflow-hidden">
                <MenuItem label="Política de Privacidad" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" /></svg>} onClick={() => alert('Política de Privacidad')} />
                <MenuItem label="Términos y Condiciones" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>} onClick={() => setActiveSection('legal')} />
             </div>
          </main>
        </>
      )}

      {activeSection === 'notifications' && (
        <>
          <SubHeader title={t('notifications')} />
          <main className="p-6 space-y-8 max-w-md mx-auto text-center">
             <p className="text-[11px] font-bold text-on-surface-variant dark:text-white/40 uppercase px-4 leading-relaxed">Gestiona cómo quieres recibir las alertas de tu comunidad.</p>
             <div className="bg-white dark:bg-white/5 rounded-3xl shadow-level-1 border border-outline-variant dark:border-white/10 p-8 flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                   <div className="w-12 h-12 rounded-2xl bg-surface-container-low dark:bg-white/10 flex items-center justify-center text-secondary"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div>
                   <div>
                      <div className="text-sm font-black text-primary dark:text-white uppercase tracking-tight">Permitir Notificaciones</div>
                      <div className="text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase">Alertas de pagos y comunidad</div>
                   </div>
                </div>
                <div className="w-14 h-7 bg-secondary rounded-full p-1 flex items-center justify-end shadow-inner"><div className="w-5 h-5 bg-white rounded-full shadow-md"></div></div>
             </div>

             <div className="bg-white dark:bg-white/5 rounded-3xl shadow-level-1 border border-outline-variant dark:border-white/10 p-8 space-y-8">
                <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest text-left">Ajustes de Sonido</h3>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-low dark:bg-white/10 flex items-center justify-center text-secondary"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg></div>
                      <div>
                         <div className="text-sm font-black text-primary dark:text-white uppercase">Sonido de Alerta</div>
                         <div className="text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase">Activado</div>
                      </div>
                   </div>
                   <div className="w-12 h-6 bg-secondary rounded-full p-1 flex items-center justify-end shadow-inner"><div className="w-4 h-4 bg-white rounded-full shadow-md"></div></div>
                </div>
                <div className="space-y-4 pt-2">
                   <div className="flex justify-between text-[11px] font-black text-primary dark:text-white uppercase tracking-widest">
                      <span>Volumen del Tono</span>
                      <span>70%</span>
                   </div>
                   <div className="w-full h-1.5 bg-surface-container-low dark:bg-white/10 rounded-full relative">
                      <div className="absolute inset-0 bg-secondary w-[70%] rounded-full shadow-lg"></div>
                      <div className="absolute top-1/2 left-[70%] -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-secondary rounded-full shadow-xl"></div>
                   </div>
                </div>
             </div>

             <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-3xl flex gap-4 text-left border border-primary/10 dark:border-white/10">
                <svg className="h-6 w-6 text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-[10px] font-bold text-on-surface-variant dark:text-white/60 leading-relaxed uppercase tracking-wider">Recomendamos mantener las notificaciones activas para no perderse avisos críticos de seguridad o vencimientos de pagos.</p>
             </div>
          </main>
        </>
      )}

      {activeSection === 'help' && (
        <>
          <SubHeader title={t('help_center')} />
          <main className="p-6 space-y-8 max-w-md mx-auto text-center">
             <p className="text-[11px] font-bold text-on-surface-variant dark:text-white/40 uppercase px-4 leading-relaxed">¿En qué podemos ayudarte hoy?</p>
             <div className="bg-white dark:bg-white/5 rounded-3xl shadow-level-1 border border-outline-variant dark:border-white/10 overflow-hidden">
                <MenuItem label="Centro de Ayuda" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" /></svg>} />
                <MenuItem label="Enviar Comentario" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>} />
                <MenuItem label="Realizar un Reclamo" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
             </div>

             <div className="bg-white dark:bg-[#0d2b5b] rounded-[40px] shadow-2xl border border-outline-variant dark:border-white/10 p-10 space-y-8">
                <div className="space-y-2">
                   <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Contacto Directo</h3>
                   <p className="text-[11px] text-on-surface-variant dark:text-white/60 font-bold uppercase tracking-widest">Lunes a Viernes: 8:00 AM - 5:00 PM</p>
                </div>
                <button type="button" className="w-full py-5 bg-primary dark:bg-secondary text-white font-black rounded-2xl shadow-xl text-xs uppercase tracking-[0.2em] active:scale-95 transition-all">Llamar a Administración</button>
             </div>
          </main>
        </>
      )}

      {activeSection === 'appearance' && (
        <>
          <SubHeader title={t('appearance_theme')} />
          <main className="p-6 space-y-8 max-w-md mx-auto">
             <div className="bg-white dark:bg-white/5 rounded-3xl border border-outline-variant dark:border-white/10 overflow-hidden shadow-sm">
                <div className="p-8 flex items-center justify-between border-b dark:border-white/10">
                   <div>
                      <div className="text-base font-black text-primary dark:text-white uppercase tracking-tight">Modo Oscuro</div>
                      <div className="text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase">Ahorra batería y descansa la vista</div>
                   </div>
                   <button onClick={toggleTheme} className={`w-14 h-7 rounded-full p-1 transition-all ${theme === 'dark' ? 'bg-secondary' : 'bg-outline-variant dark:bg-white/20'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}></div>
                   </button>
                </div>
                <div className="p-8 flex items-center justify-between">
                   <div>
                      <div className="text-base font-black text-primary dark:text-white uppercase tracking-tight">Idioma</div>
                      <div className="text-[10px] font-bold text-on-surface-variant dark:text-white/40 uppercase">Selecciona tu idioma preferido</div>
                   </div>
                   <div className="flex bg-surface-container-low dark:bg-white/10 p-1 rounded-2xl border dark:border-white/10">
                      <button onClick={() => setLanguage('es')} className={`px-5 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${language === 'es' ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' : 'text-on-surface-variant dark:text-white/40'}`}>ES</button>
                      <button onClick={() => setLanguage('en')} className={`px-5 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${language === 'en' ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' : 'text-on-surface-variant dark:text-white/40'}`}>EN</button>
                   </div>
                </div>
             </div>
          </main>
        </>
      )}

      {activeSection === 'legal' && (
        <>
          <SubHeader title={t('terms_cond')} />
          <main className="p-6 space-y-6 max-w-md mx-auto">
             <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-outline-variant dark:border-white/10 shadow-sm space-y-6">
                <h3 className="text-sm font-black text-primary dark:text-white uppercase tracking-widest border-b dark:border-white/10 pb-2">Términos de Uso</h3>
                <div className="text-[11px] text-on-surface-variant dark:text-white/60 leading-relaxed space-y-4 text-justify">
                    <p>Al utilizar BiMoneda, usted acepta que es el único responsable de la exactitud de los datos registrados y del cumplimiento de las obligaciones tributarias en su jurisdicción.</p>
                    <p>La aplicación actúa como una herramienta técnica de apoyo administrativo y no constituye asesoría contable o legal formal.</p>
                    <p>Nos reservamos el derecho de actualizar los términos para cumplir con las normativas vigentes en materia de criptoactivos.</p>
                </div>
             </div>
             <MenuItem label="Política de Privacidad" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293 1.414V19a2 2 0 01-2 2z" /></svg>} onClick={() => alert('Política de Privacidad')} />
          </main>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Profile;
