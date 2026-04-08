/**
 * Supabase Database type definitions.
 * These mirror the SQL schema exactly. Generate fresh ones with:
 *   npx supabase gen types typescript --project-id <your-project-id>
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          email: string;
          name: string;
          role: Database['public']['Enums']['user_role'];
          employee_type: Database['public']['Enums']['employee_type'];
          branch: Database['public']['Enums']['branch_type'];
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          email: string;
          name: string;
          role: Database['public']['Enums']['user_role'];
          employee_type: Database['public']['Enums']['employee_type'];
          branch: Database['public']['Enums']['branch_type'];
          is_admin?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          client_name: string;
          company_type: Database['public']['Enums']['company_type'];
          loan_type: string | null;
          loan_amount: number | null;
          bank: string | null;
          commission_percent: number | null;
          stage: Database['public']['Enums']['pipeline_stage'];
          branch: Database['public']['Enums']['branch_type'];
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          company_type: Database['public']['Enums']['company_type'];
          loan_type?: string | null;
          loan_amount?: number | null;
          bank?: string | null;
          commission_percent?: number | null;
          stage?: Database['public']['Enums']['pipeline_stage'];
          branch: Database['public']['Enums']['branch_type'];
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      project_members: {
        Row: {
          project_id: string;
          user_email: string;
          assigned_at: string;
          assigned_by: string;
        };
        Insert: {
          project_id: string;
          user_email: string;
          assigned_at?: string;
          assigned_by: string;
        };
        Update: Partial<Database['public']['Tables']['project_members']['Insert']>;
      };
      client_spocs: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          email: string;
          phone: string | null;
          designation: string | null;
          password_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          email: string;
          phone?: string | null;
          designation?: string | null;
          password_hash?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['client_spocs']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          project_id: string;
          document_name: string;
          category: string;
          company_type: Database['public']['Enums']['company_type'];
          status: Database['public']['Enums']['doc_status'];
          uploaded_at: string | null;
          uploaded_by: string | null;
          file_source: Database['public']['Enums']['file_source'] | null;
          file_url: string | null;
          expiry_date: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          document_name: string;
          category: string;
          company_type: Database['public']['Enums']['company_type'];
          status?: Database['public']['Enums']['doc_status'];
          uploaded_at?: string | null;
          uploaded_by?: string | null;
          file_source?: Database['public']['Enums']['file_source'] | null;
          file_url?: string | null;
          expiry_date?: string | null;
        };
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      queries: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          source: Database['public']['Enums']['query_source'];
          raised_by: string;
          status: Database['public']['Enums']['query_status'];
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description: string;
          source: Database['public']['Enums']['query_source'];
          raised_by: string;
          status?: Database['public']['Enums']['query_status'];
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['queries']['Insert']>;
      };
      bank_suggestions: {
        Row: {
          id: string;
          project_id: string;
          bank_name: string;
          interest_rate: number | null;
          processing_days: number | null;
          commission_percent: number | null;
          notes: string | null;
          is_selected: boolean;
          suggested_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          bank_name: string;
          interest_rate?: number | null;
          processing_days?: number | null;
          commission_percent?: number | null;
          notes?: string | null;
          is_selected?: boolean;
          suggested_by: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['bank_suggestions']['Insert']>;
      };
      internal_notes: {
        Row: {
          id: string;
          project_id: string;
          note: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          note: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['internal_notes']['Insert']>;
      };
      activity_log: {
        Row: {
          id: string;
          project_id: string;
          action: string;
          performed_by: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          action: string;
          performed_by: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['activity_log']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_email: string;
          project_id: string | null;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_email: string;
          project_id?: string | null;
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
    Enums: {
      user_role:
        | 'relation_partner'
        | 'relation_manager'
        | 'engagement_partner'
        | 'engagement_manager'
        | 'executive'
        | 'accounts'
        | 'mis'
        | 'engagement_assistant';
      employee_type: 'deal_team' | 'supervision';
      branch_type: 'kolkata' | 'delhi' | 'both';
      company_type: 'mfg_service' | 'nbfc';
      pipeline_stage:
        | 'lead_received'
        | 'meeting_done'
        | 'docs_requested'
        | 'processing'
        | 'bank_connect'
        | 'proposal_sent'
        | 'bank_docs'
        | 'approved';
      doc_status: 'received' | 'pending' | 'required';
      file_source: 'gmail' | 'drive' | 'manual';
      query_source: 'bank' | 'internal';
      query_status: 'open' | 'resolved';
    };
  };
};
