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
  }
}

export type Client = Database['public']['Tables']['clients']['Row']
export type CompanyProfile = Database['public']['Tables']['company_profile']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
