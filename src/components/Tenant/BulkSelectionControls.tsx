import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square, Check, MapPin, Building2, Hash } from 'lucide-react';

interface PostalCode {
  id: string;
  postal_code: string;
  city: string;
  region: string | null;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface BulkSelectionControlsProps {
  filteredPostalCodes: PostalCode[];
  selectedCodes: Set<string>;
  onBulkSelect: (type: string, config?: any) => void;
  onBulkDeselect: (codeIds: string[]) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const BulkSelectionControls: React.FC<BulkSelectionControlsProps> = ({
  filteredPostalCodes,
  selectedCodes,
  onBulkSelect,
  onBulkDeselect,
  onSelectAll,
  onDeselectAll
}) => {
  const selectedCount = selectedCodes.size;
  const totalVisible = filteredPostalCodes.length;
  const allVisibleSelected = totalVisible > 0 && filteredPostalCodes.every(pc => selectedCodes.has(pc.id));
  
  // Get unique regions from filtered codes
  const regions = React.useMemo(() => {
    const regionSet = new Set<string>();
    filteredPostalCodes.forEach(pc => {
      if (pc.region) regionSet.add(pc.region);
    });
    return Array.from(regionSet).sort();
  }, [filteredPostalCodes]);

  return (
    <div className="bg-muted/50 p-4 rounded-lg mb-4 space-y-4">
      {/* Selection Status */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="text-sm font-medium flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" />
          {selectedCount.toLocaleString('sv-SE')} av {totalVisible.toLocaleString('sv-SE')} valda
        </div>
        
        {/* Primary Actions */}
        <Button
          onClick={() => allVisibleSelected ? onDeselectAll() : onSelectAll()}
          variant={allVisibleSelected ? "destructive" : "default"}
          size="sm"
          className="flex items-center gap-2"
        >
          {allVisibleSelected ? (
            <>
              <Square className="h-4 w-4" />
              Avmarkera alla synliga
            </>
          ) : (
            <>
            <CheckSquare className="h-4 w-4" />
            Markera alla synliga
            </>
          )}
        </Button>
        
        {/* Clear All Selected */}
        {selectedCount > 0 && (
          <Button
            onClick={onDeselectAll}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Rensa alla ({selectedCount.toLocaleString('sv-SE')})
          </Button>
        )}
      </div>
      
      {/* Quick Selection by Type */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Snabbval:</div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onBulkSelect('coordinates')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <MapPin className="h-3 w-3" />
            Med koordinater
          </Button>
          
          <Button
            onClick={() => onBulkSelect('major_cities')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Building2 className="h-3 w-3" />
            Storstäder
          </Button>
          
          <Button
            onClick={() => onBulkSelect('range', { start: '10000', end: '19999' })}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Hash className="h-3 w-3" />
            Stockholm (10000-19999)
          </Button>
          
          <Button
            onClick={() => onBulkSelect('range', { start: '40000', end: '49999' })}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Hash className="h-3 w-3" />
            Göteborg (40000-49999)
          </Button>
          
          <Button
            onClick={() => onBulkSelect('range', { start: '20000', end: '29999' })}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Hash className="h-3 w-3" />
            Malmö (20000-29999)
          </Button>
        </div>
      </div>
      
      {/* Region Quick Selection */}
      {regions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Välj per region:</div>
          <div className="flex flex-wrap gap-1">
            {regions.slice(0, 8).map((region) => {
              const regionCodes = filteredPostalCodes.filter(pc => pc.region === region);
              const selectedInRegion = regionCodes.filter(pc => selectedCodes.has(pc.id)).length;
              const allRegionSelected = regionCodes.length > 0 && selectedInRegion === regionCodes.length;
              
              return (
                <Button
                  key={region}
                  onClick={() => {
                    if (allRegionSelected) {
                      onBulkDeselect(regionCodes.map(pc => pc.id));
                    } else {
                      onBulkSelect('region', region);
                    }
                  }}
                  variant={allRegionSelected ? "secondary" : "outline"}
                  size="sm"
                  className="text-xs"
                >
                  {region}
                  <Badge variant="outline" className="ml-1 text-xs">
                    {selectedInRegion}/{regionCodes.length}
                  </Badge>
                </Button>
              );
            })}
            {regions.length > 8 && (
              <Badge variant="outline" className="text-xs">
                +{regions.length - 8} fler
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkSelectionControls;