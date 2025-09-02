import React, { useState } from 'react';
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

interface PostalCode {
  id: string;
  postal_code: string;
  city: string;
  region: string | null;
  country: string;
}

interface SelectedPostalCode {
  postal_code_id: string;
  postal_codes_master: PostalCode;
}

const PostalCodeSelector = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
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

  // Fetch available postal codes for tenant's country
  const { data: availablePostalCodes = [], isLoading: loadingAvailable } = useQuery({
    queryKey: ['available-postal-codes', userTenant?.tenants?.country, searchTerm, selectedRegion],
    enabled: !!userTenant?.tenants?.country,
    queryFn: async () => {
      let query = supabase
        .from('postal_codes_master')
        .select('*')
        .eq('country', userTenant.tenants.country)
        .eq('is_active', true)
        .order('postal_code');

      if (searchTerm) {
        query = query.or(`postal_code.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
      }

      if (selectedRegion) {
        query = query.eq('region', selectedRegion);
      }

      const { data, error } = await query;
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
          postal_codes_master(*)
        `)
        .eq('tenant_id', userTenant.tenant_id)
        .eq('is_active', true);

      if (error) throw error;
      return data as SelectedPostalCode[];
    },
  });

  // Get unique regions for filtering
  const regions = React.useMemo(() => {
    const regionSet = new Set<string>();
    availablePostalCodes.forEach(pc => {
      if (pc.region) regionSet.add(pc.region);
    });
    return Array.from(regionSet).sort();
  }, [availablePostalCodes]);

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
      const regionPostalCodes = availablePostalCodes.filter(pc => pc.region === region);
      
      if (isSelected) {
        // Add all postal codes in region
        const inserts = regionPostalCodes.map(pc => ({
          tenant_id: userTenant?.tenant_id,
          postal_code_id: pc.id
        }));
        const { error } = await supabase
          .from('tenant_coverage_areas')
          .upsert(inserts, { onConflict: 'tenant_id,postal_code_id' });
        if (error) throw error;
      } else {
        // Remove all postal codes in region
        const postalCodeIds = regionPostalCodes.map(pc => pc.id);
        const { error } = await supabase
          .from('tenant_coverage_areas')
          .delete()
          .eq('tenant_id', userTenant?.tenant_id)
          .in('postal_code_id', postalCodeIds);
        if (error) throw error;
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
      toast({
        title: "Fel vid regionuppdatering",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isPostalCodeSelected = (postalCodeId: string) => {
    return selectedPostalCodes.some(spc => spc.postal_code_id === postalCodeId);
  };

  const isRegionSelected = (region: string) => {
    const regionPostalCodes = availablePostalCodes.filter(pc => pc.region === region);
    const selectedPostalCodeIds = selectedPostalCodes.map(spc => spc.postal_code_id);
    return regionPostalCodes.every(pc => selectedPostalCodeIds.includes(pc.id));
  };

  const getRegionProgress = (region: string) => {
    const regionPostalCodes = availablePostalCodes.filter(pc => pc.region === region);
    const selectedPostalCodeIds = selectedPostalCodes.map(spc => spc.postal_code_id);
    const selectedCount = regionPostalCodes.filter(pc => selectedPostalCodeIds.includes(pc.id)).length;
    return {
      selected: selectedCount,
      total: regionPostalCodes.length,
      percentage: regionPostalCodes.length > 0 ? (selectedCount / regionPostalCodes.length) * 100 : 0
    };
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter & Sök</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">Sök postnummer eller stad</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Sök..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Filter efter region</Label>
              <div className="space-y-2 mt-2">
                <Button
                  variant={selectedRegion === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRegion(null)}
                  className="w-full justify-start"
                >
                  Alla regioner
                </Button>
                {regions.map((region) => {
                  const progress = getRegionProgress(region);
                  const isSelected = isRegionSelected(region);
                  
                  return (
                    <div key={region} className="space-y-1">
                      <Button
                        variant={selectedRegion === region ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedRegion(region === selectedRegion ? null : region)}
                        className="w-full justify-start"
                      >
                        {region}
                        <Badge variant="outline" className="ml-auto">
                          {progress.selected}/{progress.total}
                        </Badge>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRegion.mutate({ region, isSelected: !isSelected })}
                        disabled={toggleRegion.isPending}
                        className="w-full text-xs"
                      >
                        {isSelected ? (
                          <>
                            <Minus className="h-3 w-3 mr-1" />
                            Ta bort alla
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Välj alla
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Postal Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tillgängliga postnummer</CardTitle>
            <CardDescription>
              {loadingAvailable ? 'Laddar...' : `${availablePostalCodes.length} postnummer funna`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {availablePostalCodes.map((pc) => {
                  const isSelected = isPostalCodeSelected(pc.id);
                  
                  return (
                    <div
                      key={pc.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => togglePostalCode.mutate({ 
                        postalCodeId: pc.id, 
                        isSelected: !isSelected 
                      })}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}}
                        className="pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pc.postal_code}</span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{pc.city}</p>
                        {pc.region && (
                          <p className="text-xs text-muted-foreground">{pc.region}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
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