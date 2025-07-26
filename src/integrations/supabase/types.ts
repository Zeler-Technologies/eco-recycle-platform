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
      auth_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: number | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      bidding_system: {
        Row: {
          bid_amount: number
          bid_end_date: string
          bid_start_date: string
          created_at: string
          id: string
          is_active: boolean | null
          payment_status: string | null
          tenant_id: number | null
          updated_at: string
        }
        Insert: {
          bid_amount: number
          bid_end_date: string
          bid_start_date: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          payment_status?: string | null
          tenant_id?: number | null
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          bid_end_date?: string
          bid_start_date?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          payment_status?: string | null
          tenant_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bidding_system_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      bonus_offers: {
        Row: {
          bonus_amount_sek: number
          bonus_name: string
          conditions: Json | null
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          tenant_id: number
          updated_at: string
        }
        Insert: {
          bonus_amount_sek: number
          bonus_name: string
          conditions?: Json | null
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          start_date: string
          tenant_id: number
          updated_at?: string
        }
        Update: {
          bonus_amount_sek?: number
          bonus_name?: string
          conditions?: Json | null
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          tenant_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_offers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      car_images: {
        Row: {
          car_id: string
          id: string
          image_url: string
        }
        Insert: {
          car_id: string
          id?: string
          image_url: string
        }
        Update: {
          car_id?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_metadata: {
        Row: {
          customer_request_id: string
          id: string
          kontrollbes_galler_tom: string | null
          kontrollsiffror: string | null
          missing_parts: Json | null
          part_list: Json | null
          regbevis: string | null
        }
        Insert: {
          customer_request_id: string
          id?: string
          kontrollbes_galler_tom?: string | null
          kontrollsiffror?: string | null
          missing_parts?: Json | null
          part_list?: Json | null
          regbevis?: string | null
        }
        Update: {
          customer_request_id?: string
          id?: string
          kontrollbes_galler_tom?: string | null
          kontrollsiffror?: string | null
          missing_parts?: Json | null
          part_list?: Json | null
          regbevis?: string | null
        }
        Relationships: []
      }
      cars: {
        Row: {
          age: string | null
          arrival_address: string | null
          brand: string
          color: string
          created_at: string | null
          driver_name: string | null
          id: string
          license_plate: string
          model: string
          modified_reason: string | null
          pickup_date: string | null
          pickup_date_modified: string | null
          price_modified: number | null
          price_offered: number | null
          price_payed: number | null
          price_updated: number | null
          status: Database["public"]["Enums"]["car_status"]
          tenant_id: number
          treatment_type: Database["public"]["Enums"]["treatment_type"]
        }
        Insert: {
          age?: string | null
          arrival_address?: string | null
          brand: string
          color: string
          created_at?: string | null
          driver_name?: string | null
          id?: string
          license_plate: string
          model: string
          modified_reason?: string | null
          pickup_date?: string | null
          pickup_date_modified?: string | null
          price_modified?: number | null
          price_offered?: number | null
          price_payed?: number | null
          price_updated?: number | null
          status?: Database["public"]["Enums"]["car_status"]
          tenant_id: number
          treatment_type: Database["public"]["Enums"]["treatment_type"]
        }
        Update: {
          age?: string | null
          arrival_address?: string | null
          brand?: string
          color?: string
          created_at?: string | null
          driver_name?: string | null
          id?: string
          license_plate?: string
          model?: string
          modified_reason?: string | null
          pickup_date?: string | null
          pickup_date_modified?: string | null
          price_modified?: number | null
          price_offered?: number | null
          price_payed?: number | null
          price_updated?: number | null
          status?: Database["public"]["Enums"]["car_status"]
          tenant_id?: number
          treatment_type?: Database["public"]["Enums"]["treatment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cars_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      custom_message_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          template_name: string
          template_type: string
          tenant_id: number
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          template_name: string
          template_type: string
          tenant_id: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          template_name?: string
          template_type?: string
          tenant_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_requests: {
        Row: {
          car_brand: string
          car_model: string
          car_registration_number: string
          car_year: number | null
          control_number: string | null
          created_at: string
          customer_id: string | null
          id: string
          owner_address: string
          owner_name: string
          owner_postal_code: string
          pickup_address: string
          pickup_latitude: number | null
          pickup_longitude: number | null
          pickup_postal_code: string
          quote_amount: number | null
          status: string | null
          tenant_id: number | null
          updated_at: string
        }
        Insert: {
          car_brand: string
          car_model: string
          car_registration_number: string
          car_year?: number | null
          control_number?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          owner_address: string
          owner_name: string
          owner_postal_code: string
          pickup_address: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          pickup_postal_code: string
          quote_amount?: number | null
          status?: string | null
          tenant_id?: number | null
          updated_at?: string
        }
        Update: {
          car_brand?: string
          car_model?: string
          car_registration_number?: string
          car_year?: number | null
          control_number?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          owner_address?: string
          owner_name?: string
          owner_postal_code?: string
          pickup_address?: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          pickup_postal_code?: string
          quote_amount?: number | null
          status?: string | null
          tenant_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      customers: {
        Row: {
          car_id: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          car_id: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          car_id?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_info: {
        Row: {
          car_id: string
          deleted_at: string | null
          id: string
          reason: string
        }
        Insert: {
          car_id: string
          deleted_at?: string | null
          id?: string
          reason: string
        }
        Update: {
          car_id?: string
          deleted_at?: string | null
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "deletion_info_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      distance_rules: {
        Row: {
          created_at: string
          deduction_sek: number
          id: string
          max_distance_km: number | null
          min_distance_km: number
          tenant_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deduction_sek: number
          id?: string
          max_distance_km?: number | null
          min_distance_km: number
          tenant_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deduction_sek?: number
          id?: string
          max_distance_km?: number | null
          min_distance_km?: number
          tenant_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "distance_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          car_id: string
          exported_to_csv: boolean | null
          exported_to_excel: boolean | null
          exported_to_pdf: boolean | null
          id: string
          payment_date: string
        }
        Insert: {
          amount: number
          car_id: string
          exported_to_csv?: boolean | null
          exported_to_excel?: boolean | null
          exported_to_pdf?: boolean | null
          id?: string
          payment_date: string
        }
        Update: {
          amount?: number
          car_id?: string
          exported_to_csv?: boolean | null
          exported_to_excel?: boolean | null
          exported_to_pdf?: boolean | null
          id?: string
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_orders: {
        Row: {
          actual_pickup_date: string | null
          created_at: string
          customer_request_id: string | null
          driver_name: string | null
          final_price: number | null
          id: string
          scheduled_pickup_date: string | null
          status: string | null
          tenant_id: number | null
          updated_at: string
        }
        Insert: {
          actual_pickup_date?: string | null
          created_at?: string
          customer_request_id?: string | null
          driver_name?: string | null
          final_price?: number | null
          id?: string
          scheduled_pickup_date?: string | null
          status?: string | null
          tenant_id?: number | null
          updated_at?: string
        }
        Update: {
          actual_pickup_date?: string | null
          created_at?: string
          customer_request_id?: string | null
          driver_name?: string | null
          final_price?: number | null
          id?: string
          scheduled_pickup_date?: string | null
          status?: string | null
          tenant_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_orders_customer_request_id_fkey"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "customer_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      price_viewing_payments: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          is_active: boolean | null
          payment_amount: number
          payment_date: string
          stripe_session_id: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          payment_amount: number
          payment_date?: string
          stripe_session_id?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          payment_amount?: number
          payment_date?: string
          stripe_session_id?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      scrap_yard_locations: {
        Row: {
          bidding_amount: number | null
          created_at: string
          id: string
          is_premium_listed: boolean | null
          priority_position: number | null
          service_radius_km: number | null
          tenant_id: number | null
          updated_at: string
        }
        Insert: {
          bidding_amount?: number | null
          created_at?: string
          id?: string
          is_premium_listed?: boolean | null
          priority_position?: number | null
          service_radius_km?: number | null
          tenant_id?: number | null
          updated_at?: string
        }
        Update: {
          bidding_amount?: number | null
          created_at?: string
          id?: string
          is_premium_listed?: boolean | null
          priority_position?: number | null
          service_radius_km?: number | null
          tenant_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrap_yard_locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      tenants: {
        Row: {
          base_address: string | null
          country: string
          created_at: string
          date: string
          latitude: number | null
          longitude: number | null
          name: string
          service_type: string | null
          tenants_id: number
        }
        Insert: {
          base_address?: string | null
          country: string
          created_at?: string
          date: string
          latitude?: number | null
          longitude?: number | null
          name: string
          service_type?: string | null
          tenants_id?: number
        }
        Update: {
          base_address?: string | null
          country?: string
          created_at?: string
          date?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          service_type?: string | null
          tenants_id?: number
        }
        Relationships: []
      }
      user: {
        Row: {
          created_at: string
          email: string
          name: string
          tenants_id: number
          user_id: number
        }
        Insert: {
          created_at?: string
          email?: string
          name?: string
          tenants_id: number
          user_id?: number
        }
        Update: {
          created_at?: string
          email?: string
          name?: string
          tenants_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_tenant_id_fkey"
            columns: ["tenants_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_role: Database["public"]["Enums"]["user_role"]
          tenant_id: number
        }[]
      }
    }
    Enums: {
      car_status: "new" | "ongoing" | "done" | "error" | "archive" | "deleted"
      treatment_type: "pickup" | "drivein"
      user_role: "super_admin" | "tenant_admin" | "user" | "customer"
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
      car_status: ["new", "ongoing", "done", "error", "archive", "deleted"],
      treatment_type: ["pickup", "drivein"],
      user_role: ["super_admin", "tenant_admin", "user", "customer"],
    },
  },
} as const
