import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Scrapyard {
  id: number;
  name: string;
  address: string;
  postal_code: string;
  city: string;
  distance_km: number;
  bid_amount?: number;
  is_premium?: boolean;
  tenant_id?: number;
  is_active?: boolean;
  latitude?: number;
  longitude?: number;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
}

interface VehicleAddress {
  postal_code: string;
  city: string;
  latitude: number;
  longitude: number;
}

// Mock function to get vehicle address - replace with real Transportstyrelsen API later
const mockGetVehicleAddress = async (registrationNumber: string): Promise<VehicleAddress> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data based on registration number
  const mockAddresses = {
    'ABC123': { postal_code: '11122', city: 'Stockholm', latitude: 59.3293, longitude: 18.0686 },
    'DEF456': { postal_code: '41103', city: 'Göteborg', latitude: 57.7089, longitude: 11.9746 },
    'GHI789': { postal_code: '21115', city: 'Malmö', latitude: 55.6044, longitude: 13.0038 },
  };
  
  return mockAddresses[registrationNumber as keyof typeof mockAddresses] || 
         { postal_code: '11122', city: 'Stockholm', latitude: 59.3293, longitude: 18.0686 };
};

export const useScrapyardList = (registrationNumber?: string, tenantId?: number) => {
  const [scrapyards, setScrapyards] = useState<Scrapyard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScrapyard, setSelectedScrapyard] = useState<Scrapyard | null>(null);

  useEffect(() => {
    const fetchScrapyards = async () => {
      setLoading(true);
      setError(null);

      try {
        let scrapyardsData: Scrapyard[] = [];

        if (registrationNumber) {
          // Fetch nearby scrapyards based on vehicle location
          const vehicleLocation = await mockGetVehicleAddress(registrationNumber);

          // Get nearby scrapyards using the RPC function
          const { data: nearbyScrapyards, error: scrapyardsError } = await supabase
            .rpc('find_scrapyards_by_material', {
              p_material: 'stål', // Default material
              p_latitude: vehicleLocation.latitude,
              p_longitude: vehicleLocation.longitude,
              p_max_distance: 100
            });

          if (scrapyardsError) {
            console.warn('Failed to fetch nearby scrapyards using RPC, falling back to direct query');
            
            // Fallback to direct query
            const { data: directScrapyards, error: directError } = await supabase
              .from('scrapyards')
              .select('*')
              .eq('is_active', true)
              .order('name');

            if (directError) throw directError;
            
            scrapyardsData = (directScrapyards || []).map(scrapyard => ({
              id: scrapyard.id,
              name: scrapyard.name,
              address: scrapyard.address || '',
              postal_code: scrapyard.postal_code || '',
              city: scrapyard.city || '',
              distance_km: 0, // Cannot calculate without coordinates
              tenant_id: scrapyard.tenant_id,
              is_active: scrapyard.is_active,
              latitude: scrapyard.latitude ? Number(scrapyard.latitude) : undefined,
              longitude: scrapyard.longitude ? Number(scrapyard.longitude) : undefined,
              contact_person: scrapyard.contact_person || undefined,
              contact_email: scrapyard.contact_email || undefined,
              contact_phone: scrapyard.contact_phone || undefined
            }));
          } else {
            scrapyardsData = (nearbyScrapyards || []).map((scrapyard: any) => ({
              id: scrapyard.id,
              name: scrapyard.name,
              address: scrapyard.address,
              postal_code: scrapyard.postal_code || '',
              city: scrapyard.city,
              distance_km: scrapyard.distance_km || 0,
              tenant_id: scrapyard.tenant_id,
              is_active: true
            }));
          }

          // Get active bidding data
          const { data: activeBids, error: bidsError } = await supabase
            .from('bidding_system')
            .select('*')
            .eq('is_active', true)
            .gte('bid_end_date', new Date().toISOString().split('T')[0]);

          if (!bidsError && activeBids) {
            // Add bid information to scrapyards
            scrapyardsData = scrapyardsData.map(scrapyard => {
              const bid = activeBids.find(b => b.tenant_id === scrapyard.tenant_id);
              return {
                ...scrapyard,
                bid_amount: bid?.bid_amount ? Number(bid.bid_amount) : undefined,
                is_premium: !!bid
              };
            });

            // Sort by bidding position first, then by distance
            scrapyardsData.sort((a, b) => {
              if (a.is_premium && !b.is_premium) return -1;
              if (!a.is_premium && b.is_premium) return 1;
              
              if (a.bid_amount && b.bid_amount) {
                return b.bid_amount - a.bid_amount;
              }
              
              return a.distance_km - b.distance_km;
            });
          }
        } else if (tenantId) {
          // Fetch scrapyards for a specific tenant
          const { data: tenantScrapyards, error: tenantError } = await supabase
            .from('scrapyards')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .order('name');

          if (tenantError) throw tenantError;

          scrapyardsData = (tenantScrapyards || []).map(scrapyard => ({
            id: scrapyard.id,
            name: scrapyard.name,
            address: scrapyard.address || '',
            postal_code: scrapyard.postal_code || '',
            city: scrapyard.city || '',
            distance_km: 0,
            tenant_id: scrapyard.tenant_id,
            is_active: scrapyard.is_active,
            latitude: scrapyard.latitude ? Number(scrapyard.latitude) : undefined,
            longitude: scrapyard.longitude ? Number(scrapyard.longitude) : undefined,
            contact_person: scrapyard.contact_person || undefined,
            contact_email: scrapyard.contact_email || undefined,
            contact_phone: scrapyard.contact_phone || undefined
          }));
        } else {
          // Fetch all active scrapyards
          const { data: allScrapyards, error: allError } = await supabase
            .from('scrapyards')
            .select('*')
            .eq('is_active', true)
            .order('name');

          if (allError) throw allError;

          scrapyardsData = (allScrapyards || []).map(scrapyard => ({
            id: scrapyard.id,
            name: scrapyard.name,
            address: scrapyard.address || '',
            postal_code: scrapyard.postal_code || '',
            city: scrapyard.city || '',
            distance_km: 0,
            tenant_id: scrapyard.tenant_id,
            is_active: scrapyard.is_active,
            latitude: scrapyard.latitude ? Number(scrapyard.latitude) : undefined,
            longitude: scrapyard.longitude ? Number(scrapyard.longitude) : undefined,
            contact_person: scrapyard.contact_person || undefined,
            contact_email: scrapyard.contact_email || undefined,
            contact_phone: scrapyard.contact_phone || undefined
          }));
        }

        setScrapyards(scrapyardsData);
      } catch (err) {
        console.error('Error fetching scrapyards:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setScrapyards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchScrapyards();
  }, [registrationNumber, tenantId]);

  const refreshScrapyards = () => {
    // Trigger re-fetch by changing a dependency or calling fetchScrapyards directly
    setLoading(true);
    // The useEffect will handle the refetch
  };

  return {
    scrapyards,
    loading,
    error,
    selectedScrapyard,
    setSelectedScrapyard,
    refreshScrapyards
  };
};