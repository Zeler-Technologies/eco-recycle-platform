import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Search, MapPin, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ChunkedPostalCodeList from './ChunkedPostalCodeList';
import BulkSelectionControls from './BulkSelectionControls';
import SmartPostalCodeFilter from './SmartPostalCodeFilter';

interface PostalCode {
  id: string;
  postal_code: string;
  city: string;
  region: string | null;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface SelectedPostalCode {
  postal_code_id: string;
  postal_codes_master: PostalCode;
}

const PostalCodeSelector = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [filteredPostalCodes, setFilteredPostalCodes] = useState<PostalCode[]>([]);
  const { session } = useSupabaseSession();
  const queryClient = useQueryClient();


  // Get current user's tenant info
  const { data: userTenant } = useQuery({
    queryKey: ['user-tenant'],
    enabled: !!session?.user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_users')
        .select('tenant_id, tenants(country)')
        .eq('id', session?.user?.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch ALL postal codes for tenant's country (no filtering here for performance)
  const { data: availablePostalCodes = [], isLoading: loadingAvailable } = useQuery({
    queryKey: ['available-postal-codes', userTenant?.tenants?.country],
    enabled: !!userTenant?.tenants?.country,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('postal_codes_master')
        .select('id, postal_code, city, region, country')
        .eq('country', userTenant.tenants.country)
        .eq('is_active', true)
        .order('postal_code');

      if (error) throw error;
      return data as PostalCode[];
    },
  });

  // Fetch current tenant selections
  const { data: selectedPostalCodes = [], isLoading: loadingSelected } = useQuery({
    queryKey: ['tenant-selected-postal-codes', userTenant?.tenant_id],
    enabled: !!userTenant?.tenant_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_coverage_areas')
        .select(`
          postal_code_id,
          postal_codes_master(id, postal_code, city, region, country)
        `)
        .eq('tenant_id', userTenant.tenant_id)
        .eq('is_active', true);

      if (error) throw error;
      return data as SelectedPostalCode[];
    },
  });

  // Use Set for O(1) lookups instead of array operations
  const selectedCodesSet = useMemo(() => {
    return new Set(selectedPostalCodes.map(spc => spc.postal_code_id));
  }, [selectedPostalCodes]);

  // Get unique regions for filtering
  const regions = React.useMemo(() => {
    const regionSet = new Set<string>();
    availablePostalCodes.forEach(pc => {
      if (pc.region) regionSet.add(pc.region);
    });
    return Array.from(regionSet).sort();
  }, [availablePostalCodes]);

  // Optimized bulk operations
  const bulkSelect = useCallback(async (type: string, config?: any) => {
    if (!userTenant?.tenant_id) return;
    
    let targetCodes: PostalCode[] = [];
    
    switch (type) {
      case 'coordinates':
        targetCodes = filteredPostalCodes.filter(pc => pc.latitude && pc.longitude);
        break;
      case 'major_cities':
        const majorCities = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro'];
        targetCodes = filteredPostalCodes.filter(pc => 
          majorCities.some(city => pc.city.toLowerCase().includes(city.toLowerCase()))
        );
        break;
      case 'range':
        if (config?.start && config?.end) {
          const start = parseInt(config.start);
          const end = parseInt(config.end);
          targetCodes = filteredPostalCodes.filter(pc => {
            const codeNum = parseInt(pc.postal_code);
            return codeNum >= start && codeNum <= end;
          });
        }
        break;
      case 'region':
        targetCodes = filteredPostalCodes.filter(pc => pc.region === config);
        break;
      default:
        return;
    }
    
    if (targetCodes.length === 0) return;
    
    try {
      const inserts = targetCodes
        .filter(pc => !selectedCodesSet.has(pc.id))
        .map(pc => ({
          tenant_id: userTenant.tenant_id,
          postal_code_id: pc.id
        }));
      
      if (inserts.length === 0) return;
      
      // Batch insert
      const batchSize = 100;
      for (let i = 0; i < inserts.length; i += batchSize) {
        const batch = inserts.slice(i, i + batchSize);
        const { error } = await supabase
          .from('tenant_coverage_areas')
          .upsert(batch, { onConflict: 'tenant_id,postal_code_id' });
        if (error) throw error;
      }
      
      toast({
        title: "Bulk-val slutfört",
        description: `${inserts.length} postnummer tillagda.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
    } catch (error) {
      toast({
        title: "Fel vid bulk-val",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [filteredPostalCodes, selectedCodesSet, userTenant?.tenant_id, queryClient]);

  const bulkDeselect = useCallback(async (codeIds: string[]) => {
    if (!userTenant?.tenant_id || codeIds.length === 0) return;
    
    try {
      // Delete in batches
      for (const codeId of codeIds) {
        const { error } = await supabase
          .from('tenant_coverage_areas')
          .delete()
          .eq('tenant_id', userTenant.tenant_id)
          .eq('postal_code_id', codeId);
        if (error) throw error;
      }
      
      toast({
        title: "Bulk-borttagning slutförd",
        description: `${codeIds.length} postnummer borttagna.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
    } catch (error) {
      toast({
        title: "Fel vid bulk-borttagning",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [userTenant?.tenant_id, queryClient]);

  const selectAll = useCallback(async () => {
    if (!userTenant?.tenant_id) return;
    
    const unselectedCodes = filteredPostalCodes.filter(pc => !selectedCodesSet.has(pc.id));
    
    if (unselectedCodes.length === 0) {
      toast({
        title: "Alla synliga postnummer redan valda",
        description: "Det finns inga fler postnummer att välja i den aktuella vyn.",
      });
      return;
    }
    
    try {
      const inserts = unselectedCodes.map(pc => ({
        tenant_id: userTenant.tenant_id,
        postal_code_id: pc.id
      }));
      
      // Batch insert
      const batchSize = 100;
      for (let i = 0; i < inserts.length; i += batchSize) {
        const batch = inserts.slice(i, i + batchSize);
        const { error } = await supabase
          .from('tenant_coverage_areas')
          .upsert(batch, { onConflict: 'tenant_id,postal_code_id' });
        if (error) throw error;
      }
      
      toast({
        title: "Alla synliga postnummer valda",
        description: `${inserts.length} postnummer har lagts till i ditt täckningsområde.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
    } catch (error) {
      toast({
        title: "Fel vid val av alla",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [filteredPostalCodes, selectedCodesSet, userTenant?.tenant_id, queryClient]);

  const deselectAll = useCallback(async () => {
    if (!userTenant?.tenant_id) return;
    
    // Get only the filtered postal codes that are currently selected
    const visibleSelectedCodes = filteredPostalCodes.filter(pc => selectedCodesSet.has(pc.id));
    
    if (visibleSelectedCodes.length === 0) {
      toast({
        title: "Inga postnummer att ta bort",
        description: "Det finns inga valda postnummer i den aktuella vyn.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Remove only the visible selected postal codes
      for (const pc of visibleSelectedCodes) {
        const { error } = await supabase
          .from('tenant_coverage_areas')
          .delete()
          .eq('tenant_id', userTenant.tenant_id)
          .eq('postal_code_id', pc.id);
        if (error) throw error;
      }
      
      toast({
        title: "Synliga postnummer borttagna",
        description: `${visibleSelectedCodes.length} postnummer har tagits bort från ditt täckningsområde.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
    } catch (error) {
      toast({
        title: "Fel vid borttagning",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [filteredPostalCodes, selectedCodesSet, userTenant?.tenant_id, queryClient]);

  // Toggle postal code selection
  const togglePostalCode = useMutation({
    mutationFn: async ({ postalCodeId, isSelected }: { postalCodeId: string; isSelected: boolean }) => {
      if (isSelected) {
        const { error } = await supabase
          .from('tenant_coverage_areas')
          .insert({
            tenant_id: userTenant?.tenant_id,
            postal_code_id: postalCodeId
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenant_coverage_areas')
          .delete()
          .eq('tenant_id', userTenant?.tenant_id)
          .eq('postal_code_id', postalCodeId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { isSelected }) => {
      toast({
        title: isSelected ? "Postnummer tillagt" : "Postnummer borttaget",
        description: isSelected 
          ? "Postnumret har lagts till i ditt täckningsområde." 
          : "Postnumret har tagits bort från ditt täckningsområde.",
      });
      queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
    },
    onError: (error) => {
      toast({
        title: "Fel vid uppdatering",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk operations
  const toggleRegion = useMutation({
    mutationFn: async ({ region, isSelected }: { region: string; isSelected: boolean }) => {
      if (!userTenant?.tenant_id) {
        throw new Error('Tenant ID saknas');
      }

      const regionPostalCodes = availablePostalCodes.filter(pc => pc.region === region);
      
      if (regionPostalCodes.length === 0) {
        throw new Error(`Inga postnummer hittades för regionen ${region}`);
      }
      
      try {
        if (isSelected) {
          // Add all postal codes in region
          const inserts = regionPostalCodes.map(pc => ({
            tenant_id: userTenant.tenant_id,
            postal_code_id: pc.id
          }));
          
          // Use smaller batches to avoid URL length issues
          const batchSize = 100;
          for (let i = 0; i < inserts.length; i += batchSize) {
            const batch = inserts.slice(i, i + batchSize);
            const { error } = await supabase
              .from('tenant_coverage_areas')
              .upsert(batch, { onConflict: 'tenant_id,postal_code_id' });
            if (error) throw error;
          }
        } else {
          // Remove all postal codes in region - use individual deletes to avoid .in() issues
          for (const pc of regionPostalCodes) {
            const { error } = await supabase
              .from('tenant_coverage_areas')
              .delete()
              .eq('tenant_id', userTenant.tenant_id)
              .eq('postal_code_id', pc.id);
            if (error) throw error;
          }
        }
      } catch (error) {
        console.error('Database operation failed:', error);
        throw new Error(`Databasoperation misslyckades: ${error.message}`);
      }
    },
    onSuccess: (_, { region, isSelected }) => {
      toast({
        title: isSelected ? "Region tillagd" : "Region borttagen",
        description: `Alla postnummer i ${region} har ${isSelected ? 'lagts till' : 'tagits bort'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
    },
    onError: (error) => {
      console.error('toggleRegion error:', error);
      toast({
        title: "Fel vid regionuppdatering",
        description: error.message || "Ett oväntat fel inträffade",
        variant: "destructive",
      });
    },
  });

  const isPostalCodeSelected = (postalCodeId: string) => {
    return selectedCodesSet.has(postalCodeId);
  };

  const isRegionSelected = (region: string) => {
    const regionPostalCodes = availablePostalCodes.filter(pc => pc.region === region);
    return regionPostalCodes.length > 0 && regionPostalCodes.every(pc => selectedCodesSet.has(pc.id));
  };

  const getRegionProgress = (region: string) => {
    const regionPostalCodes = availablePostalCodes.filter(pc => pc.region === region);
    const selectedCount = regionPostalCodes.filter(pc => selectedCodesSet.has(pc.id)).length;
    return {
      selected: selectedCount,
      total: regionPostalCodes.length,
      percentage: regionPostalCodes.length > 0 ? (selectedCount / regionPostalCodes.length) * 100 : 0
    };
  };

  // Toggle individual postal code
  const handleTogglePostalCode = useCallback((postalCodeId: string, isSelected: boolean) => {
    togglePostalCode.mutate({ postalCodeId, isSelected });
  }, [togglePostalCode]);

  if (!userTenant) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Laddar användarinformation...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Täckningsområden</h2>
        <p className="text-muted-foreground">
          Välj vilka postnummer ditt företag betjänar. Endast fordon från dessa områden kommer att visas i era förfrågningar.
        </p>
      </div>

      {/* Smart Filtering */}
      <SmartPostalCodeFilter
        allPostalCodes={availablePostalCodes}
        selectedCodes={selectedCodesSet}
        onFilteredResults={setFilteredPostalCodes}
      />

      {/* Bulk Selection Controls */}
      <BulkSelectionControls
        filteredPostalCodes={filteredPostalCodes}
        selectedCodes={selectedCodesSet}
        onBulkSelect={bulkSelect}
        onBulkDeselect={bulkDeselect}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Postal Codes - Virtualized */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tillgängliga postnummer</CardTitle>
            <CardDescription>
              {loadingAvailable ? 'Laddar...' : `${filteredPostalCodes.length} av ${availablePostalCodes.length} postnummer`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChunkedPostalCodeList
              postalCodes={filteredPostalCodes}
              selectedCodes={selectedCodesSet}
              onToggle={handleTogglePostalCode}
              height={500}
              isLoading={loadingAvailable}
            />
          </CardContent>
        </Card>

        {/* Selected Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valda täckningsområden</CardTitle>
            <CardDescription>
              {selectedPostalCodes.length} postnummer valda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {selectedPostalCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Inga postnummer valda ännu</p>
                    <p className="text-sm">Välj postnummer från listan till vänster</p>
                  </div>
                ) : (
                  selectedPostalCodes.map((spc) => {
                    const pc = spc.postal_codes_master;
                    return (
                      <div
                        key={spc.postal_code_id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{pc.postal_code}</span>
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{pc.city}</p>
                          {pc.region && (
                            <p className="text-xs text-muted-foreground">{pc.region}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePostalCode.mutate({ 
                            postalCodeId: pc.id, 
                            isSelected: false 
                          })}
                          disabled={togglePostalCode.isPending}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            
            {selectedPostalCodes.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Totalt valda:</span>
                    <Badge>{selectedPostalCodes.length} postnummer</Badge>
                  </div>
                  <div className="text-muted-foreground">
                    Alla kundförfrågningar från dessa postnummer kommer att visas i er admin-panel.
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostalCodeSelector;