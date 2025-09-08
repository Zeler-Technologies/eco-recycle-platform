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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      auth_users: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          pnr_num: string | null
          pnr_num_norm: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          pnr_num?: string | null
          pnr_num_norm?: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          pnr_num?: string | null
          pnr_num_norm?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: number | null
          updated_at?: string | null
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
      backup_customer_requests: {
        Row: {
          car_brand: string | null
          car_model: string | null
          car_registration_number: string | null
          car_year: number | null
          contact_phone: string | null
          control_number: string | null
          created_at: string | null
          customer_id: string | null
          estimated_value: number | null
          id: string | null
          owner_address: string | null
          owner_city: string | null
          owner_name: string | null
          owner_postal_code: string | null
          owner_street_address: string | null
          pickup_address: string | null
          pickup_city: string | null
          pickup_date: string | null
          pickup_latitude: number | null
          pickup_location: string | null
          pickup_longitude: number | null
          pickup_postal_code: string | null
          pickup_street_address: string | null
          pnr_num: string | null
          pnr_num_norm: string | null
          preferred_contact_method: string | null
          quote_amount: number | null
          scrapyard_id: number | null
          special_instructions: string | null
          status: string | null
          tenant_id: number | null
          transport_fee: number | null
          updated_at: string | null
        }
        Insert: {
          car_brand?: string | null
          car_model?: string | null
          car_registration_number?: string | null
          car_year?: number | null
          contact_phone?: string | null
          control_number?: string | null
          created_at?: string | null
          customer_id?: string | null
          estimated_value?: number | null
          id?: string | null
          owner_address?: string | null
          owner_city?: string | null
          owner_name?: string | null
          owner_postal_code?: string | null
          owner_street_address?: string | null
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_date?: string | null
          pickup_latitude?: number | null
          pickup_location?: string | null
          pickup_longitude?: number | null
          pickup_postal_code?: string | null
          pickup_street_address?: string | null
          pnr_num?: string | null
          pnr_num_norm?: string | null
          preferred_contact_method?: string | null
          quote_amount?: number | null
          scrapyard_id?: number | null
          special_instructions?: string | null
          status?: string | null
          tenant_id?: number | null
          transport_fee?: number | null
          updated_at?: string | null
        }
        Update: {
          car_brand?: string | null
          car_model?: string | null
          car_registration_number?: string | null
          car_year?: number | null
          contact_phone?: string | null
          control_number?: string | null
          created_at?: string | null
          customer_id?: string | null
          estimated_value?: number | null
          id?: string | null
          owner_address?: string | null
          owner_city?: string | null
          owner_name?: string | null
          owner_postal_code?: string | null
          owner_street_address?: string | null
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_date?: string | null
          pickup_latitude?: number | null
          pickup_location?: string | null
          pickup_longitude?: number | null
          pickup_postal_code?: string | null
          pickup_street_address?: string | null
          pnr_num?: string | null
          pnr_num_norm?: string | null
          preferred_contact_method?: string | null
          quote_amount?: number | null
          scrapyard_id?: number | null
          special_instructions?: string | null
          status?: string | null
          tenant_id?: number | null
          transport_fee?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_scrapyards: {
        Row: {
          address: string | null
          city: string | null
          closing_time: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: number | null
          is_active: boolean | null
          is_primary: boolean | null
          latitude: number | null
          longitude: number | null
          materials_accepted: Json | null
          max_capacity: number | null
          name: string | null
          opening_time: string | null
          operating_days: string[] | null
          postal_code: string | null
          services: Json | null
          tenant_id: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          closing_time?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: number | null
          is_active?: boolean | null
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          materials_accepted?: Json | null
          max_capacity?: number | null
          name?: string | null
          opening_time?: string | null
          operating_days?: string[] | null
          postal_code?: string | null
          services?: Json | null
          tenant_id?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          closing_time?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: number | null
          is_active?: boolean | null
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          materials_accepted?: Json | null
          max_capacity?: number | null
          name?: string | null
          opening_time?: string | null
          operating_days?: string[] | null
          postal_code?: string | null
          services?: Json | null
          tenant_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_tenants: {
        Row: {
          base_address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date: string | null
          invoice_email: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          postal_code: string | null
          service_type: string | null
          street_address: string | null
          tenants_id: number | null
          updated_at: string | null
        }
        Insert: {
          base_address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date?: string | null
          invoice_email?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          postal_code?: string | null
          service_type?: string | null
          street_address?: string | null
          tenants_id?: number | null
          updated_at?: string | null
        }
        Update: {
          base_address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date?: string | null
          invoice_email?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          postal_code?: string | null
          service_type?: string | null
          street_address?: string | null
          tenants_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      billing_config_audit: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          config_category: string
          config_key: string
          id: string
          new_value: Json | null
          old_value: Json | null
          tenant_id: number | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          config_category: string
          config_key: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          tenant_id?: number | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          config_category?: string
          config_key?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          tenant_id?: number | null
        }
        Relationships: []
      }
      billing_configuration: {
        Row: {
          config_category: string
          config_key: string
          config_value: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          tenant_id: number | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          config_category: string
          config_key: string
          config_value: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          tenant_id?: number | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          config_category?: string
          config_key?: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          tenant_id?: number | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_configuration_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "billing_configuration_tenant_id_fkey"
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
          car_registration_number: string | null
          created_at: string | null
          file_name: string | null
          file_size: number | null
          id: string
          image_type: string | null
          image_url: string
          notes: string | null
          pnr_num: number
          pnr_num_norm: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          car_id: string
          car_registration_number?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          image_type?: string | null
          image_url: string
          notes?: string | null
          pnr_num: number
          pnr_num_norm?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          car_id?: string
          car_registration_number?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          image_type?: string | null
          image_url?: string
          notes?: string | null
          pnr_num?: number
          pnr_num_norm?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_car_images_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["car_registration_number"]
          },
          {
            foreignKeyName: "fk_car_images_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_registrations"
            referencedColumns: ["car_registration_number"]
          },
        ]
      }
      car_metadata: {
        Row: {
          car_registration_number: string | null
          car_year: number | null
          control_number: string | null
          customer_request_id: string
          id: string
          kontrollbes_galler_tom: string | null
          kontrollsiffror: string | null
          missing_parts: Json | null
          part_list: Json | null
        }
        Insert: {
          car_registration_number?: string | null
          car_year?: number | null
          control_number?: string | null
          customer_request_id: string
          id?: string
          kontrollbes_galler_tom?: string | null
          kontrollsiffror?: string | null
          missing_parts?: Json | null
          part_list?: Json | null
        }
        Update: {
          car_registration_number?: string | null
          car_year?: number | null
          control_number?: string | null
          customer_request_id?: string
          id?: string
          kontrollbes_galler_tom?: string | null
          kontrollsiffror?: string | null
          missing_parts?: Json | null
          part_list?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_car_metadata_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["car_registration_number"]
          },
          {
            foreignKeyName: "fk_car_metadata_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_registrations"
            referencedColumns: ["car_registration_number"]
          },
        ]
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
      car_registrations: {
        Row: {
          car_registration_number: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          car_registration_number: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          car_registration_number?: string
          created_at?: string | null
          updated_at?: string | null
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
          estimated_cost_sek: number | null
          estimated_sms_count: number | null
          id: string
          is_active: boolean
          required_variables: string[] | null
          template_name: string
          template_type: string
          tenant_id: number
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          estimated_cost_sek?: number | null
          estimated_sms_count?: number | null
          id?: string
          is_active?: boolean
          required_variables?: string[] | null
          template_name: string
          template_type: string
          tenant_id: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          estimated_cost_sek?: number | null
          estimated_sms_count?: number | null
          id?: string
          is_active?: boolean
          required_variables?: string[] | null
          template_name?: string
          template_type?: string
          tenant_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_requests: {
        Row: {
          car_brand: string | null
          car_model: string | null
          car_registration_number: string
          car_year: number | null
          contact_phone: string | null
          control_number: string | null
          created_at: string
          customer_id: string | null
          estimated_value: number | null
          id: string
          owner_address: string | null
          owner_city: string | null
          owner_name: string | null
          owner_postal_code: string | null
          owner_street_address: string | null
          pickup_address: string | null
          pickup_city: string | null
          pickup_date: string | null
          pickup_latitude: number | null
          pickup_location: string | null
          pickup_longitude: number | null
          pickup_postal_code: string | null
          pickup_street_address: string | null
          pnr_num: string | null
          pnr_num_norm: string | null
          preferred_contact_method: string | null
          quote_amount: number | null
          scrapyard_id: number
          special_instructions: string | null
          status: string | null
          tenant_id: number | null
          transport_fee: number | null
          updated_at: string
        }
        Insert: {
          car_brand?: string | null
          car_model?: string | null
          car_registration_number: string
          car_year?: number | null
          contact_phone?: string | null
          control_number?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_value?: number | null
          id?: string
          owner_address?: string | null
          owner_city?: string | null
          owner_name?: string | null
          owner_postal_code?: string | null
          owner_street_address?: string | null
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_date?: string | null
          pickup_latitude?: number | null
          pickup_location?: string | null
          pickup_longitude?: number | null
          pickup_postal_code?: string | null
          pickup_street_address?: string | null
          pnr_num?: string | null
          pnr_num_norm?: string | null
          preferred_contact_method?: string | null
          quote_amount?: number | null
          scrapyard_id: number
          special_instructions?: string | null
          status?: string | null
          tenant_id?: number | null
          transport_fee?: number | null
          updated_at?: string
        }
        Update: {
          car_brand?: string | null
          car_model?: string | null
          car_registration_number?: string
          car_year?: number | null
          contact_phone?: string | null
          control_number?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_value?: number | null
          id?: string
          owner_address?: string | null
          owner_city?: string | null
          owner_name?: string | null
          owner_postal_code?: string | null
          owner_street_address?: string | null
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_date?: string | null
          pickup_latitude?: number | null
          pickup_location?: string | null
          pickup_longitude?: number | null
          pickup_postal_code?: string | null
          pickup_street_address?: string | null
          pnr_num?: string | null
          pnr_num_norm?: string | null
          preferred_contact_method?: string | null
          quote_amount?: number | null
          scrapyard_id?: number
          special_instructions?: string | null
          status?: string | null
          tenant_id?: number | null
          transport_fee?: number | null
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
          {
            foreignKeyName: "fk_customer_requests_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["car_registration_number"]
          },
          {
            foreignKeyName: "fk_customer_requests_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_registrations"
            referencedColumns: ["car_registration_number"]
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
          pnr_num_norm: string | null
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
          pnr_num_norm?: string | null
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
          pnr_num_norm?: string | null
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
      daily_summaries: {
        Row: {
          average_pickup_value: number | null
          created_at: string | null
          id: number
          pickups_assigned: number | null
          pickups_cancelled: number | null
          pickups_completed: number | null
          pickups_created: number | null
          sms_cost: number | null
          sms_failed: number | null
          sms_sent: number | null
          summary_date: string
          tenant_id: number | null
          total_quoted: number | null
          total_revenue: number | null
          total_weight_kg: number | null
          updated_at: string | null
          vehicles_excellent: number | null
          vehicles_fair: number | null
          vehicles_good: number | null
          vehicles_poor: number | null
          vehicles_scrap: number | null
          vehicles_with_battery: number | null
          vehicles_with_catalytic: number | null
        }
        Insert: {
          average_pickup_value?: number | null
          created_at?: string | null
          id?: number
          pickups_assigned?: number | null
          pickups_cancelled?: number | null
          pickups_completed?: number | null
          pickups_created?: number | null
          sms_cost?: number | null
          sms_failed?: number | null
          sms_sent?: number | null
          summary_date: string
          tenant_id?: number | null
          total_quoted?: number | null
          total_revenue?: number | null
          total_weight_kg?: number | null
          updated_at?: string | null
          vehicles_excellent?: number | null
          vehicles_fair?: number | null
          vehicles_good?: number | null
          vehicles_poor?: number | null
          vehicles_scrap?: number | null
          vehicles_with_battery?: number | null
          vehicles_with_catalytic?: number | null
        }
        Update: {
          average_pickup_value?: number | null
          created_at?: string | null
          id?: number
          pickups_assigned?: number | null
          pickups_cancelled?: number | null
          pickups_completed?: number | null
          pickups_created?: number | null
          sms_cost?: number | null
          sms_failed?: number | null
          sms_sent?: number | null
          summary_date?: string
          tenant_id?: number | null
          total_quoted?: number | null
          total_revenue?: number | null
          total_weight_kg?: number | null
          updated_at?: string | null
          vehicles_excellent?: number | null
          vehicles_fair?: number | null
          vehicles_good?: number | null
          vehicles_poor?: number | null
          vehicles_scrap?: number | null
          vehicles_with_battery?: number | null
          vehicles_with_catalytic?: number | null
        }
        Relationships: []
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
      driver_activity_log: {
        Row: {
          created_at: string | null
          driver_id: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          status: string
          tenant_id: number | null
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          status: string
          tenant_id?: number | null
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          status?: string
          tenant_id?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_activity_log_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "driver_activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      driver_assignments: {
        Row: {
          accepted_at: string | null
          actual_end: string | null
          actual_start: string | null
          assigned_at: string | null
          assignment_type: string | null
          completed_at: string | null
          customer_request_id: string | null
          driver_id: string
          id: string
          is_active: boolean | null
          notes: string | null
          pickup_order_id: string | null
          role: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          actual_end?: string | null
          actual_start?: string | null
          assigned_at?: string | null
          assignment_type?: string | null
          completed_at?: string | null
          customer_request_id?: string | null
          driver_id: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          pickup_order_id?: string | null
          role?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          actual_end?: string | null
          actual_start?: string | null
          assigned_at?: string | null
          assignment_type?: string | null
          completed_at?: string | null
          customer_request_id?: string | null
          driver_id?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          pickup_order_id?: string | null
          role?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_assignments_customer_request_id_fkey"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["customer_request_id"]
          },
          {
            foreignKeyName: "driver_assignments_customer_request_id_fkey"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "customer_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          altitude: number | null
          driver_id: string
          expires_at: string | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          pickup_order_id: string | null
          recorded_at: string | null
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          driver_id: string
          expires_at?: string | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          pickup_order_id?: string | null
          recorded_at?: string | null
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          driver_id?: string
          expires_at?: string | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          pickup_order_id?: string | null
          recorded_at?: string | null
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          customer_request_id: string | null
          driver_id: string
          id: string
          is_read: boolean | null
          is_urgent: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          pickup_order_id: string | null
          read_at: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          customer_request_id?: string | null
          driver_id: string
          id?: string
          is_read?: boolean | null
          is_urgent?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          pickup_order_id?: string | null
          read_at?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          customer_request_id?: string | null
          driver_id?: string
          id?: string
          is_read?: boolean | null
          is_urgent?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          pickup_order_id?: string | null
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_notifications_customer_request_id_fkey"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["customer_request_id"]
          },
          {
            foreignKeyName: "driver_notifications_customer_request_id_fkey"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "customer_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_notifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          driver_id: string
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          new_status: Database["public"]["Enums"]["driver_status"]
          old_status: Database["public"]["Enums"]["driver_status"] | null
          reason: string | null
          source: string | null
          status: Database["public"]["Enums"]["driver_status"]
          tenant_id: number | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          driver_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          new_status: Database["public"]["Enums"]["driver_status"]
          old_status?: Database["public"]["Enums"]["driver_status"] | null
          reason?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          tenant_id?: number | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          driver_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["driver_status"]
          old_status?: Database["public"]["Enums"]["driver_status"] | null
          reason?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          tenant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_status_history_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          auth_user_id: string | null
          available_from: string | null
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          current_status: string | null
          driver_status: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          last_activity_update: string | null
          last_location_update: string | null
          max_capacity_kg: number | null
          phone_number: string
          scrapyard_id: number | null
          status: Database["public"]["Enums"]["driver_status"]
          status_updated_at: string | null
          tenant_id: number
          updated_at: string | null
          vehicle_registration: string | null
          vehicle_type: string | null
        }
        Insert: {
          auth_user_id?: string | null
          available_from?: string | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          current_status?: string | null
          driver_status?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          last_activity_update?: string | null
          last_location_update?: string | null
          max_capacity_kg?: number | null
          phone_number: string
          scrapyard_id?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          status_updated_at?: string | null
          tenant_id: number
          updated_at?: string | null
          vehicle_registration?: string | null
          vehicle_type?: string | null
        }
        Update: {
          auth_user_id?: string | null
          available_from?: string | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          current_status?: string | null
          driver_status?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_activity_update?: string | null
          last_location_update?: string | null
          max_capacity_kg?: number | null
          phone_number?: string
          scrapyard_id?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          status_updated_at?: string | null
          tenant_id?: number
          updated_at?: string | null
          vehicle_registration?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "available_scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "monthly_cancelled_invoices"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "drivers_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_reports"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "drivers_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["scrapyard_id"]
          },
          {
            foreignKeyName: "drivers_scrapyard_id_fkey"
            columns: ["scrapyard_id"]
            isOneToOne: false
            referencedRelation: "scrapyards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "drivers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          description: string | null
          is_active: boolean
          key: string
          locale: string | null
          name: string
          template_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          key: string
          locale?: string | null
          name: string
          template_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          key?: string
          locale?: string | null
          name?: string
          template_type?: string
        }
        Relationships: []
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
      margin_alert_thresholds: {
        Row: {
          alert_category: string
          comparison_operator: string
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          message: string
          service_type: string
          severity: string
          tenant_id: number | null
          threshold_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alert_category: string
          comparison_operator?: string
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          message: string
          service_type: string
          severity?: string
          tenant_id?: number | null
          threshold_value: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alert_category?: string
          comparison_operator?: string
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          message?: string
          service_type?: string
          severity?: string
          tenant_id?: number | null
          threshold_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margin_alert_thresholds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "margin_alert_thresholds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      monthly_billing_cycles: {
        Row: {
          billing_month: string
          completed_at: string | null
          created_at: string | null
          generated_by: string | null
          id: string
          status: string
          total_amount: number | null
          total_invoices: number | null
        }
        Insert: {
          billing_month: string
          completed_at?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          status?: string
          total_amount?: number | null
          total_invoices?: number | null
        }
        Update: {
          billing_month?: string
          completed_at?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          status?: string
          total_amount?: number | null
          total_invoices?: number | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          car_id: string
          customer_id: string | null
          driver_id: string | null
          exported_to_csv: boolean | null
          exported_to_excel: boolean | null
          exported_to_pdf: boolean | null
          id: string
          payment_date: string
          payment_method: string | null
          payment_status: string | null
          pickup_order_id: string | null
        }
        Insert: {
          amount: number
          car_id: string
          customer_id?: string | null
          driver_id?: string | null
          exported_to_csv?: boolean | null
          exported_to_excel?: boolean | null
          exported_to_pdf?: boolean | null
          id?: string
          payment_date: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_order_id?: string | null
        }
        Update: {
          amount?: number
          car_id?: string
          customer_id?: string | null
          driver_id?: string | null
          exported_to_csv?: boolean | null
          exported_to_excel?: boolean | null
          exported_to_pdf?: boolean | null
          id?: string
          payment_date?: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_logs: {
        Row: {
          car_brand: string | null
          car_model: string | null
          car_year: number | null
          condition_notes: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          driver_id: string | null
          driver_name: string | null
          event_timestamp: string | null
          event_type: string
          final_price: number | null
          has_battery: boolean | null
          has_catalytic_converter: boolean | null
          id: number
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          photos: Json | null
          pickup_address: string | null
          pickup_date: string | null
          pickup_order_id: string | null
          pickup_time: string | null
          price_adjustments: Json | null
          quoted_price: number | null
          registration_number: string | null
          sms_cost_total: number | null
          sms_sent_count: number | null
          tenant_id: number | null
          transportstyrelsen_id: string | null
          updated_at: string | null
          vehicle_condition: string | null
          weight_kg: number | null
        }
        Insert: {
          car_brand?: string | null
          car_model?: string | null
          car_year?: number | null
          condition_notes?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          driver_id?: string | null
          driver_name?: string | null
          event_timestamp?: string | null
          event_type: string
          final_price?: number | null
          has_battery?: boolean | null
          has_catalytic_converter?: boolean | null
          id?: number
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          photos?: Json | null
          pickup_address?: string | null
          pickup_date?: string | null
          pickup_order_id?: string | null
          pickup_time?: string | null
          price_adjustments?: Json | null
          quoted_price?: number | null
          registration_number?: string | null
          sms_cost_total?: number | null
          sms_sent_count?: number | null
          tenant_id?: number | null
          transportstyrelsen_id?: string | null
          updated_at?: string | null
          vehicle_condition?: string | null
          weight_kg?: number | null
        }
        Update: {
          car_brand?: string | null
          car_model?: string | null
          car_year?: number | null
          condition_notes?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          driver_id?: string | null
          driver_name?: string | null
          event_timestamp?: string | null
          event_type?: string
          final_price?: number | null
          has_battery?: boolean | null
          has_catalytic_converter?: boolean | null
          id?: number
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          photos?: Json | null
          pickup_address?: string | null
          pickup_date?: string | null
          pickup_order_id?: string | null
          pickup_time?: string | null
          price_adjustments?: Json | null
          quoted_price?: number | null
          registration_number?: string | null
          sms_cost_total?: number | null
          sms_sent_count?: number | null
          tenant_id?: number | null
          transportstyrelsen_id?: string | null
          updated_at?: string | null
          vehicle_condition?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pickup_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_logs_pickup_order_id_fkey"
            columns: ["pickup_order_id"]
            isOneToOne: false
            referencedRelation: "pickup_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_logs_pickup_order_id_fkey"
            columns: ["pickup_order_id"]
            isOneToOne: false
            referencedRelation: "v_pickup_orders_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_logs_pickup_order_id_fkey"
            columns: ["pickup_order_id"]
            isOneToOne: false
            referencedRelation: "v_pickup_status_unified"
            referencedColumns: ["pickup_order_id"]
          },
          {
            foreignKeyName: "pickup_logs_pickup_order_id_fkey"
            columns: ["pickup_order_id"]
            isOneToOne: false
            referencedRelation: "v_unified_pickup_status"
            referencedColumns: ["pickup_order_id"]
          },
        ]
      }
      pickup_orders: {
        Row: {
          actual_pickup_date: string | null
          assigned_driver_id: string | null
          completion_photos: string[] | null
          created_at: string
          customer_request_id: string
          driver_id: string | null
          driver_name: string | null
          driver_notes: string | null
          final_price: number | null
          id: string
          scheduled_pickup_date: string | null
          status: string | null
          tenant_id: number
          updated_at: string
        }
        Insert: {
          actual_pickup_date?: string | null
          assigned_driver_id?: string | null
          completion_photos?: string[] | null
          created_at?: string
          customer_request_id: string
          driver_id?: string | null
          driver_name?: string | null
          driver_notes?: string | null
          final_price?: number | null
          id?: string
          scheduled_pickup_date?: string | null
          status?: string | null
          tenant_id: number
          updated_at?: string
        }
        Update: {
          actual_pickup_date?: string | null
          assigned_driver_id?: string | null
          completion_photos?: string[] | null
          created_at?: string
          customer_request_id?: string
          driver_id?: string | null
          driver_name?: string | null
          driver_notes?: string | null
          final_price?: number | null
          id?: string
          scheduled_pickup_date?: string | null
          status?: string | null
          tenant_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pickup_orders_customer_request"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["customer_request_id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_customer_request"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "customer_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_driver"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      pickup_status_updates: {
        Row: {
          customer_request_id: string | null
          driver_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          new_status: string
          notes: string | null
          old_status: string | null
          photos: string[] | null
          pickup_order_id: string | null
          timestamp: string | null
        }
        Insert: {
          customer_request_id?: string | null
          driver_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          new_status: string
          notes?: string | null
          old_status?: string | null
          photos?: string[] | null
          pickup_order_id?: string | null
          timestamp?: string | null
        }
        Update: {
          customer_request_id?: string | null
          driver_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          new_status?: string
          notes?: string | null
          old_status?: string | null
          photos?: string[] | null
          pickup_order_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pickup_status_updates_customer_request_id_fkey"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["customer_request_id"]
          },
          {
            foreignKeyName: "pickup_status_updates_customer_request_id_fkey"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "customer_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_status_updates_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      postal_codes_master: {
        Row: {
          city: string
          country: string
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          postal_code: string
          region: string | null
          updated_at: string | null
        }
        Insert: {
          city: string
          country?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          postal_code: string
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          postal_code?: string
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      pricing_tiers: {
        Row: {
          age_bonuses: Json | null
          created_at: string | null
          distance_adjustments: Json | null
          fuel_adjustments: Json | null
          id: string
          is_vehicle_pricing: boolean | null
          old_car_deduction: Json | null
          parts_bonuses: Json | null
          tenant_id: string
          updated_at: string | null
          vehicle_age_bonuses: Json | null
          vehicle_distance_adjustments: Json | null
          vehicle_fuel_adjustments: Json | null
          vehicle_old_car_deduction: Json | null
          vehicle_parts_bonuses: Json | null
        }
        Insert: {
          age_bonuses?: Json | null
          created_at?: string | null
          distance_adjustments?: Json | null
          fuel_adjustments?: Json | null
          id?: string
          is_vehicle_pricing?: boolean | null
          old_car_deduction?: Json | null
          parts_bonuses?: Json | null
          tenant_id: string
          updated_at?: string | null
          vehicle_age_bonuses?: Json | null
          vehicle_distance_adjustments?: Json | null
          vehicle_fuel_adjustments?: Json | null
          vehicle_old_car_deduction?: Json | null
          vehicle_parts_bonuses?: Json | null
        }
        Update: {
          age_bonuses?: Json | null
          created_at?: string | null
          distance_adjustments?: Json | null
          fuel_adjustments?: Json | null
          id?: string
          is_vehicle_pricing?: boolean | null
          old_car_deduction?: Json | null
          parts_bonuses?: Json | null
          tenant_id?: string
          updated_at?: string | null
          vehicle_age_bonuses?: Json | null
          vehicle_distance_adjustments?: Json | null
          vehicle_fuel_adjustments?: Json | null
          vehicle_old_car_deduction?: Json | null
          vehicle_parts_bonuses?: Json | null
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
          service_id: string | null
          service_period_end: string | null
          service_period_start: string | null
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
          service_id?: string | null
          service_period_end?: string | null
          service_period_start?: string | null
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
          service_id?: string | null
          service_period_end?: string | null
          service_period_start?: string | null
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
          {
            foreignKeyName: "scrapyard_invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_cost_models"
            referencedColumns: ["id"]
          },
        ]
      }
      scrapyard_invoices: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_month: string | null
          billing_postal_code: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          due_date: string
          id: number
          invoice_date: string
          invoice_items: Json | null
          invoice_number: string
          invoice_type: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          scrapyard_id: number
          status: string
          tax_amount: number
          tenant_id: number | null
          total_amount: number
          updated_at: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_month?: string | null
          billing_postal_code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          due_date: string
          id?: never
          invoice_date?: string
          invoice_items?: Json | null
          invoice_number: string
          invoice_type?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          scrapyard_id: number
          status?: string
          tax_amount?: number
          tenant_id?: number | null
          total_amount: number
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_month?: string | null
          billing_postal_code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string
          id?: never
          invoice_date?: string
          invoice_items?: Json | null
          invoice_number?: string
          invoice_type?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          scrapyard_id?: number
          status?: string
          tax_amount?: number
          tenant_id?: number | null
          total_amount?: number
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
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
          is_primary: boolean | null
          latitude: number | null
          longitude: number | null
          materials_accepted: Json | null
          max_capacity: number | null
          name: string
          opening_time: string | null
          operating_days: string[] | null
          postal_code: string | null
          services: Json | null
          tenant_id: number
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
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          materials_accepted?: Json | null
          max_capacity?: number | null
          name: string
          opening_time?: string | null
          operating_days?: string[] | null
          postal_code?: string | null
          services?: Json | null
          tenant_id: number
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
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          materials_accepted?: Json | null
          max_capacity?: number | null
          name?: string
          opening_time?: string | null
          operating_days?: string[] | null
          postal_code?: string | null
          services?: Json | null
          tenant_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrapyards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "scrapyards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      service_cost_models: {
        Row: {
          allocation_method: string | null
          base_cost_monthly: number | null
          cost_type: string
          created_at: string | null
          id: string
          service_name: string
          unit_cost: number | null
        }
        Insert: {
          allocation_method?: string | null
          base_cost_monthly?: number | null
          cost_type: string
          created_at?: string | null
          id?: string
          service_name: string
          unit_cost?: number | null
        }
        Update: {
          allocation_method?: string | null
          base_cost_monthly?: number | null
          cost_type?: string
          created_at?: string | null
          id?: string
          service_name?: string
          unit_cost?: number | null
        }
        Relationships: []
      }
      shared_cost_allocations: {
        Row: {
          allocation_data: Json | null
          billing_month: string
          created_at: string | null
          id: string
          service_id: string | null
          total_base_cost: number | null
          total_usage_units: number | null
        }
        Insert: {
          allocation_data?: Json | null
          billing_month: string
          created_at?: string | null
          id?: string
          service_id?: string | null
          total_base_cost?: number | null
          total_usage_units?: number | null
        }
        Update: {
          allocation_data?: Json | null
          billing_month?: string
          created_at?: string | null
          id?: string
          service_id?: string | null
          total_base_cost?: number | null
          total_usage_units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_cost_allocations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_cost_models"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_billing_summary: {
        Row: {
          billing_month: string
          breakdown_by_type: Json | null
          created_at: string | null
          id: string
          invoice_id: string | null
          is_invoiced: boolean | null
          tenant_id: number
          total_cost_amount: number
          total_sms_count: number
          updated_at: string | null
        }
        Insert: {
          billing_month: string
          breakdown_by_type?: Json | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          is_invoiced?: boolean | null
          tenant_id: number
          total_cost_amount?: number
          total_sms_count?: number
          updated_at?: string | null
        }
        Update: {
          billing_month?: string
          breakdown_by_type?: Json | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          is_invoiced?: boolean | null
          tenant_id?: number
          total_cost_amount?: number
          total_sms_count?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          cost_amount: number
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: number
          message_content: string | null
          message_type: string
          message_variables: Json | null
          pickup_log_id: number | null
          pickup_order_id: string | null
          provider: string | null
          provider_message_id: string | null
          provider_response: Json | null
          recipient_name: string | null
          recipient_phone: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          template_used: string | null
          tenant_id: number | null
        }
        Insert: {
          cost_amount?: number
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: number
          message_content?: string | null
          message_type: string
          message_variables?: Json | null
          pickup_log_id?: number | null
          pickup_order_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          recipient_name?: string | null
          recipient_phone: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_used?: string | null
          tenant_id?: number | null
        }
        Update: {
          cost_amount?: number
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: number
          message_content?: string | null
          message_type?: string
          message_variables?: Json | null
          pickup_log_id?: number | null
          pickup_order_id?: string | null
          provider?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          recipient_name?: string | null
          recipient_phone?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_used?: string | null
          tenant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_pickup_log_id_fkey"
            columns: ["pickup_log_id"]
            isOneToOne: false
            referencedRelation: "pickup_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_pickup_order_id_fkey"
            columns: ["pickup_order_id"]
            isOneToOne: false
            referencedRelation: "pickup_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_pickup_order_id_fkey"
            columns: ["pickup_order_id"]
            isOneToOne: false
            referencedRelation: "v_pickup_orders_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_pickup_order_id_fkey"
            columns: ["pickup_order_id"]
            isOneToOne: false
            referencedRelation: "v_pickup_status_unified"
            referencedColumns: ["pickup_order_id"]
          },
          {
            foreignKeyName: "sms_logs_pickup_order_id_fkey"
            columns: ["pickup_order_id"]
            isOneToOne: false
            referencedRelation: "v_unified_pickup_status"
            referencedColumns: ["pickup_order_id"]
          },
        ]
      }
      sms_trigger_rules: {
        Row: {
          created_at: string | null
          delay_minutes: number | null
          description: string | null
          id: string
          is_enabled: boolean | null
          template_id: string | null
          template_type: string | null
          tenant_id: number
          trigger_event: string
          trigger_sequence: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delay_minutes?: number | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          template_id?: string | null
          template_type?: string | null
          tenant_id: number
          trigger_event: string
          trigger_sequence?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delay_minutes?: number | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          template_id?: string | null
          template_type?: string | null
          tenant_id?: number
          trigger_event?: string
          trigger_sequence?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_trigger_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "custom_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      supported_currencies: {
        Row: {
          code: string
          created_at: string
          is_active: boolean
          name: string
          symbol: string
        }
        Insert: {
          code: string
          created_at?: string
          is_active?: boolean
          name: string
          symbol: string
        }
        Update: {
          code?: string
          created_at?: string
          is_active?: boolean
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      supported_locales: {
        Row: {
          code: string
          created_at: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      supported_timezones: {
        Row: {
          created_at: string
          display_name: string
          is_active: boolean
          value: string
        }
        Insert: {
          created_at?: string
          display_name: string
          is_active?: boolean
          value: string
        }
        Update: {
          created_at?: string
          display_name?: string
          is_active?: boolean
          value?: string
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
      tenant_coverage_areas: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          postal_code_id: string | null
          tenant_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          postal_code_id?: string | null
          tenant_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          postal_code_id?: string | null
          tenant_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_coverage_areas_postal_code_id_fkey"
            columns: ["postal_code_id"]
            isOneToOne: false
            referencedRelation: "postal_codes_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_coverage_areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_coverage_areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      tenant_service_usage: {
        Row: {
          base_cost_allocation: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          service_id: string | null
          tenant_id: number | null
          total_cost: number | null
          unit_cost: number | null
          units_used: number
          usage_date: string | null
        }
        Insert: {
          base_cost_allocation?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          service_id?: string | null
          tenant_id?: number | null
          total_cost?: number | null
          unit_cost?: number | null
          units_used: number
          usage_date?: string | null
        }
        Update: {
          base_cost_allocation?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          service_id?: string | null
          tenant_id?: number | null
          total_cost?: number | null
          unit_cost?: number | null
          units_used?: number
          usage_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_service_usage_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_cost_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_service_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_service_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      tenants: {
        Row: {
          base_address: string | null
          city: string | null
          country: string
          created_at: string
          date: string
          invoice_email: string | null
          latitude: number | null
          longitude: number | null
          name: string
          postal_code: string | null
          service_type: string | null
          street_address: string | null
          tenants_id: number
          updated_at: string | null
        }
        Insert: {
          base_address?: string | null
          city?: string | null
          country: string
          created_at?: string
          date: string
          invoice_email?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          postal_code?: string | null
          service_type?: string | null
          street_address?: string | null
          tenants_id?: number
          updated_at?: string | null
        }
        Update: {
          base_address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          date?: string
          invoice_email?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          postal_code?: string | null
          service_type?: string | null
          street_address?: string | null
          tenants_id?: number
          updated_at?: string | null
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
      vehicle_pricing_config: {
        Row: {
          age_bonuses: Json | null
          created_at: string | null
          distance_adjustments: Json | null
          fuel_adjustments: Json | null
          id: string
          old_car_deduction: Json | null
          parts_bonuses: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          age_bonuses?: Json | null
          created_at?: string | null
          distance_adjustments?: Json | null
          fuel_adjustments?: Json | null
          id?: string
          old_car_deduction?: Json | null
          parts_bonuses?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          age_bonuses?: Json | null
          created_at?: string | null
          distance_adjustments?: Json | null
          fuel_adjustments?: Json | null
          id?: string
          old_car_deduction?: Json | null
          parts_bonuses?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
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
      car_complete_view: {
        Row: {
          car_ids: string[] | null
          car_registration_number: string | null
          car_year: number | null
          control_number: string | null
          customer_request_id: string | null
          image_ids: string[] | null
          image_urls: string[] | null
          kontrollbes_galler_tom: string | null
          kontrollsiffror: string | null
          metadata_car_registration: string | null
          metadata_id: string | null
          missing_parts: Json | null
          part_list: Json | null
          pnr_nums: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_car_metadata_registration"
            columns: ["metadata_car_registration"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["car_registration_number"]
          },
          {
            foreignKeyName: "fk_car_metadata_registration"
            columns: ["metadata_car_registration"]
            isOneToOne: false
            referencedRelation: "car_registrations"
            referencedColumns: ["car_registration_number"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
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
      v_data_quality_monitor: {
        Row: {
          data_quality_percentage: number | null
          missing_scrapyard_id: number | null
          potential_placeholders: number | null
          report_generated_at: string | null
          requests_last_24h: number | null
          requests_last_7_days: number | null
          total_requests: number | null
        }
        Relationships: []
      }
      v_data_quality_monitor_safe: {
        Row: {
          customer_placeholders: number | null
          marked_for_review: number | null
          missing_scrapyard_id: number | null
          report_generated_at: string | null
          requests_last_24h: number | null
          test_phone_numbers: number | null
          total_requests: number | null
        }
        Relationships: []
      }
      v_pickup_orders_enriched: {
        Row: {
          actual_pickup_date: string | null
          assigned_at: string | null
          assigned_driver_id: string | null
          assignment_notes: string | null
          assignment_status:
            | Database["public"]["Enums"]["assignment_status"]
            | null
          car_brand: string | null
          car_model: string | null
          car_registration_number: string | null
          car_year: number | null
          completion_photos: string[] | null
          contact_phone: string | null
          created_at: string | null
          customer_request_id: string | null
          driver_full_name: string | null
          driver_id: string | null
          driver_name: string | null
          driver_notes: string | null
          driver_phone: string | null
          driver_vehicle_type: string | null
          final_price: number | null
          id: string | null
          owner_name: string | null
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          scheduled_pickup_date: string | null
          scrapyard_id: number | null
          status: string | null
          tenant_id: number | null
          updated_at: string | null
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
            foreignKeyName: "fk_customer_requests_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["car_registration_number"]
          },
          {
            foreignKeyName: "fk_customer_requests_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_registrations"
            referencedColumns: ["car_registration_number"]
          },
          {
            foreignKeyName: "fk_pickup_orders_customer_request"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["customer_request_id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_customer_request"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "customer_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_driver"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      v_pickup_status_unified: {
        Row: {
          actual_pickup_date: string | null
          assignment_status: string | null
          car_brand: string | null
          car_model: string | null
          car_registration_number: string | null
          car_year: number | null
          completion_photos: string[] | null
          contact_phone: string | null
          created_at: string | null
          customer_request_id: string | null
          driver_id: string | null
          driver_name: string | null
          driver_notes: string | null
          final_price: number | null
          kontrollsiffror: string | null
          owner_name: string | null
          part_list: Json | null
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          pickup_order_id: string | null
          pickup_status: string | null
          scheduled_pickup_date: string | null
          scrapyard_id: number | null
          tenant_id: number | null
          updated_at: string | null
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
            foreignKeyName: "fk_customer_requests_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["car_registration_number"]
          },
          {
            foreignKeyName: "fk_customer_requests_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_registrations"
            referencedColumns: ["car_registration_number"]
          },
          {
            foreignKeyName: "fk_pickup_orders_customer_request"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["customer_request_id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_customer_request"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "customer_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
      v_unified_pickup_status: {
        Row: {
          actual_pickup_date: string | null
          assigned_driver_id: string | null
          car_brand: string | null
          car_model: string | null
          car_registration_number: string | null
          car_year: number | null
          completion_photos: string[] | null
          contact_phone: string | null
          current_status: string | null
          customer_request_id: string | null
          driver_name: string | null
          driver_notes: string | null
          estimated_value: number | null
          final_price: number | null
          owner_name: string | null
          pickup_address: string | null
          pickup_created_at: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          pickup_order_id: string | null
          pickup_postal_code: string | null
          pickup_updated_at: string | null
          quote_amount: number | null
          request_created_at: string | null
          scheduled_pickup_date: string | null
          scrapyard_id: number | null
          tenant_id: number | null
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
            foreignKeyName: "fk_customer_requests_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["car_registration_number"]
          },
          {
            foreignKeyName: "fk_customer_requests_registration"
            columns: ["car_registration_number"]
            isOneToOne: false
            referencedRelation: "car_registrations"
            referencedColumns: ["car_registration_number"]
          },
          {
            foreignKeyName: "fk_pickup_orders_customer_request"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "car_complete_view"
            referencedColumns: ["customer_request_id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_customer_request"
            columns: ["customer_request_id"]
            isOneToOne: false
            referencedRelation: "customer_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "scrapyard_invoice_summaries"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "fk_pickup_orders_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenants_id"]
          },
        ]
      }
    }
    Functions: {
      _driver_status_to_enum: {
        Args: { p: string }
        Returns: Database["public"]["Enums"]["driver_status"]
      }
      _is_assignment_active_text: {
        Args: {
          p_completed_at: string
          p_is_active: boolean
          p_status_text: string
        }
        Returns: boolean
      }
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
        Returns: string
      }
      assign_driver_to_pickup: {
        Args: {
          p_driver_id: string
          p_notes?: string
          p_pickup_order_id: string
        }
        Returns: string
      }
      assign_tenant_admin_role: {
        Args:
          | { p_scrapyard_id: number; p_tenant_id: number; p_user_id: string }
          | { p_tenant_id: number; p_user_id: string }
        Returns: Json
      }
      assign_user_to_scrapyard: {
        Args: { p_role: string; p_scrapyard_id: number; p_user_id: string }
        Returns: undefined
      }
      belongs_to_scrapyard: {
        Args: { scrapyard_id: number }
        Returns: boolean
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      calculate_car_price_with_bonuses: {
        Args: {
          p_car_brand?: string
          p_car_year: number
          p_fuel_type?: string
          p_pickup_distance_km?: number
          p_postal_code?: string
          p_service_type?: string
          p_tenant_id: number
          p_valuable_parts?: string[]
          p_vehicle_condition?: string
        }
        Returns: Json
      }
      calculate_distance: {
        Args:
          | { lat1: number; lat2: number; lon1: number; lon2: number }
          | { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      calculate_distance_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calculate_invoice_totals: {
        Args: { p_invoice_id: number }
        Returns: {
          tax_amount: number
          total_amount: number
        }[]
      }
      calculate_sms_cost: {
        Args: { message_content: string }
        Returns: number
      }
      can_cancel_invoice: {
        Args: { p_invoice_id: number }
        Returns: {
          can_cancel: boolean
          days_since_creation: number
          invoice_amount: number
          invoice_date: string
          invoice_number: string
          invoice_status: string
          reason: string
          scrapyard_name: string
        }[]
      }
      cancel_invoice: {
        Args: {
          p_cancellation_reason: string
          p_cancelled_by?: string
          p_invoice_id: number
        }
        Returns: boolean
      }
      check_table_exists: {
        Args: { p_table_name: string }
        Returns: boolean
      }
      cleanup_old_driver_locations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      connect_customer_to_scrapyard: {
        Args: { p_customer_request_id: string; p_scrapyard_id: number }
        Returns: boolean
      }
      create_customer_request: {
        Args: {
          p_address?: string
          p_city?: string
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_latitude: number
          p_longitude: number
          p_postal_code?: string
          p_request_details: string
        }
        Returns: string
      }
      create_scrapyard_user: {
        Args: { p_email: string; p_role: string; p_scrapyard_id?: number }
        Returns: Json
      }
      create_scrapyard_with_admin: {
        Args: {
          p_address: string
          p_admin_user_id: string
          p_city: string
          p_contact_email: string
          p_contact_person: string
          p_contact_phone: string
          p_name: string
          p_postal_code: string
        }
        Returns: number
      }
      create_tenant_complete: {
        Args: {
          p_address?: string
          p_admin_email: string
          p_admin_name: string
          p_city?: string
          p_country: string
          p_invoice_email?: string
          p_name: string
          p_postal_code?: string
          p_service_type?: string
        }
        Returns: Json
      }
      create_tenant_complete_correct: {
        Args: {
          p_address?: string
          p_admin_email: string
          p_admin_name: string
          p_city?: string
          p_country: string
          p_invoice_email?: string
          p_name: string
          p_postal_code?: string
          p_service_type?: string
        }
        Returns: Json
      }
      create_tenant_complete_fixed: {
        Args: {
          p_address?: string
          p_admin_email: string
          p_admin_name: string
          p_city?: string
          p_country: string
          p_invoice_email?: string
          p_name: string
          p_postal_code?: string
          p_service_type?: string
        }
        Returns: Json
      }
      create_tenant_debug: {
        Args: {
          p_admin_email: string
          p_admin_name: string
          p_country: string
          p_name: string
        }
        Returns: Json
      }
      create_tenant_no_auth_check: {
        Args: {
          p_admin_email: string
          p_admin_name: string
          p_country: string
          p_name: string
        }
        Returns: Json
      }
      current_user_tenant: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      debug_lovable_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_tenant_params: {
        Args: {
          p_address?: string
          p_admin_email?: string
          p_admin_name?: string
          p_city?: string
          p_country?: string
          p_invoice_email?: string
          p_name?: string
          p_postal_code?: string
          p_service_type?: string
        }
        Returns: Json
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      driver_self_assign_pickup: {
        Args: { notes?: string; pickup_order_id: string }
        Returns: string
      }
      driver_status_history_get: {
        Args: { p_driver_id: string }
        Returns: {
          changed_by: string
          changed_by_email: string
          created_at: string
          id: string
          new_status: string
          old_status: string
          reason: string
        }[]
      }
      driver_status_history_get_v1: {
        Args: { p_driver_id: string }
        Returns: {
          changed_by: string
          changed_by_email: string
          created_at: string
          id: string
          new_status: string
          old_status: string
          reason: string
        }[]
      }
      driver_status_manager: {
        Args:
          | {
              p_changed_by?: string
              p_driver_id: string
              p_latitude?: number
              p_longitude?: number
              p_metadata?: Json
              p_new_status: string
              p_reason?: string
            }
          | { p_driver_id: string; p_new_status: string; p_reason?: string }
        Returns: string
      }
      driver_status_manager_v1: {
        Args: {
          p_create_if_missing?: boolean
          p_driver_id: string
          p_new_status: string
          p_reason?: string
        }
        Returns: string
      }
      driver_status_manager_v2: {
        Args: {
          p_create_if_missing?: boolean
          p_driver_id: string
          p_new_status: string
          p_reason?: string
          p_status_column_name?: string
        }
        Returns: string
      }
      driver_status_manager_v4: {
        Args: {
          p_create_if_missing?: boolean
          p_driver_id: string
          p_new_status: string
          p_reason?: string
          p_status_column_name?: string
        }
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
          | { column_name: string; schema_name: string; table_name: string }
          | { column_name: string; table_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      ensure_car_metadata: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      ensure_driver_status_column: {
        Args: { p_status_column_name?: string }
        Returns: boolean
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      export_all_rls: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      export_all_tables_data: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      export_security_functions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      find_nearby_scrapyards: {
        Args: {
          p_latitude: number
          p_longitude: number
          p_max_distance?: number
        }
        Returns: {
          address: string
          city: string
          distance_km: number
          id: number
          is_active: boolean
          name: string
          postal_code: string
          tenant_id: number
        }[]
      }
      find_scrapyards_by_material: {
        Args:
          | { material_name: string }
          | {
              p_latitude?: number
              p_longitude?: number
              p_material: string
              p_max_distance?: number
            }
        Returns: {
          accepted_materials: Json
          address: string
          banner_url: string
          business_hours: Json
          city: string
          created_at: string
          description: string
          email: string
          id: number
          is_active: boolean
          latitude: number
          logo_url: string
          longitude: number
          name: string
          phone: string
          rating: number
          state: string
          tenant_id: number
          total_reviews: number
          updated_at: string
          website: string
          zip_code: string
        }[]
      }
      format_full_address: {
        Args: {
          p_city?: string
          p_postal_code?: string
          p_street_address?: string
        }
        Returns: string
      }
      generate_enhanced_quote: {
        Args: {
          p_customer_request_id: string
          p_pickup_location?: string
          p_preferred_date?: string
        }
        Returns: Json
      }
      generate_invoice_number: {
        Args:
          | { p_scrapyard_id: number }
          | { p_scrapyard_id: number; p_tenant_id: number }
        Returns: string
      }
      generate_monthly_invoices_for_tenants: {
        Args: { p_billing_month: string }
        Returns: Json
      }
      generate_monthly_invoices_for_tenants_test: {
        Args: { p_billing_month: string }
        Returns: Json
      }
      generate_rls_policy_export: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_secure_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_accessible_scrapyards: {
        Args: Record<PropertyKey, never> | { p_tenant_id?: number }
        Returns: {
          address: string
          city: string
          contact_email: string
          contact_person: string
          contact_phone: string
          created_at: string
          id: number
          name: string
          postal_code: string
          role: string
          updated_at: string
        }[]
      }
      get_active_tenant_bids: {
        Args: { region_filter?: string }
        Returns: {
          bid_amount: number
          end_date: string
          position_rank: number
          region_code: string
          scrapyard_id: number
          scrapyard_name: string
        }[]
      }
      get_all_tenants: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_available_drivers_for_tenant: {
        Args: { p_tenant_id: number }
        Returns: {
          current_assignments_count: number
          driver_id: string
          driver_status: string
          email: string
          full_name: string
          is_active: boolean
          phone_number: string
          vehicle_type: string
        }[]
      }
      get_available_options: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_available_pickups_for_driver: {
        Args: { driver_auth_id: string; pickup_date?: string }
        Returns: {
          car_brand: string
          car_model: string
          car_registration_number: string
          customer_request_id: string
          distance_km: number
          final_price: number
          owner_name: string
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          pickup_order_id: string
          scheduled_pickup_date: string
        }[]
      }
      get_billing_configuration: {
        Args: { p_tenant_id?: number }
        Returns: {
          config_category: string
          config_key: string
          config_value: Json
          is_global: boolean
          version: number
        }[]
      }
      get_billing_kpi_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          change_percentage: number
          current_value: number
          metric_name: string
          previous_value: number
          trend_direction: string
        }[]
      }
      get_cancelled_invoices_report: {
        Args: {
          p_end_date?: string
          p_scrapyard_id?: number
          p_start_date?: string
        }
        Returns: {
          avg_days_before_cancellation: number
          cancellation_reasons: Json
          cancelled_by_users: Json
          most_common_reason: string
          scrapyard_id: number
          scrapyard_name: string
          total_cancelled_amount: number
          total_cancelled_invoices: number
        }[]
      }
      get_car_id_from_customer_request: {
        Args: { request_id: string }
        Returns: string
      }
      get_current_driver_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          driver_id: string
          tenant_id: number
          user_role: string
        }[]
      }
      get_current_user_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          tenant_id: number
          user_role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_customer_request_images: {
        Args: { request_id: string }
        Returns: {
          created_at: string
          file_name: string
          id: string
          image_type: string
          image_url: string
          notes: string
          uploaded_by: string
        }[]
      }
      get_driver_pickups: {
        Args: { driver_auth_id: string }
        Returns: {
          car_brand: string
          car_model: string
          car_registration_number: string
          car_year: number
          completion_photos: string[]
          created_at: string
          customer_request_id: string
          driver_notes: string
          final_price: number
          kontrollsiffror: string
          owner_address: string
          owner_name: string
          part_list: Json
          pickup_address: string
          pickup_id: string
          pickup_latitude: number
          pickup_longitude: number
          pickup_postal_code: string
          pnr_num: string
          scheduled_pickup_time: string
          status: string
        }[]
      }
      get_driver_status_history: {
        Args: { p_driver_id: string }
        Returns: {
          changed_by: string
          changed_by_email: string
          created_at: string
          id: string
          new_status: string
          old_status: string
          reason: string
        }[]
      }
      get_invoice_cancellation_history: {
        Args: { p_invoice_id: number }
        Returns: {
          cancellation_id: number
          cancelled_at: string
          cancelled_by_email: string
          invoice_amount: number
          invoice_id: number
          previous_status: string
          reason: string
          scrapyard_name: string
        }[]
      }
      get_monthly_billing_overview: {
        Args: { p_billing_month?: string }
        Returns: Json
      }
      get_monthly_billing_overview_test: {
        Args: { p_billing_month?: string }
        Returns: Json
      }
      get_my_requests: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_platform_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_pricing_settings: {
        Args: { p_tenant_id: number }
        Returns: Json
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_request_trends_analytics: {
        Args: { days_back?: number }
        Returns: {
          avg_quote_amount: number
          completed_requests: number
          completion_rate: number
          pending_requests: number
          period_end: string
          period_start: string
          request_count: number
        }[]
      }
      get_scrapyard_analytics: {
        Args:
          | {
              end_date_param: string
              scrapyard_id_param: number
              start_date_param: string
            }
          | { p_end_date?: string; p_start_date?: string; p_tenant_id?: number }
          | { scrapyard_id_param: number }
        Returns: {
          avg_processing_time_hours: number
          busiest_day_of_week: string
          busiest_hour_of_day: number
          cancelled_requests: number
          completed_requests: number
          completion_rate: number
          in_progress_requests: number
          most_common_material: string
          scrapyard_id: number
          scrapyard_name: string
          tenant_id: number
          tenant_name: string
          total_requests: number
          total_revenue: number
        }[]
      }
      get_scrapyard_dashboard: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_scrapyard_details: {
        Args: { p_scrapyard_id: number }
        Returns: {
          active_requests: number
          address: string
          availability_status: string
          city: string
          closing_time: string
          contact_email: string
          contact_person: string
          contact_phone: string
          id: number
          latitude: number
          longitude: number
          materials_accepted: Json
          max_capacity: number
          name: string
          opening_time: string
          operating_days: string[]
          postal_code: string
          rating: number
          remaining_capacity: number
          review_count: number
          services: Json
          tenant_name: string
        }[]
      }
      get_scrapyard_details_extended: {
        Args: { p_scrapyard_id: number }
        Returns: {
          active_requests: number
          address: string
          availability_status: string
          city: string
          closing_time: string
          contact_email: string
          contact_person: string
          contact_phone: string
          id: number
          latitude: number
          longitude: number
          materials_accepted: Json
          max_capacity: number
          name: string
          opening_time: string
          operating_days: string[]
          postal_code: string
          remaining_capacity: number
          services: Json
          tenant_name: string
        }[]
      }
      get_scrapyard_invoice_stats: {
        Args: {
          p_end_date?: string
          p_scrapyard_id: number
          p_start_date?: string
        }
        Returns: {
          avg_days_to_payment: number
          overdue_amount: number
          overdue_invoices: number
          paid_amount: number
          paid_invoices: number
          pending_amount: number
          pending_invoices: number
          total_amount: number
          total_invoices: number
        }[]
      }
      get_scrapyard_requests: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_scrapyard_tenant_id: {
        Args: { p_scrapyard_id: number }
        Returns: number
      }
      get_scrapyard_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_service_utilization_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_units: number
          avg_capacity_per_unit: number
          service_type: string
          total_capacity: number
          utilization_rate: number
        }[]
      }
      get_tenant_performance_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_drivers: number
          request_count: number
          service_type: string
          tenant_id: number
          tenant_name: string
          total_capacity_kg: number
        }[]
      }
      get_unassigned_pickup_orders: {
        Args: { p_limit?: number; p_tenant_id: number }
        Returns: {
          car_brand: string
          car_model: string
          car_registration_number: string
          car_year: number
          created_at: string
          customer_request_id: string
          final_price: number
          owner_name: string
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          pickup_order_id: string
          scheduled_pickup_date: string
          status: string
        }[]
      }
      get_user_context: {
        Args: Record<PropertyKey, never>
        Returns: {
          is_customer: boolean
          is_driver: boolean
          is_scrapyard_admin: boolean
          is_super_admin: boolean
          role: string
          scrapyard_id: number
          user_id: string
        }[]
      }
      get_user_role_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_scrapyard_ids: {
        Args: Record<PropertyKey, never>
        Returns: number[]
      }
      get_user_tenant_id_safe: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      insert_customer_car_image: {
        Args: {
          p_customer_request_id: string
          p_file_name?: string
          p_file_size?: number
          p_image_type: string
          p_image_url: string
          p_notes?: string
        }
        Returns: string
      }
      is_assigned_driver: {
        Args: { pickup_order_uuid: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_bypass: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_safe: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      list_available_pickup_requests: {
        Args: { p_driver_id: string; p_limit?: number }
        Returns: {
          car_brand: string
          car_model: string
          car_year: number
          customer_request_id: string
          owner_name: string
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          pickup_order_id: string
          scheduled_pickup_date: string
          status: string
        }[]
      }
      list_scrapyards_for_current_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          name: string
          tenant_id: number
        }[]
      }
      longtransactionsenabled: {
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
      parse_address: {
        Args: { p_combined_address: string }
        Returns: {
          city: string
          postal_code: string
          street_address: string
        }[]
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: number
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      record_customer_payment: {
        Args: {
          p_amount: number
          p_car_id: string
          p_customer_id?: string
          p_driver_id: string
          p_payment_method?: string
          p_pickup_order_id?: string
        }
        Returns: string
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
      save_pricing_settings: {
        Args: { p_pricing_settings: Json; p_tenant_id: number }
        Returns: Json
      }
      send_test_sms: {
        Args: {
          p_customer_name?: string
          p_phone?: string
          p_tenant_id: number
          p_trigger_event: string
        }
        Returns: Json
      }
      send_test_sms_working: {
        Args: {
          p_customer_name?: string
          p_phone?: string
          p_tenant_id: number
          p_trigger_event: string
        }
        Returns: Json
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { format?: string; geom: unknown }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; rel?: number }
          | { geom: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; options?: string; radius: number }
          | { geom: unknown; quadsegs: number; radius: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { dm?: number; dx: number; dy: number; dz?: number; geom: unknown }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { font?: Json; letters: string }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { from_proj: string; geom: unknown; to_proj: string }
          | { from_proj: string; geom: unknown; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      submit_customer_request: {
        Args: {
          p_car_brand: string
          p_car_model: string
          p_car_registration_number: string
          p_owner_address: string
          p_owner_name: string
          p_pickup_address: string
          p_pickup_postal_code: string
        }
        Returns: Json
      }
      test_driver_status_manager: {
        Args: { p_driver_id: string; p_new_status: string; p_reason?: string }
        Returns: {
          current_status: string
          driver_id: string
          reason: string
          would_change: boolean
          would_change_to: string
        }[]
      }
      test_update_pickup_status_committed: {
        Args: {
          p_completion_photos?: string[]
          p_driver_notes?: string
          p_new_status: string
          p_pickup_order_id: string
          p_test_driver_id?: string
        }
        Returns: boolean
      }
      test_update_pickup_status_unified: {
        Args: {
          p_completion_photos?: string[]
          p_driver_notes?: string
          p_new_status: string
          p_pickup_order_id: string
          p_test_driver_id?: string
        }
        Returns: boolean
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      update_assignment_status: {
        Args: {
          assignment_id_param: string
          new_status: Database["public"]["Enums"]["assignment_status"]
        }
        Returns: boolean
      }
      update_billing_configuration: {
        Args: {
          p_config_category: string
          p_config_key: string
          p_config_value: Json
          p_current_version?: number
          p_tenant_id: number
        }
        Returns: {
          error_message: string
          new_version: number
          success: boolean
        }[]
      }
      update_driver_status: {
        Args: { new_driver_status: string; reason_param?: string }
        Returns: Json
      }
      update_driver_status_admin: {
        Args: { p_driver_id: string; p_new_status: string; p_reason?: string }
        Returns: undefined
      }
      update_driver_status_admin_enum: {
        Args: {
          available_from_param?: string
          driver_id_param: string
          new_status: Database["public"]["Enums"]["driver_status"]
          source_param?: string
        }
        Returns: boolean
      }
      update_driver_status_for_auth: {
        Args: {
          driver_auth_id?: string
          new_driver_status: string
          reason_param?: string
        }
        Returns: boolean
      }
      update_driver_status_with_location: {
        Args: {
          p_changed_by?: string
          p_driver_id: string
          p_latitude?: number
          p_longitude?: number
          p_metadata?: Json
          p_new_status: string
          p_reason?: string
        }
        Returns: boolean
      }
      update_pickup_status: {
        Args: {
          completion_photos_param?: string[]
          driver_auth_id?: string
          driver_notes_param?: string
          new_status: string
          pickup_id: string
        }
        Returns: boolean
      }
      update_pickup_status_simple: {
        Args: {
          completion_photos_param?: string[]
          driver_notes_param?: string
          new_status: string
          pickup_id: string
        }
        Returns: boolean
      }
      update_pickup_status_unified: {
        Args: {
          p_completion_photos?: string[]
          p_driver_notes?: string
          p_new_status: string
          p_pickup_order_id: string
        }
        Returns: Json
      }
      update_pickup_status_yesterday_workflow: {
        Args: {
          p_completion_photos?: string[]
          p_driver_notes?: string
          p_new_status: string
          p_pickup_order_id: string
          p_test_driver_id?: string
        }
        Returns: boolean
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      validate_billing_config_json: {
        Args:
          | { config_category: string; config_key: string; config_value: Json }
          | { config_category: string; config_value: Json }
        Returns: boolean
      }
      validate_swedish_pnr: {
        Args: { pnr_input: string }
        Returns: boolean
      }
      whoami: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: string
          tenant_id: number
          user_id: string
        }[]
      }
    }
    Enums: {
      assignment_status:
        | "scheduled"
        | "en_route"
        | "arrived"
        | "picked_up"
        | "completed"
        | "canceled"
        | "failed"
        | "in_progress"
        | "pending"
        | "assigned"
      car_status: "new" | "ongoing" | "done" | "error" | "archive" | "deleted"
      driver_status:
        | "off_duty"
        | "available"
        | "on_job"
        | "break"
        | "inactive"
        | "busy"
        | "offline"
      treatment_type: "pickup" | "drivein"
      user_role:
        | "super_admin"
        | "tenant_admin"
        | "user"
        | "customer"
        | "driver"
        | "scrapyard_admin"
        | "scrapyard_staff"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
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
      assignment_status: [
        "scheduled",
        "en_route",
        "arrived",
        "picked_up",
        "completed",
        "canceled",
        "failed",
        "in_progress",
        "pending",
        "assigned",
      ],
      car_status: ["new", "ongoing", "done", "error", "archive", "deleted"],
      driver_status: [
        "off_duty",
        "available",
        "on_job",
        "break",
        "inactive",
        "busy",
        "offline",
      ],
      treatment_type: ["pickup", "drivein"],
      user_role: [
        "super_admin",
        "tenant_admin",
        "user",
        "customer",
        "driver",
        "scrapyard_admin",
        "scrapyard_staff",
      ],
    },
  },
} as const
