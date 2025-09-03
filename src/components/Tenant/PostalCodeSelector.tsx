import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Search, MapPin, Plus, Minus, CheckCircle2, Filter, X } from 'lucide-react';
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

interface DisplayItem {
  id: string;
  type: 'region' | 'postal_code';
  display: string;
  subtitle: string;
  isSelected: boolean;
  isPartial: boolean;
  region?: string;
  postal_code?: string;
  city?: string;
}

const PostalCodeSelector = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [viewMode, setViewMode] = useState<'mixed' | 'regions' | 'cities' | 'postal_codes'>('mixed');
  const [sortBy, setSortBy] = useState<'postal_code' | 'city' | 'region'>('postal_code');
  const [itemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Optimized postal codes fetch with proper pagination
  const { data: availablePostalCodes = [], isLoading: loadingAvailable } = useQuery({
    queryKey: ['available-postal-codes', userTenant?.tenants?.country],
    enabled: !!userTenant?.tenants?.country,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    queryFn: async () => {
      const countryFilter = userTenant.tenants.country === 'Sverige' ? 'Sweden' : userTenant.tenants.country;
      
      // Use count query first to check total records
      const { count } = await supabase
        .from('postal_codes_master')
        .select('*', { count: 'exact', head: true })
        .eq('country', countryFilter)
        .eq('is_active', true);

      console.log(`🔍 Total postal codes available: ${count}`);

      // Fetch all records in batches if needed
      let allData: PostalCode[] = [];
      const batchSize = 1000;
      
      for (let offset = 0; offset < (count || 0); offset += batchSize) {
        const { data, error } = await supabase
          .from('postal_codes_master')
          .select('id, postal_code, city, region, country')
          .eq('country', countryFilter)
          .eq('is_active', true)
          .range(offset, offset + batchSize - 1)
          .order('postal_code');

        if (error) {
          console.error(`Error loading batch ${offset}-${offset + batchSize}:`, error);
          throw error;
        }
        
        if (data) {
          // Ensure proper typing
          const typedData: PostalCode[] = data.map(item => ({
            id: item.id,
            postal_code: item.postal_code,
            city: item.city,
            region: item.region,
            country: item.country
          }));
          allData = [...allData, ...typedData];
        }
      }
      
      console.log(`✅ Loaded ${allData.length} postal codes for ${countryFilter}`);
      return allData;
    },
  });

  // Fetch selected postal codes
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

  // Optimized selected codes set
  const selectedCodesSet = useMemo(() => {
    return new Set(selectedPostalCodes.map(spc => spc.postal_code_id));
  }, [selectedPostalCodes]);

  // Get unique regions with postal code counts
  const regionsWithCounts = useMemo(() => {
    const regionMap = new Map<string, { total: number; selected: number }>();
    
    availablePostalCodes.forEach(pc => {
      if (pc.region) {
        const current = regionMap.get(pc.region) || { total: 0, selected: 0 };
        current.total += 1;
        if (selectedCodesSet.has(pc.id)) {
          current.selected += 1;
        }
        regionMap.set(pc.region, current);
      }
    });
    
    return Array.from(regionMap.entries())
      .map(([region, counts]) => ({ region, ...counts }))
      .sort((a, b) => a.region.localeCompare(b.region, 'sv-SE'));
  }, [availablePostalCodes, selectedCodesSet]);

  const regions = useMemo(() => {
    return regionsWithCounts.map(r => r.region);
  }, [regionsWithCounts]);

  // Generate display items based on view mode
  const displayItems = useMemo(() => {
    if (viewMode === 'regions') {
      // Show regions as items
      let filteredRegions = regionsWithCounts;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredRegions = filteredRegions.filter(r => 
          r.region.toLowerCase().includes(searchLower)
        );
      }
      
      if (showOnlySelected) {
        filteredRegions = filteredRegions.filter(r => r.selected > 0);
      }
      
      return filteredRegions.map(r => ({
        id: `region-${r.region}`,
        type: 'region' as const,
        region: r.region,
        display: r.region,
        subtitle: `${r.selected}/${r.total} postnummer valda`,
        isSelected: r.selected === r.total && r.total > 0,
        isPartial: r.selected > 0 && r.selected < r.total
      }));
    } else {
      // Show postal codes (mixed, cities, or postal_codes view)
      let filtered = availablePostalCodes;

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(pc => 
          pc.postal_code.includes(searchTerm) ||
          pc.city.toLowerCase().includes(searchLower) ||
          (pc.region && pc.region.toLowerCase().includes(searchLower))
        );
      }

      // Apply region filter
      if (selectedRegion !== 'all') {
        filtered = filtered.filter(pc => pc.region === selectedRegion);
      }

      // Apply selection filter
      if (showOnlySelected) {
        filtered = filtered.filter(pc => selectedCodesSet.has(pc.id));
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'city':
            return a.city.localeCompare(b.city, 'sv-SE');
          case 'region':
            return (a.region || '').localeCompare(b.region || '', 'sv-SE');
          default:
            return a.postal_code.localeCompare(b.postal_code);
        }
      });

      return filtered.map(pc => ({
        id: pc.id,
        type: 'postal_code' as const,
        postal_code: pc.postal_code,
        city: pc.city,
        region: pc.region,
        display: pc.postal_code,
        subtitle: pc.city,
        isSelected: selectedCodesSet.has(pc.id),
        isPartial: false
      }));
    }
  }, [availablePostalCodes, regionsWithCounts, searchTerm, selectedRegion, showOnlySelected, sortBy, viewMode, selectedCodesSet]);

  // Pagination
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayItems.slice(startIndex, startIndex + itemsPerPage);
  }, [displayItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(displayItems.length / itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRegion, showOnlySelected, sortBy, viewMode]);

  // Toggle individual postal code
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
    onError: (error: any) => {
      toast({
        title: "Fel vid uppdatering",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Select entire region
  const selectRegion = useCallback(async (region: string) => {
    if (!userTenant?.tenant_id) return;
    
    const regionCodes = availablePostalCodes.filter(pc => 
      pc.region === region && !selectedCodesSet.has(pc.id)
    );
    
    if (regionCodes.length === 0) {
      toast({
        title: "Alla postnummer i regionen redan valda",
        description: `Regionen ${region} är redan helt vald.`,
      });
      return;
    }
    
    try {
      const inserts = regionCodes.map(pc => ({
        tenant_id: userTenant.tenant_id,
        postal_code_id: pc.id
      }));
      
      // Process in batches
      const batchSize = 100;
      for (let i = 0; i < inserts.length; i += batchSize) {
        const batch = inserts.slice(i, i + batchSize);
        const { error } = await supabase
          .from('tenant_coverage_areas')
          .upsert(batch, { onConflict: 'tenant_id,postal_code_id' });
        if (error) throw error;
      }
      
      toast({
        title: "Region tillagd",
        description: `${regionCodes.length} postnummer från ${region} har lagts till.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
    } catch (error: any) {
      toast({
        title: "Fel vid regionval",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [availablePostalCodes, selectedCodesSet, userTenant?.tenant_id, queryClient]);

  // Handle item toggle (region or postal code)
  const handleToggleItem = useCallback(async (item: DisplayItem) => {
    if (item.type === 'region') {
      // Toggle entire region
      await selectRegion(item.region!);
    } else {
      // Toggle individual postal code
      togglePostalCode.mutate({ postalCodeId: item.id, isSelected: !item.isSelected });
    }
  }, [selectRegion, togglePostalCode]);

  // Bulk select all visible
  const selectAllVisible = useCallback(async () => {
    if (!userTenant?.tenant_id) return;
    
    let codesToSelect: PostalCode[] = [];
    
    if (viewMode === 'regions') {
      // Select all postal codes in visible regions
      const visibleRegions = paginatedItems.filter(item => !item.isSelected).map(item => item.region!);
      codesToSelect = availablePostalCodes.filter(pc => 
        visibleRegions.includes(pc.region) && !selectedCodesSet.has(pc.id)
      );
    } else {
      // Select visible postal codes
      codesToSelect = paginatedItems
        .filter(item => item.type === 'postal_code' && !item.isSelected)
        .map(item => availablePostalCodes.find(pc => pc.id === item.id)!)
        .filter(Boolean);
    }
    
    if (codesToSelect.length === 0) {
      toast({
        title: "Alla synliga områden redan valda",
        description: "Det finns inga fler områden att välja på denna sida.",
      });
      return;
    }
    
    try {
      const inserts = codesToSelect.map(pc => ({
        tenant_id: userTenant.tenant_id,
        postal_code_id: pc.id
      }));
      
      const { error } = await supabase
        .from('tenant_coverage_areas')
        .upsert(inserts, { onConflict: 'tenant_id,postal_code_id' });
      
      if (error) throw error;
      
      toast({
        title: "Synliga områden valda",
        description: `${inserts.length} postnummer har lagts till.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
    } catch (error: any) {
      toast({
        title: "Fel vid bulk-val",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [viewMode, paginatedItems, availablePostalCodes, selectedCodesSet, userTenant?.tenant_id, queryClient]);

  // Bulk deselect all visible
  const deselectAllVisible = useCallback(async () => {
    if (!userTenant?.tenant_id) return;
    
    let codesToDeselect: PostalCode[] = [];
    
    if (viewMode === 'regions') {
      // Deselect all postal codes in visible regions that have selections
      const visibleRegions = paginatedItems.filter(item => item.isSelected || item.isPartial).map(item => item.region!);
      codesToDeselect = availablePostalCodes.filter(pc => 
        visibleRegions.includes(pc.region) && selectedCodesSet.has(pc.id)
      );
    } else {
      // Deselect visible postal codes
      codesToDeselect = paginatedItems
        .filter(item => item.type === 'postal_code' && item.isSelected)
        .map(item => availablePostalCodes.find(pc => pc.id === item.id)!)
        .filter(Boolean);
    }
    
    if (codesToDeselect.length === 0) {
      toast({
        title: "Inga valda områden att ta bort",
        description: "Det finns inga valda områden på denna sida.",
      });
      return;
    }
    
    try {
      for (const pc of codesToDeselect) {
        const { error } = await supabase
          .from('tenant_coverage_areas')
          .delete()
          .eq('tenant_id', userTenant.tenant_id)
          .eq('postal_code_id', pc.id);
        if (error) throw error;
      }
      
      toast({
        title: "Synliga områden borttagna",
        description: `${codesToDeselect.length} postnummer har tagits bort.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
    } catch (error: any) {
      toast({
        title: "Fel vid borttagning",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [viewMode, paginatedItems, availablePostalCodes, selectedCodesSet, userTenant?.tenant_id, queryClient]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedRegion('all');
    setShowOnlySelected(false);
    setSortBy('postal_code');
    setViewMode('mixed');
  }, []);

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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Täckningsområden</h2>
        <p className="text-muted-foreground">
          Välj vilka postnummer ditt företag betjänar. Endast fordon från dessa områden kommer att visas i era förfrågningar.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{selectedPostalCodes.length}</div>
            <p className="text-sm text-muted-foreground">Valda postnummer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{availablePostalCodes.length}</div>
            <p className="text-sm text-muted-foreground">Tillgängliga totalt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{displayItems.length}</div>
            <p className="text-sm text-muted-foreground">Matchande filter</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{regions.length}</div>
            <p className="text-sm text-muted-foreground">Regioner</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter och kontroller
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Region Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök postnummer, ort eller region..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Välj region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla regioner</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Mode and Sort Options */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="view-select">Visa som:</Label>
              <Select value={viewMode} onValueChange={(value: string) => setViewMode(value as any)}>
                <SelectTrigger className="w-48" id="view-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Blandad vy</SelectItem>
                  <SelectItem value="regions">Endast regioner</SelectItem>
                  <SelectItem value="cities">Gruppera efter städer</SelectItem>
                  <SelectItem value="postal_codes">Endast postnummer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {viewMode !== 'regions' && (
              <div className="flex items-center gap-2">
                <Label htmlFor="sort-select">Sortera efter:</Label>
                <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as 'postal_code' | 'city' | 'region')}>
                  <SelectTrigger className="w-40" id="sort-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postal_code">Postnummer</SelectItem>
                    <SelectItem value="city">Ort</SelectItem>
                    <SelectItem value="region">Region</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-selected"
                checked={showOnlySelected}
                onCheckedChange={(checked) => setShowOnlySelected(checked === true)}
              />
              <Label htmlFor="show-selected">Visa endast valda</Label>
            </div>

            <div className="flex-1" />

            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Rensa filter
            </Button>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={selectAllVisible} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Välj synliga ({paginatedItems.filter(item => !item.isSelected).length})
            </Button>
            <Button onClick={deselectAllVisible} variant="outline" size="sm">
              <Minus className="h-4 w-4 mr-1" />
              Ta bort synliga ({paginatedItems.filter(item => item.isSelected || item.isPartial).length})
            </Button>
            {selectedRegion !== 'all' && viewMode !== 'regions' && (
              <Button onClick={() => selectRegion(selectedRegion)} variant="outline" size="sm">
                Välj hela {selectedRegion}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    {viewMode === 'regions' ? 'Regioner' : 'Postnummer'}
                  </CardTitle>
                  <CardDescription>
                    Visar {paginatedItems.length} av {displayItems.length} {viewMode === 'regions' ? 'regioner' : 'postnummer'}
                  </CardDescription>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Föregående
                    </Button>
                    <span className="text-sm">
                      Sida {currentPage} av {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Nästa
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingAvailable ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Laddar postnummer...</p>
                </div>
              ) : paginatedItems.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">Inga {viewMode === 'regions' ? 'regioner' : 'postnummer'} matchar dina filter</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {paginatedItems.map((item) => {
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                            item.isSelected 
                              ? 'bg-primary/5 border-primary' 
                              : item.isPartial
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-background hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.display}</span>
                              {item.isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                              {item.isPartial && <div className="h-4 w-4 rounded-full bg-yellow-400 flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-white"></div>
                              </div>}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                            {item.region && item.type === 'postal_code' && (
                              <p className="text-xs text-muted-foreground">{item.region}</p>
                            )}
                          </div>
                          <Button
                            variant={item.isSelected ? "secondary" : item.isPartial ? "outline" : "outline"}
                            size="sm"
                            onClick={() => handleToggleItem(item)}
                            disabled={togglePostalCode.isPending}
                          >
                            {item.type === 'region' ? (
                              item.isSelected ? (
                                <Minus className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )
                            ) : (
                              item.isSelected ? (
                                <Minus className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valda områden</CardTitle>
              <CardDescription>
                {selectedPostalCodes.length} postnummer i täckningsområdet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPostalCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Inga postnummer valda ännu</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {selectedPostalCodes.slice(0, 50).map((spc) => {
                      const pc = spc.postal_codes_master;
                      return (
                        <div
                          key={spc.postal_code_id}
                          className="flex items-center justify-between p-2 border rounded-lg bg-primary/5 border-primary/20"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{pc.postal_code}</span>
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{pc.city}</p>
                          </div>
                        </div>
                      );
                    })}
                    {selectedPostalCodes.length > 50 && (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        ... och {selectedPostalCodes.length - 50} till
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
              
              {selectedPostalCodes.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Täckning:</span>
                      <Badge>
                        {((selectedPostalCodes.length / availablePostalCodes.length) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Kundförfrågningar från dessa postnummer visas automatiskt i er admin-panel.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PostalCodeSelector;