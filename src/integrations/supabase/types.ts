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
      voip_activity_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: number
          lead_id: number | null
          metadata: Json | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: number
          lead_id?: number | null
          metadata?: Json | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: number
          lead_id?: number | null
          metadata?: Json | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_activity_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "voip_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_activity_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
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
      voip_appointments: {
        Row: {
          created_at: string | null
          created_by: number | null
          created_by_name: string | null
          deleted_at: string | null
          id: number
          lead_id: number | null
          lead_name: string | null
          lead_phone: string
          negotiated_price: string | null
          notes: string | null
          outcome: string | null
          scheduled_at: string
          selected_plan: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          created_by_name?: string | null
          deleted_at?: string | null
          id?: number
          lead_id?: number | null
          lead_name?: string | null
          lead_phone: string
          negotiated_price?: string | null
          notes?: string | null
          outcome?: string | null
          scheduled_at: string
          selected_plan?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          created_by_name?: string | null
          deleted_at?: string | null
          id?: number
          lead_id?: number | null
          lead_name?: string | null
          lead_phone?: string
          negotiated_price?: string | null
          notes?: string | null
          outcome?: string | null
          scheduled_at?: string
          selected_plan?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "voip_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_blocked_ips: {
        Row: {
          blocked_at: string
          blocked_by: number | null
          created_at: string
          expires_at: string | null
          id: number
          ip_address: string
          reason: string | null
          status: string
        }
        Insert: {
          blocked_at?: string
          blocked_by?: number | null
          created_at?: string
          expires_at?: string | null
          id?: number
          ip_address: string
          reason?: string | null
          status?: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: number | null
          created_at?: string
          expires_at?: string | null
          id?: number
          ip_address?: string
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "voip_blocked_ips_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_calls: {
        Row: {
          appointment_created: boolean | null
          cost: number | null
          deleted_at: string | null
          direction: string
          duration_seconds: number | null
          end_time: string | null
          followup_at: string | null
          followup_notes: string | null
          followup_priority: string | null
          from_number: string
          id: number
          lead_id: number | null
          notes: string | null
          outcome: string | null
          recording_url: string | null
          session_duration_seconds: number | null
          start_time: string | null
          status: string
          to_number: string
          user_id: number | null
        }
        Insert: {
          appointment_created?: boolean | null
          cost?: number | null
          deleted_at?: string | null
          direction?: string
          duration_seconds?: number | null
          end_time?: string | null
          followup_at?: string | null
          followup_notes?: string | null
          followup_priority?: string | null
          from_number: string
          id?: number
          lead_id?: number | null
          notes?: string | null
          outcome?: string | null
          recording_url?: string | null
          session_duration_seconds?: number | null
          start_time?: string | null
          status?: string
          to_number: string
          user_id?: number | null
        }
        Update: {
          appointment_created?: boolean | null
          cost?: number | null
          deleted_at?: string | null
          direction?: string
          duration_seconds?: number | null
          end_time?: string | null
          followup_at?: string | null
          followup_notes?: string | null
          followup_priority?: string | null
          from_number?: string
          id?: number
          lead_id?: number | null
          notes?: string | null
          outcome?: string | null
          recording_url?: string | null
          session_duration_seconds?: number | null
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
      voip_chat_channel_reads: {
        Row: {
          channel_id: number
          created_at: string | null
          id: number
          last_read_at: string | null
          user_id: number
        }
        Insert: {
          channel_id: number
          created_at?: string | null
          id?: number
          last_read_at?: string | null
          user_id: number
        }
        Update: {
          channel_id?: number
          created_at?: string | null
          id?: number
          last_read_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voip_chat_channel_reads_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "voip_chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_chat_channel_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_chat_channels: {
        Row: {
          admin_only: boolean | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          description: string | null
          id: number
          is_locked: boolean | null
          name: string
        }
        Insert: {
          admin_only?: boolean | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          id?: number
          is_locked?: boolean | null
          name: string
        }
        Update: {
          admin_only?: boolean | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          id?: number
          is_locked?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "voip_chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_chat_messages: {
        Row: {
          channel_id: number
          content: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: number
          image_url: string | null
          is_pinned: boolean | null
          user_id: number
        }
        Insert: {
          channel_id: number
          content: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: number
          image_url?: string | null
          is_pinned?: boolean | null
          user_id: number
        }
        Update: {
          channel_id?: number
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: number
          image_url?: string | null
          is_pinned?: boolean | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voip_chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "voip_chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_chat_user_status: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string
          id: number
          is_banned: boolean | null
          is_muted: boolean | null
          muted_until: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name: string
          id?: number
          is_banned?: boolean | null
          is_muted?: boolean | null
          muted_until?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string
          id?: number
          is_banned?: boolean | null
          is_muted?: boolean | null
          muted_until?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voip_chat_user_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_commissions: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string | null
          id: number
          notes: string | null
          paid_at: string | null
          partner_id: number
          revenue_event_id: number
          status: string
        }
        Insert: {
          commission_amount: number
          commission_rate?: number
          created_at?: string | null
          id?: number
          notes?: string | null
          paid_at?: string | null
          partner_id: number
          revenue_event_id: number
          status?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          id?: number
          notes?: string | null
          paid_at?: string | null
          partner_id?: number
          revenue_event_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "voip_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_commissions_revenue_event_id_fkey"
            columns: ["revenue_event_id"]
            isOneToOne: false
            referencedRelation: "voip_revenue_events"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_duplicate_leads: {
        Row: {
          created_at: string | null
          email: string | null
          existing_lead_id: number | null
          id: number
          name: string | null
          phone: string
          reason: string
          review_action: string | null
          reviewed_at: string | null
          reviewed_by: number | null
          upload_id: number | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          existing_lead_id?: number | null
          id?: number
          name?: string | null
          phone: string
          reason: string
          review_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: number | null
          upload_id?: number | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          existing_lead_id?: number | null
          id?: number
          name?: string | null
          phone?: string
          reason?: string
          review_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: number | null
          upload_id?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_duplicate_leads_existing_lead_id_fkey"
            columns: ["existing_lead_id"]
            isOneToOne: false
            referencedRelation: "voip_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_duplicate_leads_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_duplicate_leads_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "voip_lead_uploads"
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
          category: string | null
          contact_name: string | null
          created_at: string | null
          deleted_at: string | null
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
          category?: string | null
          contact_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
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
          category?: string | null
          contact_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
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
      voip_partner_profiles: {
        Row: {
          created_at: string | null
          id: number
          payout_details: string | null
          payout_method: string | null
          phone: string | null
          status: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          payout_details?: string | null
          payout_method?: string | null
          phone?: string | null
          status?: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          payout_details?: string | null
          payout_method?: string | null
          phone?: string | null
          status?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voip_partner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_partner_settings: {
        Row: {
          apply_bonus_once_per_client: boolean
          bonus_enabled: boolean
          bonus_type: string
          bonus_value: number
          commission_rate: number
          id: number
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          apply_bonus_once_per_client?: boolean
          bonus_enabled?: boolean
          bonus_type?: string
          bonus_value?: number
          commission_rate?: number
          id?: number
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          apply_bonus_once_per_client?: boolean
          bonus_enabled?: boolean
          bonus_type?: string
          bonus_value?: number
          commission_rate?: number
          id?: number
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_partner_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_partner_token_usage: {
        Row: {
          client_user_id: number
          created_at: string | null
          id: number
          token_id: number
        }
        Insert: {
          client_user_id: number
          created_at?: string | null
          id?: number
          token_id: number
        }
        Update: {
          client_user_id?: number
          created_at?: string | null
          id?: number
          token_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voip_partner_token_usage_client_user_id_fkey"
            columns: ["client_user_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_partner_token_usage_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "voip_partner_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_partner_tokens: {
        Row: {
          created_at: string | null
          created_by: number | null
          expires_at: string | null
          id: number
          max_uses: number | null
          partner_id: number
          purpose: string
          status: string
          token_code: string
          uses_count: number
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          expires_at?: string | null
          id?: number
          max_uses?: number | null
          partner_id: number
          purpose?: string
          status?: string
          token_code: string
          uses_count?: number
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          expires_at?: string | null
          id?: number
          max_uses?: number | null
          partner_id?: number
          purpose?: string
          status?: string
          token_code?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "voip_partner_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_partner_tokens_partner_id_fkey"
            columns: ["partner_id"]
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
      voip_revenue_events: {
        Row: {
          amount: number
          client_id: number
          created_at: string | null
          currency: string
          description: string | null
          id: number
          partner_id: number
          type: string
        }
        Insert: {
          amount: number
          client_id: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: number
          partner_id: number
          type: string
        }
        Update: {
          amount?: number
          client_id?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: number
          partner_id?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "voip_revenue_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_revenue_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_security_logs: {
        Row: {
          created_at: string
          details: Json | null
          endpoint: string | null
          id: number
          ip_address: string | null
          request_count: number | null
          rule_triggered: string | null
          status: string
          timestamp: string
          user_agent: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          id?: number
          ip_address?: string | null
          request_count?: number | null
          rule_triggered?: string | null
          status?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          id?: number
          ip_address?: string | null
          request_count?: number | null
          rule_triggered?: string | null
          status?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_security_logs_user_id_fkey"
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      voip_support_ticket_messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string | null
          id: number
          is_admin_reply: boolean | null
          ticket_id: number
          user_id: number
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: number
          is_admin_reply?: boolean | null
          ticket_id: number
          user_id: number
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: number
          is_admin_reply?: boolean | null
          ticket_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voip_support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "voip_support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_support_ticket_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_support_tickets: {
        Row: {
          assigned_to: number | null
          category: string | null
          closed_at: string | null
          created_at: string | null
          has_new_reply: boolean | null
          id: number
          priority: string
          status: string
          subject: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          assigned_to?: number | null
          category?: string | null
          closed_at?: string | null
          created_at?: string | null
          has_new_reply?: boolean | null
          id?: number
          priority?: string
          status?: string
          subject: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          assigned_to?: number | null
          category?: string | null
          closed_at?: string | null
          created_at?: string | null
          has_new_reply?: boolean | null
          id?: number
          priority?: string
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voip_support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_support_tickets_user_id_fkey"
            columns: ["user_id"]
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
      voip_user_preferences: {
        Row: {
          accent_color: string | null
          created_at: string | null
          id: number
          lead_category: string | null
          notifications_enabled: boolean | null
          sound_enabled: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          id?: number
          lead_category?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          id?: number
          lead_category?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voip_user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_user_sessions: {
        Row: {
          id: number
          is_idle: boolean | null
          last_heartbeat: string | null
          session_end: string | null
          session_start: string
          total_active_seconds: number | null
          user_id: number | null
        }
        Insert: {
          id?: number
          is_idle?: boolean | null
          last_heartbeat?: string | null
          session_end?: string | null
          session_start?: string
          total_active_seconds?: number | null
          user_id?: number | null
        }
        Update: {
          id?: number
          is_idle?: boolean | null
          last_heartbeat?: string | null
          session_end?: string | null
          session_start?: string
          total_active_seconds?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_users: {
        Row: {
          consent_accepted_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          force_password_change: boolean | null
          id: number
          name: string
          partner_id: number | null
          password_hash: string
          privacy_accepted: boolean | null
          role: Database["public"]["Enums"]["voip_role"]
          status: string
          suspension_reason: string | null
          tos_accepted: boolean | null
          updated_at: string | null
        }
        Insert: {
          consent_accepted_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          force_password_change?: boolean | null
          id?: number
          name: string
          partner_id?: number | null
          password_hash: string
          privacy_accepted?: boolean | null
          role?: Database["public"]["Enums"]["voip_role"]
          status?: string
          suspension_reason?: string | null
          tos_accepted?: boolean | null
          updated_at?: string | null
        }
        Update: {
          consent_accepted_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          force_password_change?: boolean | null
          id?: number
          name?: string
          partner_id?: number | null
          password_hash?: string
          privacy_accepted?: boolean | null
          role?: Database["public"]["Enums"]["voip_role"]
          status?: string
          suspension_reason?: string | null
          tos_accepted?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "voip_users"
            referencedColumns: ["id"]
          },
        ]
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
      assign_next_lead:
        | {
            Args: { p_worker_id: number }
            Returns: {
              out_contact_name: string
              out_email: string
              out_lead_id: number
              out_name: string
              out_phone: string
              out_website: string
            }[]
          }
        | {
            Args: { p_category?: string; p_worker_id: number }
            Returns: {
              out_contact_name: string
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
      voip_role: "admin" | "client" | "partner"
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
      voip_role: ["admin", "client", "partner"],
      website_status: ["active", "pending", "maintenance", "suspended"],
    },
  },
} as const
