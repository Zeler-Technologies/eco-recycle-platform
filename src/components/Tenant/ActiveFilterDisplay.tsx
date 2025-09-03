import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ActiveFilter {
  key: string;
  label: string;
}

interface ActiveFilterDisplayProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filterKey: string) => void;
}

export const ActiveFilterDisplay: React.FC<ActiveFilterDisplayProps> = ({
  activeFilters,
  onRemoveFilter
}) => {
  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/30 rounded-lg">
      <span className="text-sm font-medium text-muted-foreground">Aktiva filter:</span>
      {activeFilters.map(filter => (
        <span
          key={filter.key}
          className="inline-flex items-center px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
        >
          {filter.label}
          <Button
            onClick={() => onRemoveFilter(filter.key)}
            variant="ghost"
            size="sm"
            className="ml-2 h-4 w-4 p-0 hover:bg-destructive/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </span>
      ))}
    </div>
  );
};