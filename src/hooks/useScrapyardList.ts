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

// Function to generate dummy tenants if only one exists
const generateDummyTenants = async (vehicleLocation: VehicleAddress) => {
  const dummyTenants = [
    {
      name: 'Bil & Skrot AB',
      country: 'Sweden',
      service_type: 'car_recycling',
      base_address: 'Industrivägen 15, 12345 Teststad',
      latitude: vehicleLocation.latitude + 0.5,
      longitude: vehicleLocation.longitude + 0.3,
    },
    {
      name: 'Återvinning Nord',
      country: 'Sweden', 
      service_type: 'car_recycling',
      base_address: 'Recycling Road 42, 67890 Mockville',
      latitude: vehicleLocation.latitude - 0.3,
      longitude: vehicleLocation.longitude - 0.2,
    },
  ];

  for (const tenant of dummyTenants) {
    const { error } = await supabase
      .from('tenants')
      .insert({
        ...tenant,
        date: new Date().toISOString().split('T')[0],
      });
    
    if (error) {
      console.error('Error inserting dummy tenant:', error);
    }
  }
};

export const useScrapyardList = (registrationNumber: string) => {
  const [scrapyards, setScrapyards] = useState<Scrapyard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScrapyard, setSelectedScrapyard] = useState<Scrapyard | null>(null);

  useEffect(() => {
    if (!registrationNumber) return;

    const fetchScrapyards = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Get vehicle address
        const vehicleLocation = await mockGetVehicleAddress(registrationNumber);

        // 2. Check how many tenants exist
        const { data: existingTenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('*');

        if (tenantsError) {
          throw new Error('Failed to fetch tenants');
        }

        // 3. If only one tenant exists, generate dummy ones
        if (existingTenants && existingTenants.length === 1) {
          await generateDummyTenants(vehicleLocation);
        }

        // 4. Get nearby scrapyards with distance calculation
        const { data: nearbyScrapyards, error: scrapyardsError } = await supabase
          .rpc('find_nearby_scrapyards', {
            p_latitude: vehicleLocation.latitude,
            p_longitude: vehicleLocation.longitude,
            p_max_distance: 100
          });

        if (scrapyardsError) {
          throw new Error('Failed to fetch nearby scrapyards');
        }

        // 5. Get active bidding data
        const { data: activeBids, error: bidsError } = await supabase
          .rpc('get_active_tenant_bids');

        if (bidsError) {
          console.warn('Failed to fetch bidding data:', bidsError);
        }

        // 6. Combine and sort data
        const scrapyardsWithBids = (nearbyScrapyards || []).map((scrapyard: any) => {
          const bid = activeBids?.find((b: any) => b.scrapyard_id === scrapyard.id);
          return {
            id: scrapyard.id,
            name: scrapyard.name,
            address: scrapyard.address,
            postal_code: scrapyard.postal_code,
            city: scrapyard.city,
            distance_km: scrapyard.distance_km,
            bid_amount: bid?.bid_amount,
            is_premium: !!bid,
          };
        });

        // 7. Sort by bidding position first, then by distance
        const sortedScrapyards = scrapyardsWithBids.sort((a, b) => {
          // Premium (bidding) partners first
          if (a.is_premium && !b.is_premium) return -1;
          if (!a.is_premium && b.is_premium) return 1;
          
          // If both have bids, sort by bid amount (highest first)
          if (a.bid_amount && b.bid_amount) {
            return b.bid_amount - a.bid_amount;
          }
          
          // Otherwise sort by distance (closest first)
          return a.distance_km - b.distance_km;
        });

        setScrapyards(sortedScrapyards);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchScrapyards();
  }, [registrationNumber]);

  return {
    scrapyards,
    loading,
    error,
    selectedScrapyard,
    setSelectedScrapyard,
  };
};
