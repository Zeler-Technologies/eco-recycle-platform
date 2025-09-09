import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle, AlertCircle, Car } from 'lucide-react';

interface InspectionItem {
  id: string;
  label: string;
  checked: boolean;
  notes?: string;
}

interface DriverCarInspectionProps {
  carId?: string;
  licensePlate?: string;
  onComplete?: (inspectionData: any) => void;
}

const DriverCarInspection: React.FC<DriverCarInspectionProps> = ({
  carId,
  licensePlate,
  onComplete
}) => {
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    { id: 'exterior', label: 'Exterior condition', checked: false },
    { id: 'interior', label: 'Interior condition', checked: false },
    { id: 'tires', label: 'Tires condition', checked: false },
    { id: 'engine', label: 'Engine compartment', checked: false },
    { id: 'fluids', label: 'Fluid levels', checked: false },
    { id: 'documents', label: 'Required documents', checked: false }
  ]);

  const [overallCondition, setOverallCondition] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [photos, setPhotos] = useState<File[]>([]);

  const handleItemCheck = (itemId: string, checked: boolean) => {
    setInspectionItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, checked } : item
      )
    );
  };

  const handleItemNotes = (itemId: string, notes: string) => {
    setInspectionItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, notes } : item
      )
    );
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotos(prev => [...prev, ...files]);
  };

  const handleComplete = () => {
    const inspectionData = {
      carId,
      licensePlate,
      inspectionItems,
      overallCondition,
      additionalNotes,
      photos,
      completedAt: new Date().toISOString()
    };
    
    onComplete?.(inspectionData);
  };

  const allItemsChecked = inspectionItems.every(item => item.checked);
  const completionRate = (inspectionItems.filter(item => item.checked).length / inspectionItems.length) * 100;

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Car Inspection
          </CardTitle>
          {licensePlate && (
            <Badge variant="outline" className="w-fit">
              {licensePlate}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Completion Progress</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(completionRate)}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Inspection items */}
          <div className="space-y-4">
            <h3 className="font-medium">Inspection Checklist</h3>
            {inspectionItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={(checked) => 
                        handleItemCheck(item.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={item.id} className="font-medium">
                      {item.label}
                    </Label>
                    {item.checked && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  
                  {item.checked && (
                    <Textarea
                      placeholder="Add notes about this inspection item..."
                      value={item.notes || ''}
                      onChange={(e) => handleItemNotes(item.id, e.target.value)}
                      className="text-sm"
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Overall condition */}
          <div className="space-y-2">
            <Label htmlFor="condition">Overall Vehicle Condition</Label>
            <select
              id="condition"
              value={overallCondition}
              onChange={(e) => setOverallCondition(e.target.value)}
              className="w-full p-2 border border-input rounded-md bg-background"
            >
              <option value="">Select condition...</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="scrap">Scrap Only</option>
            </select>
          </div>

          {/* Additional notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional observations or comments..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
          </div>

          {/* Photo upload */}
          <div className="space-y-2">
            <Label>Inspection Photos</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <Label 
                htmlFor="photo-upload"
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                Upload Photos ({photos.length})
              </Label>
            </div>
          </div>

          {/* Complete button */}
          <Button
            onClick={handleComplete}
            disabled={!allItemsChecked || !overallCondition}
            className="w-full"
          >
            {allItemsChecked && overallCondition ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Inspection
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Complete All Items ({inspectionItems.filter(i => !i.checked).length} remaining)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverCarInspection;