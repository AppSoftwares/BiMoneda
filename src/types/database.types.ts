export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      crypto_operations: {
        Row: {
          id: string
          created_at: string
          date: string
          type: 'COMPRA' | 'VENTA'
          asset: string
          amount_crypto: number
          unit_price_bs: number
          total_amount_bs: number
          bcv_rate: number
          platform: string
          reference: string
          fee_bs: number
          notes: string | null
          order_number_binance?: string
          order_status?: 'COMPLETADO' | 'ESPERANDO_PAGO' | 'CANCELADO'
          qty_net_crypto?: number
          fee_crypto?: number
          payment_method?: string
          fiat_currency?: string
          counterparty_nickname?: string
          counterparty_full_name?: string
          exchange_datetime?: string
          binance_order_capture_path?: string
        }
        Insert: {
          id?: string
          created_at?: string
          date: string
          type: 'COMPRA' | 'VENTA'
          asset: string
          amount_crypto: number
          unit_price_bs: number
          total_amount_bs: number
          bcv_rate: number
          platform?: string
          reference: string
          fee_bs?: number
          notes?: string | null
          order_number_binance?: string
          order_status?: 'COMPLETADO' | 'ESPERANDO_PAGO' | 'CANCELADO'
          qty_net_crypto?: number
          fee_crypto?: number
          payment_method?: string
          fiat_currency?: string
          counterparty_nickname?: string
          counterparty_full_name?: string
          exchange_datetime?: string
          binance_order_capture_path?: string
        }
        Update: {
          id?: string
          created_at?: string
          date?: string
          type?: 'COMPRA' | 'VENTA'
          asset?: string
          amount_crypto?: number
          unit_price_bs?: number
          total_amount_bs?: number
          bcv_rate?: number
          platform?: string
          reference?: string
          fee_bs?: number
          notes?: string | null
          order_number_binance?: string
          order_status?: 'COMPLETADO' | 'ESPERANDO_PAGO' | 'CANCELADO'
          qty_net_crypto?: number
          fee_crypto?: number
          payment_method?: string
          fiat_currency?: string
          counterparty_nickname?: string
          counterparty_full_name?: string
          exchange_datetime?: string
          binance_order_capture_path?: string
        }
      }
      bank_transfer_receipts: {
        Row: {
          id: number
          operation_id: string
          bank_origin: string
          bank_operation_number: string
          account_holder_name: string
          source_account_masked: string
          dest_account_masked: string
          concept: string | null
          amount_bs: number
          operation_date: string
          receipt_capture_path: string | null
          created_at: string
        }
        Insert: {
          id?: number
          operation_id: string
          bank_origin: string
          bank_operation_number: string
          account_holder_name: string
          source_account_masked: string
          dest_account_masked: string
          concept?: string | null
          amount_bs: number
          operation_date: string
          receipt_capture_path?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          operation_id?: string
          bank_origin?: string
          bank_operation_number?: string
          account_holder_name?: string
          source_account_masked?: string
          dest_account_masked?: string
          concept?: string | null
          amount_bs?: number
          operation_date?: string
          receipt_capture_path?: string | null
          created_at?: string
        }
      }
      ledger_entries: {
        Row: {
          id: string
          operation_id: string
          date: string
          debit_account: string
          credit_account: string
          amount_bs: number
          description: string
        }
        Insert: {
          id?: string
          operation_id: string
          date: string
          debit_account: string
          credit_account: string
          amount_bs: number
          description: string
        }
        Update: {
          id?: string
          operation_id?: string
          date?: string
          debit_account?: string
          credit_account?: string
          amount_bs?: number
          description?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          operation_id: string
          in_qty: number | null
          out_qty: number | null
          avg_cost: number
          balance_qty: number
          balance_value_bs: number
          realized_profit_bs: number | null
        }
        Insert: {
          id?: string
          operation_id: string
          in_qty?: number | null
          out_qty?: number | null
          avg_cost: number
          balance_qty: number
          balance_value_bs: number
          realized_profit_bs?: number | null
        }
        Update: {
          id?: string
          operation_id?: string
          in_qty?: number | null
          out_qty?: number | null
          avg_cost?: number
          balance_qty?: number
          balance_value_bs?: number
          realized_profit_bs?: number | null
        }
      }
      clients: {
        Row: {
          id: string
          created_at: string
          name: string
          rif: string
          email: string | null
          phone: string | null
          address: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          rif: string
          email?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          rif?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean
        }
      }
      company_profile: {
        Row: {
          id: string
          name: string
          rif: string
          address: string
          phone: string | null
          email: string | null
          logo_url: string | null
          signature_url: string | null
        }
        Insert: {
          id?: string
          name: string
          rif: string
          address: string
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          signature_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          rif?: string
          address?: string
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          signature_url?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          created_at: string
          invoice_number: string
          control_number: string
          client_id: string
          issue_date: string
          status: 'PAID' | 'PENDING' | 'CANCELLED'
          subtotal_usd: number
          taxable_base_usd: number
          iva_percent: number
          iva_usd: number
          igtf_percent: number
          igtf_usd: number
          total_usd: number
          total_bs: number
          bcv_rate: number
          payment_method: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          invoice_number: string
          control_number: string
          client_id: string
          issue_date: string
          status?: 'PAID' | 'PENDING' | 'CANCELLED'
          subtotal_usd: number
          taxable_base_usd: number
          iva_percent?: number
          iva_usd: number
          igtf_percent?: number
          igtf_usd: number
          total_usd: number
          total_bs: number
          bcv_rate: number
          payment_method: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          invoice_number?: string
          control_number?: string
          client_id?: string
          issue_date?: string
          status?: 'PAID' | 'PENDING' | 'CANCELLED'
          subtotal_usd?: number
          taxable_base_usd?: number
          iva_percent?: number
          iva_usd?: number
          igtf_percent?: number
          igtf_usd?: number
          total_usd?: number
          total_bs?: number
          bcv_rate?: number
          payment_method?: string
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Client = Database['public']['Tables']['clients']['Row']
export type CompanyProfile = Database['public']['Tables']['company_profile']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
