import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, MapPin, Square, Check } from 'lucide-react';

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
  region: string;
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
    region: '',
    city: '',
    postalCodeRange: { start: '', end: '' },
    hasCoordinates: null,
    isSelected: null
  });

  // Get unique regions and cities for dropdowns
  const { regions, cities } = useMemo(() => {
    const regionSet = new Set<string>();
    const citySet = new Set<string>();
    
    allPostalCodes.forEach(pc => {
      if (pc.region) regionSet.add(pc.region);
      if (pc.city) citySet.add(pc.city);
    });
    
    return {
      regions: Array.from(regionSet).sort(),
      cities: Array.from(citySet).sort().slice(0, 100) // Limit for performance
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

    // Region filter
    if (filters.region) {
      filtered = filtered.filter(code => code.region === filters.region);
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
      region: '',
      city: '',
      postalCodeRange: { start: '', end: '' },
      hasCoordinates: null,
      isSelected: null
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== '');
    }
    return value !== '' && value !== null;
  });

  return (
    <div className="bg-background border rounded-lg p-4 mb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">Filtrera postnummer</h3>
          <Badge variant="outline">
            {filteredCodes.length.toLocaleString('sv-SE')} resultat
          </Badge>
        </div>
        
        {hasActiveFilters && (
          <Button
            onClick={clearAllFilters}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <X className="h-3 w-3" />
            Rensa filter
          </Button>
        )}
      </div>

      {/* Search Input */}
      <div>
        <Label htmlFor="filter-search">Sök postnummer eller stad</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="filter-search"
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="t.ex. 12345, Stockholm..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Region Filter */}
        <div>
          <Label>Region/Län</Label>
          <Select 
            value={filters.region || "all"} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, region: value === "all" ? "" : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Välj region..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla regioner</SelectItem>
              {regions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Filter */}
        <div>
          <Label>Stad</Label>
          <Select 
            value={filters.city || "all"} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, city: value === "all" ? "" : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Välj stad..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla städer</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Postal Code Range */}
        <div>
          <Label>Postnummer-intervall</Label>
          <div className="flex space-x-2">
            <Input
              type="text"
              value={filters.postalCodeRange.start}
              onChange={(e) => setFilters(prev => ({
                ...prev, 
                postalCodeRange: { ...prev.postalCodeRange, start: e.target.value }
              }))}
              placeholder="10000"
              className="text-sm"
            />
            <span className="self-center text-muted-foreground">–</span>
            <Input
              type="text"
              value={filters.postalCodeRange.end}
              onChange={(e) => setFilters(prev => ({
                ...prev, 
                postalCodeRange: { ...prev.postalCodeRange, end: e.target.value }
              }))}
              placeholder="19999"
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setFilters(prev => ({ ...prev, isSelected: true }))}
          variant={filters.isSelected === true ? "default" : "outline"}
          size="sm"
          className="flex items-center gap-2"
        >
          <Check className="h-3 w-3" />
          Endast valda
        </Button>
        
        <Button
          onClick={() => setFilters(prev => ({ ...prev, isSelected: false }))}
          variant={filters.isSelected === false ? "default" : "outline"}
          size="sm"
          className="flex items-center gap-2"
        >
          <Square className="h-3 w-3" />
          Endast ej valda
        </Button>
        
        <Button
          onClick={() => setFilters(prev => ({ ...prev, hasCoordinates: true }))}
          variant={filters.hasCoordinates === true ? "default" : "outline"}
          size="sm"
          className="flex items-center gap-2"
        >
          <MapPin className="h-3 w-3" />
          Med koordinater
        </Button>

        {/* Quick Region Buttons */}
        <Button
          onClick={() => setFilters(prev => ({ ...prev, region: 'Stockholm' }))}
          variant={filters.region === 'Stockholm' ? "default" : "outline"}
          size="sm"
        >
          Stockholm
        </Button>
        
        <Button
          onClick={() => setFilters(prev => ({ ...prev, region: 'Västra Götaland' }))}
          variant={filters.region === 'Västra Götaland' ? "default" : "outline"}
          size="sm"
        >
          Västra Götaland
        </Button>
        
        <Button
          onClick={() => setFilters(prev => ({ ...prev, region: 'Skåne' }))}
          variant={filters.region === 'Skåne' ? "default" : "outline"}
          size="sm"
        >
          Skåne
        </Button>
      </div>
    </div>
  );
};

export default SmartPostalCodeFilter;