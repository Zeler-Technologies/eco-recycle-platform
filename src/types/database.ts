// Enhanced type definitions matching database schema
export interface DatabaseDriver {
  id: string;
  tenant_id: number;
  full_name: string;
  phone_number: string;
  email?: string;
  vehicle_registration?: string;
  vehicle_type?: string;
  driver_status: 'available' | 'busy' | 'offline' | 'break';
  current_latitude?: number;
  current_longitude?: number;
  is_active: boolean;
  scrapyard_id?: number;
  max_capacity_kg?: number;
  last_location_update?: string;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseCustomerRequest {
  id: string;
  tenant_id?: number;
  owner_name: string;
  contact_phone?: string;
  email?: string;
  pickup_address?: string;
  car_brand: string;
  car_model: string;
  car_year?: number;
  car_registration_number?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  pickup_date?: string;
  driver_id?: string;
  estimated_value?: number;
  quote_amount?: number;
  created_at: string;
  updated_at?: string;
  scrapyard_id?: number;
  pnr_num?: string;
}

export interface DatabaseUserProfile {
  id: string;
  auth_user_id: string;
  tenant_id?: number;
  scrapyard_id?: number;
  full_name: string;
  role: 'super_admin' | 'tenant_admin' | 'driver' | 'customer';
  phone_number?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  // Relations
  tenants?: {
    tenants_id: number;
    name: string;
    country: string;
  };
  scrapyards?: {
    id: number;
    name: string;
    address: string;
  };
}

export interface DatabaseTenant {
  tenants_id: number;
  name: string;
  country: string;
  service_type?: string;
  base_address?: string;
  invoice_email?: string;
  date?: string;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseScrapyard {
  id: number;
  tenant_id: number;
  name: string;
  address?: string;
  postal_code?: string;
  city?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  max_capacity?: number;
  opening_time?: string;
  closing_time?: string;
  operating_days?: string[];
  services?: any;
  materials_accepted?: any;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseAPIUsageLog {
  id: string;
  tenant_id?: number;
  service_id?: string;
  endpoint: string;
  status_code: number;
  response_time_ms: number;
  request_timestamp: string;
}

// Type-safe query result interfaces
export interface TenantWithStats extends DatabaseTenant {
  scrapyard_count?: number;
  driver_count?: number;
  request_count?: number;
  total_revenue?: number;
}

export interface DriverWithLocation extends DatabaseDriver {
  distance_km?: number;
  current_assignment?: DatabaseCustomerRequest;
}

export interface CustomerRequestWithDriver extends DatabaseCustomerRequest {
  driver?: Pick<DatabaseDriver, 'full_name' | 'phone_number' | 'vehicle_type'>;
}

// Helper for creating type-safe Supabase queries
export const createTypedQuery = <T>() => ({
  select: (query: string) => query as any,
  insert: (data: Partial<T>) => data,
  update: (data: Partial<T>) => data,
});