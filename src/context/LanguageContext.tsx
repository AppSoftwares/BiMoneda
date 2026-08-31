import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  es: {
    splash_title: "Tu facturación en su versión más inteligente.",
    splash_desc: "La plataforma integral que simplifica tu facturación digital, gestión de divisas USD/Bs, tasa BCV y cumplimiento legal SENIAT.",
    btn_login: "INGRESAR / INICIAR SESIÓN",
    login_title: "Iniciar Sesión",
    login_subtitle: "Ingresa tus credenciales",
    email_label: "Correo Electrónico",
    pass_label: "Contraseña",
    forgot_pass: "¿Olvidaste tu contraseña?",
    btn_signin: "Iniciar Sesión",
    rec_title: "Recuperar",
    rec_subtitle: "Ingresa tu correo para recibir un enlace de restablecimiento",
    btn_send: "Enviar Enlace",
    btn_back: "Volver",
    dash_title: "Provider Dashboard",
    btn_create_inv: "Crear Nueva Factura",
    monthly_rev: "Ingresos Mensuales",
    total_earned: "Total Ganado",
    bcv_rate: "Tasa BCV",
    sub_summary: "Resumen de Suscripciones",
    active_subs: "Suscripciones Activas",
    pending_pay: "Pagos Pendientes",
    recent_inv: "Facturas Recientes",
    view_all: "Ver Todas",
    profile_title: "Configuración y Perfil",
    account_settings: "Configuración de Cuenta",
    privacy_security: "Privacidad y Seguridad",
    appearance_theme: "Apariencia y Tema",
    notifications: "Notificaciones",
    help_center: "Centro de Ayuda",
    terms_cond: "Términos y Condiciones",
    logout: "Cerrar Sesión",
    logout_confirm_title: "¿Cerrar Sesión?",
    logout_confirm_desc: "¿Estás seguro que deseas salir de tu cuenta?",
    btn_cancel: "Cancelar",
    btn_exit: "Salir",
    lang_label: "Idioma",
    lang_es: "Español",
    lang_en: "Inglés",
    status_paid: "Pagado",
    status_pending: "Pendiente",
    status_cancelled: "Cancelado",
    theme_light: "Claro",
    theme_dark: "Oscuro",
    no_invoices: "No se encontraron facturas",
    loading_invoices: "Cargando facturas...",
    all_filters: "Todos",
    register_client_title: "Registrar Cliente",
    client_name_label: "Nombre Completo / Empresa",
    rif_label: "RIF (Tax ID)",
    phone_label: "Teléfono",
    btn_register: "Registrar Cliente",
    crypto_menu: "Cripto P2P y Contabilidad",
    crypto_title: "Operaciones P2P",
    btn_reg_op: "Registrar Operación",
    type_buy: "Compra",
    type_sell: "Venta",
    label_binance_order: "N.º de Orden Binance",
    label_order_status: "Estado de la Orden",
    label_crypto_net: "Cantidad Neta Cripto",
    label_crypto_fee: "Comisión Cripto",
    label_counterparty: "Contraparte (Apodo)",
    label_full_name: "Nombre Completo Contraparte",
    label_bank: "Banco",
    label_op_number: "N.º Operación Bancaria",
    label_account_holder: "Titular de Cuenta",
    btn_attach_receipt: "Adjuntar Comprobante Bancario",
    btn_attach_order: "Adjuntar Captura de Orden",
    legal_report_disclaimer: "Este documento es generado como apoyo contable/administrativo con base en los datos registrados por el usuario. No constituye asesoría legal, contable ni tributaria. Se recomienda validar con un contador público y/o abogado antes de presentarlo ante terceros.",
    legal_tech_report_text: "Por medio de la presente se deja constancia que la actividad comercial de intercambio de criptoactivos realizada por el usuario se encuentra amparada bajo el marco legal vigente de la República Bolivariana de Venezuela, cumpliendo con los principios de transparencia y licitud de fondos.",
    legal_reference_block: "Decreto Constituyente sobre el Sistema Integral de Criptoactivos y Providencia Sunacrip N.º 008-2019 (Gaceta Oficial N.º 41.578), que regulan la operatividad de las Casas de Intercambio y reconocen a los criptoactivos como medio de transferencia de valor, medio de pago y almacenamiento de valor en Venezuela.", // TODO: validar redacción y vigencia con abogado antes de publicar
  },
  en: {
    splash_title: "Your billing in its smartest version.",
    splash_desc: "The comprehensive platform that simplifies your digital billing, USD/Bs currency management, BCV rate, and SENIAT legal compliance.",
    btn_login: "ENTER / LOG IN",
    login_title: "Login",
    login_subtitle: "Enter your credentials",
    email_label: "Email Address",
    pass_label: "Password",
    forgot_pass: "Forgot your password?",
    btn_signin: "Sign In",
    rec_title: "Recover",
    rec_subtitle: "Enter your email to receive a reset link",
    btn_send: "Send Link",
    btn_back: "Back",
    dash_title: "Provider Dashboard",
    btn_create_inv: "Create New Invoice",
    monthly_rev: "Monthly Revenue",
    total_earned: "Total Earned",
    bcv_rate: "BCV Rate",
    sub_summary: "Subscription Summary",
    active_subs: "Active Subscriptions",
    pending_pay: "Pending Payments",
    recent_inv: "Recent Invoices",
    view_all: "View All",
    profile_title: "Settings & Profile",
    account_settings: "Account Settings",
    privacy_security: "Privacy & Security",
    appearance_theme: "Appearance & Theme",
    notifications: "Notifications",
    help_center: "Help Center",
    terms_cond: "Terms & Conditions",
    logout: "Log Out",
    logout_confirm_title: "Log Out?",
    logout_confirm_desc: "Are you sure you want to log out of your account?",
    btn_cancel: "Cancel",
    btn_exit: "Exit",
    lang_label: "Language",
    lang_es: "Spanish",
    lang_en: "English",
    status_paid: "Paid",
    status_pending: "Pending",
    status_cancelled: "Cancelled",
    theme_light: "Light",
    theme_dark: "Dark",
    no_invoices: "No invoices found",
    loading_invoices: "Loading invoices...",
    all_filters: "All",
    register_client_title: "Register Client",
    client_name_label: "Full Name / Company",
    rif_label: "RIF (Tax ID)",
    phone_label: "Phone",
    btn_register: "Register Client",
    crypto_menu: "Crypto P2P & Accounting",
    crypto_title: "P2P Operations",
    btn_reg_op: "Register Operation",
    type_buy: "Buy",
    type_sell: "Sell",
    label_binance_order: "Binance Order No.",
    label_order_status: "Order Status",
    label_crypto_net: "Net Crypto Amount",
    label_crypto_fee: "Crypto Fee",
    label_counterparty: "Counterparty (Nickname)",
    label_full_name: "Counterparty Full Name",
    label_bank: "Bank",
    label_op_number: "Bank Operation No.",
    label_account_holder: "Account Holder",
    btn_attach_receipt: "Attach Bank Receipt",
    btn_attach_order: "Attach Order Screenshot",
    legal_report_disclaimer: "This document is generated as accounting/administrative support based on data recorded by the user. It does not constitute legal, accounting, or tax advice. It is recommended to validate with a public accountant and/or lawyer before presenting it to third parties.",
    legal_tech_report_text: "This document certifies that the crypto-asset exchange commercial activity carried out by the user is protected under the current legal framework of the Bolivarian Republic of Venezuela, complying with the principles of transparency and legality of funds.",
    legal_reference_block: "Constituent Decree on the Comprehensive System of Crypto-assets and Sunacrip Providence No. 008-2019 (Official Gazette No. 41.578), which regulate the operation of Exchanges and recognize crypto-assets as a means of value transfer, means of payment, and value storage in Venezuela.",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved as Language) || 'es';
  });

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  const t = (key: string) => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
