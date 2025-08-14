export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          client_id: string
          company_id: string
          created_at: string
          duration: number
          id: string
          notes: string | null
          professional_id: string | null
          service_id: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          client_id: string
          company_id: string
          created_at?: string
          duration?: number
          id?: string
          notes?: string | null
          professional_id?: string | null
          service_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          client_id?: string
          company_id?: string
          created_at?: string
          duration?: number
          id?: string
          notes?: string | null
          professional_id?: string | null
          service_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          normalized_phone: string | null
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          normalized_phone?: string | null
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          normalized_phone?: string | null
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          advance_booking_limit: number
          appointment_interval: number
          company_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          lunch_break_enabled: boolean | null
          lunch_end_time: string | null
          lunch_start_time: string | null
          max_simultaneous_appointments: number
          monthly_appointments_limit: number | null
          phone: string | null
          selected_theme_id: string | null
          slug: string
          status_aberto: boolean | null
          tempo_entrega: number | null
          tempo_retirada: number | null
          theme_color: string | null
          updated_at: string
          welcome_message: string | null
          whatsapp: string | null
          working_days: number[]
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          address?: string | null
          advance_booking_limit?: number
          appointment_interval?: number
          company_id: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          lunch_break_enabled?: boolean | null
          lunch_end_time?: string | null
          lunch_start_time?: string | null
          max_simultaneous_appointments?: number
          monthly_appointments_limit?: number | null
          phone?: string | null
          selected_theme_id?: string | null
          slug: string
          status_aberto?: boolean | null
          tempo_entrega?: number | null
          tempo_retirada?: number | null
          theme_color?: string | null
          updated_at?: string
          welcome_message?: string | null
          whatsapp?: string | null
          working_days?: number[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Update: {
          address?: string | null
          advance_booking_limit?: number
          appointment_interval?: number
          company_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          lunch_break_enabled?: boolean | null
          lunch_end_time?: string | null
          lunch_start_time?: string | null
          max_simultaneous_appointments?: number
          monthly_appointments_limit?: number | null
          phone?: string | null
          selected_theme_id?: string | null
          slug?: string
          status_aberto?: boolean | null
          tempo_entrega?: number | null
          tempo_retirada?: number | null
          theme_color?: string | null
          updated_at?: string
          welcome_message?: string | null
          whatsapp?: string | null
          working_days?: number[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_schedules: {
        Row: {
          company_id: string
          created_at: string
          day_of_week: number
          end_time: string
          has_lunch_break: boolean
          id: string
          is_active: boolean
          lunch_end: string | null
          lunch_start: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          day_of_week: number
          end_time?: string
          has_lunch_break?: boolean
          id?: string
          is_active?: boolean
          lunch_end?: string | null
          lunch_start?: string | null
          start_time?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          has_lunch_break?: boolean
          id?: string
          is_active?: boolean
          lunch_end?: string | null
          lunch_start?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string
          role: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone: string
          role: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          role?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_type: string | null
          company_name: string | null
          created_at: string
          id: string
          is_admin: boolean
          profile_image_url: string | null
          updated_at: string
        }
        Insert: {
          business_type?: string | null
          company_name?: string | null
          created_at?: string
          id: string
          is_admin?: boolean
          profile_image_url?: string | null
          updated_at?: string
        }
        Update: {
          business_type?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean
          profile_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      public_theme_settings: {
        Row: {
          company_id: string
          created_at: string | null
          dark_mode: boolean
          id: string
          theme_color: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          dark_mode?: boolean
          id?: string
          theme_color?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          dark_mode?: boolean
          id?: string
          theme_color?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_config_reminders: {
        Row: {
          config_name: string
          created_at: string | null
          description: string
          id: number
          status: string | null
        }
        Insert: {
          config_name: string
          created_at?: string | null
          description: string
          id?: number
          status?: string | null
        }
        Update: {
          config_name?: string
          created_at?: string | null
          description?: string
          id?: number
          status?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          duration: number
          id: string
          is_active: boolean
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_fcm_tokens: {
        Row: {
          created_at: string | null
          device_type: string | null
          fcm_token: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          fcm_token: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          fcm_token?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      company_stats_summary: {
        Row: {
          appointments_last_30_days: number | null
          company_id: string | null
          company_name: string | null
          last_appointment_date: string | null
          slug: string | null
          total_clients: number | null
          total_professionals: number | null
          total_services: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_public_appointment: {
        Args: {
          p_company_id: string
          p_client_id: string
          p_service_id: string
          p_professional_id: string
          p_appointment_date: string
          p_appointment_time: string
          p_duration: number
        }
        Returns: string
      }
      create_public_client: {
        Args: {
          p_company_id: string
          p_name: string
          p_phone: string
          p_email?: string
        }
        Returns: string
      }
      generate_company_slug: {
        Args: { company_name: string }
        Returns: string
      }
      get_appointment_stats: {
        Args: {
          p_company_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          total_appointments: number
          confirmed_appointments: number
          completed_appointments: number
          cancelled_appointments: number
          total_revenue: number
          most_popular_service: string
          busiest_day: string
        }[]
      }
      get_available_times: {
        Args:
          | {
              p_company_id: string
              p_date: string
              p_working_hours_start: string
              p_working_hours_end: string
              p_appointment_interval: number
              p_lunch_break_enabled?: boolean
              p_lunch_start_time?: string
              p_lunch_end_time?: string
              p_service_duration?: number
            }
          | {
              p_company_id: string
              p_date: string
              p_working_hours_start: string
              p_working_hours_end: string
              p_appointment_interval?: number
              p_lunch_break_enabled?: boolean
              p_lunch_start_time?: string
              p_lunch_end_time?: string
            }
        Returns: {
          available_time: string
        }[]
      }
      get_companies_with_slug: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_id: string
        }[]
      }
      get_public_company_ids: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_id: string
        }[]
      }
      refresh_company_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
