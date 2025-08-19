import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TenantUser = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string | null;
  pnr_num: string | null;
  pnr_num_norm: string | null;
  first_name: string | null;
  last_name: string | null;
};

export function useTenantUsers(tenantId: number | null) {
  return useQuery({
    queryKey: ['tenant-users', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return [];
      
      console.log(`Fetching users for tenant_id: ${tenantId}`);
      
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tenant users:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} users for tenant_id: ${tenantId}`, data);
      return data as TenantUser[];
    },
  });
}