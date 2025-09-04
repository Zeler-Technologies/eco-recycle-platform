import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Search, MapPin, Plus, Minus, CheckCircle2, Filter, List, Map } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BulkSelectionTools from './BulkSelectionTools';

interface PostalCode {
  id: string;
  postal_code: string;
  city: string;
  region: string | null;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface SelectedPostalCode {
  postal_code_id: string;
  postal_codes_master: PostalCode;
}

interface RegionStats {
  region: string;
  total: number;
  selected: number;
  percentage: number;
}

interface CityStats {
  city: string;
  region: string;
  total: number;
  selected: number;
}

const TenantPostalCodeSelector = () => {
  const [viewMode, setViewMode] = useState<'hierarchy' | 'search'>('hierarchy');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    postalCode: '',
    city: '',
    region: '',
    hasCoordinates: null as boolean | null
  });
  
  const { session } = useAuth();
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

  // Fetch regions for the tenant's country
  const { data: regions = [] } = useQuery({
    queryKey: ['postal-regions', userTenant?.tenants?.country],
    enabled: !!userTenant?.tenants?.country,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('postal_codes_master')
        .select('region')
        .eq('country', userTenant.tenants.country)
        .eq('is_active', true)
        .not('region', 'is', null)
        .range(0, 19999) // Fetch beyond default 1,000 limit
        .order('region');
      
      if (error) throw error;
      
      // Get unique regions
      const uniqueRegions = [...new Set(data.map(item => item.region))].filter(Boolean);
      return uniqueRegions.sort();
    },
  });

  // Fetch cities for selected regions
  const { data: cities = [] } = useQuery({
    queryKey: ['postal-cities', userTenant?.tenants?.country, selectedRegions],
    enabled: !!userTenant?.tenants?.country && selectedRegions.length > 0,
    queryFn: async () => {
      let query = supabase
        .from('postal_codes_master')
        .select('city, region')
        .eq('country', userTenant.tenants.country)
        .eq('is_active', true);

      if (selectedRegions.length > 0) {
        query = query.in('region', selectedRegions);
      }

      const { data, error } = await query.limit(25000).order('city');
      if (error) throw error;
      
      // Get unique cities with their regions
      const uniqueCities = data.reduce((acc, item) => {
        const key = `${item.city}-${item.region}`;
        if (!acc.find(c => `${c.city}-${c.region}` === key)) {
          acc.push({ city: item.city, region: item.region });
        }
        return acc;
      }, [] as { city: string; region: string }[]);
      
      return uniqueCities.sort((a, b) => a.city.localeCompare(b.city));
    },
  });

  // Fetch postal codes for search view
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['postal-search', userTenant?.tenants?.country, searchFilters],
    enabled: !!userTenant?.tenants?.country && viewMode === 'search',
    queryFn: async () => {
      let query = supabase
        .from('postal_codes_master')
        .select('*')
        .eq('country', userTenant.tenants.country)
        .eq('is_active', true);

      if (searchFilters.postalCode) {
        query = query.ilike('postal_code', `%${searchFilters.postalCode}%`);
      }
      if (searchFilters.city) {
        query = query.ilike('city', `%${searchFilters.city}%`);
      }
      if (searchFilters.region) {
        query = query.ilike('region', `%${searchFilters.region}%`);
      }
      if (searchFilters.hasCoordinates !== null) {
        if (searchFilters.hasCoordinates) {
          query = query.not('latitude', 'is', null);
        } else {
          query = query.is('latitude', null);
        }
      }

      const { data, error } = await query.limit(500).order('postal_code');
      if (error) throw error;
      return data as PostalCode[];
    },
  });

  // Fetch postal codes for selected cities (hierarchy view)
  const { data: postalCodes = [] } = useQuery({
    queryKey: ['postal-codes-for-cities', userTenant?.tenants?.country, selectedCities],
    enabled: !!userTenant?.tenants?.country && selectedCities.length > 0 && viewMode === 'hierarchy',
    queryFn: async () => {
      const cityRegionPairs = selectedCities.map(cityKey => {
        const [city, region] = cityKey.split('-');
        return { city, region };
      });

      const { data, error } = await supabase
        .from('postal_codes_master')
        .select('*')
        .eq('country', userTenant.tenants.country)
        .eq('is_active', true)
        .in('city', cityRegionPairs.map(cr => cr.city))
        .limit(1000)
        .order('postal_code');

      if (error) throw error;
      return data as PostalCode[];
    },
  });

  // Fetch current tenant selections
  const { data: selectedPostalCodes = [] } = useQuery({
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

  // Calculate region statistics
  const regionStats = useMemo((): RegionStats[] => {
    if (!regions.length) return [];

    return regions.map(region => {
      const selectedIds = selectedPostalCodes.map(spc => spc.postal_code_id);
      
      // For region stats, we need to query all postal codes in the region
      // This is a simplified calculation - in production you'd want to cache this
      const selected = selectedPostalCodes.filter(spc => 
        spc.postal_codes_master.region === region
      ).length;

      return {
        region,
        total: 0, // Would need separate query to get accurate totals
        selected,
        percentage: 0
      };
    });
  }, [regions, selectedPostalCodes]);

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
    onSuccess: () => {
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

  // Bulk selection for entire region
  const selectEntireRegion = useMutation({
    mutationFn: async (region: string) => {
      // Get all postal codes in the region
      const { data: regionPostalCodes, error: fetchError } = await supabase
        .from('postal_codes_master')
        .select('id')
        .eq('country', userTenant?.tenants?.country)
        .eq('region', region)
        .eq('is_active', true)
        .limit(25000);

      if (fetchError) throw fetchError;

      // Insert all postal codes for this tenant
      const inserts = regionPostalCodes.map(pc => ({
        tenant_id: userTenant?.tenant_id,
        postal_code_id: pc.id
      }));

      const { error } = await supabase
        .from('tenant_coverage_areas')
        .upsert(inserts, { onConflict: 'tenant_id,postal_code_id' });

      if (error) throw error;
      return regionPostalCodes.length;
    },
    onSuccess: (count, region) => {
      toast({
        title: "Region tillagd",
        description: `Alla ${count} postnummer i ${region} har lagts till.`,
      });
      queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
    },
    onError: (error) => {
      toast({
        title: "Fel vid regiontillägg",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isPostalCodeSelected = (postalCodeId: string) => {
    return selectedPostalCodes.some(spc => spc.postal_code_id === postalCodeId);
  };

  const performSearch = () => {
    queryClient.invalidateQueries({ queryKey: ['postal-search'] });
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Täckningsområden</h2>
          <p className="text-muted-foreground">
            Välj postnummer för {userTenant.tenants?.country} med skalbar hierarkisk filtrering
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'hierarchy' ? 'default' : 'outline'}
            onClick={() => setViewMode('hierarchy')}
          >
            <List className="h-4 w-4 mr-2" />
            Hierarki
          </Button>
          <Button
            variant={viewMode === 'search' ? 'default' : 'outline'}
            onClick={() => setViewMode('search')}
          >
            <Search className="h-4 w-4 mr-2" />
            Avancerad sök
          </Button>
        </div>
      </div>

      {viewMode === 'hierarchy' && (
        <HierarchyView
          regions={regions}
          cities={cities}
          postalCodes={postalCodes}
          selectedRegions={selectedRegions}
          selectedCities={selectedCities}
          selectedPostalCodes={selectedPostalCodes}
          regionStats={regionStats}
          onRegionToggle={setSelectedRegions}
          onCityToggle={setSelectedCities}
          onPostalCodeToggle={togglePostalCode}
          onSelectEntireRegion={selectEntireRegion}
          isPostalCodeSelected={isPostalCodeSelected}
        />
      )}

      {viewMode === 'search' && (
        <SearchView
          searchFilters={searchFilters}
          searchResults={searchResults}
          searchLoading={searchLoading}
          selectedPostalCodes={selectedPostalCodes}
          onFiltersChange={setSearchFilters}
          onSearch={performSearch}
          onPostalCodeToggle={togglePostalCode}
          isPostalCodeSelected={isPostalCodeSelected}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SelectionSummary 
            selectedPostalCodes={selectedPostalCodes}
            country={userTenant.tenants?.country}
          />
        </div>
        <div>
          <BulkSelectionTools
            tenantId={userTenant.tenant_id}
            country={userTenant.tenants?.country || ''}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Hierarchy View Component
const HierarchyView = ({ 
  regions, cities, postalCodes, selectedRegions, selectedCities, selectedPostalCodes,
  regionStats, onRegionToggle, onCityToggle, onPostalCodeToggle, onSelectEntireRegion,
  isPostalCodeSelected 
}: any) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Step 1: Region Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Välj regioner</CardTitle>
          <CardDescription>{regions.length} regioner tillgängliga</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {regions.map((region: string) => {
                const stats = regionStats.find((rs: RegionStats) => rs.region === region);
                const isSelected = selectedRegions.includes(region);
                
                return (
                  <div key={region} className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onRegionToggle([...selectedRegions, region]);
                          } else {
                            onRegionToggle(selectedRegions.filter((r: string) => r !== region));
                          }
                        }}
                      />
                      <Label className="flex-1 cursor-pointer">{region}</Label>
                      {stats && (
                        <Badge variant="outline">{stats.selected} valda</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectEntireRegion.mutate(region)}
                      disabled={onSelectEntireRegion.isPending}
                      className="w-full text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Välj alla i {region}
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Step 2: City Selection */}
      {selectedRegions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Välj städer</CardTitle>
            <CardDescription>{cities.length} städer i valda regioner</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {cities.map((city: any) => {
                  const cityKey = `${city.city}-${city.region}`;
                  const isSelected = selectedCities.includes(cityKey);
                  
                  return (
                    <div key={cityKey} className="flex items-center space-x-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onCityToggle([...selectedCities, cityKey]);
                          } else {
                            onCityToggle(selectedCities.filter((c: string) => c !== cityKey));
                          }
                        }}
                      />
                      <Label className="flex-1 cursor-pointer">
                        {city.city}
                        <span className="text-xs text-muted-foreground ml-2">({city.region})</span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Postal Code Selection */}
      {selectedCities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Välj postnummer</CardTitle>
            <CardDescription>{postalCodes.length} postnummer i valda städer</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {postalCodes.map((pc: PostalCode) => {
                  const isSelected = isPostalCodeSelected(pc.id);
                  
                  return (
                    <div
                      key={pc.id}
                      className={`flex items-center space-x-3 p-2 border rounded cursor-pointer ${
                        isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => onPostalCodeToggle.mutate({ 
                        postalCodeId: pc.id, 
                        isSelected: !isSelected 
                      })}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1">
                        <div className="font-medium">{pc.postal_code}</div>
                        <div className="text-sm text-muted-foreground">{pc.city}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Search View Component
const SearchView = ({ 
  searchFilters, searchResults, searchLoading, selectedPostalCodes,
  onFiltersChange, onSearch, onPostalCodeToggle, isPostalCodeSelected 
}: any) => {
  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Avancerad sökning</CardTitle>
          <CardDescription>Sök och filtrera bland alla postnummer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Postnummer</Label>
              <Input
                placeholder="12345"
                value={searchFilters.postalCode}
                onChange={(e) => onFiltersChange({...searchFilters, postalCode: e.target.value})}
              />
            </div>
            <div>
              <Label>Stad</Label>
              <Input
                placeholder="Stockholm"
                value={searchFilters.city}
                onChange={(e) => onFiltersChange({...searchFilters, city: e.target.value})}
              />
            </div>
            <div>
              <Label>Region</Label>
              <Input
                placeholder="Stockholm"
                value={searchFilters.region}
                onChange={(e) => onFiltersChange({...searchFilters, region: e.target.value})}
              />
            </div>
            <div>
              <Label>Koordinater</Label>
              <Select
                value={searchFilters.hasCoordinates === null ? 'all' : searchFilters.hasCoordinates.toString()}
                onValueChange={(value) => 
                  onFiltersChange({
                    ...searchFilters, 
                    hasCoordinates: value === 'all' ? null : value === 'true'
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla</SelectItem>
                  <SelectItem value="true">Med koordinater</SelectItem>
                  <SelectItem value="false">Utan koordinater</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={onSearch} className="mt-4">
            <Search className="h-4 w-4 mr-2" />
            Sök ({searchResults.length} resultat)
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle>Sökresultat</CardTitle>
          <CardDescription>
            {searchLoading ? 'Söker...' : `${searchResults.length} postnummer (max 500 visas)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {searchResults.map((pc: PostalCode) => {
                const isSelected = isPostalCodeSelected(pc.id);
                
                return (
                  <div
                    key={pc.id}
                    className={`flex items-center space-x-3 p-3 border rounded cursor-pointer ${
                      isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onPostalCodeToggle.mutate({ 
                      postalCodeId: pc.id, 
                      isSelected: !isSelected 
                    })}
                  >
                    <Checkbox checked={isSelected} />
                    <div className="flex-1">
                      <div className="font-medium">{pc.postal_code}</div>
                      <div className="text-sm text-muted-foreground">{pc.city}</div>
                      {pc.region && (
                        <div className="text-xs text-muted-foreground">{pc.region}</div>
                      )}
                      {pc.latitude && pc.longitude && (
                        <div className="text-xs text-green-600">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          Koordinater
                        </div>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Selection Summary Component
const SelectionSummary = ({ selectedPostalCodes, country }: any) => {
  const regionBreakdown = useMemo(() => {
    const breakdown = selectedPostalCodes.reduce((acc: any, spc: SelectedPostalCode) => {
      const region = spc.postal_codes_master.region || 'Okänd region';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(breakdown).map(([region, count]) => ({ region, count }));
  }, [selectedPostalCodes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sammanfattning av val</CardTitle>
        <CardDescription>
          {selectedPostalCodes.length} postnummer valda för {country}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {regionBreakdown.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Fördelning per region:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {regionBreakdown.map(({ region, count }: any) => (
                  <div key={region} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">{region}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="text-sm text-muted-foreground">
            Alla kundförfrågningar från dessa postnummer kommer att visas i er admin-panel.
            Använd hierarkisk vy för stora regioner eller avancerad sök för specifika områden.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantPostalCodeSelector;