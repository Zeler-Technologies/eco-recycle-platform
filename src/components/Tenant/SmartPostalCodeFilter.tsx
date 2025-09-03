import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, MapPin, Square, Check } from 'lucide-react';
import { RegionMultiSelect } from './RegionMultiSelect';
import { CityDropdown } from './CityDropdown';
import { PostalRangeSelector } from './PostalRangeSelector';
import { ActiveFilterDisplay } from './ActiveFilterDisplay';

interface PostalCode {
  id: string;
  postal_code: string;
  city: string;
  region: string | null;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface FilterState {
  search: string;
  regions: string[];
  city: string;
  postalCodeRange: { start: string; end: string };
  hasCoordinates: boolean | null;
  isSelected: boolean | null;
}

interface SmartPostalCodeFilterProps {
  allPostalCodes: PostalCode[];
  selectedCodes: Set<string>;
  onFilteredResults: (filtered: PostalCode[]) => void;
}

const SmartPostalCodeFilter: React.FC<SmartPostalCodeFilterProps> = ({
  allPostalCodes,
  selectedCodes,
  onFilteredResults
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    regions: [],
    city: '',
    postalCodeRange: { start: '', end: '' },
    hasCoordinates: null,
    isSelected: null
  });

  // Get unique regions and cities for dropdowns
  const { regions, cities } = useMemo(() => {
    const regionSet = new Set<string>();
    const citySet = new Set<string>();
    
    console.log('🔍 Processing postal codes for regions/cities:', allPostalCodes.length);
    
    allPostalCodes.forEach(pc => {
      if (pc.region && pc.region.trim()) {
        regionSet.add(pc.region.trim());
      }
      if (pc.city && pc.city.trim()) {
        citySet.add(pc.city.trim());
      }
    });
    
    const regionsArray = Array.from(regionSet).sort();
    const citiesArray = Array.from(citySet).sort();
    
    console.log('🌍 Found regions from postal codes:', regionsArray.length, regionsArray);
    console.log('🏙️ Found cities from postal codes:', citiesArray.length, citiesArray.slice(0, 10), '...');
    
    return {
      regions: regionsArray,
      cities: citiesArray
    };
  }, [allPostalCodes]);

  // Apply filters with debouncing
  const filteredCodes = useMemo(() => {
    let filtered = allPostalCodes;

    // Search filter (postal code or city)
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(code => 
        code.postal_code.toLowerCase().includes(searchTerm) ||
        code.city.toLowerCase().includes(searchTerm)
      );
    }

    // Regions filter
    if (filters.regions.length > 0) {
      filtered = filtered.filter(code => filters.regions.includes(code.region || ''));
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(code => code.city === filters.city);
    }

    // Postal code range filter
    if (filters.postalCodeRange.start || filters.postalCodeRange.end) {
      const start = parseInt(filters.postalCodeRange.start) || 0;
      const end = parseInt(filters.postalCodeRange.end) || 99999;
      
      filtered = filtered.filter(code => {
        const codeNum = parseInt(code.postal_code);
        return codeNum >= start && codeNum <= end;
      });
    }

    // Coordinates filter
    if (filters.hasCoordinates !== null) {
      filtered = filtered.filter(code => {
        const hasCoords = !!(code.latitude && code.longitude);
        return hasCoords === filters.hasCoordinates;
      });
    }

    // Selection status filter
    if (filters.isSelected !== null) {
      filtered = filtered.filter(code => {
        const isSelected = selectedCodes.has(code.id);
        return isSelected === filters.isSelected;
      });
    }

    return filtered;
  }, [allPostalCodes, filters, selectedCodes]);

  // Update parent with filtered results
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilteredResults(filteredCodes);
    }, 200); // Debounce

    return () => clearTimeout(timeoutId);
  }, [filteredCodes, onFilteredResults]);

  const clearAllFilters = () => {
    setFilters({
      search: '',
      regions: [],
      city: '',
      postalCodeRange: { start: '', end: '' },
      hasCoordinates: null,
      isSelected: null
    });
  };

  const removeFilter = (filterKey: string) => {
    setFilters(prev => {
      switch (filterKey) {
        case 'search':
          return { ...prev, search: '' };
        case 'regions':
          return { ...prev, regions: [] };
        case 'city':
          return { ...prev, city: '' };
        case 'postalRange':
          return { ...prev, postalCodeRange: { start: '', end: '' } };
        case 'hasCoordinates':
          return { ...prev, hasCoordinates: null };
        case 'isSelected':
          return { ...prev, isSelected: null };
        default:
          return prev;
      }
    });
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.search) active.push({ key: 'search', label: `Sök: "${filters.search}"` });
    if (filters.regions.length > 0) active.push({ key: 'regions', label: `Regioner: ${filters.regions.join(', ')}` });
    if (filters.city) active.push({ key: 'city', label: `Stad: ${filters.city}` });
    if (filters.postalCodeRange.start || filters.postalCodeRange.end) {
      active.push({ key: 'postalRange', label: `Intervall: ${filters.postalCodeRange.start}-${filters.postalCodeRange.end}` });
    }
    if (filters.hasCoordinates !== null) {
      active.push({ key: 'hasCoordinates', label: filters.hasCoordinates ? 'Med koordinater' : 'Utan koordinater' });
    }
    if (filters.isSelected !== null) {
      active.push({ key: 'isSelected', label: filters.isSelected ? 'Endast valda' : 'Endast ej valda' });
    }
    return active;
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== '');
    }
    return value !== '' && value !== null;
  });

  return (
    <div className="bg-background border rounded-lg p-6 mb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-medium">Filtrera postnummer</h3>
          <Badge variant="outline" className="ml-2">
            {filteredCodes.length.toLocaleString('sv-SE')} resultat
          </Badge>
        </div>
        
        {hasActiveFilters && (
          <Button
            onClick={clearAllFilters}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
            Rensa alla filter
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      <ActiveFilterDisplay 
        activeFilters={getActiveFilters()}
        onRemoveFilter={removeFilter}
      />

      {/* Main Filter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Region Multi-Select */}
        <div>
          <Label className="text-sm font-medium text-foreground">Region/Län</Label>
          <RegionMultiSelect
            selectedRegions={filters.regions}
            availableRegions={regions}
            onRegionChange={(regions) => setFilters(prev => ({ ...prev, regions }))}
          />
        </div>

        {/* City Dropdown */}
        <div>
          <Label className="text-sm font-medium text-foreground">Stad</Label>
          <CityDropdown
            selectedCity={filters.city}
            onCityChange={(city) => setFilters(prev => ({ ...prev, city }))}
            regions={filters.regions}
            availableCities={cities}
          />
        </div>

        {/* Postal Range Selector */}
        <div>
          <Label className="text-sm font-medium text-foreground">Postnummer-intervall</Label>
          <PostalRangeSelector
            range={filters.postalCodeRange}
            onRangeChange={(postalCodeRange) => setFilters(prev => ({ ...prev, postalCodeRange }))}
          />
        </div>

        {/* Quick Filters */}
        <div>
          <Label className="text-sm font-medium text-foreground">Snabbfilter</Label>
          <div className="space-y-2 mt-2">
            <Button
              onClick={() => setFilters(prev => ({ ...prev, isSelected: filters.isSelected === true ? null : true }))}
              variant={filters.isSelected === true ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
            >
              <Check className="h-3 w-3 mr-2" />
              Endast valda
            </Button>
            
            <Button
              onClick={() => setFilters(prev => ({ ...prev, hasCoordinates: filters.hasCoordinates === true ? null : true }))}
              variant={filters.hasCoordinates === true ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
            >
              <MapPin className="h-3 w-3 mr-2" />
              Med koordinater
            </Button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div>
        <Label htmlFor="filter-search" className="text-sm font-medium text-foreground">
          Sök postnummer eller stad
        </Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="filter-search"
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="t.ex. 12345, Stockholm..."
            className="pl-10"
          />
          {filters.search && (
            <Button
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartPostalCodeFilter;