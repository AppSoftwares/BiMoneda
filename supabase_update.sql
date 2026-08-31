-- Actualizacion FacturaPro VE

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE IF EXISTS public.clients
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.crypto_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL,
    type TEXT CHECK (type IN ('COMPRA', 'VENTA')) NOT NULL,
    asset TEXT NOT NULL,
    amount_crypto NUMERIC(20, 8) NOT NULL,
    unit_price_bs NUMERIC(20, 2) NOT NULL,
    total_amount_bs NUMERIC(20, 2) NOT NULL,
    bcv_rate NUMERIC(20, 2) NOT NULL,
    platform TEXT DEFAULT 'Binance P2P',
    reference TEXT NOT NULL,
    fee_bs NUMERIC(20, 2) DEFAULT 0,
    notes TEXT,
    order_number_binance TEXT,
    order_status TEXT CHECK (order_status IN ('COMPLETADO', 'ESPERANDO_PAGO', 'CANCELADO')) DEFAULT 'COMPLETADO',
    qty_net_crypto NUMERIC(20, 8),
    fee_crypto NUMERIC(20, 8) DEFAULT 0,
    payment_method TEXT,
    fiat_currency TEXT DEFAULT 'VES',
    counterparty_nickname TEXT,
    counterparty_full_name TEXT,
    exchange_datetime TIMESTAMP WITH TIME ZONE,
    binance_order_capture_path TEXT
);

ALTER TABLE public.crypto_operations ADD COLUMN IF NOT EXISTS order_number_binance TEXT;
ALTER TABLE public.crypto_operations ADD COLUMN IF NOT EXISTS order_status TEXT CHECK (order_status IN ('COMPLETADO', 'ESPERANDO_PAGO', 'CANCELADO')) DEFAULT 'COMPLETADO';
ALTER TABLE public.crypto_operations ADD COLUMN IF NOT EXISTS qty_net_crypto NUMERIC(20, 8);
ALTER TABLE public.crypto_operations ADD COLUMN IF NOT EXISTS fee_crypto NUMERIC(20, 8) DEFAULT 0;
ALTER TABLE public.crypto_operations ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.crypto_operations ADD COLUMN IF NOT EXISTS fiat_currency TEXT DEFAULT 'VES';
ALTER TABLE public.crypto_operations ADD COLUMN IF NOT EXISTS counterparty_nickname TEXT;
ALTER TABLE public.crypto_operations ADD COLUMN IF NOT EXISTS counterparty_full_name TEXT;
ALTER TABLE public.crypto_operations ADD COLUMN IF NOT EXISTS exchange_datetime TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.crypto_operations ADD COLUMN IF NOT EXISTS binance_order_capture_path TEXT;

CREATE TABLE IF NOT EXISTS public.bank_transfer_receipts (
    id BIGSERIAL PRIMARY KEY,
    operation_id UUID REFERENCES public.crypto_operations(id) ON DELETE CASCADE UNIQUE,
    bank_origin TEXT,
    bank_operation_number TEXT,
    account_holder_name TEXT,
    source_account_masked TEXT,
    dest_account_masked TEXT,
    concept TEXT,
    amount_bs NUMERIC(20, 2),
    operation_date DATE,
    receipt_capture_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.crypto_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transfer_receipts ENABLE ROW LEVEL SECURITY;
