
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

export type TenantCustomer = {
  customer_id: string;
  tenant_id: number;
  scrapyard_id: number | null;
  car_id: string;
  license_plate: string;
  brand: string;
  model: string;
  name: string;
  phone: string | null;
  email: string | null;
  masked_pnr: string | null;
  created_at: string;
};

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
      let query: any = supabase
        .from('v_tenant_customers' as any)
        // @ts-ignore - the Database type may not include this view; runtime is fine.
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .returns<TenantCustomer[]>();

      const term = search?.trim();
      if (term) {
        const s = `%${term}%`;
        // Push search down to DB for better perf
        (query as any) = (query as any).or(
          [
            `name.ilike.${s}`,
            `email.ilike.${s}`,
            `license_plate.ilike.${s}`,
            `brand.ilike.${s}`,
            `model.ilike.${s}`,
          ].join(',')
        );
      }

      const { data, error, count } = await query;
      if (error) {
        console.error('useTenantCustomers error:', error);
        throw error;
      }
      return { rows: data ?? [], count: count ?? 0 };
    },
    meta: {
      onError: (err: unknown) => {
        console.warn('Query meta onError (tenant-customers):', err);
      }
    }
  });
}
