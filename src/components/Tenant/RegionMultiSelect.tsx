import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface RegionMultiSelectProps {
  selectedRegions: string[];
  availableRegions: string[];
  onRegionChange: (regions: string[]) => void;
}

export const RegionMultiSelect: React.FC<RegionMultiSelectProps> = ({
  selectedRegions,
  availableRegions,
  onRegionChange
}) => {
  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      // Remove region
      onRegionChange(selectedRegions.filter(r => r !== region));
    } else {
      // Add region
      onRegionChange([...selectedRegions, region]);
    }
  };

  const availableToSelect = availableRegions.filter(region => !selectedRegions.includes(region));

  return (
    <div className="space-y-2 mt-2">
      {/* Selected Regions Display */}
      {selectedRegions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedRegions.map(region => (
            <span
              key={region}
              className="inline-flex items-center px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
            >
              {region}
              <Button
                onClick={() => toggleRegion(region)}
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0 hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
        </div>
      )}
      
      {/* Region Selector */}
      {availableToSelect.length > 0 && (
        <Select 
          value="" 
          onValueChange={(value) => value && toggleRegion(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Välj region..." />
          </SelectTrigger>
          <SelectContent>
            {availableToSelect.map(region => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear all button */}
      {selectedRegions.length > 0 && (
        <Button
          onClick={() => onRegionChange([])}
          variant="ghost"
          size="sm"
          className="w-full text-xs text-destructive hover:text-destructive"
        >
          Rensa alla regioner
        </Button>
      )}
    </div>
  );
};