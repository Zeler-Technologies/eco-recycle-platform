import React, { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface PostalCode {
  id: string;
  postal_code: string;
  city: string;
  region: string | null;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface ChunkedPostalCodeListProps {
  postalCodes: PostalCode[];
  selectedCodes: Set<string>;
  onToggle: (codeId: string, isSelected: boolean) => void;
  height?: number;
  isLoading?: boolean;
}

const ChunkedPostalCodeList: React.FC<ChunkedPostalCodeListProps> = ({
  postalCodes,
  selectedCodes,
  onToggle,
  height = 400,
  isLoading = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 200; // Manageable chunk size for performance
  
  const totalPages = Math.ceil(postalCodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageItems = postalCodes.slice(startIndex, endIndex);

  // Reset to first page when postal codes change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [postalCodes]);

  const renderPostalCodeRow = (postalCode: PostalCode) => {
    const isSelected = selectedCodes.has(postalCode.id);
    const hasCoordinates = postalCode.latitude && postalCode.longitude;
    
    return (
      <div 
        key={postalCode.id}
        className={`flex items-center px-4 py-3 border-b border-border cursor-pointer transition-colors ${
          isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
        }`}
        onClick={() => onToggle(postalCode.id, !isSelected)}
      >
        <Checkbox
          checked={isSelected}
          onChange={() => {}} // Handled by parent onClick
          className="mr-3 pointer-events-none"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{postalCode.postal_code}</span>
            {isSelected && <CheckCircle2 className="h-3 w-3 text-primary" />}
            {hasCoordinates && <MapPin className="h-3 w-3 text-muted-foreground" />}
          </div>
          
          <div className="text-sm text-muted-foreground truncate">
            {postalCode.city}
            {postalCode.region && (
              <span className="ml-2 text-xs">• {postalCode.region}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Laddar postnummer...</div>
      </div>
    );
  }

  if (postalCodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <MapPin className="h-8 w-8 mb-2 opacity-50" />
        <p>Inga postnummer hittades</p>
        <p className="text-sm">Prova att ändra dina sökfilter</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* List Header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="text-sm text-muted-foreground">
          Visar {startIndex + 1}-{Math.min(endIndex, postalCodes.length)} av {postalCodes.length.toLocaleString('sv-SE')}
        </div>
        <div className="text-sm text-muted-foreground">
          {selectedCodes.size.toLocaleString('sv-SE')} valda
        </div>
      </div>
      
      {/* List Content */}
      <div 
        className="border rounded-lg overflow-auto"
        style={{ height: `${height}px` }}
      >
        {currentPageItems.map(renderPostalCodeRow)}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-3 w-3" />
              Föregående
            </Button>
            
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              Nästa
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Sida {currentPage} av {totalPages}
            </span>
            <Badge variant="outline">
              {itemsPerPage} per sida
            </Badge>
          </div>
        </div>
      )}

      {/* Quick page navigation */}
      {totalPages > 5 && (
        <div className="flex justify-center mt-2">
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              variant="ghost"
              size="sm"
            >
              1
            </Button>
            
            {currentPage > 3 && <span className="text-muted-foreground">...</span>}
            
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i;
              if (page === 1 || page === totalPages) return null;
              
              return (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                >
                  {page}
                </Button>
              );
            })}
            
            {currentPage < totalPages - 2 && <span className="text-muted-foreground">...</span>}
            
            {totalPages > 1 && (
              <Button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                variant="ghost"
                size="sm"
              >
                {totalPages}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChunkedPostalCodeList;