import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PostalRangeSelectorProps {
  range: { start: string; end: string };
  onRangeChange: (range: { start: string; end: string }) => void;
}

export const PostalRangeSelector: React.FC<PostalRangeSelectorProps> = ({
  range,
  onRangeChange
}) => {
  const commonRanges = [
    { label: 'Stockholm (10000-19999)', start: '10000', end: '19999' },
    { label: 'Göteborg (40000-49999)', start: '40000', end: '49999' },
    { label: 'Malmö (20000-29999)', start: '20000', end: '29999' },
    { label: 'Uppsala (75000-75999)', start: '75000', end: '75999' },
    { label: 'Linköping (58000-58999)', start: '58000', end: '58999' },
    { label: 'Västerås (72000-72999)', start: '72000', end: '72999' }
  ];

  const handleRangeSelect = (selectedRange: { start: string; end: string }) => {
    onRangeChange(selectedRange);
  };

  const clearRange = () => {
    onRangeChange({ start: '', end: '' });
  };

  const hasRange = range.start || range.end;

  return (
    <div className="space-y-2 mt-2">
      {/* Common Range Shortcuts */}
      <Select 
        value="" 
        onValueChange={(value) => {
          if (value) {
            const selected = commonRanges.find(r => r.label === value);
            if (selected) {
              handleRangeSelect({ start: selected.start, end: selected.end });
            }
          }
        }}
      >
        <SelectTrigger className="text-sm">
          <SelectValue placeholder="Vanliga områden..." />
        </SelectTrigger>
        <SelectContent>
          {commonRanges.map(rangeOption => (
            <SelectItem key={rangeOption.label} value={rangeOption.label}>
              {rangeOption.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Manual Range Input */}
      <div className="flex space-x-2">
        <Input
          type="text"
          value={range.start}
          onChange={(e) => onRangeChange({ ...range, start: e.target.value })}
          placeholder="Från"
          className="text-sm"
        />
        <span className="self-center text-muted-foreground text-sm">–</span>
        <Input
          type="text"
          value={range.end}
          onChange={(e) => onRangeChange({ ...range, end: e.target.value })}
          placeholder="Till"
          className="text-sm"
        />
      </div>
      
      {/* Current Range Display & Clear */}
      {hasRange && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            Intervall: {range.start || '0'} - {range.end || '∞'}
          </div>
          <Button
            onClick={clearRange}
            variant="ghost"
            size="sm"
            className="w-full text-xs text-destructive hover:text-destructive"
          >
            Rensa intervall
          </Button>
        </div>
      )}
    </div>
  );
};