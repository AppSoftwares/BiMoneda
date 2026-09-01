-- REPARACIÓN DEFINITIVA FacturaPro VE

-- 1. Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Reparación Tabla CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    rif TEXT NOT NULL UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE
);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. Reparación Tabla COMPANY_PROFILE
DROP TABLE IF EXISTS public.company_profile CASCADE;
CREATE TABLE public.company_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT DEFAULT 'BiMoneda S.A.',
    rif TEXT DEFAULT 'J-00000000-0',
    address TEXT DEFAULT 'Caracas, Venezuela',
    phone TEXT DEFAULT '+58 000-0000000',
    email TEXT DEFAULT 'admin@bimoneda.app',
    logo_url TEXT,
    signature_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.company_profile (name, rif, address)
VALUES ('BiMoneda S.A.', 'J-00000000-0', 'Caracas, Venezuela');

-- 4. Reparación Tabla INVOICES
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS iva_percent NUMERIC(5,2) DEFAULT 16.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS igtf_percent NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_bs NUMERIC(20,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS bcv_rate NUMERIC(20,4) DEFAULT 1.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subscription_id BIGINT; -- FK a client_subscriptions

-- 5. Nueva tabla para Suscripciones de Clientes
CREATE TABLE IF NOT EXISTS public.client_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    app_product TEXT CHECK (app_product IN ('CONDOMINIO', 'EASY_GO', 'BIMONEDA')) NOT NULL,
    periodicity TEXT CHECK (periodicity IN ('SEMANAL', 'MENSUAL', 'SEMESTRAL', 'ANUAL')) NOT NULL,
    amount_usd NUMERIC(20, 2) NOT NULL,
    billable_description TEXT NOT NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    next_billing_date DATE,
    status TEXT CHECK (status IN ('ACTIVA', 'PAUSADA', 'CANCELADA')) DEFAULT 'ACTIVA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PERMISOS (RLS) - Abrir para desarrollo
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todo para autenticados clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Todo para autenticados profile" ON public.company_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Todo para autenticados invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Todo para autenticados crypto" ON public.crypto_operations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Todo para autenticados subscriptions" ON public.client_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- 7. RECARGAR CACHÉ
NOTIFY pgrst, 'reload schema';
