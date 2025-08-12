
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

export interface TenantCustomer {
  customer_id: string;
  tenant_id: number;
  scrapyard_id: number | null;
  car_id: string;
  license_plate: string | null;
  brand: string | null;
  model: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string | null;
  masked_pnr: string | null;
}

interface UseTenantCustomersOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useTenantCustomers({ search = '', page = 1, pageSize = 10 }: UseTenantCustomersOptions = {}) {
  const { isAuth } = useSupabaseSession();

  return useQuery({
    queryKey: ['tenant-customers', { search, page, pageSize, isAuth }],
    enabled: isAuth, // Require real Supabase session
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase
        .from('v_tenant_customers')
        // @ts-ignore - the Database type may not include this view; runtime is fine.
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      const q = search?.trim();
      if (q) {
        const like = `%${q}%`;
        // Push search down to DB for better perf
        query = query.or(
          [
            `name.ilike.${like}`,
            `email.ilike.${like}`,
            `license_plate.ilike.${like}`,
            `brand.ilike.${like}`,
            `model.ilike.${like}`,
          ].join(',')
        );
      }

      const { data, error, count } = await query;
      if (error) {
        console.error('useTenantCustomers error:', error);
        throw error;
      }
      return { rows: (data as TenantCustomer[]) ?? [], count: count ?? 0 };
    },
    meta: {
      onError: (err: unknown) => {
        console.warn('Query meta onError (tenant-customers):', err);
      }
    }
  });
}
