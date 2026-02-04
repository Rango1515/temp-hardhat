export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_responses: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voip_admin_audit_log: {
        Row: {
          action: string
          admin_id: number
          created_at: string | null
          details: Json | null
          entity_id: number | null
          entity_type: string | null
          id: number
        }
        Insert: {
          action: string
          admin_id: number
          created_at?: string | null
          details?: Json | null
          entity_id?: number | null
          entity_type?: string | null
          id?: number
        }
        Update: {
          action?: string
          admin_id?: number
          created_at?: string | null
          details?: Json | null
          entity_id?: number | null
          entity_type?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voip_admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: number
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: string[] | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: number
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: string[] | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: number
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[] | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_calls: {
        Row: {
          cost: number | null
          direction: string
          duration_seconds: number | null
          end_time: string | null
          followup_at: string | null
          from_number: string
          id: number
          lead_id: number | null
          notes: string | null
          outcome: string | null
          recording_url: string | null
          start_time: string | null
          status: string
          to_number: string
          user_id: number | null
        }
        Insert: {
          cost?: number | null
          direction?: string
          duration_seconds?: number | null
          end_time?: string | null
          followup_at?: string | null
          from_number: string
          id?: number
          lead_id?: number | null
          notes?: string | null
          outcome?: string | null
          recording_url?: string | null
          start_time?: string | null
          status?: string
          to_number: string
          user_id?: number | null
        }
        Update: {
          cost?: number | null
          direction?: string
          duration_seconds?: number | null
          end_time?: string | null
          followup_at?: string | null
          from_number?: string
          id?: number
          lead_id?: number | null
          notes?: string | null
          outcome?: string | null
          recording_url?: string | null
          start_time?: string | null
          status?: string
          to_number?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "voip_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_calls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_lead_uploads: {
        Row: {
          admin_id: number
          created_at: string | null
          duplicate_count: number | null
          filename: string
          id: number
          imported_count: number | null
          invalid_count: number | null
          total_lines: number | null
        }
        Insert: {
          admin_id: number
          created_at?: string | null
          duplicate_count?: number | null
          filename: string
          id?: number
          imported_count?: number | null
          invalid_count?: number | null
          total_lines?: number | null
        }
        Update: {
          admin_id?: number
          created_at?: string | null
          duplicate_count?: number | null
          filename?: string
          id?: number
          imported_count?: number | null
          invalid_count?: number | null
          total_lines?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_lead_uploads_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_leads: {
        Row: {
          assigned_at: string | null
          assigned_to: number | null
          attempt_count: number | null
          created_at: string | null
          email: string | null
          id: number
          locked_until: string | null
          name: string | null
          phone: string
          status: string
          updated_at: string | null
          upload_id: number | null
          website: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: number | null
          attempt_count?: number | null
          created_at?: string | null
          email?: string | null
          id?: number
          locked_until?: string | null
          name?: string | null
          phone: string
          status?: string
          updated_at?: string | null
          upload_id?: number | null
          website?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: number | null
          attempt_count?: number | null
          created_at?: string | null
          email?: string | null
          id?: number
          locked_until?: string | null
          name?: string | null
          phone?: string
          status?: string
          updated_at?: string | null
          upload_id?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_voip_leads_upload"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "voip_lead_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_number_requests: {
        Row: {
          admin_notes: string | null
          area_code: string | null
          assigned_number_id: number | null
          country: string | null
          created_at: string | null
          id: number
          number_type: string | null
          status: string
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          admin_notes?: string | null
          area_code?: string | null
          assigned_number_id?: number | null
          country?: string | null
          created_at?: string | null
          id?: number
          number_type?: string | null
          status?: string
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          admin_notes?: string | null
          area_code?: string | null
          assigned_number_id?: number | null
          country?: string | null
          created_at?: string | null
          id?: number
          number_type?: string | null
          status?: string
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_number_requests_assigned_number_id_fkey"
            columns: ["assigned_number_id"]
            isOneToOne: false
            referencedRelation: "voip_phone_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_number_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_phone_numbers: {
        Row: {
          assigned_at: string | null
          created_at: string | null
          friendly_name: string | null
          id: number
          monthly_cost: number | null
          phone_number: string
          status: string
          user_id: number | null
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string | null
          friendly_name?: string | null
          id?: number
          monthly_cost?: number | null
          phone_number: string
          status?: string
          user_id?: number | null
        }
        Update: {
          assigned_at?: string | null
          created_at?: string | null
          friendly_name?: string | null
          id?: number
          monthly_cost?: number | null
          phone_number?: string
          status?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_phone_numbers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_refresh_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: number
          token_hash: string
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: number
          token_hash: string
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: number
          token_hash?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_signup_tokens: {
        Row: {
          created_at: string | null
          created_by: number | null
          email: string | null
          expires_at: string
          id: number
          token: string
          used_at: string | null
          used_by: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          email?: string | null
          expires_at: string
          id?: number
          token: string
          used_at?: string | null
          used_by?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          email?: string | null
          expires_at?: string
          id?: number
          token?: string
          used_at?: string | null
          used_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_signup_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_signup_tokens_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_twilio_config: {
        Row: {
          account_sid: string | null
          auth_token: string | null
          id: number
          is_active: boolean | null
          outbound_number: string | null
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          account_sid?: string | null
          auth_token?: string | null
          id?: number
          is_active?: boolean | null
          outbound_number?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          account_sid?: string | null
          auth_token?: string | null
          id?: number
          is_active?: boolean | null
          outbound_number?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_twilio_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_users: {
        Row: {
          created_at: string | null
          email: string
          id: number
          name: string
          password_hash: string
          role: Database["public"]["Enums"]["voip_role"]
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          name: string
          password_hash: string
          role?: Database["public"]["Enums"]["voip_role"]
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          name?: string
          password_hash?: string
          role?: Database["public"]["Enums"]["voip_role"]
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      voip_worker_lead_history: {
        Row: {
          created_at: string | null
          id: number
          lead_id: number
          worker_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          lead_id: number
          worker_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          lead_id?: number
          worker_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voip_worker_lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "voip_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_worker_lead_history_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          monthly_cost: number | null
          name: string
          next_billing_date: string | null
          plan: string | null
          status: Database["public"]["Enums"]["website_status"]
          updated_at: string
          uptime_percentage: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          monthly_cost?: number | null
          name: string
          next_billing_date?: string | null
          plan?: string | null
          status?: Database["public"]["Enums"]["website_status"]
          updated_at?: string
          uptime_percentage?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          monthly_cost?: number | null
          name?: string
          next_billing_date?: string | null
          plan?: string | null
          status?: Database["public"]["Enums"]["website_status"]
          updated_at?: string
          uptime_percentage?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_next_lead: {
        Args: { p_worker_id: number }
        Returns: {
          out_email: string
          out_lead_id: number
          out_name: string
          out_phone: string
          out_website: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      ticket_priority: "low" | "medium" | "high"
      ticket_status: "open" | "in_progress" | "resolved"
      voip_role: "admin" | "client"
      website_status: "active" | "pending" | "maintenance" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      ticket_priority: ["low", "medium", "high"],
      ticket_status: ["open", "in_progress", "resolved"],
      voip_role: ["admin", "client"],
      website_status: ["active", "pending", "maintenance", "suspended"],
    },
  },
} as const
