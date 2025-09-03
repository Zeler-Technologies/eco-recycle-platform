import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface CityDropdownProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  regions: string[];
  availableCities: string[];
}

export const CityDropdown: React.FC<CityDropdownProps> = ({
  selectedCity,
  onCityChange,
  regions,
  availableCities
}) => {
  // Filter cities based on selected regions if any
  const filteredCities = useMemo(() => {
    if (regions.length === 0) {
      return availableCities;
    }
    // If regions are selected, we'd need the full postal code data to filter cities by region
    // For now, return all cities - this could be enhanced with region-city mapping
    return availableCities;
  }, [availableCities, regions]);

  return (
    <div className="space-y-2 mt-2">
      <div className="relative">
        <Select 
          value={selectedCity || "all"} 
          onValueChange={(value) => onCityChange(value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Alla städer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla städer</SelectItem>
            {filteredCities.map(city => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Clear selection button */}
        {selectedCity && (
          <Button
            onClick={() => onCityChange('')}
            variant="ghost"
            size="sm"
            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {selectedCity && (
        <div className="text-xs text-muted-foreground">
          Filtrerar på: {selectedCity}
        </div>
      )}
    </div>
  );
};