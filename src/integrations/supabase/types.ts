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
          pnr_num: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: number | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          pnr_num?: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          pnr_num?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
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
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
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
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
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
          pnr_num: number
        }
        Insert: {
          car_id: string
          id?: string
          image_url: string
          pnr_num: number
        }
        Update: {
          car_id?: string
          id?: string
          image_url?: string
          pnr_num?: number
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
          car_year: number | null
          control_number: string | null
          customer_request_id: string
          id: string
          kontrollbes_galler_tom: string | null
          kontrollsiffror: string | null
          missing_parts: Json | null
          part_list: Json | null
          regbevis: string | null
        }
        Insert: {
          car_year?: number | null
          control_number?: string | null
          customer_request_id: string
          id?: string
          kontrollbes_galler_tom?: string | null
          kontrollsiffror?: string | null
          missing_parts?: Json | null
          part_list?: Json | null
          regbevis?: string | null
        }
        Update: {
          car_year?: number | null
          control_number?: string | null
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
      car_pricing: {
        Row: {
          base_price: number
          brand: string
          created_at: string | null
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          model: string
          price_per_kg: number | null
          tenant_id: number
          updated_at: string | null
          updated_by: string | null
          year_from: number | null
          year_to: number | null
        }
        Insert: {
          base_price: number
          brand: string
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          model: string
          price_per_kg?: number | null
          tenant_id: number
          updated_at?: string | null
          updated_by?: string | null
          year_from?: number | null
          year_to?: number | null
        }
        Update: {
          base_price?: number
          brand?: string
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          model?: string
          price_per_kg?: number | null
          tenant_id?: number
          updated_at?: string | null
          updated_by?: string | null
          year_from?: number | null
          year_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "car_pricing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "car_pricing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
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
          scrapyard_id: number | null
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
          scrapyard_id?: number | null
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
          scrapyard_id?: number | null
          status?: Database["public"]["Enums"]["car_status"]
          tenant_id?: number
          treatment_type?: Database["public"]["Enums"]["treatment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cars_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "available_scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "monthly_cancelled_invoices"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "cars_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_reports"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "cars_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "cars_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
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
          pnr_num: string | null
          quote_amount: number | null
          scrapyard_id: number | null
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
          pnr_num?: string | null
          quote_amount?: number | null
          scrapyard_id?: number | null
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
          pnr_num?: string | null
          quote_amount?: number | null
          scrapyard_id?: number | null
          status?: string | null
          tenant_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_requests_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "available_scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_requests_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "monthly_cancelled_invoices"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "customer_requests_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_reports"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "customer_requests_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "customer_requests_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
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
          pnr_num: number
          scrapyard_id: number | null
        }
        Insert: {
          car_id: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          pnr_num: number
          scrapyard_id?: number | null
        }
        Update: {
          car_id?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          pnr_num?: number
          scrapyard_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "available_scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "monthly_cancelled_invoices"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "customers_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_reports"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "customers_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "customers_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyards"
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
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "distance_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      invoice_cancellations: {
        Row: {
          cancelled_at: string
          cancelled_by: string | null
          created_at: string
          id: number
          invoice_amount: number
          invoice_id: number
          previous_status: string
          reason: string
          scrapyard_id: number
        }
        Insert: {
          cancelled_at?: string
          cancelled_by?: string | null
          created_at?: string
          id?: never
          invoice_amount: number
          invoice_id: number
          previous_status: string
          reason: string
          scrapyard_id: number
        }
        Update: {
          cancelled_at?: string
          cancelled_by?: string | null
          created_at?: string
          id?: never
          invoice_amount?: number
          invoice_id?: number
          previous_status?: string
          reason?: string
          scrapyard_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_cancellations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_reports"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_cancellations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_cancellations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoices"
            referencedColumns: ["id"]
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
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
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
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "scrap_yard_locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      scrapyard_invoice_items: {
        Row: {
          created_at: string
          description: string
          id: number
          invoice_id: number
          item_type: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          tax_amount: number
          tax_rate: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: never
          invoice_id: number
          item_type?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          tax_amount?: number
          tax_rate?: number
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: never
          invoice_id?: number
          item_type?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          tax_amount?: number
          tax_rate?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrapyard_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_reports"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "scrapyard_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrapyard_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      scrapyard_invoices: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_postal_code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: number
          invoice_date: string
          invoice_items: Json | null
          invoice_number: string
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          scrapyard_id: number
          status: string
          tax_amount: number
          tenant_id: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_postal_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: never
          invoice_date?: string
          invoice_items?: Json | null
          invoice_number: string
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          scrapyard_id: number
          status?: string
          tax_amount?: number
          tenant_id?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_postal_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: never
          invoice_date?: string
          invoice_items?: Json | null
          invoice_number?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          scrapyard_id?: number
          status?: string
          tax_amount?: number
          tenant_id?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrapyard_invoices_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "available_scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrapyard_invoices_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "monthly_cancelled_invoices"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "scrapyard_invoices_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_reports"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "scrapyard_invoices_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "scrapyard_invoices_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrapyard_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "scrapyard_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      scrapyards: {
        Row: {
          address: string | null
          city: string | null
          closing_time: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          id: number
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          materials_accepted: Json | null
          max_capacity: number | null
          name: string
          opening_time: string | null
          operating_days: string[] | null
          postal_code: string | null
          services: Json | null
          tenant_id: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          closing_time?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: never
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          materials_accepted?: Json | null
          max_capacity?: number | null
          name: string
          opening_time?: string | null
          operating_days?: string[] | null
          postal_code?: string | null
          services?: Json | null
          tenant_id?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          closing_time?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: never
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          materials_accepted?: Json | null
          max_capacity?: number | null
          name?: string
          opening_time?: string | null
          operating_days?: string[] | null
          postal_code?: string | null
          services?: Json | null
          tenant_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_bidding: {
        Row: {
          bid_amount: number
          created_at: string | null
          end_date: string
          id: number
          is_active: boolean
          position_rank: number | null
          region_code: string | null
          scrapyard_id: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          bid_amount: number
          created_at?: string | null
          end_date: string
          id?: never
          is_active?: boolean
          position_rank?: number | null
          region_code?: string | null
          scrapyard_id: number
          start_date: string
          updated_at?: string | null
        }
        Update: {
          bid_amount?: number
          created_at?: string | null
          end_date?: string
          id?: never
          is_active?: boolean
          position_rank?: number | null
          region_code?: string | null
          scrapyard_id?: number
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_bidding_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "available_scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_bidding_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "monthly_cancelled_invoices"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "tenant_bidding_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_reports"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "tenant_bidding_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "tenant_bidding_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyards"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          base_address: string | null
          country: string
          created_at: string
          date: string
          invoice_email: string | null
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
          invoice_email?: string | null
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
          invoice_email?: string | null
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
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_tenant_id_fkey"
            columns: ["tenants_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: number
          role: string
          scrapyard_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          role: string
          scrapyard_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          role?: string
          scrapyard_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "available_scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "monthly_cancelled_invoices"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "user_roles_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_reports"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "user_roles_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "user_roles_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      available_scrapyards: {
        Row: {
          active_requests: number | null
          address: string | null
          availability_status: string | null
          city: string | null
          closing_time: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          id: number | null
          latitude: number | null
          longitude: number | null
          materials_accepted: Json | null
          max_capacity: number | null
          name: string | null
          opening_time: string | null
          operating_days: string[] | null
          postal_code: string | null
          remaining_capacity: number | null
          services: Json | null
          tenant_name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      monthly_cancelled_invoices: {
        Row: {
          avg_days_before_cancellation: number | null
          cancellation_reasons: Json | null
          month: string | null
          scrapyard_id: number | null
          scrapyard_name: string | null
          total_cancelled_amount: number | null
          total_cancelled_invoices: number | null
        }
        Relationships: []
      }
      monthly_invoice_stats: {
        Row: {
          avg_days_to_payment: number | null
          month: string | null
          overdue_amount: number | null
          overdue_invoices: number | null
          paid_amount: number | null
          paid_invoices: number | null
          pending_amount: number | null
          pending_invoices: number | null
          scrapyard_id: number | null
          scrapyard_name: string | null
          total_amount: number | null
          total_invoices: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scrapyard_invoices_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "available_scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrapyard_invoices_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "monthly_cancelled_invoices"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "scrapyard_invoices_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_reports"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "scrapyard_invoices_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "scrapyard_invoices_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyards"
            referencedColumns: ["id"]
          },
        ]
      }
      scrapyard_invoice_reports: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_postal_code: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          created_by_email: string | null
          due_date: string | null
          invoice_date: string | null
          invoice_description: string | null
          invoice_id: number | null
          invoice_number: string | null
          items: Json | null
          payment_date: string | null
          payment_method: string | null
          scrapyard_address: string | null
          scrapyard_city: string | null
          scrapyard_id: number | null
          scrapyard_name: string | null
          scrapyard_postal_code: string | null
          status: string | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      scrapyard_invoice_summaries: {
        Row: {
          created_at: string | null
          created_by_email: string | null
          due_date: string | null
          due_soon: boolean | null
          id: number | null
          invoice_date: string | null
          invoice_number: string | null
          is_overdue: boolean | null
          item_count: number | null
          payment_date: string | null
          payment_method: string | null
          scrapyard_id: number | null
          scrapyard_name: string | null
          status: string | null
          tax_amount: number | null
          tenant_id: number | null
          tenant_name: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_tenant_admin_role: {
        Args:
          | { p_user_id: string; p_tenant_id: number }
          | { p_user_id: string; p_tenant_id: number; p_scrapyard_id: number }
        Returns: Json
      }
      assign_user_to_scrapyard: {
        Args: { p_user_id: string; p_scrapyard_id: number; p_role: string }
        Returns: undefined
      }
      belongs_to_scrapyard: {
        Args: { scrapyard_id: number }
        Returns: boolean
      }
      calculate_distance: {
        Args:
          | { lat1: number; lon1: number; lat2: number; lon2: number }
          | { lat1: number; lon1: number; lat2: number; lon2: number }
        Returns: number
      }
      calculate_invoice_totals: {
        Args: { p_invoice_id: number }
        Returns: {
          total_amount: number
          tax_amount: number
        }[]
      }
      can_cancel_invoice: {
        Args: { p_invoice_id: number }
        Returns: {
          can_cancel: boolean
          reason: string
          invoice_number: string
          invoice_date: string
          invoice_status: string
          invoice_amount: number
          scrapyard_name: string
          days_since_creation: number
        }[]
      }
      cancel_invoice: {
        Args: {
          p_invoice_id: number
          p_cancellation_reason: string
          p_cancelled_by?: string
        }
        Returns: boolean
      }
      connect_customer_to_scrapyard: {
        Args: { p_customer_request_id: string; p_scrapyard_id: number }
        Returns: boolean
      }
      create_customer_request: {
        Args: {
          p_customer_name: string
          p_customer_email: string
          p_customer_phone: string
          p_request_details: string
          p_latitude: number
          p_longitude: number
          p_address?: string
          p_postal_code?: string
          p_city?: string
        }
        Returns: string
      }
      create_scrapyard_with_admin: {
        Args: {
          p_name: string
          p_address: string
          p_postal_code: string
          p_city: string
          p_contact_person: string
          p_contact_email: string
          p_contact_phone: string
          p_admin_user_id: string
        }
        Returns: number
      }
      create_tenant_complete: {
        Args:
          | {
              p_name: string
              p_country: string
              p_admin_name: string
              p_admin_email: string
              p_invoice_email?: string
              p_service_type?: string
              p_address?: string
              p_postal_code?: string
              p_city?: string
            }
          | {
              p_name: string
              p_country: string
              p_admin_name: string
              p_admin_email: string
              p_service_type?: string
              p_address?: string
              p_postal_code?: string
              p_city?: string
            }
          | { tenant_name: string; admin_email: string; admin_password: string }
        Returns: Json
      }
      ensure_car_metadata: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_nearby_scrapyards: {
        Args: {
          p_latitude: number
          p_longitude: number
          p_max_distance?: number
        }
        Returns: {
          id: number
          name: string
          address: string
          postal_code: string
          city: string
          latitude: number
          longitude: number
          distance_km: number
          max_capacity: number
          active_requests: number
          availability_status: string
          opening_time: string
          closing_time: string
          operating_days: string[]
        }[]
      }
      find_scrapyards_by_material: {
        Args:
          | { material_name: string }
          | {
              p_material: string
              p_latitude?: number
              p_longitude?: number
              p_max_distance?: number
            }
        Returns: {
          id: number
          name: string
          address: string
          city: string
          state: string
          zip_code: string
          phone: string
          email: string
          website: string
          description: string
          latitude: number
          longitude: number
          created_at: string
          updated_at: string
          tenant_id: number
          is_active: boolean
          logo_url: string
          banner_url: string
          business_hours: Json
          accepted_materials: Json
          rating: number
          total_reviews: number
        }[]
      }
      generate_invoice_number: {
        Args:
          | { p_scrapyard_id: number }
          | { p_scrapyard_id: number; p_tenant_id: number }
        Returns: string
      }
      generate_secure_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_accessible_scrapyards: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          name: string
          address: string
          postal_code: string
          city: string
          contact_person: string
          contact_email: string
          contact_phone: string
          created_at: string
          updated_at: string
          role: string
        }[]
      }
      get_active_tenant_bids: {
        Args: { region_filter?: string }
        Returns: {
          scrapyard_id: number
          scrapyard_name: string
          bid_amount: number
          position_rank: number
          region_code: string
          end_date: string
        }[]
      }
      get_cancelled_invoices_report: {
        Args: {
          p_scrapyard_id?: number
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          scrapyard_id: number
          scrapyard_name: string
          total_cancelled_invoices: number
          total_cancelled_amount: number
          cancellation_reasons: Json
          cancelled_by_users: Json
          most_common_reason: string
          avg_days_before_cancellation: number
        }[]
      }
      get_current_user_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_role: Database["public"]["Enums"]["user_role"]
          tenant_id: number
        }[]
      }
      get_invoice_cancellation_history: {
        Args: { p_invoice_id: number }
        Returns: {
          cancellation_id: number
          invoice_id: number
          cancelled_at: string
          cancelled_by_email: string
          reason: string
          previous_status: string
          scrapyard_name: string
          invoice_amount: number
        }[]
      }
      get_scrapyard_analytics: {
        Args:
          | { p_tenant_id?: number; p_start_date?: string; p_end_date?: string }
          | { scrapyard_id_param: number }
          | {
              scrapyard_id_param: number
              start_date_param: string
              end_date_param: string
            }
        Returns: {
          scrapyard_id: number
          scrapyard_name: string
          tenant_id: number
          tenant_name: string
          total_requests: number
          completed_requests: number
          cancelled_requests: number
          in_progress_requests: number
          completion_rate: number
          avg_processing_time_hours: number
          total_revenue: number
          most_common_material: string
          busiest_day_of_week: string
          busiest_hour_of_day: number
        }[]
      }
      get_scrapyard_details: {
        Args: { p_scrapyard_id: number }
        Returns: {
          id: number
          name: string
          address: string
          postal_code: string
          city: string
          contact_person: string
          contact_email: string
          contact_phone: string
          latitude: number
          longitude: number
          tenant_name: string
          active_requests: number
          availability_status: string
          max_capacity: number
          remaining_capacity: number
          opening_time: string
          closing_time: string
          operating_days: string[]
          services: Json
          materials_accepted: Json
          rating: number
          review_count: number
        }[]
      }
      get_scrapyard_details_extended: {
        Args: { p_scrapyard_id: number }
        Returns: {
          id: number
          name: string
          address: string
          postal_code: string
          city: string
          contact_person: string
          contact_email: string
          contact_phone: string
          latitude: number
          longitude: number
          tenant_name: string
          active_requests: number
          availability_status: string
          max_capacity: number
          remaining_capacity: number
          opening_time: string
          closing_time: string
          operating_days: string[]
          services: Json
          materials_accepted: Json
        }[]
      }
      get_scrapyard_invoice_stats: {
        Args: {
          p_scrapyard_id: number
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          total_invoices: number
          total_amount: number
          paid_invoices: number
          paid_amount: number
          pending_invoices: number
          pending_amount: number
          overdue_invoices: number
          overdue_amount: number
          avg_days_to_payment: number
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_scrapyard_ids: {
        Args: Record<PropertyKey, never>
        Returns: number[]
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_overdue_invoices: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      migrate_customer_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      record_invoice_payment: {
        Args: {
          p_invoice_id: number
          p_payment_date?: string
          p_payment_method?: string
          p_payment_reference?: string
          p_updated_by?: string
        }
        Returns: boolean
      }
      restore_cancelled_invoice: {
        Args: {
          p_invoice_id: number
          p_restoration_reason: string
          p_restored_by?: string
        }
        Returns: boolean
      }
      validate_swedish_pnr: {
        Args: { pnr: string }
        Returns: boolean
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
